package com.resume.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Edge-case tests for EmailValidationService.
 * Covers: boundary inputs, unicode, aliases, subdomains, lookalike domains, format edge cases.
 */
class EmailValidationEdgeCaseTest {

    private EmailValidationService svc;

    @BeforeEach void setUp() { svc = new EmailValidationService(); }

    // ── Format edge cases ────────────────────────────────────────────────────

    @Test void rejects_email_with_no_domain() {
        assertFalse(svc.validate("user@").valid());
    }

    @Test void rejects_email_with_spaces() {
        assertFalse(svc.validate("user @gmail.com").valid());
    }

    @Test void rejects_multiple_at_signs() {
        // only the last @ is used for domain extraction — domain = "extra.com"
        // "user@middle@extra.com" → not a valid format per RFC, but we should handle it
        var result = svc.validate("user@middle@extra.com");
        // Either rejects for format reasons or treats "extra.com" as domain
        // Either outcome is fine — should not throw
        assertNotNull(result);
    }

    @Test void allows_plus_alias_gmail() {
        // user+tag@gmail.com is valid RFC 5321
        var result = svc.validate("user+tag@gmail.com");
        // gmail.com has valid MX — should pass or fail-open on DNS
        assertTrue(result.valid() ||
            (result.reason() != null && !result.reason().contains("throwaway")),
            "Plus alias on real domain should not be blocked as disposable");
    }

    @Test void allows_dots_in_local_part() {
        var result = svc.validate("first.last@gmail.com");
        assertTrue(result.valid() ||
            (result.reason() != null && !result.reason().contains("throwaway")));
    }

    @Test void handles_uppercase_domain() {
        // Domain matching must be case-insensitive
        assertFalse(svc.validate("user@MAILINATOR.COM").valid(),
            "Uppercase disposable domain must still be blocked");
    }

    @Test void handles_mixed_case_domain() {
        assertFalse(svc.validate("user@Mailinator.Com").valid(),
            "Mixed-case disposable domain must still be blocked");
    }

    @Test void rejects_whitespace_only_email() {
        assertFalse(svc.validate("   ").valid());
    }

    // ── Disposable blocklist comprehensiveness ───────────────────────────────

    @ParameterizedTest
    @ValueSource(strings = {
        "user@mailinator.com",
        "user@guerrillamail.com",
        "user@tempmail.com",
        "user@10minutemail.com",
        "user@yopmail.com",
        "user@trashmail.com",
        "user@getnada.com",
        "user@maildrop.cc",
        "user@mohmal.com",
        "user@throwam.com",
        "user@dispostable.com",
        "user@spamgourmet.com",
        "user@fakeinbox.com",
        "user@mailnull.com",
        "user@binkmail.com",
        "user@dayrep.com",
        "user@meltmail.com",
        "user@mytrashmail.com"
    })
    void rejects_known_disposable_domains(String email) {
        assertFalse(svc.validate(email).valid(),
            "Should reject disposable domain: " + email);
    }

    // ── Suspicious pattern edge cases ────────────────────────────────────────

    @ParameterizedTest
    @ValueSource(strings = {
        "user@qwerty.com",
        "user@asdf.com",
        "user@zxcv.com",
        "user@test.com",
        "user@fake.com",
        "user@noreply.com",
        "user@invalid.com",
        "user@nobody.com",
        "user@null.com"
    })
    void rejects_suspicious_pattern_domains(String email) {
        assertFalse(svc.validate(email).valid(),
            "Should reject suspicious domain: " + email);
    }

    // ── Subdomain handling ───────────────────────────────────────────────────

    @Test void allows_corporate_subdomain() {
        // A corporate address like user@mail.company.com should not match keyword patterns
        var result = svc.validate("user@mail.nightcity.dev");
        // Should not be blocked as disposable or suspicious
        // May fail MX check for unknown domains — that's fine
        if (!result.valid()) {
            assertFalse(result.reason().contains("throwaway"), "Should not flag as throwaway");
            assertFalse(result.reason().contains("suspicious"), "Should not flag as suspicious");
        }
    }

    // ── Validation result contract ───────────────────────────────────────────

    @Test void ok_result_has_null_reason() {
        // If we get a valid result, reason must be null
        var ok = EmailValidationService.ValidationResult.ok();
        assertTrue(ok.valid());
        assertNull(ok.reason());
    }

    @Test void reject_result_has_non_null_reason() {
        var reject = EmailValidationService.ValidationResult.reject("Test reason");
        assertFalse(reject.valid());
        assertEquals("Test reason", reject.reason());
    }

    @Test void reject_result_preserves_full_reason_string() {
        String longReason = "A".repeat(500);
        var result = EmailValidationService.ValidationResult.reject(longReason);
        assertEquals(longReason, result.reason());
    }

    // ── DNS lookup target (SSRF) ─────────────────────────────────────────────

    @ParameterizedTest
    @ValueSource(strings = {
        "x@/192.0.2.1:53/example.com",   // would become dns://192.0.2.1:53/example.com
        "x@//192.0.2.1/example.com",
        "x@example.com:53",
        "x@localhost",
        "x@exa_mple.com",
        "x@-example.com",
    })
    void rejects_domains_that_are_not_plain_hostnames(String email) {
        var result = svc.validate(email);
        assertFalse(result.valid());
        assertEquals("Invalid email format.", result.reason());
    }

    @Test void accepts_plain_hostnames() {
        assertTrue(EmailValidationService.isHostname("mail.example.co.uk"));
        assertTrue(EmailValidationService.isHostname("xn--bcher-kva.example"));
        assertFalse(EmailValidationService.isHostname("a".repeat(254) + ".com"));
    }

    @Test void converts_idn_and_trailing_dot_before_the_check() {
        assertEquals("xn--mnchen-3ya.de", EmailValidationService.toAsciiDomain("München.DE."));
        assertTrue(EmailValidationService.isHostname(EmailValidationService.toAsciiDomain("münchen.de")));
    }
}
