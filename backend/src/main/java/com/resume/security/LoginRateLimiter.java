package com.resume.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Limits failed admin sign-in attempts so the password cannot be guessed at speed.
 *
 * Two counters, both over the same sliding window:
 *  - per client address, so one source is cut off quickly;
 *  - across all clients, because the forwarded client address can be forged
 *    and an attacker could otherwise rotate it to dodge the per-client limit.
 *
 * Only failures are counted, and a successful sign-in clears that client's
 * count. State is in memory, so it resets on restart and is per instance.
 */
@Component
public class LoginRateLimiter {

    static final String ALL_CLIENTS = "*";

    private final int maxPerClient;
    private final int maxOverall;
    private final long windowSeconds;
    private final ConcurrentHashMap<String, Deque<Long>> failures = new ConcurrentHashMap<>();

    public LoginRateLimiter(
            @Value("${admin.login-rate-limit.max-attempts:5}") int maxPerClient,
            @Value("${admin.login-rate-limit.max-attempts-overall:30}") int maxOverall,
            @Value("${admin.login-rate-limit.window-seconds:900}") long windowSeconds) {
        this.maxPerClient = maxPerClient;
        this.maxOverall = maxOverall;
        this.windowSeconds = windowSeconds;
    }

    /** True when this client, or sign-in as a whole, has used up its failed attempts. */
    public boolean isBlocked(String client) {
        long now = Instant.now().getEpochSecond();
        return recent(key(client), now) >= maxPerClient || recent(ALL_CLIENTS, now) >= maxOverall;
    }

    public void recordFailure(String client) {
        long now = Instant.now().getEpochSecond();
        add(key(client), now);
        add(ALL_CLIENTS, now);
    }

    /** Clears the client's own count after a successful sign-in. The overall count is left to expire. */
    public void recordSuccess(String client) {
        failures.remove(key(client));
    }

    public long windowSeconds() {
        return windowSeconds;
    }

    private static String key(String client) {
        return client == null || client.isBlank() ? "unknown" : client;
    }

    private int recent(String key, long now) {
        Deque<Long> times = failures.get(key);
        if (times == null) return 0;
        synchronized (times) {
            prune(times, now);
            return times.size();
        }
    }

    private void add(String key, long now) {
        Deque<Long> times = failures.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (times) {
            prune(times, now);
            times.addLast(now);
        }
    }

    private void prune(Deque<Long> times, long now) {
        long cutoff = now - windowSeconds;
        while (!times.isEmpty() && times.peekFirst() <= cutoff) {
            times.pollFirst();
        }
    }
}
