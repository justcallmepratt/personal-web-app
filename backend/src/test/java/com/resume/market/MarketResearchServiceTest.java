package com.resume.market;

import com.resume.market.AllowList.Company;
import com.resume.market.MarketResearchService.Outcome;
import com.resume.market.MarketResearchService.Status;
import com.resume.model.MarketResearchRun;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class MarketResearchServiceTest {

    private static final LocalDate WEEK = LocalDate.of(2026, 11, 16);

    private static AllowList.Entry included(String name, String... aliases) {
        return new AllowList.Entry(name, true, new AllowList.Fortune500(10, 2026, "https://fortune.test"),
                List.of(new AllowList.FinraFirm(name + " Securities LLC", 123L, "https://brokercheck.test")),
                null, List.of(aliases), null, null);
    }

    private final AllowList allowList = AllowList.of("2026-11-21", List.of(
            included("Alpha Bank", "alpha"), included("Beta Financial", "beta financial")));
    private final SkillDictionary dictionary = SkillDictionary.of(List.of(
            new SkillDictionary.Entry("Java", null, null),
            new SkillDictionary.Entry("Kafka", null, null),
            new SkillDictionary.Entry("Kubernetes", List.of("K8s"), null)));

    private final ListingsClient client = mock(ListingsClient.class);
    private final MarketSummaryStore store = mock(MarketSummaryStore.class);
    private final MarketSuggester suggester = mock(MarketSuggester.class);
    private final List<Long> pauses = new ArrayList<>();

    private Company alpha;
    private Company beta;

    @BeforeEach
    void setUp() {
        alpha = allowList.companies().get(0);
        beta = allowList.companies().get(1);
        when(store.completed(any())).thenReturn(Optional.empty());
        when(store.latest()).thenReturn(Optional.empty());
        when(store.saveFailed(any(), any(), anyInt(), any())).thenReturn(true);
        when(store.saveCompleted(any(), any(), anyInt(), anyInt(), anyInt(), anyMap()))
                .thenAnswer(call -> summary(call.getArgument(0), call.getArgument(2)));
    }

    @AfterEach
    void clearInterrupt() {
        Thread.interrupted();
    }

    private MarketResearchService service() {
        return service(TestSettings.defaults(), allowList, dictionary);
    }

    private MarketResearchService service(MarketResearchSettings settings, AllowList companies, SkillDictionary skills) {
        return new MarketResearchService(settings, companies, skills, client, store, suggester, pauses::add);
    }

    private static MarketSummaryStore.Summary summary(LocalDate week, int examined) {
        MarketResearchRun run = new MarketResearchRun();
        run.setId(5L);
        run.setWeekStart(week);
        run.setStatus(MarketResearchRun.COMPLETED);
        run.setListingsExamined(examined);
        return new MarketSummaryStore.Summary(run, List.of());
    }

    private static ListingsClient.Page page(int calls, Listing... listings) {
        return new ListingsClient.Page(List.of(listings), calls);
    }

    // ── a normal run ─────────────────────────────────────────────────────────

    @Test
    void countsEachSkillOncePerListing_forAllowListedDeveloperListingsOnly_andStoresTheSummary() {
        when(client.fetch(alpha)).thenReturn(page(1,
                new Listing("1", "Software Engineer", "Alpha Bank N.A.", "Java, Kafka and more Java"),
                new Listing("2", "Java Developer", "ALPHA", "K8s"),
                // Not this company: the source's company filter is not trusted.
                new Listing("3", "Software Engineer", "Alphabet Inc", "Java Kafka Kubernetes"),
                // Not a developer role.
                new Listing("4", "Business Analyst", "Alpha Bank", "Java Kafka Kubernetes"),
                // The same listing again.
                new Listing("1", "Software Engineer", "Alpha Bank N.A.", "Java, Kafka and more Java"),
                // No skill at all still counts as examined.
                new Listing("5", "Application Developer", "Alpha Bank", "Great team")));
        when(client.fetch(beta)).thenReturn(page(2,
                new Listing("", "Backend Engineer", "Beta Financial", "Kafka"),
                new Listing(null, "Backend Engineer", "Beta Financial", "Kafka"),
                new Listing("6", "Senior Programmer", "Beta Financial Group", "kubernetes; JAVA")));
        when(suggester.suggest(any())).thenReturn(2);

        Outcome outcome = service().run(WEEK, false);

        assertThat(outcome.status()).isEqualTo(Status.COMPLETED);
        assertThat(outcome.weekStart()).isEqualTo(WEEK);
        assertThat(outcome.listingsExamined()).isEqualTo(5);
        assertThat(outcome.suggestionsCreated()).isEqualTo(2);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Integer>> counts = ArgumentCaptor.forClass(Map.class);
        verify(store).saveCompleted(eq(WEEK), any(), eq(5), eq(2), eq(3), counts.capture());
        assertThat(counts.getValue()).containsExactlyInAnyOrderEntriesOf(Map.of("Java", 3, "Kafka", 2, "Kubernetes", 2));

        verify(suggester).suggest(any());
        verify(store).addSuggestionsCreated(5L, 2);
        verify(store, never()).saveFailed(any(), any(), anyInt(), any());
        // One pause, between the two companies.
        assertThat(pauses).containsExactly(3000L);
    }

    @Test
    void aWeekWithNoMatchingListingsStillCompletes_withAnEmptySummary() {
        when(client.fetch(any())).thenReturn(page(1));

        Outcome outcome = service().run(WEEK, false);

        assertThat(outcome.status()).isEqualTo(Status.COMPLETED);
        assertThat(outcome.listingsExamined()).isZero();
        verify(store).saveCompleted(eq(WEEK), any(), eq(0), eq(2), eq(2), eq(Map.of()));
    }

    // ── idempotent per week ──────────────────────────────────────────────────

    @Test
    void aWeekAlreadySummarisedIsNotFetchedAgain_butSuggestionsAreStillDerived() {
        when(store.completed(WEEK)).thenReturn(Optional.of(summary(WEEK, 42)));
        when(suggester.suggest(any())).thenReturn(1);

        Outcome outcome = service().run(WEEK, false);

        assertThat(outcome.status()).isEqualTo(Status.ALREADY_DONE);
        assertThat(outcome.listingsExamined()).isEqualTo(42);
        assertThat(outcome.suggestionsCreated()).isEqualTo(1);
        assertThat(outcome.message()).contains("already summarised");
        verifyNoInteractions(client);
        verify(store, never()).saveCompleted(any(), any(), anyInt(), anyInt(), anyInt(), anyMap());
        verify(store).addSuggestionsCreated(5L, 1);
        assertThat(pauses).isEmpty();
    }

    @Test
    void forceFetchesAgain_andReplacesTheWeek() {
        when(store.completed(WEEK)).thenReturn(Optional.of(summary(WEEK, 42)));
        when(client.fetch(any())).thenReturn(page(1, new Listing("1", "Java Developer", "Alpha Bank", "Java")));

        Outcome outcome = service().run(WEEK, true);

        assertThat(outcome.status()).isEqualTo(Status.COMPLETED);
        verify(client, times(2)).fetch(any());
        verify(store).saveCompleted(eq(WEEK), any(), eq(1), eq(2), eq(2), eq(Map.of("Java", 1)));
    }

    // ── failures ─────────────────────────────────────────────────────────────

    @Test
    void aFailedRequestFailsTheRun_storesNoCounts_andLeavesEarlierSummariesAlone() {
        when(client.fetch(alpha)).thenReturn(page(1, new Listing("1", "Java Developer", "Alpha Bank", "Java")));
        when(client.fetch(beta)).thenThrow(new ListingsException("Adzuna request for Beta Financial failed: HTTP 503", 3));
        when(store.latest()).thenReturn(Optional.of(summary(WEEK.minusWeeks(1), 40)));

        Outcome outcome = service().run(WEEK, false);

        assertThat(outcome.status()).isEqualTo(Status.FAILED);
        assertThat(outcome.message()).isEqualTo("Adzuna request for Beta Financial failed: HTTP 503");
        assertThat(outcome.suggestionsCreated()).isZero();
        verify(store).saveFailed(eq(WEEK), any(), eq(4), eq("Adzuna request for Beta Financial failed: HTTP 503"));
        verify(store, never()).saveCompleted(any(), any(), anyInt(), anyInt(), anyInt(), anyMap());
        verifyNoInteractions(suggester);
    }

    @Test
    void aFailedForcedRerunKeepsTheWeeksExistingSummary() {
        when(store.completed(WEEK)).thenReturn(Optional.of(summary(WEEK, 42)));
        when(client.fetch(any())).thenThrow(new ListingsException("rate limited", 3));
        when(store.saveFailed(any(), any(), anyInt(), any())).thenReturn(false);

        Outcome outcome = service().run(WEEK, true);

        assertThat(outcome.status()).isEqualTo(Status.FAILED);
        verify(client, times(1)).fetch(any());
        verify(store, never()).saveCompleted(any(), any(), anyInt(), anyInt(), anyInt(), anyMap());
        verifyNoInteractions(suggester);
    }

    @Test
    void aDatabaseErrorWhileSaving_failsTheRunWithoutThrowing() {
        when(client.fetch(any())).thenReturn(page(1));
        when(store.saveCompleted(any(), any(), anyInt(), anyInt(), anyInt(), anyMap()))
                .thenThrow(new IllegalStateException("jdbc:postgresql://secret-host"));

        Outcome outcome = service().run(WEEK, false);

        assertThat(outcome.status()).isEqualTo(Status.FAILED);
        assertThat(outcome.message()).isEqualTo("Unexpected error (IllegalStateException)");
        verifyNoInteractions(suggester);
    }

    @Test
    void aDatabaseErrorBeforeFetching_failsTheRunWithoutCallingTheApi() {
        when(store.completed(any())).thenThrow(new IllegalStateException("down"));
        when(store.saveFailed(any(), any(), anyInt(), any())).thenThrow(new IllegalStateException("still down"));
        when(store.latest()).thenThrow(new IllegalStateException("still down"));

        Outcome outcome = service().run(WEEK, false);

        assertThat(outcome.status()).isEqualTo(Status.FAILED);
        assertThat(outcome.message()).isEqualTo("The database could not be read (IllegalStateException)");
        verifyNoInteractions(client, suggester);
    }

    @Test
    void anInterruptBetweenCompaniesFailsTheRun_andKeepsTheInterruptFlag() {
        when(client.fetch(any())).thenReturn(page(1));
        MarketResearchService interrupted = new MarketResearchService(TestSettings.defaults(), allowList, dictionary,
                client, store, suggester, millis -> { throw new InterruptedException(); });

        Outcome outcome = interrupted.run(WEEK, false);

        assertThat(outcome.status()).isEqualTo(Status.FAILED);
        assertThat(outcome.message()).isEqualTo("The run was interrupted");
        assertThat(Thread.currentThread().isInterrupted()).isTrue();
        verify(client, times(1)).fetch(any());
        verify(store).saveFailed(eq(WEEK), any(), eq(1), any());
    }

    @Test
    void aFailureInTheSuggestionStepDoesNotFailTheRun() {
        when(client.fetch(any())).thenReturn(page(1));
        when(suggester.suggest(any())).thenThrow(new IllegalStateException("boom"));

        Outcome outcome = service().run(WEEK, false);

        assertThat(outcome.status()).isEqualTo(Status.COMPLETED);
        assertThat(outcome.suggestionsCreated()).isZero();
        verify(store, never()).addSuggestionsCreated(any(), anyInt());
    }

    // ── switched off ─────────────────────────────────────────────────────────

    @Test
    void whenSwitchedOffNothingIsFetchedOrStored() {
        TestSettings off = TestSettings.on();
        off.enabled = "false";

        Outcome outcome = service(off.build(), allowList, dictionary).run(WEEK, true);

        assertThat(outcome.status()).isEqualTo(Status.DISABLED);
        assertThat(outcome.message()).isEqualTo("MARKET_RESEARCH_ENABLED is not true");
        verifyNoInteractions(client, store, suggester);
    }

    @Test
    void disabledReason_coversTheFlagTheCredentialsAndBothDataFiles() {
        assertThat(service().disabledReason()).isEmpty();

        TestSettings noKey = TestSettings.on();
        noKey.appKey = "";
        assertThat(service(noKey.build(), allowList, dictionary).disabledReason())
                .contains("ADZUNA_APP_ID and ADZUNA_APP_KEY are not both set");

        AllowList nobody = AllowList.of("2026-11-21", List.of());
        assertThat(service(TestSettings.defaults(), nobody, dictionary).disabledReason())
                .contains("the allow-list has no included company with complete evidence");

        SkillDictionary nothing = SkillDictionary.of(List.of());
        assertThat(service(TestSettings.defaults(), allowList, nothing).disabledReason())
                .contains("the skills dictionary is empty");

        AllowList unreadable = mock(AllowList.class);
        when(unreadable.companies()).thenReturn(List.of());
        when(unreadable.loadError()).thenReturn("market/allow-list.json could not be read (X)");
        assertThat(service(TestSettings.defaults(), unreadable, dictionary).disabledReason())
                .contains("market/allow-list.json could not be read (X)");

        SkillDictionary broken = mock(SkillDictionary.class);
        when(broken.size()).thenReturn(0);
        when(broken.loadError()).thenReturn("market/skills.json could not be read (X)");
        assertThat(service(TestSettings.defaults(), allowList, broken).disabledReason())
                .contains("market/skills.json could not be read (X)");
    }

    @Test
    void theProductionConstructorWiresTheSameService() {
        MarketResearchService wired = new MarketResearchService(TestSettings.defaults(), allowList, dictionary,
                client, store, suggester);
        assertThat(wired.disabledReason()).isEmpty();
    }

    // ── which titles count ───────────────────────────────────────────────────

    @Test
    void onlyDeveloperTitlesCount() {
        for (String title : List.of("Software Engineer II", "Senior Java Developer", "Lead Programmer Analyst",
                "Backend Engineer", "Back-End Engineer", "Back End Engineer", "Full Stack Engineer",
                "Full-Stack Engineer", "Fullstack Engineer", "Applications Engineer", "JAVA ENGINEER")) {
            assertThat(MarketResearchService.isDeveloperRole(title)).as(title).isTrue();
        }
        for (String title : List.of("Business Analyst", "Sales Engineer", "Network Engineer", "Project Manager",
                "Data Scientist", "", "Engineer")) {
            assertThat(MarketResearchService.isDeveloperRole(title)).as(title).isFalse();
        }
        assertThat(MarketResearchService.isDeveloperRole(null)).isFalse();
    }
}
