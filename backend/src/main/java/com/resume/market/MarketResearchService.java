package com.resume.market;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.TreeMap;

/**
 * One run of the weekly market research: fetch listings for each allow-listed company and
 * each target role, count which dictionary skills they mention, store the counts for the
 * week by role, then hand the summary to {@link MarketSuggester}.
 *
 * <p>Idempotent per week: a week that already has a completed summary is not fetched
 * again (no API calls) unless {@code force} is set; the suggestion step still runs, and
 * creates nothing that is already pending or was rejected. A run that fails stores no
 * counts: an earlier completed summary, for this or any other week, stays as it is.
 */
@Service
public class MarketResearchService {
    private static final Logger log = LoggerFactory.getLogger(MarketResearchService.class);

    public enum Status { COMPLETED, ALREADY_DONE, FAILED, DISABLED }

    /** What a run did. {@code message} is safe to show and log. */
    public record Outcome(Status status, LocalDate weekStart, int listingsExamined, int suggestionsCreated,
                          String message) {}

    private final MarketResearchSettings settings;
    private final AllowList allowList;
    private final SkillDictionary dictionary;
    private final TargetRoles targetRoles;
    private final ListingsClient client;
    private final MarketSummaryStore store;
    private final MarketSuggester suggester;
    private final AdzunaClient.Sleeper sleeper;

    @Autowired
    public MarketResearchService(MarketResearchSettings settings, AllowList allowList, SkillDictionary dictionary,
                                 TargetRoles targetRoles, ListingsClient client, MarketSummaryStore store,
                                 MarketSuggester suggester) {
        this(settings, allowList, dictionary, targetRoles, client, store, suggester, Thread::sleep);
    }

    MarketResearchService(MarketResearchSettings settings, AllowList allowList, SkillDictionary dictionary,
                          TargetRoles targetRoles, ListingsClient client, MarketSummaryStore store,
                          MarketSuggester suggester, AdzunaClient.Sleeper sleeper) {
        this.settings = settings;
        this.allowList = allowList;
        this.dictionary = dictionary;
        this.targetRoles = targetRoles;
        this.client = client;
        this.store = store;
        this.suggester = suggester;
        this.sleeper = sleeper;
    }

    /** Why the job is off, or empty when it may run: the flag, the credentials and the three data files. */
    public Optional<String> disabledReason() {
        Optional<String> fromSettings = settings.disabledReason();
        if (fromSettings.isPresent()) return fromSettings;
        if (allowList.companies().isEmpty()) {
            return Optional.of(allowList.loadError() != null ? allowList.loadError()
                    : "the allow-list has no included company with complete evidence");
        }
        if (dictionary.size() == 0) {
            return Optional.of(dictionary.loadError() != null ? dictionary.loadError()
                    : "the skills dictionary is empty");
        }
        if (targetRoles.roles().isEmpty()) {
            return Optional.of(targetRoles.loadError() != null ? targetRoles.loadError()
                    : "the target roles list has no usable role");
        }
        return Optional.empty();
    }

