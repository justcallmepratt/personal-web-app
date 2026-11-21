package com.resume.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simple in-memory IP-based rate limiter for the contact form.
 *
 * Allows up to MAX_SUBMISSIONS per IP within WINDOW_SECONDS.
 * Designed for low-traffic use (portfolio contact form).
 * For high-traffic use replace with Redis + bucket4j.
 */
@Service
public class RateLimitService {

    private static final Logger log = LoggerFactory.getLogger(RateLimitService.class);

    private final int maxSubmissions;
    private final int windowSeconds;

    /** ip → timestamps of recent submissions within the window */
    private final ConcurrentHashMap<String, Deque<Long>> log_ = new ConcurrentHashMap<>();

    public RateLimitService(
            @Value("${contact.rate-limit.max-submissions:3}") int maxSubmissions,
            @Value("${contact.rate-limit.window-seconds:3600}") int windowSeconds) {
        this.maxSubmissions = maxSubmissions;
        this.windowSeconds  = windowSeconds;
    }

    /**
     * @param ip the remote IP address (X-Forwarded-For header preferred)
     * @return true if the submission is allowed; false if rate-limited
     */
    public boolean isAllowed(String ip) {
        if (ip == null || ip.isBlank()) return true;   // allow unknown IPs

        long now     = Instant.now().getEpochSecond();
        long cutoff  = now - windowSeconds;

        Deque<Long> times = log_.computeIfAbsent(ip, k -> new ArrayDeque<>());

        synchronized (times) {
            // remove timestamps outside the window
            while (!times.isEmpty() && times.peekFirst() < cutoff) {
                times.pollFirst();
            }

            if (times.size() >= maxSubmissions) {
                log.warn("Rate limit exceeded for IP [{}]: {} submissions in {}s window",
                        ip == null ? null : ip.replaceAll("\\R", "_"), times.size(), windowSeconds);
                return false;
            }

            times.addLast(now);
        }
        return true;
    }

    /** Periodic cleanup of stale entries (call from a @Scheduled job or leave for GC). */
    public void evictStale() {
        long cutoff = Instant.now().getEpochSecond() - windowSeconds;
        log_.entrySet().removeIf(entry -> {
            synchronized (entry.getValue()) {
                entry.getValue().removeIf(t -> t < cutoff);
                return entry.getValue().isEmpty();
            }
        });
    }
}
