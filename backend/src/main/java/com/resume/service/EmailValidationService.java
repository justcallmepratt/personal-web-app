package com.resume.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.naming.directory.Attributes;
import javax.naming.directory.InitialDirContext;
import java.util.Hashtable;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Validates sender email addresses on contact form submissions.
 *
 * Three-layer defence:
 *  1. Disposable-domain blocklist — rejects throwaway inboxes
 *  2. MX record DNS lookup       — rejects domains with no mail exchange
 *  3. Suspicious-pattern check   — flags keyboard-mash and lookalike domains
 *
 * DNS failures are non-fatal: if lookup times out we allow the submission
 * rather than blocking legitimate senders due to infrastructure issues.
 */
@Service
public class EmailValidationService {

    private static final Logger log = LoggerFactory.getLogger(EmailValidationService.class);

    // ── Disposable / throwaway email providers ───────────────────────────────
    private static final Set<String> DISPOSABLE = Set.of(
        "mailinator.com", "guerrillamail.com", "guerrillamail.net", "guerrillamail.org",
        "guerrillamail.de", "guerrillamail.biz", "guerrillamail.info",
        "tempmail.com", "temp-mail.org", "temp-mail.ru", "tempmail.net",
        "throwam.com", "throwaway.email", "dispostable.com", "maildrop.cc",
        "yopmail.com", "yopmail.fr", "sharklasers.com", "guerrillamailblock.com",
        "grr.la", "spam4.me", "trashmail.com", "trashmail.me", "trashmail.at",
        "trashmail.io", "trashmail.net", "trashmail.org", "trashmail.xyz",
        "10minutemail.com", "10minutemail.net", "10minutemail.org", "10minutemail.de",
        "minutemail.com", "20minutemail.com", "discard.email", "discardmail.com",
        "spamgourmet.com", "spamgourmet.net", "spamgourmet.org",
        "fakeinbox.com", "fakeinbox.net", "fakeinbox.org",
        "mailnull.com", "mailnull.net", "mailnull.org",
        "spamfree24.org", "spamfree24.de", "spamfree24.eu", "spamfree24.net",
        "getnada.com", "nada.ltd", "filzmail.com",
        "mohmal.com", "mohmal.im", "mohmal.in",
        "mailexpire.com", "mailexpire.org",
        "crazymailing.com", "crazymailing.org",
        "spamherelots.com", "spamhereplease.com",
        "sendspamhere.com", "binkmail.com",
        "bobmail.info", "dayrep.com", "einrot.com", "fleckens.hu",
        "gustr.com", "inoutmail.eu", "inoutmail.de", "inoutmail.info",
        "inoutmail.net", "jetable.fr", "kasmail.com", "kaspop.com",
        "klzlk.com", "lhsdv.com", "lifebyfood.com", "link2mail.net",
        "lol.ovpn.to", "lookugly.com", "lortemail.dk", "lr78.com",
        "maileater.com", "mailfreeonline.com", "mailguard.me",
        "mailme24.com", "mailmetrash.com", "mailmoat.com",
        "mailseal.de", "mailwithyou.com", "meltmail.com",
        "mierdamail.com", "ministerquangcao.com", "moncourrier.fr",
        "monemail.fr", "monmail.fr", "msa.minsmail.com",
        "mt2009.com", "mt2014.com", "mx0.wwwnew.eu",
        "mxfuel.com", "mypartyclip.de", "myphantomemail.com",
        "myspaceinc.com", "myspaceinc.net", "myspaceinc.org",
        "mytrashmail.com", "neomailbox.com", "nepwk.com",
        "nervmich.net", "nervtmich.net", "netviewer-france.com",
        "neverbox.com", "nice-4u.com", "noblepioneer.com",
        "nomail.pw", "nomail.xl.cx", "no-spam.ws", "nospamfor.us",
        "nospam.ze.tc", "nospamthanks.info", "notmailinator.com",
        "nowhere.org", "nowmymail.com", "nwldx.com",
        "objectmail.com", "obobbo.com", "odnorazovoe.ru",
        "oneoffmail.com", "onewaymail.com", "online.ms",
        "oopi.org", "opayq.com", "ordinaryamerican.net",
        "otpku.com", "oursnet.com", "outlawspam.com"
    );