    /** Runs the research for the week starting on {@code weekStart} (a Monday). Never throws. */
    public Outcome run(LocalDate weekStart, boolean force) {
        Optional<String> off = disabledReason();
        if (off.isPresent()) {
            log.info("Market research is disabled: {}", off.get());
            return new Outcome(Status.DISABLED, weekStart, 0, 0, off.get());
        }
        try {
            Optional<MarketSummaryStore.Summary> done = store.completed(weekStart);
            if (done.isPresent() && !force) {
                int created = suggest(done.get());
                log.info("Market research: the week of {} is already summarised; no listings were fetched", weekStart);
                return new Outcome(Status.ALREADY_DONE, weekStart, done.get().run().getListingsExamined(), Math.max(created, 0),
                        "The week of " + weekStart + " is already summarised; no listings were fetched"
                                + (created < 0 ? ", and no suggestions could be created; see the API log." : "."));
            }
        } catch (RuntimeException e) {
            // Safe to log in full: AdzunaClient already reduces HTTP errors (whose text holds
            // the credentialed request URL) to their type, so none reach this point.
            log.error("Market research: the database could not be read for the week of {}", weekStart, e);
            return failed(weekStart, LocalDateTime.now(), 0, "The database could not be read ("
                    + e.getClass().getSimpleName() + ")");
        }

        LocalDateTime startedAt = LocalDateTime.now();
        int apiCalls = 0;
        MarketSummaryStore.Summary summary;
        try {
            // Every role gets an entry, so a role with no listings shows as "0 examined".
            Map<String, Integer> examinedByRole = new LinkedHashMap<>();
            Map<String, Map<String, Integer>> countsByRole = new LinkedHashMap<>();
            for (TargetRoles.Role role : targetRoles.roles()) {
                examinedByRole.put(role.id(), 0);
                countsByRole.put(role.id(), new TreeMap<>());
            }
            Set<String> seen = new HashSet<>();
            List<String> unmatched = new ArrayList<>();
            int examined = 0;
            int queried = 0;
            boolean first = true;
            for (AllowList.Company company : allowList.companies()) {
                int before = examined;
                for (TargetRoles.Role searched : targetRoles.roles()) {
                    if (!first) sleeper.sleep(settings.pauseMillis());
                    first = false;
                    ListingsClient.Page page;
                    try {
                        page = client.fetch(company, searched);
                    } catch (ListingsException e) {
                        apiCalls += e.apiCalls();
                        throw e;
                    }
                    apiCalls += page.apiCalls();
                    for (Listing listing : page.listings()) {
                        if (!company.matches(listing.company())) continue;
                        // The title decides the role, whichever search returned the listing.
                        Optional<TargetRoles.Role> role = targetRoles.classify(listing.title());
                        if (role.isEmpty() || !seen.add(identity(listing))) continue;
                        examined++;
                        examinedByRole.merge(role.get().id(), 1, Integer::sum);
                        Map<String, Integer> counts = countsByRole.get(role.get().id());
                        for (String skill : dictionary.extract(listing.title() + "\n" + listing.description())) {
                            counts.merge(skill, 1, Integer::sum);
                        }
                    }
                }
                queried++;
                if (examined == before) unmatched.add(company.name());
            }
            Map<String, MarketSummaryStore.RoleCounts> byRole = new LinkedHashMap<>();
            examinedByRole.forEach((role, listings) ->
                    byRole.put(role, new MarketSummaryStore.RoleCounts(listings, countsByRole.get(role))));
            if (!unmatched.isEmpty()) {
                // Usually a search name or alias in the allow-list that the source does not know.
                log.info("Market research: no listing counted for {} of {} companies: {}",
                        unmatched.size(), queried, String.join(", ", unmatched));
            }
            if (examined == 0) {
                log.warn("Market research: no listing matched an allow-listed company and a target-role title in "
                        + "the week of {}; check the search names and aliases in the allow-list", weekStart);
            }
            summary = store.saveCompleted(weekStart, startedAt, queried, apiCalls, byRole);
            log.info("Market research: week of {} summarised: {} listings examined ({}), {} companies queried, "
                    + "{} API calls", weekStart, examined, examinedByRole, queried, apiCalls);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return failed(weekStart, startedAt, apiCalls, "The run was interrupted");
        } catch (ListingsException e) {
            return failed(weekStart, startedAt, apiCalls, e.getMessage());
        } catch (RuntimeException e) {
            log.error("Market research: the run for the week of {} failed unexpectedly", weekStart, e);
            return failed(weekStart, startedAt, apiCalls, "Unexpected error (" + e.getClass().getSimpleName() + ")");
        }

        int created = suggest(summary);
        return new Outcome(Status.COMPLETED, weekStart, summary.run().getListingsExamined(), Math.max(created, 0),
                "The week of " + weekStart + " was summarised"
                        + (created < 0 ? ", but no suggestions could be created; see the API log." : "."));
    }

    /**
     * The suggestion step never fails a run: the summary is already stored.
     * @return how many suggestions were created, or -1 if the step failed
     */
    private int suggest(MarketSummaryStore.Summary summary) {
        try {
            int created = suggester.suggest(summary);
            store.addSuggestionsCreated(summary.run().getId(), created);
            return created;
        } catch (RuntimeException e) {
            log.error("Market research: suggestions could not be created for the week of {}",
                    summary.run().getWeekStart(), e);
            return -1;
        }
    }

    private Outcome failed(LocalDate weekStart, LocalDateTime startedAt, int apiCalls, String message) {
        String kept = "no summary was stored for it";
        try {
            if (!store.saveFailed(weekStart, startedAt, apiCalls, message)) {
                kept = "its existing summary was kept";
            }
        } catch (RuntimeException e) {
            kept = "the failure could not be recorded (" + e.getClass().getSimpleName() + ")";
        }
        Optional<LocalDate> previous = Optional.empty();
        try {
            previous = store.latest().map(s -> s.run().getWeekStart());
        } catch (RuntimeException e) {
            // Only used for the log line below.
        }
        log.error("Market research run FAILED for the week of {}: {}; {}. Latest summary in place: {}",
                weekStart, message, kept, previous.map(LocalDate::toString).orElse("none"));
        return new Outcome(Status.FAILED, weekStart, 0, 0, message);
    }

    /** The source's id, or the listing's own text when it has none, so a listing is counted once per run. */
    private static String identity(Listing listing) {
        if (listing.id() != null && !listing.id().isBlank()) return "id:" + listing.id();
        return "text:" + listing.company() + "|" + listing.title() + "|" + listing.description();
    }
}
