package com.resume.market;

/** Builds {@link MarketResearchSettings} for tests: the defaults, switched on, with no waiting. */
final class TestSettings {
    String enabled = "true";
    String appId = "test-id";
    String appKey = "test-key";
    String cron = MarketResearchSettings.DEFAULT_CRON;
    String baseUrl = "https://adzuna.test/v1/api";
    String country = "us";
    String minListings = "30";
    String minMentions = "5";
    String minSharePercent = "20";
    String maxSuggestionsPerRun = "3";
    String maxPendingSuggestions = "5";
    String maxDaysOld = "30";
    String resultsPerPage = "50";
    String maxAttempts = "3";
    String backoffMillis = "2000";
    String pauseMillis = "3000";

    static TestSettings on() { return new TestSettings(); }

    static MarketResearchSettings defaults() { return on().build(); }

    MarketResearchSettings build() {
        return new MarketResearchSettings(enabled, appId, appKey, cron, baseUrl, country, minListings, minMentions,
                minSharePercent, maxSuggestionsPerRun, maxPendingSuggestions, maxDaysOld, resultsPerPage,
                maxAttempts, backoffMillis, pauseMillis);
    }
}