    // ── Suspicious domain pattern: lookalikes and keyboard mash ─────────────
    private static final Pattern SUSPICIOUS = Pattern.compile(
        // keyboard rows / mash
        "^(asdf|qwer|zxcv|qwerty|asdfgh|zxcvbn|aaaaaa|bbbbbb|cccccc|" +
        // all digits domain
        "\\d{5,}|" +
        // random consonant clusters (no vowel in 6+ chars)
        "[^aeiou]{6,}|" +
        // obvious fakes
        "test|fake|noreply|no-reply|null|void|invalid|example|" +
        "spam|junk|trash|discard|drop|ignore|nobody|anonymous|" +
        "donotreply|do-not-reply)" +
        "(\\.\\w{2,})+$",
        Pattern.CASE_INSENSITIVE
    );

    public record ValidationResult(boolean valid, String reason) {
        public static ValidationResult ok()                   { return new ValidationResult(true,  null); }
        public static ValidationResult reject(String reason)  { return new ValidationResult(false, reason); }
    }

    /**
     * Validates the email's domain against all three layers.
     * @param email the raw email address from the contact form
     */
    public ValidationResult validate(String email) {
        if (email == null || !email.contains("@")) {
            return ValidationResult.reject("Invalid email format.");
        }

        // Spaces are never valid in unquoted email addresses
        if (email.contains(" ")) {
            return ValidationResult.reject("Email addresses cannot contain spaces.");
        }

        String domain = toAsciiDomain(email.substring(email.lastIndexOf('@') + 1));

        // The domain goes into a DNS lookup, so accept only a plain hostname.
        // Anything else (for example "/10.0.0.5:53/x") could steer the lookup
        // to a server the caller picks.
        if (!isHostname(domain)) {
            return ValidationResult.reject("Invalid email format.");
        }

        // 1. Disposable provider
        if (DISPOSABLE.contains(domain)) {
            log.warn("Contact rejected: disposable email domain [{}]", safe(domain));
            return ValidationResult.reject(
                "Disposable or throwaway email addresses are not accepted. Please use a real inbox."
            );
        }

        // 2. MX record check
        ValidationResult mxResult = checkMxRecord(domain);
        if (!mxResult.valid()) return mxResult;

        // 3. Suspicious pattern
        if (SUSPICIOUS.matcher(domain).matches()) {
            log.warn("Contact flagged: suspicious domain pattern [{}]", safe(domain));
            return ValidationResult.reject(
                "The email domain looks invalid or suspicious. Please double-check your address."
            );
        }

        return ValidationResult.ok();
    }

    /** Dot-separated LDH labels, at least two, at most 253 characters (RFC 1123). */
    private static final Pattern HOSTNAME = Pattern.compile(
        "^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$"
    );

    /** Lower-cases, drops one trailing dot and converts IDN labels to punycode; null if not convertible. */
    static String toAsciiDomain(String raw) {
        String d = raw.trim().toLowerCase(java.util.Locale.ROOT);
        if (d.endsWith(".")) d = d.substring(0, d.length() - 1);
        try {
            return java.net.IDN.toASCII(d, java.net.IDN.ALLOW_UNASSIGNED).toLowerCase(java.util.Locale.ROOT);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    static boolean isHostname(String domain) {
        return domain != null && HOSTNAME.matcher(domain).matches();
    }

    /** Strips line breaks so user-supplied text cannot forge extra log entries. */
    private static String safe(String s) {
        return s == null ? null : s.replaceAll("\\R", "_");
    }

    private ValidationResult checkMxRecord(String domain) {
        try {
            Hashtable<String, String> env = new Hashtable<>();
            env.put("java.naming.factory.initial", "com.sun.jndi.dns.DnsContextFactory");
            env.put("com.sun.jndi.dns.timeout.initial", "3000");  // 3 s timeout
            env.put("com.sun.jndi.dns.timeout.retries", "1");

            InitialDirContext ctx = new InitialDirContext(env);
            Attributes attrs = ctx.getAttributes("dns:/" + domain, new String[]{"MX"});

            if (attrs.get("MX") == null || attrs.get("MX").size() == 0) {
                log.warn("Contact rejected: no MX records for domain [{}]", safe(domain));
                return ValidationResult.reject(
                    "The email domain has no mail server. Please verify your email address."
                );
            }
            return ValidationResult.ok();

        } catch (javax.naming.NameNotFoundException e) {
            log.warn("Contact rejected: domain does not exist [{}]", safe(domain));
            return ValidationResult.reject("The email domain does not exist. Please check your address.");
        } catch (Exception e) {
            // DNS timeout or other infra issue — fail open to avoid blocking legit users
            log.debug("MX lookup inconclusive for [{}]: {}", safe(domain), e.getMessage());
            return ValidationResult.ok();
        }
    }
}
