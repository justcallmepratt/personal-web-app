package com.resume.market;

import com.resume.model.MarketResearchRun;
import com.resume.model.MarketRoleTotal;
import com.resume.model.MarketSkillCount;
import com.resume.repository.MarketResearchRunRepository;
import com.resume.repository.MarketRoleTotalRepository;
import com.resume.repository.MarketSkillCountRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Reads and writes the weekly summaries. There is at most one row per week, and a week's
 * counts are replaced together with its row in one transaction, so a reader never sees
 * half a summary and a failure never damages a completed one.
 *
 * <p>A summary is broken down by target role: for each role, how many of its listings
 * were examined and how many of those mentioned each skill.
 */
@Service
public class MarketSummaryStore {
    static final int ERROR_MAX = 500;

    /** What one run found for one role: listings examined, and listings mentioning each skill. */
    public record RoleCounts(int listingsExamined, Map<String, Integer> skills) {}

    /** One role of a stored week; skills are most mentioned first. {@code role} is the role's id. */
    public record RoleSummary(String role, int listingsExamined, List<MarketSkillCount> skills) {}

    /** A completed week, by role, in the order the roles were saved. */
    public record Summary(MarketResearchRun run, List<RoleSummary> roles) {}

    private final MarketResearchRunRepository runs;
    private final MarketRoleTotalRepository totals;
    private final MarketSkillCountRepository counts;

    public MarketSummaryStore(MarketResearchRunRepository runs, MarketRoleTotalRepository totals,
                              MarketSkillCountRepository counts) {
        this.runs = runs;
        this.totals = totals;
        this.counts = counts;
    }

    @Transactional(readOnly = true)
    public Optional<MarketResearchRun> find(LocalDate weekStart) {
        return runs.findByWeekStart(weekStart);
    }

    /** The newest completed week with its counts. */
    @Transactional(readOnly = true)
    public Optional<Summary> latest() {
        return runs.findFirstByStatusOrderByWeekStartDesc(MarketResearchRun.COMPLETED).map(this::withCounts);
    }

    /** The given week with its counts, if it completed. */
    @Transactional(readOnly = true)
    public Optional<Summary> completed(LocalDate weekStart) {
        return runs.findByWeekStart(weekStart).filter(MarketResearchRun::isCompleted).map(this::withCounts);
    }

    /** The newest week, completed or failed (without counts). */
    @Transactional(readOnly = true)
    public Optional<MarketResearchRun> newestWeek() {
        return runs.findFirstByOrderByWeekStartDesc();
    }

    /**
     * Records the week as completed and replaces its counts. Running it twice for the
     * same week leaves one row and one set of counts. {@code byRole} is keyed by role id.
     */
    @Transactional
    public Summary saveCompleted(LocalDate weekStart, LocalDateTime startedAt, int companiesQueried, int apiCalls,
                                 Map<String, RoleCounts> byRole) {
        int examined = byRole.values().stream().mapToInt(RoleCounts::listingsExamined).sum();
        MarketResearchRun run = runs.findByWeekStart(weekStart).orElseGet(MarketResearchRun::new);
        run.setWeekStart(weekStart);
        run.setStatus(MarketResearchRun.COMPLETED);
        run.setListingsExamined(examined);
        run.setCompaniesQueried(companiesQueried);
        run.setApiCalls(apiCalls);
        run.setSuggestionsCreated(0);
        run.setError(null);
        run.setStartedAt(startedAt);
        run.setFinishedAt(LocalDateTime.now());
        MarketResearchRun saved = runs.saveAndFlush(run);
        Long runId = saved.getId();

        counts.deleteByRunId(runId);
        totals.deleteByRunId(runId);
        byRole.forEach((role, found) -> {
            totals.save(new MarketRoleTotal(runId, role, found.listingsExamined()));
            found.skills().forEach((skill, mentioned) -> {
                if (mentioned != null && mentioned > 0) counts.save(new MarketSkillCount(runId, role, skill, mentioned));
            });
        });
        totals.flush();
        counts.flush();
        // The deletes cleared the persistence context; read the row back rather than return a detached copy.
        return withCounts(runs.findById(runId).orElseThrow());
    }

    /**
     * Records that the week's run failed, unless the week already has a completed
     * summary, which is left exactly as it is.
     *
     * @return false when a completed summary was kept
     */
    @Transactional
    public boolean saveFailed(LocalDate weekStart, LocalDateTime startedAt, int apiCalls, String error) {
        Optional<MarketResearchRun> existing = runs.findByWeekStart(weekStart);
        if (existing.filter(MarketResearchRun::isCompleted).isPresent()) return false;

        MarketResearchRun run = existing.orElseGet(MarketResearchRun::new);
        run.setWeekStart(weekStart);
        run.setStatus(MarketResearchRun.FAILED);
        run.setListingsExamined(0);
        run.setCompaniesQueried(0);
        run.setApiCalls(apiCalls);
        run.setSuggestionsCreated(0);
        String message = error == null || error.isBlank() ? "Unknown error" : error.strip();
        run.setError(message.length() > ERROR_MAX ? message.substring(0, ERROR_MAX) : message);
        run.setStartedAt(startedAt);
        run.setFinishedAt(LocalDateTime.now());
        runs.save(run);
        return true;
    }

    /** Adds to the number of suggestions the week has produced. */
    @Transactional
    public void addSuggestionsCreated(Long runId, int created) {
        if (created <= 0) return;
        runs.findById(runId).ifPresent(run -> {
            run.setSuggestionsCreated(run.getSuggestionsCreated() + created);
            runs.save(run);
        });
    }

    private Summary withCounts(MarketResearchRun run) {
        Map<String, Integer> examined = new LinkedHashMap<>();
        Map<String, List<MarketSkillCount>> skills = new LinkedHashMap<>();
        for (MarketRoleTotal total : totals.findByRunIdOrderByIdAsc(run.getId())) {
            examined.put(total.getRole(), total.getListingsExamined());
            skills.put(total.getRole(), new ArrayList<>());
        }
        for (MarketSkillCount count : counts.findByRunIdOrderByListingsMentionedDescSkillAsc(run.getId())) {
            // A count without a total (a row written by hand) still shows, with nothing examined.
            examined.putIfAbsent(count.getRole(), 0);
            skills.computeIfAbsent(count.getRole(), role -> new ArrayList<>()).add(count);
        }
        List<RoleSummary> roles = new ArrayList<>();
        examined.forEach((role, listings) -> roles.add(new RoleSummary(role, listings, List.copyOf(skills.get(role)))));
        return new Summary(run, List.copyOf(roles));
    }
}
