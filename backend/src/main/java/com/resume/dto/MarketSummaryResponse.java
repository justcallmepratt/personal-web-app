package com.resume.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * What {@code GET /api/admin/market-research/latest} answers: whether the job is on, the
 * rules it applies, the target roles, the newest completed week broken down by role
 * ({@code summary}, null before the first one) and the newest week of any status ({@code lastRun}, which differs from the summary
 * when the latest run failed).
 */
public record MarketSummaryResponse(
        boolean enabled,
        String disabledReason,
        boolean running,
        String allowListCompiledOn,
        int allowListCompanies,
        List<String> targetRoles,
        Thresholds thresholds,
        Summary summary,
        Run lastRun
) {
    public record Thresholds(int minListings, int minMentions, int minSharePercent,
                             int maxSuggestionsPerRun, int maxPendingSuggestions) {}

    /** {@code listingsExamined} is the total over the roles. */
    public record Summary(LocalDate weekStart, int listingsExamined, int companiesQueried, int apiCalls,
                          int suggestionsCreated, LocalDateTime finishedAt, List<Role> roles) {}

    /** One target role of the week: its id and name, its listings examined, and its skills, most mentioned first. */
    public record Role(String role, String name, int listingsExamined, List<SkillCount> skills) {}

    public record SkillCount(String skill, int listingsMentioned) {}

    public record Run(LocalDate weekStart, String status, String error, LocalDateTime finishedAt) {}
}
