package com.resume.controller;

import com.resume.market.AllowList;
import com.resume.market.MarketResearchJob;
import com.resume.market.MarketResearchService;
import com.resume.market.MarketResearchSettings;
import com.resume.market.MarketSummaryStore;
import com.resume.model.MarketResearchRun;
import com.resume.model.MarketSkillCount;
import com.resume.security.JwtFilter;
import com.resume.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(MarketResearchController.class)
@AutoConfigureMockMvc(addFilters = false)
class MarketResearchControllerTest {

    @Autowired MockMvc mockMvc;
    @MockitoBean MarketResearchJob job;
    @MockitoBean MarketResearchService service;
    @MockitoBean MarketSummaryStore store;
    @MockitoBean MarketResearchSettings settings;
    @MockitoBean AllowList allowList;
    @MockitoBean JwtUtil jwtUtil;
    @MockitoBean JwtFilter jwtFilter;

    @BeforeEach
    void setUp() {
        when(service.disabledReason()).thenReturn(Optional.empty());
        when(store.latest()).thenReturn(Optional.empty());
        when(store.newestWeek()).thenReturn(Optional.empty());
        when(settings.minListings()).thenReturn(30);
        when(settings.minMentions()).thenReturn(5);
        when(settings.minSharePercent()).thenReturn(20);
        when(settings.maxSuggestionsPerRun()).thenReturn(3);
        when(settings.maxPendingSuggestions()).thenReturn(5);
        when(allowList.compiledOn()).thenReturn("2026-11-21");
        when(allowList.companies()).thenReturn(List.of(
                new AllowList.Company("A", "A", Set.of("a")), new AllowList.Company("B", "B", Set.of("b"))));
        when(job.currentWeek()).thenReturn(LocalDate.of(2026, 11, 16));
    }

    private static MarketResearchRun run(LocalDate week, String status, String error) {
        MarketResearchRun run = new MarketResearchRun();
        run.setId(4L);
        run.setWeekStart(week);
        run.setStatus(status);
        run.setListingsExamined(60);
        run.setCompaniesQueried(2);
        run.setApiCalls(3);
        run.setSuggestionsCreated(1);
        run.setError(error);
        run.setStartedAt(LocalDateTime.of(2026, 11, 16, 6, 0, 0));
        run.setFinishedAt(LocalDateTime.of(2026, 11, 16, 6, 4, 30));
        return run;
    }

    @Test
    void latest_returnsTheNewestSummary_theRulesAndTheStateOfTheJob() throws Exception {
        when(store.latest()).thenReturn(Optional.of(new MarketSummaryStore.Summary(
                run(LocalDate.of(2026, 11, 9), "completed", null),
                List.of(new MarketSkillCount(4L, "Java", 50), new MarketSkillCount(4L, "Kubernetes", 20)))));
        when(store.newestWeek()).thenReturn(Optional.of(
                run(LocalDate.of(2026, 11, 16), "failed", "Adzuna request for A failed: HTTP 503")));
        when(job.running()).thenReturn(true);

        mockMvc.perform(get("/api/admin/market-research/latest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(true))
                .andExpect(jsonPath("$.disabledReason").value(nullValue()))
                .andExpect(jsonPath("$.running").value(true))
                .andExpect(jsonPath("$.allowListCompiledOn").value("2026-11-21"))
                .andExpect(jsonPath("$.allowListCompanies").value(2))
                .andExpect(jsonPath("$.thresholds.minListings").value(30))
                .andExpect(jsonPath("$.thresholds.minMentions").value(5))
                .andExpect(jsonPath("$.thresholds.minSharePercent").value(20))
                .andExpect(jsonPath("$.thresholds.maxSuggestionsPerRun").value(3))
                .andExpect(jsonPath("$.thresholds.maxPendingSuggestions").value(5))
                .andExpect(jsonPath("$.summary.weekStart").value("2026-11-09"))
                .andExpect(jsonPath("$.summary.listingsExamined").value(60))
                .andExpect(jsonPath("$.summary.companiesQueried").value(2))
                .andExpect(jsonPath("$.summary.apiCalls").value(3))
                .andExpect(jsonPath("$.summary.suggestionsCreated").value(1))
                .andExpect(jsonPath("$.summary.finishedAt").value("2026-11-16T06:04:30"))
                .andExpect(jsonPath("$.summary.skills.length()").value(2))
                .andExpect(jsonPath("$.summary.skills[0].skill").value("Java"))
                .andExpect(jsonPath("$.summary.skills[0].listingsMentioned").value(50))
                .andExpect(jsonPath("$.summary.skills[1].skill").value("Kubernetes"))
                .andExpect(jsonPath("$.lastRun.weekStart").value("2026-11-16"))
                .andExpect(jsonPath("$.lastRun.status").value("failed"))
                .andExpect(jsonPath("$.lastRun.error").value("Adzuna request for A failed: HTTP 503"));
    }

    @Test
    void latest_beforeAnyRun_andWhileSwitchedOff_saysSo() throws Exception {
        when(service.disabledReason()).thenReturn(Optional.of("MARKET_RESEARCH_ENABLED is not true"));

        mockMvc.perform(get("/api/admin/market-research/latest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(false))
                .andExpect(jsonPath("$.disabledReason").value("MARKET_RESEARCH_ENABLED is not true"))
                .andExpect(jsonPath("$.running").value(false))
                .andExpect(jsonPath("$.summary").value(nullValue()))
                .andExpect(jsonPath("$.lastRun").value(nullValue()));
    }

    @Test
    void run_startsInTheBackground_andAnswers202() throws Exception {
        when(job.trigger(false)).thenReturn(MarketResearchJob.Trigger.STARTED);
        when(job.trigger(true)).thenReturn(MarketResearchJob.Trigger.STARTED);

        mockMvc.perform(post("/api/admin/market-research/run"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.status").value("started"))
                .andExpect(jsonPath("$.weekStart").value("2026-11-16"))
                .andExpect(jsonPath("$.force").value(false));
        verify(job).trigger(false);

        mockMvc.perform(post("/api/admin/market-research/run").param("force", "true"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.force").value(true));
        verify(job).trigger(true);
    }

    @Test
    void run_whileARunIsGoing_answers409() throws Exception {
        when(job.trigger(false)).thenReturn(MarketResearchJob.Trigger.ALREADY_RUNNING);

        mockMvc.perform(post("/api/admin/market-research/run"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("already_running"))
                .andExpect(jsonPath("$.error").value("A run is already going."));
    }

    @Test
    void run_whenSwitchedOff_answers409WithTheReason() throws Exception {
        when(job.trigger(false)).thenReturn(MarketResearchJob.Trigger.DISABLED);
        when(service.disabledReason()).thenReturn(Optional.of("ADZUNA_APP_ID and ADZUNA_APP_KEY are not both set"));

        mockMvc.perform(post("/api/admin/market-research/run"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("disabled"))
                .andExpect(jsonPath("$.error")
                        .value("Market research is disabled: ADZUNA_APP_ID and ADZUNA_APP_KEY are not both set."));

        // Enabled by its settings, but never scheduled (startup failed to set it up).
        when(service.disabledReason()).thenReturn(Optional.empty());
        mockMvc.perform(post("/api/admin/market-research/run"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Market research is disabled: the job is not scheduled."));
    }

    @Test
    void run_withAForceThatIsNotTrueOrFalse_answers400_andStartsNothing() throws Exception {
        mockMvc.perform(post("/api/admin/market-research/run").param("force", "maybe"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("invalid"));
        verify(job, never()).trigger(anyBoolean());
    }
}
