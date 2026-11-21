package com.resume.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class LoginRateLimiterTest {

    @Test
    void blocksAClientAfterItsFailedAttemptsAreUsedUp() {
        LoginRateLimiter limiter = new LoginRateLimiter(3, 100, 900);

        assertThat(limiter.isBlocked("203.0.113.7")).isFalse();
        limiter.recordFailure("203.0.113.7");
        limiter.recordFailure("203.0.113.7");
        assertThat(limiter.isBlocked("203.0.113.7")).isFalse();
        limiter.recordFailure("203.0.113.7");

        assertThat(limiter.isBlocked("203.0.113.7")).isTrue();
        assertThat(limiter.isBlocked("198.51.100.9")).isFalse();
    }

    @Test
    void aSuccessfulSignInClearsThatClientsCount() {
        LoginRateLimiter limiter = new LoginRateLimiter(2, 100, 900);
        limiter.recordFailure("203.0.113.7");
        limiter.recordFailure("203.0.113.7");
        assertThat(limiter.isBlocked("203.0.113.7")).isTrue();

        limiter.recordSuccess("203.0.113.7");

        assertThat(limiter.isBlocked("203.0.113.7")).isFalse();
    }

    @Test
    void blocksEveryoneOnceTheOverallLimitIsReached() {
        LoginRateLimiter limiter = new LoginRateLimiter(100, 3, 900);
        limiter.recordFailure("203.0.113.1");
        limiter.recordFailure("203.0.113.2");
        assertThat(limiter.isBlocked("198.51.100.9")).isFalse();
        limiter.recordFailure("203.0.113.3");

        assertThat(limiter.isBlocked("198.51.100.9")).isTrue();
    }

    @Test
    void aSuccessfulSignInDoesNotClearTheOverallCount() {
        LoginRateLimiter limiter = new LoginRateLimiter(100, 2, 900);
        limiter.recordFailure("203.0.113.1");
        limiter.recordFailure("203.0.113.2");

        limiter.recordSuccess("203.0.113.1");

        assertThat(limiter.isBlocked("203.0.113.1")).isTrue();
    }

    @Test
    void attemptsOutsideTheWindowNoLongerCount() {
        // A zero-second window means every earlier attempt has already expired.
        LoginRateLimiter limiter = new LoginRateLimiter(1, 1, 0);
        limiter.recordFailure("203.0.113.7");

        assertThat(limiter.isBlocked("203.0.113.7")).isFalse();
    }

    @Test
    void missingOrBlankClientAddressesShareOneCount() {
        LoginRateLimiter limiter = new LoginRateLimiter(2, 100, 900);
        limiter.recordFailure(null);
        limiter.recordFailure("  ");

        assertThat(limiter.isBlocked("")).isTrue();
        assertThat(limiter.isBlocked("203.0.113.7")).isFalse();
    }

    @Test
    void exposesItsWindowForTheRetryAfterHeader() {
        assertThat(new LoginRateLimiter(5, 30, 900).windowSeconds()).isEqualTo(900);
    }
}
