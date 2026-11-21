package com.resume.market;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Settings of the weekly market research, from {@code market-research.*} in
 * {@code application.yml} (environment variables on Railway).
 *
 * <p>Every value is read as text and parsed here, so a typo in a variable falls back to
 * the default with a warning instead of stopping the application from starting.
 */
@Component
public class MarketResearchSettings {
    private static final Logger log = LoggerFactory.getLogger(MarketResearchSettings.class);

    public static final String DEFAULT_CRON = "0 0 6 * * MON";
    public static final String DEFAULT_BASE_URL = "https://api.adzuna.com/v1/api";

    private final boolean enabled;
    private final String appId;
    private final String appKey;
    private final String cron;
    private final String baseUrl;
    private final String country;
    private final int minListings;
    private final int minMentions;
    private final int minSharePercent;
    private final int maxSuggestionsPerRun;
    private final int maxPendingSuggestions;
    private final int maxDaysOld;
    private final int resultsPerPage;
    private final int maxAttempts;
    private final long backoffMillis;
    private final long pauseMillis;

    @Autowired
    public MarketResearchSettings(
            @Value("${market-research.enabled:false}") String enabled,
            @Value("${market-research.adzuna.app-id:}") String appId,
            @Value("${market-research.adzuna.app-key:}") String appKey,
            @Value("${market-research.cron:" + DEFAULT_CRON + "}") String cron,
            @Value("${market-research.adzuna.base-url:" + DEFAULT_BASE_URL + "}") String baseUrl,
            @Value("${market-research.adzuna.country:us}") String country,
            @Value("${market-research.min-listings:30}") String minListings,
            @Value("${market-research.min-mentions:5}") String minMentions,
            @Value("${market-research.min-share-percent:20}") String minSharePercent,
            @Value("${market-research.max-suggestions-per-run:3}") String maxSuggestionsPerRun,
            @Value("${market-research.max-pending-suggestions:5}") String maxPendingSuggestions,
            @Value("${market-research.adzuna.max-days-old:30}") String maxDaysOld,
            @Value("${market-research.adzuna.results-per-page:50}") String resultsPerPage,
            @Value("${market-research.adzuna.max-attempts:3}") String maxAttempts,
            @Value("${market-research.adzuna.backoff-millis:2000}") String backoffMillis,
            @Value("${market-research.adzuna.pause-millis:3000}") String pauseMillis) {
        this.enabled = "true".equalsIgnoreCase(text(enabled));
        this.appId = text(appId);
        this.appKey = text(appKey);
        this.cron = text(cron).isEmpty() ? DEFAULT_CRON : text(cron);
        this.baseUrl = text(baseUrl).isEmpty() ? DEFAULT_BASE_URL : text(baseUrl).replaceAll("/+$", "");
        this.country = text(country).matches("[a-z]{2}") ? text(country) : "us";
        this.minListings = number("min-listings", minListings, 30, 1, 100_000);
        this.minMentions = number("min-mentions", minMentions, 5, 1, 100_000);
        this.minSharePercent = number("min-share-percent", minSharePercent, 20, 1, 100);
        this.maxSuggestionsPerRun = number("max-suggestions-per-run", maxSuggestionsPerRun, 3, 0, 10);
        this.maxPendingSuggestions = number("max-pending-suggestions", maxPendingSuggestions, 5, 0, 50);
        this.maxDaysOld = number("adzuna.max-days-old", maxDaysOld, 30, 1, 90);
        this.resultsPerPage = number("adzuna.results-per-page", resultsPerPage, 50, 1, 50);
        this.maxAttempts = number("adzuna.max-attempts", maxAttempts, 3, 1, 5);
        this.backoffMillis = number("adzuna.backoff-millis", backoffMillis, 2000, 0, 60_000);
        this.pauseMillis = number("adzuna.pause-millis", pauseMillis, 3000, 0, 60_000);
    }

    /** Why the job may not run, from the settings alone; empty when the flag and both credentials are set. */
    public Optional<String> disabledReason() {
        if (!enabled) return Optional.of("MARKET_RESEARCH_ENABLED is not true");
        if (appId.isEmpty() || appKey.isEmpty()) {
            return Optional.of("ADZUNA_APP_ID and ADZUNA_APP_KEY are not both set");
        }
        return Optional.empty();
    }

    public boolean enabled() { return enabled; }
    public String appId() { return appId; }
    public String appKey() { return appKey; }
    public String cron() { return cron; }
    public String baseUrl() { return baseUrl; }
    public String country() { return country; }
    /** Below this many examined listings a week's numbers are not acted on. */
    public int minListings() { return minListings; }
    /** A skill must be mentioned in at least this many listings... */
    public int minMentions() { return minMentions; }
    /** ...and in at least this share of them. */
    public int minSharePercent() { return minSharePercent; }
    public int maxSuggestionsPerRun() { return maxSuggestionsPerRun; }
    /** No new suggestion while this many from market research are still waiting. */
    public int maxPendingSuggestions() { return maxPendingSuggestions; }
    public int maxDaysOld() { return maxDaysOld; }
    public int resultsPerPage() { return resultsPerPage; }
    /** Tries per request, the first included. */
    public int maxAttempts() { return maxAttempts; }
    /** Wait before the second try; doubled for each later one. */
    public long backoffMillis() { return backoffMillis; }
    /** Wait between two companies' requests, to stay far below any rate limit. */
    public long pauseMillis() { return pauseMillis; }

    private static String text(String raw) {
        return raw == null ? "" : raw.strip();
    }

    private static int number(String name, String raw, int fallback, int min, int max) {
        String value = text(raw);
        try {
            int parsed = Integer.parseInt(value);
            if (parsed >= min && parsed <= max) return parsed;
        } catch (NumberFormatException e) {
            // reported below
        }
        log.warn("Market research: market-research.{} must be a whole number from {} to {}; using {}",
                name, min, max, fallback);
        return fallback;
    }
}
