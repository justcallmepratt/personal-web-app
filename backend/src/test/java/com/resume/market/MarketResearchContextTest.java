package com.resume.market;

import com.resume.model.MarketResearchRun;
import com.resume.model.MarketSkillCount;
import com.resume.repository.MarketResearchRunRepository;
import com.resume.repository.MarketSkillCountRepository;
import com.resume.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The whole application on the {@code test} profile (H2, no Docker), where no
 * market-research variable is set: the job must be off, the application must start, and
 * the endpoints must sit behind the real security filter chain. The store is exercised
 * here too; {@code PostgresMarketResearchTest} repeats that against PostgreSQL.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MarketResearchContextTest {

    private static final LocalDate WEEK = LocalDate.of(2026, 11, 16);
    private static final LocalDateTime STARTED = LocalDateTime.of(2026, 11, 16, 6, 0);

    @Autowired MockMvc mockMvc;
    @Autowired JwtUtil jwt;
    @Autowired MarketResearchJob job;
    @Autowired MarketResearchService service;
    @Autowired MarketResearchSettings settings;
    @Autowired AllowList allowList;
    @Autowired SkillDictionary dictionary;
    @Autowired MarketSummaryStore store;
    @Autowired MarketResearchRunRepository runs;
    @Autowired MarketSkillCountRepository counts;

    @BeforeEach
    void clean() {
        counts.deleteAll();
        runs.deleteAll();
    }

    // ── off by default ───────────────────────────────────────────────────────

    @Test
    void withNoVariablesSet_theApplicationStarts_andTheJobIsOff() {
        assertThat(settings.enabled()).isFalse();
        assertThat(service.disabledReason()).contains("MARKET_RESEARCH_ENABLED is not true");
        assertThat(job.trigger(false)).isEqualTo(MarketResearchJob.Trigger.DISABLED);
        assertThat(job.trigger(true)).isEqualTo(MarketResearchJob.Trigger.DISABLED);
        assertThat(job.running()).isFalse();

        MarketResearchService.Outcome outcome = service.run(WEEK, true);
        assertThat(outcome.status()).isEqualTo(MarketResearchService.Status.DISABLED);
        assertThat(runs.count()).isZero();

        // The data files are in the build and usable, so only the flag keeps it off.
        assertThat(allowList.companies()).isNotEmpty();
        assertThat(dictionary.size()).isPositive();
    }

    // ── admin only ───────────────────────────────────────────────────────────

    private static List<MockHttpServletRequestBuilder> everyEndpoint() {
        return List.of(
                get("/api/admin/market-research/latest"),
                post("/api/admin/market-research/run"),
                post("/api/admin/market-research/run").param("force", "true"));
    }

    @Test
    void everyEndpoint_refusesARequestWithoutAValidToken() throws Exception {
        String forged = new JwtUtil("another-secret-key-min-256-bits-long-bbbbbbbbbbbbbbbbbbbb", 3_600_000L)
                .generate("admin");
        for (MockHttpServletRequestBuilder request : everyEndpoint()) {
            mockMvc.perform(request).andExpect(status().isForbidden());
        }
        for (String header : List.of("Bearer " + forged, "Bearer not-a-jwt", "Basic YWRtaW46YWRtaW4=")) {
            for (MockHttpServletRequestBuilder request : everyEndpoint()) {
                mockMvc.perform(request.header("Authorization", header)).andExpect(status().isForbidden());
            }
        }
        assertThat(runs.count()).isZero();
    }

    @Test
    void withTheAdminToken_latestAnswers_andATriggerIsRefusedWhileSwitchedOff() throws Exception {
        String bearer = "Bearer " + jwt.generate("admin");

        mockMvc.perform(get("/api/admin/market-research/latest").header("Authorization", bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(false))
                .andExpect(jsonPath("$.disabledReason").value("MARKET_RESEARCH_ENABLED is not true"))
                .andExpect(jsonPath("$.running").value(false))
                .andExpect(jsonPath("$.allowListCompiledOn").value(allowList.compiledOn()))
                .andExpect(jsonPath("$.allowListCompanies").value(allowList.companies().size()))
                .andExpect(jsonPath("$.thresholds.minListings").value(30))
                .andExpect(jsonPath("$.summary").value(nullValue()))
                .andExpect(jsonPath("$.lastRun").value(nullValue()));

        mockMvc.perform(post("/api/admin/market-research/run").header("Authorization", bearer))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("disabled"));
        assertThat(runs.count()).isZero();

        store.saveCompleted(WEEK, STARTED, 40, 2, 2, Map.of("Java", 30, "Kafka", 12));
        mockMvc.perform(get("/api/admin/market-research/latest").header("Authorization", bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.summary.weekStart").value("2026-11-16"))
                .andExpect(jsonPath("$.summary.listingsExamined").value(40))
                .andExpect(jsonPath("$.summary.skills[0].skill").value("Java"))
                .andExpect(jsonPath("$.summary.skills[0].listingsMentioned").value(30))
                .andExpect(jsonPath("$.summary.skills[1].skill").value("Kafka"))
                .andExpect(jsonPath("$.lastRun.status").value("completed"));
    }

    // ── the store ────────────────────────────────────────────────────────────

    @Test
    void savingAWeekTwice_leavesOneRowAndOneSetOfCounts() {
        MarketSummaryStore.Summary first = store.saveCompleted(WEEK, STARTED, 40, 2, 2,
                Map.of("Java", 30, "Kafka", 12, "Docker", 9));
        MarketSummaryStore.Summary second = store.saveCompleted(WEEK, STARTED.plusHours(1), 50, 3, 4,
                Map.of("Java", 35, "Kubernetes", 20));

        assertThat(runs.count()).isEqualTo(1);
        assertThat(second.run().getId()).isEqualTo(first.run().getId());
        assertThat(second.run().getListingsExamined()).isEqualTo(50);
        assertThat(second.run().getCompaniesQueried()).isEqualTo(3);
        assertThat(second.run().getApiCalls()).isEqualTo(4);
        assertThat(second.run().getStartedAt()).isEqualTo(STARTED.plusHours(1));
        assertThat(second.run().getFinishedAt()).isNotNull();
        assertThat(second.run().isCompleted()).isTrue();
        assertThat(counts.count()).isEqualTo(2);
        assertThat(second.skills()).extracting(MarketSkillCount::getSkill, MarketSkillCount::getListingsMentioned)
                .containsExactly(org.assertj.core.groups.Tuple.tuple("Java", 35),
                        org.assertj.core.groups.Tuple.tuple("Kubernetes", 20));
        assertThat(second.skills()).allSatisfy(c -> {
            assertThat(c.getId()).isNotNull();
            assertThat(c.getRunId()).isEqualTo(first.run().getId());
        });
    }

    @Test
    void countsOfZeroAreNotStored_andTiesAreOrderedByName() {
        java.util.Map<String, Integer> raw = new java.util.HashMap<>();
        raw.put("Kafka", 5);
        raw.put("Docker", 5);
        raw.put("Never", 0);
        raw.put("Nothing", null);

        MarketSummaryStore.Summary saved = store.saveCompleted(WEEK, STARTED, 10, 1, 1, raw);

        assertThat(saved.skills()).extracting(MarketSkillCount::getSkill).containsExactly("Docker", "Kafka");
    }

    @Test
    void aFailedRunIsRecorded_butNeverReplacesACompletedSummary() {
        // No row yet: the failure is recorded.
        assertThat(store.saveFailed(WEEK, STARTED, 3, "  Adzuna request for A failed: HTTP 503  ")).isTrue();
        MarketResearchRun failed = store.find(WEEK).orElseThrow();
        assertThat(failed.getStatus()).isEqualTo("failed");
        assertThat(failed.isCompleted()).isFalse();
        assertThat(failed.getError()).isEqualTo("Adzuna request for A failed: HTTP 503");
        assertThat(failed.getApiCalls()).isEqualTo(3);
        assertThat(store.latest()).isEmpty();
        assertThat(store.completed(WEEK)).isEmpty();
        assertThat(store.newestWeek()).map(MarketResearchRun::getStatus).contains("failed");

        // A second failure updates the same row; a long or missing message is handled.
        assertThat(store.saveFailed(WEEK, STARTED, 1, "x".repeat(700))).isTrue();
        assertThat(store.find(WEEK).orElseThrow().getError()).hasSize(500);
        assertThat(store.saveFailed(WEEK, STARTED, 1, null)).isTrue();
        assertThat(store.find(WEEK).orElseThrow().getError()).isEqualTo("Unknown error");
        assertThat(store.saveFailed(WEEK, STARTED, 1, " ")).isTrue();
        assertThat(runs.count()).isEqualTo(1);

        // The retry succeeds: the same row becomes the summary and the error is cleared.
        store.saveCompleted(WEEK, STARTED, 40, 2, 2, Map.of("Java", 30));
        assertThat(runs.count()).isEqualTo(1);
        assertThat(store.find(WEEK).orElseThrow().getError()).isNull();

        // A later failure for the same week leaves the summary exactly as it is.
        assertThat(store.saveFailed(WEEK, STARTED.plusDays(1), 9, "rate limited")).isFalse();
        MarketSummaryStore.Summary kept = store.completed(WEEK).orElseThrow();
        assertThat(kept.run().getStatus()).isEqualTo("completed");
        assertThat(kept.run().getListingsExamined()).isEqualTo(40);
        assertThat(kept.run().getApiCalls()).isEqualTo(2);
        assertThat(kept.run().getError()).isNull();
        assertThat(kept.skills()).hasSize(1);
    }

    @Test
    void theLatestSummaryIsTheNewestCompletedWeek_evenWhenANewerWeekFailed() {
        store.saveCompleted(WEEK.minusWeeks(2), STARTED, 30, 2, 2, Map.of("Java", 20));
        store.saveCompleted(WEEK.minusWeeks(1), STARTED, 31, 2, 2, Map.of("Kafka", 21));
        store.saveFailed(WEEK, STARTED, 1, "HTTP 500");

        MarketSummaryStore.Summary latest = store.latest().orElseThrow();
        assertThat(latest.run().getWeekStart()).isEqualTo(WEEK.minusWeeks(1));
        assertThat(latest.skills()).extracting(MarketSkillCount::getSkill).containsExactly("Kafka");
        assertThat(store.newestWeek().orElseThrow().getWeekStart()).isEqualTo(WEEK);
        assertThat(store.find(WEEK.plusWeeks(1))).isEmpty();
    }

    @Test
    void suggestionsCreatedAddsUp_andIgnoresNothingToAdd() {
        Long id = store.saveCompleted(WEEK, STARTED, 40, 2, 2, Map.of("Java", 30)).run().getId();

        store.addSuggestionsCreated(id, 2);
        store.addSuggestionsCreated(id, 0);
        store.addSuggestionsCreated(id, -1);
        store.addSuggestionsCreated(id, 1);
        store.addSuggestionsCreated(999_999L, 1);

        assertThat(runs.findById(id).orElseThrow().getSuggestionsCreated()).isEqualTo(3);
    }
}
