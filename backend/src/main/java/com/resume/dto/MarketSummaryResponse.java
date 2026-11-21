package com.resume.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * What {@code GET /api/admin/market-research/latest} answers: whether the job is on, the
 * rules it applies, the newest completed week ({@code summary}, null before the first
 * one) and the newest week of any status ({@code lastRun}, which differs from the summary
 * when the latest run failed).
 */
public record MarketSummaryResponse(
        boolean enabled,
        String disabledReason,
        boolean running,
        String allowListCompiledOn,
        int allowListCompanies,
        Thresholds thresholds,
        Summary summary,
        Run lastRun
) {
    public record Thresholds(int minListings, int minMentions, int minSharePercent,
                             int maxSuggestionsPerRun, int maxPendingSuggestions) {}

    public record Summary(LocalDate weekStart, int listingsExamined, int companiesQueried, int apiCalls,
                          int suggestionsCreated, LocalDateTime finishedAt, List<SkillCount> skills) {}

    public record SkillCount(String skill, int listingsMentioned) {}

    public record Run(LocalDate weekStart, String status, String error, LocalDateTime finishedAt) {}
}
