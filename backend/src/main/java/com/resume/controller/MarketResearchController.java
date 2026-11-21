package com.resume.controller;

import com.resume.dto.MarketSummaryResponse;
import com.resume.market.AllowList;
import com.resume.market.MarketResearchJob;
import com.resume.market.MarketResearchService;
import com.resume.market.MarketResearchSettings;
import com.resume.market.MarketSummaryStore;
import com.resume.market.TargetRoles;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/**
 * The weekly market research, for the owner only: everything here is under
 * {@code /api/admin/**}, which {@code SecurityConfig} restricts to the admin JWT.
 */
@RestController
@RequestMapping("/api/admin/market-research")
public class MarketResearchController {
    private final MarketResearchJob job;
    private final MarketResearchService service;
    private final MarketSummaryStore store;
    private final MarketResearchSettings settings;
    private final AllowList allowList;
    private final TargetRoles targetRoles;

    public MarketResearchController(MarketResearchJob job, MarketResearchService service, MarketSummaryStore store,
                                    MarketResearchSettings settings, AllowList allowList, TargetRoles targetRoles) {
        this.job = job;
        this.service = service;
        this.store = store;
        this.settings = settings;
        this.allowList = allowList;
        this.targetRoles = targetRoles;
    }

    /** The newest completed summary, broken down by target role, and the state of the job. */
    @GetMapping("/latest")
    public MarketSummaryResponse latest() {
        Optional<String> off = service.disabledReason();
        MarketSummaryResponse.Summary summary = store.latest().map(s -> new MarketSummaryResponse.Summary(
                s.run().getWeekStart(), s.run().getListingsExamined(), s.run().getCompaniesQueried(),
                s.run().getApiCalls(), s.run().getSuggestionsCreated(), s.run().getFinishedAt(),
                s.roles().stream().map(role -> new MarketSummaryResponse.Role(
                        role.role(), targetRoles.nameOf(role.role()), role.listingsExamined(),
                        role.skills().stream()
                                .map(c -> new MarketSummaryResponse.SkillCount(c.getSkill(), c.getListingsMentioned()))
                                .toList())).toList())).orElse(null);
        MarketSummaryResponse.Run lastRun = store.newestWeek().map(r -> new MarketSummaryResponse.Run(
                r.getWeekStart(), r.getStatus(), r.getError(), r.getFinishedAt())).orElse(null);
        return new MarketSummaryResponse(off.isEmpty(), off.orElse(null), job.running(),
                allowList.compiledOn(), allowList.companies().size(),
                targetRoles.roles().stream().map(TargetRoles.Role::name).toList(),
                new MarketSummaryResponse.Thresholds(settings.minListings(), settings.minMentions(),
                        settings.minSharePercent(), settings.maxSuggestionsPerRun(), settings.maxPendingSuggestions()),
                summary, lastRun);
    }

    /**
     * Starts a run for the current week in the background (202). A week that is already
     * summarised is not fetched again unless {@code force=true}. 409 when the job is off
     * ({@code disabled}) or a run is going ({@code already_running}).
     */
    @PostMapping("/run")
    public ResponseEntity<Map<String, Object>> run(@RequestParam(defaultValue = "false") boolean force) {
        Map<String, Object> body = new LinkedHashMap<>();
        switch (job.trigger(force)) {
            case STARTED -> {
                body.put("status", "started");
                body.put("weekStart", job.currentWeek().toString());
                body.put("force", force);
                return ResponseEntity.status(HttpStatus.ACCEPTED).body(body);
            }
            case ALREADY_RUNNING -> {
                body.put("error", "A run is already going.");
                body.put("code", "already_running");
            }
            case DISABLED -> {
                body.put("error", "Market research is disabled: "
                        + service.disabledReason().orElse("the job is not scheduled") + ".");
                body.put("code", "disabled");
            }
        }
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    /** {@code force} that is not true or false is the caller's mistake, not a 500. */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> unreadable() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", "The request could not be read.");
        body.put("code", "invalid");
        return ResponseEntity.badRequest().body(body);
    }
}
