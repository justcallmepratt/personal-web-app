package com.resume.market;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.TreeMap;

/**
 * One run of the weekly market research: fetch listings for each allow-listed company,
 * count which dictionary skills they mention, store the counts for the week, then hand the
 * summary to {@link MarketSuggester}.
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
    private final ListingsClient client;
    private final MarketSummaryStore store;
    private final MarketSuggester suggester;
    private final AdzunaClient.Sleeper sleeper;

    @Autowired
    public MarketResearchService(MarketResearchSettings settings, AllowList allowList, SkillDictionary dictionary,
                                 ListingsClient client, MarketSummaryStore store, MarketSuggester suggester) {
        this(settings, allowList, dictionary, client, store, suggester, Thread::sleep);
    }

    MarketResearchService(MarketResearchSettings settings, AllowList allowList, SkillDictionary dictionary,
                          ListingsClient client, MarketSummaryStore store, MarketSuggester suggester,
                          AdzunaClient.Sleeper sleeper) {
        this.settings = settings;
        this.allowList = allowList;
        this.dictionary = dictionary;
        this.client = client;
        this.store = store;
        this.suggester = suggester;
        this.sleeper = sleeper;
    }

    /** Why the job is off, or empty when it may run: the flag, the credentials and both data files. */
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
                return new Outcome(Status.ALREADY_DONE, weekStart, done.get().run().getListingsExamined(), created,
                        "The week of " + weekStart + " is already summarised; no listings were fetched.");
            }
        } catch (RuntimeException e) {
            return failed(weekStart, LocalDateTime.now(), 0, "The database could not be read ("
                    + e.getClass().getSimpleName() + ")");
        }

        LocalDateTime startedAt = LocalDateTime.now();
        int apiCalls = 0;
        MarketSummaryStore.Summary summary;
        try {
            Map<String, Integer> counts = new TreeMap<>();
            Set<String> seen = new HashSet<>();
            List<String> unmatched = new ArrayList<>();
            int examined = 0;
            int queried = 0;
            for (AllowList.Company company : allowList.companies()) {
                if (queried > 0) sleeper.sleep(settings.pauseMillis());
                ListingsClient.Page page;
                try {
                    page = client.fetch(company);
                } catch (ListingsException e) {
                    apiCalls += e.apiCalls();
                    throw e;
                }
                apiCalls += page.apiCalls();
                queried++;
                int before = examined;
                for (Listing listing : page.listings()) {
                    if (!company.matches(listing.company()) || !isDeveloperRole(listing.title())) continue;
                    if (!seen.add(identity(listing))) continue;
                    examined++;
                    for (String skill : dictionary.extract(listing.title() + "\n" + listing.description())) {
                        counts.merge(skill, 1, Integer::sum);
                    }
                }
                if (examined == before) unmatched.add(company.name());
            }
            if (!unmatched.isEmpty()) {
                // Usually a search name or alias in the allow-list that the source does not know.
                log.info("Market research: no listing counted for {} of {} companies: {}",
                        unmatched.size(), queried, String.join(", ", unmatched));
            }
            if (examined == 0) {
                log.warn("Market research: no listing matched an allow-listed company and a developer title in the "
                        + "week of {}; check the search names and aliases in the allow-list", weekStart);
            }
            summary = store.saveCompleted(weekStart, startedAt, examined, queried, apiCalls, counts);
            log.info("Market research: week of {} summarised: {} listings examined, {} companies queried, "
                    + "{} API calls, {} skills counted", weekStart, examined, queried, apiCalls, counts.size());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return failed(weekStart, startedAt, apiCalls, "The run was interrupted");
        } catch (ListingsException e) {
            return failed(weekStart, startedAt, apiCalls, e.getMessage());
        } catch (RuntimeException e) {
            return failed(weekStart, startedAt, apiCalls, "Unexpected error (" + e.getClass().getSimpleName() + ")");
        }

        int created = suggest(summary);
        return new Outcome(Status.COMPLETED, weekStart, summary.run().getListingsExamined(), created,
                "The week of " + weekStart + " was summarised.");
    }

    /** The suggestion step never fails a run: the summary is already stored. */
    private int suggest(MarketSummaryStore.Summary summary) {
        try {
            int created = suggester.suggest(summary);
            store.addSuggestionsCreated(summary.run().getId(), created);
            return created;
        } catch (RuntimeException e) {
            log.error("Market research: suggestions could not be created for the week of {} ({})",
                    summary.run().getWeekStart(), e.getClass().getSimpleName());
            return 0;
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

    /** A software developer or engineer title; other roles in the IT category (analysts, managers, support) are left out. */
    static boolean isDeveloperRole(String title) {
        if (title == null) return false;
        String t = title.toLowerCase(Locale.ROOT);
        if (t.contains("developer") || t.contains("programmer")) return true;
        return t.contains("engineer") && (t.contains("software") || t.contains("java") || t.contains("backend")
                || t.contains("back-end") || t.contains("back end") || t.contains("full stack")
                || t.contains("full-stack") || t.contains("fullstack") || t.contains("application"));
    }

    /** The source's id, or the listing's own text when it has none, so a listing is counted once per run. */
    private static String identity(Listing listing) {
        if (listing.id() != null && !listing.id().isBlank()) return "id:" + listing.id();
        return "text:" + listing.company() + "|" + listing.title() + "|" + listing.description();
    }
}
