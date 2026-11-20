# frontend — Next.js 16 portfolio site

The public site at https://justcallmepratt.dev. Next.js App Router, React 19,
TypeScript, Tailwind 4, tested with Vitest. Note `AGENTS.md`: this Next.js version
differs from older ones, so check `node_modules/next/dist/docs/` before using an API.

```bash
pnpm install
pnpm dev              # http://localhost:3000
pnpm test             # Vitest (pnpm test:coverage for the coverage thresholds)
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

## Content

Pages get their data through `src/lib/api.ts`.

- **`BACKEND_URL` unset (the default):** content comes from `src/content/index.ts`. No
  backend is needed to develop or build.
- **`BACKEND_URL` set** (server-only, e.g. `http://localhost:8080`): pages fetch from the
  Spring Boot API and fall back to `src/content/index.ts` if it is down or slow.

The contact form posts to this app's own `POST /api/contact` (`src/app/api/contact/route.ts`),
which relays to the API when `BACKEND_URL` is set and otherwise sends mail over SMTP
(`MAIL_*`, `CONTACT_NOTIFY_TO`). Variables are documented in the root `.env.example`.

## More

- Project overview: [../README.md](../README.md)
- Deployment and environment variables: [../docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md)
- Code layout: [../docs/CODEBASE_STRUCTURE.md](../docs/CODEBASE_STRUCTURE.md)
