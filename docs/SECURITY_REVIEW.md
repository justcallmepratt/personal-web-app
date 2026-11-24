# Security review — 2026-11-24

Scope: <https://justcallmepratt.dev> (public site, `/admin`, `/projects/kafka`), the API at
<https://personal-web-app-api-production.up.railway.app>, the Athlink demo at
<https://athllinkmvp-demo.vercel.app/>, and the code in `justcallmepratt/personal-web-app`.
Testing was light and non-destructive: no load, no login guessing, no writes to the
production database and no contact-form submissions.

Method:
- A code review of the route handlers, admin auth, Spring config and controllers, using the ECC `security-reviewer` agent plus a manual check of each finding.
- Live `curl`/`openssl` probes of headers, cookies, CORS, error pages, auth and TLS.
- `pnpm audit --prod` for all three Next.js apps, GitHub Dependabot alerts, and a pattern scan of git history that printed counts only, never values.

Status key: **Fixed** means fixed in the PR that added this file, with tests. **Owner** means it needs an owner action or approval. **Open** means it is a code follow-up.

## Summary

| # | Severity | Finding | Status |
|---|----------|---------|--------|
| 1 | High | `GET /api/contact/validate-email` let anyone send DNS queries to a host and port they chose (SSRF) | Fixed |
| 2 | Medium | Admin sign-in limiter: the per-client key is forgeable, and the shared bucket can lock out the owner | Owner + Open |
| 3 | Medium | Contact rate limit trusts the forwarded client address, and limiter memory never shrank | Memory: Fixed; rest: Owner + Open |
| 4 | Medium | No Content-Security-Policy on any app | Owner |
| 5 | Medium | Swagger UI and the OpenAPI spec are public | Owner |
| 6 | Low | A line break in the contact subject reached `setSubject` on the API's mail path | Fixed |
| 7 | Low | The API sent no HSTS or Referrer-Policy | Fixed |
| 8 | Low | Unknown paths and bad input returned 500, and unexpected exceptions were never logged | Fixed |
| 9 | Low | `docker-compose.yml` fell back to a sample JWT secret and a published admin password hash | Fixed |
| 10 | Low | Body-size limits on `/api/contact` and `/api/kafka/produce` only check `Content-Length` | Open |
| 11 | Low | JWT hardening: 24 h tokens, no revocation, a username timing difference | Open |
| 12 | Low | CORS origin list isn't trimmed, and `allowedHeaders=*` is broader than needed | Open |
| 13 | Info | Old secrets and stale variables | Owner |
| 14 | Info | Things that were checked and are fine | — |

---

## 1. DNS SSRF in `validate-email` (High) — Fixed

**What:**
- `EmailValidationService.checkMxRecord` built the lookup name as `"dns:/" + domain`. The domain is everything after the last `@` in an unauthenticated query parameter.
- `x@/192.0.2.1:53/example.com` therefore became the JNDI URL `dns://192.0.2.1:53/example.com`, so the API queried a DNS server chosen by the caller.
- The answers differ: "no MX", "does not exist", or a timeout that fails open to "Email looks good". That let a caller probe hosts and UDP ports the API can reach.

**Reproduce (before the fix):**

```bash
A=https://personal-web-app-api-production.up.railway.app/api/contact/validate-email
curl -G --data-urlencode 'email=x@no-such-domain-zz9q.example' $A   # 422 in ~0.2 s
curl -G --data-urlencode 'email=x@/192.0.2.1:53/example.com' $A     # 200 "Email looks good" after ~3 s
```

The 3-second timeout shows the API tried to reach `192.0.2.1:53`. `192.0.2.1` is a reserved test address.

**Fix:**
- Before any lookup, the domain must be a plain RFC 1123 hostname: LDH labels, at least two of them, at most 253 characters. Anything else gets "Invalid email format."
- Tests: `EmailValidationEdgeCaseTest` (`rejects_domains_that_are_not_plain_hostnames`, `accepts_plain_hostnames`).
- After deploy, the second command above returns 422 at once.

## 2. Admin sign-in limiter (Medium) — Owner + Open

**What:**
- `AdminController.clientAddress` keys the limiter on the first `X-Forwarded-For` entry, which the caller controls.
- The admin app (`apps/admin/src/lib/backend.ts`) does not forward the visitor's address, so every sign-in through `/admin` shares one per-client bucket.
- The overall cap, 30 failures per 15 minutes, still limits guessing. A strong password makes guessing impractical.
- Even so, failed attempts from anyone can block sign-in for everyone, including the owner, until the window passes.

**Reproduce:** not run live, because it would block real sign-in and the task rules out guessing. See the code paths above and `LoginRateLimiterTest.blocksEveryoneOnceTheOverallLimitIsReached`.

