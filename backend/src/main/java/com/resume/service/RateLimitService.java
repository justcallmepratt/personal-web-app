package com.resume.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

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

    /** Map size at which expired entries are swept on the next request. */
    static final int SWEEP_THRESHOLD = 1_000;

    private final int maxSubmissions;
    private final int windowSeconds;

    /** ip → timestamps of recent submissions within the window */
    private final ConcurrentHashMap<String, Deque<Long>> log_ = new ConcurrentHashMap<>();
    /** Second of the last sweep; sweeps run at most once a second. */
    private final AtomicLong lastSweep = new AtomicLong(Long.MIN_VALUE);

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

        // Each new address adds an entry; drop expired ones before the map grows large.
        // Throttled to once a second, so a flood of live addresses can't make every request scan the map.
        if (log_.size() >= SWEEP_THRESHOLD && lastSweep.getAndUpdate(t -> t < now ? now : t) < now) evictStale();

        // compute locks the key, so a concurrent sweep cannot drop this deque mid-update.
        boolean[] allowed = {true};
        log_.compute(ip, (k, existing) -> {
            Deque<Long> times = existing == null ? new ArrayDeque<>() : existing;
            synchronized (times) {
                // remove timestamps outside the window
                while (!times.isEmpty() && times.peekFirst() < cutoff) {
                    times.pollFirst();
                }
                if (times.size() >= maxSubmissions) {
                    log.warn("Rate limit exceeded for IP [{}]: {} submissions in {}s window",
                            ip.replaceAll("\\R", "_"), times.size(), windowSeconds);
                    allowed[0] = false;
                } else {
                    times.addLast(now);
                }
            }
            return times;
        });
        return allowed[0];
    }

    int trackedAddresses() { return log_.size(); }

    /** Removes addresses with no submissions inside the window. Runs from isAllowed when the map is large. */
    public void evictStale() {
        long cutoff = Instant.now().getEpochSecond() - windowSeconds;
        // computeIfPresent locks the key, so isAllowed cannot add to a deque that is being removed.
        for (String ip : log_.keySet()) {
            log_.computeIfPresent(ip, (k, times) -> {
                synchronized (times) {
                    times.removeIf(t -> t < cutoff);
                    return times.isEmpty() ? null : times;
                }
            });
        }
    }
}
