package com.resume.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Edge-case tests for RateLimitService.
 * Covers: boundary conditions, exact limit, different IPs, malformed IPs.
 */
class RateLimitEdgeCaseTest {

    // ── Exact boundary at limit ──────────────────────────────────────────────

    @Test void allows_exactly_at_limit() {
        RateLimitService svc = new RateLimitService(5, 3600);
        for (int i = 0; i < 5; i++) {
            assertTrue(svc.isAllowed("10.0.0.1"), "Attempt " + (i+1) + " should be allowed");
        }
    }

    @Test void a_released_slot_can_be_used_again() {
        RateLimitService svc = new RateLimitService(2, 3600);
        assertTrue(svc.isAllowed("10.0.0.9"));
        assertTrue(svc.isAllowed("10.0.0.9"));
        svc.release("10.0.0.9");
        assertTrue(svc.isAllowed("10.0.0.9"), "the released slot is free again");
        assertFalse(svc.isAllowed("10.0.0.9"));
        svc.release("unknown");   // no entry: nothing happens
        svc.release(null);
    }

    @Test void blocks_exactly_one_over_limit() {
        RateLimitService svc = new RateLimitService(5, 3600);
        for (int i = 0; i < 5; i++) svc.isAllowed("10.0.0.2");
        assertFalse(svc.isAllowed("10.0.0.2"), "6th attempt should be blocked");
    }

    @Test void blocks_all_subsequent_over_limit() {
        RateLimitService svc = new RateLimitService(2, 3600);
        svc.isAllowed("10.0.0.3");
        svc.isAllowed("10.0.0.3");
        // 3rd, 4th, 5th all blocked
        assertFalse(svc.isAllowed("10.0.0.3"));
        assertFalse(svc.isAllowed("10.0.0.3"));
        assertFalse(svc.isAllowed("10.0.0.3"));
    }

    // ── IP isolation ─────────────────────────────────────────────────────────

    @Test void hundred_different_ips_all_get_fresh_limit() {
        RateLimitService svc = new RateLimitService(1, 3600);
        for (int i = 0; i < 100; i++) {
            String ip = "192.168.1." + i;
            assertTrue(svc.isAllowed(ip), "First request from " + ip + " should be allowed");
        }
    }

    @Test void ipv6_address_treated_as_key() {
        RateLimitService svc = new RateLimitService(2, 3600);
        String ipv6 = "2001:0db8:85a3:0000:0000:8a2e:0370:7334";
        assertTrue(svc.isAllowed(ipv6));
        assertTrue(svc.isAllowed(ipv6));
        assertFalse(svc.isAllowed(ipv6));
    }

    @Test void localhost_loopback_ipv6_treated_as_key() {
        RateLimitService svc = new RateLimitService(1, 3600);
        assertTrue(svc.isAllowed("::1"));
        assertFalse(svc.isAllowed("::1"));
    }

    // ── Edge values for maxSubmissions ───────────────────────────────────────

    @Test void max_submissions_of_one_allows_first_blocks_second() {
        RateLimitService svc = new RateLimitService(1, 3600);
        assertTrue(svc.isAllowed("1.2.3.4"));
        assertFalse(svc.isAllowed("1.2.3.4"));
    }

    @Test void very_high_limit_never_blocks_in_practice() {
        RateLimitService svc = new RateLimitService(Integer.MAX_VALUE, 3600);
        for (int i = 0; i < 1000; i++) {
            assertTrue(svc.isAllowed("5.5.5.5"), "Should never block with max limit");
        }
    }

    // ── X-Forwarded-For (handled in controller, but test IP format tolerance) ─

    @Test void ip_with_port_treated_as_key() {
        // Unlikely in practice, but should not crash
        RateLimitService svc = new RateLimitService(1, 3600);
        assertDoesNotThrow(() -> svc.isAllowed("192.168.1.1:8080"));
    }

    @Test void evict_stale_does_not_throw_when_empty() {
        RateLimitService svc = new RateLimitService(3, 3600);
        assertDoesNotThrow(svc::evictStale);
    }

    @Test void evict_stale_after_submissions_does_not_throw() {
        RateLimitService svc = new RateLimitService(3, 3600);
        svc.isAllowed("1.1.1.1");
        svc.isAllowed("2.2.2.2");
        assertDoesNotThrow(svc::evictStale);
    }

    @org.junit.jupiter.api.Test
    void sweepsExpiredAddressesSoTheMapStaysBounded() {
        // A negative window puts every earlier submission outside it.
        RateLimitService limiter = new RateLimitService(3, -1);
        for (int i = 0; i <= RateLimitService.SWEEP_THRESHOLD; i++) {
            limiter.isAllowed("10.0." + (i / 256) + "." + (i % 256));
        }
        // The request that found the map full swept it, then added only itself.
        org.assertj.core.api.Assertions.assertThat(limiter.trackedAddresses()).isEqualTo(1);
    }
}