**Proposed fix** (needs a shared secret, so an owner step):
1. Generate a random `RELAY_SECRET` and set it on Railway and on the `admin` and `frontend` Vercel projects.
2. The relays send the visitor address (Vercel's `x-real-ip`) with the secret in a header.
3. The API trusts that address only when the secret matches. Otherwise it uses the address Railway's proxy adds, which is the right-most `X-Forwarded-For` entry and not the first.

With real per-client buckets, the overall cap can be raised so that it stops being a lockout lever.

## 3. Contact rate limit and limiter memory (Medium)

**What:**
- `ContactController.extractIp` also trusts the first `X-Forwarded-For` entry, so the 3-per-hour limit is only as strong as that header.
- On Vercel the `frontend` relay's own view is safe, because Vercel overwrites `x-forwarded-for`.
- Separately, `RateLimitService.evictStale()` was never called and `LoginRateLimiter` never dropped old clients, so every address seen stayed in memory until a restart.

**Fixed:**
- Both limiters now sweep expired entries once they track 1,000 addresses.
- Tests: `RateLimitEdgeCaseTest.sweepsExpiredAddressesSoTheMapStaysBounded` and `LoginRateLimiterTest.forgetsClientsWhoseFailuresHaveExpired`.

**Open:** trust the forwarded address only with the relay secret from #2.

## 4. No Content-Security-Policy (Medium) — Owner

**What:** none of `frontend`, `apps/admin`, `apps/kafka` or the Athlink demo sends `Content-Security-Policy`. All of them send `X-Frame-Options: DENY`, `nosniff`, HSTS (2 years, preload) and a Referrer-Policy.

**Reproduce:**

```bash
curl -sI https://justcallmepratt.dev/ | grep -i content-security
```

This prints nothing.

**Proposal:**
1. Start with `Content-Security-Policy-Report-Only` in each `vercel.json`, for a week, and watch the browser console:

   ```text
   default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';
   img-src 'self' data:; font-src 'self'; connect-src 'self' https://*.amplitude.com;
   frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'
   ```

2. Then enforce it.
3. `/admin` can be strict from day one. It embeds nothing and is the most valuable target.

This needs approval because an enforced policy that misses a source breaks pages for visitors.

## 5. Swagger and OpenAPI are public (Medium) — Owner

**What:**
- `/swagger-ui/index.html` and `/v3/api-docs` return 200 to anyone. They list every route, including `/api/admin/**`. The routes themselves still require auth (see #14).
- The spec also advertises `http://` as the server URL.

**Reproduce:**

```bash
curl -s https://personal-web-app-api-production.up.railway.app/v3/api-docs | head -c 200
```

**Proposal:** set `SPRINGDOC_APIDOCS_ENABLED=false` and `SPRINGDOC_SWAGGERUI_ENABLED=false` (`springdoc.api-docs.enabled` and `springdoc.swagger-ui.enabled`) on Railway. Springdoc reads these through relaxed binding, so no code change is needed. Local dev keeps the docs.

## 6. Line break in the contact subject (Low) — Fixed

**What:** the API's `ContactService` passed `req.subject()` straight to `SimpleMailMessage.setSubject`. The frontend SMTP path already stripped line breaks, so the two paths disagreed.

**Fix:**
- CR, LF and Unicode line separators are replaced with a space.
- Test: `ContactServiceTest.handle_flattensLineBreaksInTheSubject_soNoHeaderCanBeAdded`.

## 7. API had no HSTS or Referrer-Policy (Low) — Fixed

**What:**
- TLS ends at Railway's proxy, so Spring sees plain HTTP and Spring Security skips HSTS.
- Railway already redirects `http://` to `https://` with a 301, so the risk was small.

**Reproduce:**

```bash
curl -sI https://personal-web-app-api-production.up.railway.app/api/profile | grep -iE 'strict|referrer'
```

This printed nothing before the fix.

**Fix:**
- `SecurityConfig` always sends `Strict-Transport-Security: max-age=63072000 ; includeSubDomains` and `Referrer-Policy: no-referrer`.
- Test: `SecurityHeadersTest`.

## 8. Wrong 500s and unlogged exceptions (Low) — Fixed

**What:**
- `GlobalExceptionHandler`'s catch-all turned Spring's own request errors into 500 "Internal server error": unknown path, wrong type, bad JSON, missing parameter.
- It also logged nothing, so real faults were invisible in the Railway logs.

**Reproduce (before the fix):**

```bash
A=https://personal-web-app-api-production.up.railway.app
curl -s $A/api/does-not-exist   # 500
curl -s $A/api/projects/abc     # 500
curl -s $A/actuator/env         # 500
```

**Fix:**
- Spring `ErrorResponse` exceptions keep their status, with only a reason phrase.
- Bad JSON and type mismatches return 400 "Invalid request".
- Anything else is logged at ERROR and still returns a generic 500.
- Tests: `GlobalExceptionHandlerTest` and `SecurityHeadersTest`.

## 9. Compose defaults (Low) — Fixed

**What:** `docker-compose.yml` defaulted `JWT_SECRET` to a placeholder and `ADMIN_PASSWORD_HASH` to the well-known sample bcrypt hash. A compose deploy without `.env` therefore had a published admin password.

**Fix:** both now use `${VAR:?…}`, so compose refuses to start without them. README updated. This doesn't affect production, which runs on Railway.

## 10. Body-size checks trust `Content-Length` (Low) — Open

**What:** `frontend/src/app/api/contact/route.ts` and both `kafka/produce` routes reject large bodies by header only. A chunked request skips that check before `request.json()`.

**Impact:** Vercel caps bodies at 4.5 MB, so this only matters for the Docker standalone build.

**Fix:** reuse the byte-counting reader in `apps/admin/src/lib/http.ts`.

## 11. JWT hardening (Low) — Open

- Tokens last 24 hours (`JWT_EXPIRY_MS`). Signing out only clears the cookie, so a stolen token stays valid until it expires. Suggest 2 hours, or a token version for revocation.
- `AdminController.login` compares the username before running bcrypt, so a wrong username answers faster. Always run `encoder.matches` and compare the username with `MessageDigest.isEqual`.
- The secret only needs to meet jjwt's 32-byte minimum. Use at least 32 random bytes, which is an owner check of the current value.

## 12. CORS details (Low) — Open

- `CorsConfig` splits `CORS_ORIGIN` on commas without trimming, so `a, b` silently drops `b`.
- `allowedHeaders=*` with `allowCredentials=true` is looser than needed. The API uses Bearer tokens, not cookies, so the impact is nil today.

Live check: preflight from `https://evil.example` gets 403, and from `https://justcallmepratt.dev` it gets 200 with that exact origin echoed.

## 13. Secrets and variables (Info) — Owner

- **Railway token:** it was pasted into a chat earlier. Rotate it in Railway → Account → Tokens.
- **Amplitude key:**
  - My pattern scan of history didn't match it, but it is known to be there.
  - Amplitude browser keys ship in the page by design, so the risk is junk events, not data access.
  - Rotating it is optional.
  - Rewriting git history is not recommended.
- **Other history hits:** every `JWT_SECRET=`/`MAIL_PASS=` hit in history is a placeholder in an example or doc file. I found no AWS, GitHub, Stripe, private-key, JWT or Postgres-URL secrets.
- **Stale Vercel variables:** remove `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_AMPLITUDE_API_KEY` from the `frontend` Vercel project.
- **Dependabot:** it is off for `justcallmepratt/Athllinkmvp-DEMO`. Turn it on (Settings → Code security). `personal-web-app` has 0 open alerts.

## 14. Checked and fine

- **Admin API:**
  - `/api/admin/**` without a token returns 403. Every admin controller sits under that matcher.
  - `/admin/api/messages` and `/admin/api/suggestions` without the cookie return 401.
  - Cross-origin `POST /admin/api/session` returns 403.
- **Admin pages:** `/admin` pages without a cookie stream a redirect to `/admin/login` and render no data. They send `Cache-Control: private, no-store` and `X-Robots-Tag: noindex`.
- **Cookie:** `admin_session` is `HttpOnly; Secure; SameSite=Strict; Path=/admin`. Its lifetime is taken from the token's `exp`.
- **JWT:** signed with HS256 and verified by jjwt, so `alg=none` is rejected.
- **Actuator:** only `health` and `info` are exposed. `health` hides details.
- **Open redirects:** none found. `?next=` on `/admin/login` is ignored, and `/kafka` returns a 308 to a fixed local path.
- **TLS:**
  - TLS 1.2 and 1.3 work on both hosts, with ECDHE-GCM ciphers.
  - TLS 1.0 and 1.1 could not be tested from this machine, because its OpenSSL is built without them. Vercel and Railway both document a TLS 1.2 minimum.
  - HTTP to HTTPS redirects are in place.
- **Dependencies:** `pnpm audit --prod` finds no known vulnerabilities in `frontend`, `apps/admin` or `apps/kafka`. I did not run the Maven OWASP dependency-check, because it needs a large NVD download. Dependabot covers `pom.xml`.
- **Server-side fetch:** no user-controlled URL anywhere. The Adzuna, `BACKEND_URL` and `KAFKA_DEMO_URL` targets all come from the environment.
- **Wildcard CORS:** `Access-Control-Allow-Origin: *` appears on public HTML from Vercel's CDN, on the site root and on the Athlink demo. It has no credentials and the content is public, so there is no impact.
