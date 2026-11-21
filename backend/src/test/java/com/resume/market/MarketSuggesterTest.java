package com.resume.market;

import com.resume.dto.SuggestionRequest;
import com.resume.market.SkillDictionary.Entry;
import com.resume.model.ContentSuggestion;
import com.resume.model.Experience;
import com.resume.model.MarketResearchRun;
import com.resume.model.MarketSkillCount;
import com.resume.model.Profile;
import com.resume.model.Project;
import com.resume.model.Skill;
import com.resume.repository.ContentSuggestionRepository;
import com.resume.repository.ExperienceRepository;
import com.resume.repository.ProfileRepository;
import com.resume.repository.ProjectRepository;
import com.resume.service.SuggestionException;
import com.resume.service.SuggestionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import tools.jackson.databind.json.JsonMapper;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Thresholds, de-duplication and, above all, the rule that market research never states
 * that the owner has a skill: it can only ask, through one kind of suggestion.
 */
class MarketSuggesterTest {

    private static final LocalDate WEEK = LocalDate.of(2026, 11, 16);
    private static final long PROFILE_ID = 7L;

    private final SkillDictionary dictionary = SkillDictionary.of(List.of(
            new Entry("Java", null, null),
            new Entry("Kafka", List.of("Apache Kafka"), null),
            new Entry("Kubernetes", List.of("K8s"), null),
            new Entry("Docker", null, null),
            new Entry("AWS", List.of("Amazon Web Services"), null),
            new Entry("Python", null, null),
            new Entry("Terraform", null, null),
            new Entry("x".repeat(SkillDictionary.NAME_MAX), null, null)));

    private final SuggestionService suggestions = mock(SuggestionService.class);
    private final ContentSuggestionRepository rows = mock(ContentSuggestionRepository.class);
    private final ProfileRepository profiles = mock(ProfileRepository.class);
    private final ExperienceRepository experiences = mock(ExperienceRepository.class);
    private final ProjectRepository projects = mock(ProjectRepository.class);

    private Profile profile;

    @BeforeEach
    void setUp() {
        profile = new Profile();
        profile.setId(PROFILE_ID);
        profile.setName("Ada");
        profile.setTechStack(List.of("Java", "Kafka"));
        when(profiles.findAll()).thenReturn(List.of(profile));
        when(experiences.findAll()).thenReturn(List.of());
        when(projects.findAll()).thenReturn(List.of());
        when(rows.findByTargetTypeAndTargetIdAndFieldAndStatus(any(), any(), any(), any())).thenReturn(List.of());
    }

    private MarketSuggester suggester() {
        return suggester(TestSettings.on());
    }

    private MarketSuggester suggester(TestSettings settings) {
        return new MarketSuggester(settings.build(), dictionary, suggestions, rows, profiles, experiences, projects,
                JsonMapper.builder().build());
    }

    private static MarketSummaryStore.Summary summary(int examined, Object... skillThenCount) {
        MarketResearchRun run = new MarketResearchRun();
        run.setId(1L);
        run.setWeekStart(WEEK);
        run.setStatus(MarketResearchRun.COMPLETED);
        run.setListingsExamined(examined);
        List<MarketSkillCount> counts = new ArrayList<>();
        for (int i = 0; i < skillThenCount.length; i += 2) {
            counts.add(new MarketSkillCount(1L, (String) skillThenCount[i], (Integer) skillThenCount[i + 1]));
        }
        return new MarketSummaryStore.Summary(run, counts);
    }

    private List<SuggestionRequest> created(int times) {
        ArgumentCaptor<SuggestionRequest> captor = ArgumentCaptor.forClass(SuggestionRequest.class);
        verify(suggestions, times(times)).create(captor.capture());
        return captor.getAllValues();
    }

    private void existing(String status, ContentSuggestion... found) {
        when(rows.findByTargetTypeAndTargetIdAndFieldAndStatus("profile", PROFILE_ID, "techStack", status))
                .thenReturn(List.of(found));
    }

    private static ContentSuggestion row(String source, String current, String proposed) {
        ContentSuggestion s = new ContentSuggestion();
        s.setTargetType("profile");
        s.setTargetId(PROFILE_ID);
        s.setField("techStack");
        s.setSource(source);
        s.setCurrentValue(current);
        s.setProposedValue(proposed);
        return s;
    }

    // ── what a suggestion is ─────────────────────────────────────────────────

    @Test
    void aCommonSkillTheOwnerDoesNotList_becomesOnePendingSuggestionWithTheEvidence() {
        int made = suggester().suggest(summary(60, "Java", 50, "Kubernetes", 20));

        assertThat(made).isEqualTo(1);
        SuggestionRequest request = created(1).get(0);
        assertThat(request.targetType()).isEqualTo("profile");
        assertThat(request.targetId()).isEqualTo(PROFILE_ID);
        assertThat(request.field()).isEqualTo("techStack");
        assertThat(request.source()).isEqualTo("market-research");
        assertThat(request.proposedValue()).isEqualTo(List.of("Java", "Kafka", "Kubernetes"));
        assertThat(request.reason()).isEqualTo("Market research, week of 2026-11-16: \"Kubernetes\" was mentioned in "
                + "20 of 60 software-developer listings examined at allow-listed firms (source: Adzuna). "
                + "This is what those listings ask for, not a statement about you. "
                + "Accept only if you have real experience with Kubernetes; otherwise reject.");
    }

    @Test
    void neverAssertsAClaim_everySuggestionOnlyAddsOneDictionaryNameToTheTechStackAndAsks() {
        TestSettings generous = TestSettings.on();
        generous.maxSuggestionsPerRun = "10";
        generous.maxPendingSuggestions = "50";
        String longest = "x".repeat(SkillDictionary.NAME_MAX);

        suggester(generous).suggest(summary(100_000, "Kubernetes", 90_000, "Docker", 80_000, "AWS", 70_000,
                "Python", 60_000, "Terraform", 50_000, longest, 40_000));

        List<SuggestionRequest> requests = created(6);
        for (SuggestionRequest request : requests) {
            // The only target is the list of technology names on the profile: never an
            // experience entry, a project, a description, a bio or any other free text.
            assertThat(request.targetType()).isEqualTo("profile");
            assertThat(request.field()).isEqualTo("techStack");
            assertThat(request.source()).isEqualTo(MarketSuggester.SOURCE);

            // The proposed value is what the owner already has plus exactly one name, and
            // that name comes from the dictionary file, not from listing text.
            assertThat(request.proposedValue()).isInstanceOf(List.class);
            List<?> proposed = (List<?>) request.proposedValue();
            assertThat(proposed).hasSize(3);
            assertThat(proposed.subList(0, 2)).isEqualTo(List.of("Java", "Kafka"));
            String addedSkill = (String) proposed.get(2);
            assertThat(dictionary.names()).contains(addedSkill);

            // The reason reports the market and asks; it does not say the owner has the skill.
            assertThat(request.reason())
                    .contains("was mentioned in")
                    .contains("of 100000 software-developer listings")
                    .contains("not a statement about you")
                    .contains("Accept only if you have real experience with " + addedSkill)
                    .endsWith("otherwise reject.");
            assertThat(request.reason().length()).isLessThanOrEqualTo(SuggestionService.REASON_MAX);
        }
        assertThat(requests).extracting(r -> (Object) ((List<?>) r.proposedValue()).get(2))
                .containsExactly("Kubernetes", "Docker", "AWS", "Python", "Terraform", longest);

        // It writes no content and no suggestion row itself: the queue is the only way in.
        verify(profiles, never()).save(any());
        verify(experiences, never()).save(any());
        verify(projects, never()).save(any());
        verify(rows, never()).save(any());
        verify(suggestions, never()).accept(any());
    }

    @Test
    void theReasonNeverStatesExperience_whateverTheNumbers() {
        String reason = MarketSuggester.reason("Kafka", 1, 1, "2026-11-16");

        assertThat(reason).doesNotContainIgnoringCase("you know")
                .doesNotContainIgnoringCase("your experience")
                .doesNotContainIgnoringCase("you are")
                .doesNotContainIgnoringCase("proficient")
                .doesNotContainIgnoringCase("expert");
        // The one place "you have" appears is the condition the owner is asked to check.
        assertThat(reason.split("you have", -1)).hasSize(2);
        assertThat(reason).contains("Accept only if you have real experience with Kafka");
    }

    @Test
    void aNameThatIsNotExactlyADictionaryNameIsNeverProposed() {
        // Rows as another tool, or an older dictionary, might have left them.
        int made = suggester().suggest(summary(60, "Rust", 40, "kubernetes", 30, "K8s", 30, "Senior engineer", 30));

        assertThat(made).isZero();
        verifyNoInteractions(suggestions);
    }

    // ── thresholds ───────────────────────────────────────────────────────────

    @Test
    void aSampleBelowTheMinimum_createsNothing_andReadsNothing() {
        int made = suggester().suggest(summary(29, "Kubernetes", 29, "Docker", 20));

        assertThat(made).isZero();
        verifyNoInteractions(suggestions, profiles, rows);

        assertThat(suggester().suggest(summary(0))).isZero();
    }

    @Test
    void theMinimumSampleItselfIsEnough() {
        assertThat(suggester().suggest(summary(30, "Kubernetes", 6))).isEqualTo(1);
    }

    @Test
    void aSkillMustBeMentionedOftenEnough_inCountAndInShare() {
        MarketSuggester suggester = suggester();
        assertThat(suggester.common(4, 30)).as("below 5 mentions").isFalse();
        assertThat(suggester.common(5, 30)).as("5 mentions is under 20% of 30").isFalse();
        assertThat(suggester.common(6, 30)).as("exactly 20%").isTrue();
        assertThat(suggester.common(11, 60)).as("18%").isFalse();
        assertThat(suggester.common(12, 60)).as("exactly 20%").isTrue();
        assertThat(suggester.common(5, 5)).isTrue();

        int made = suggester.suggest(summary(60, "Kubernetes", 11, "Docker", 12, "AWS", 4));

        assertThat(made).isEqualTo(1);
        assertThat(created(1).get(0).proposedValue()).isEqualTo(List.of("Java", "Kafka", "Docker"));
    }

    @Test
    void atMostTheCapPerRun_mostMentionedFirst() {
        int made = suggester().suggest(summary(60, "Kubernetes", 40, "Docker", 35, "AWS", 30, "Python", 25,
                "Terraform", 20));

        assertThat(made).isEqualTo(3);
        assertThat(created(3)).extracting(r -> (Object) ((List<?>) r.proposedValue()).get(2))
                .containsExactly("Kubernetes", "Docker", "AWS");
    }

    @Test
    void aCapOfZeroSwitchesSuggestionsOff() {
        TestSettings none = TestSettings.on();
        none.maxSuggestionsPerRun = "0";

        assertThat(suggester(none).suggest(summary(60, "Kubernetes", 40))).isZero();
        verifyNoInteractions(suggestions);
    }

    // ── de-duplication ───────────────────────────────────────────────────────

    @Test
    void aSkillTheOwnerAlreadyListsAnywhereIsNotSuggested_whateverTheSpelling() {
        profile.setTechStack(List.of("Java", "apache kafka"));
        profile.setSkills(Arrays.asList(new Skill("docker", "Tools"), null, new Skill(null, "Tools")));
        Experience experience = new Experience();
        experience.setTechnologies(Arrays.asList("K8s", null, " "));
        Experience bare = new Experience();
        when(experiences.findAll()).thenReturn(List.of(experience, bare));
        Project project = new Project();
        project.setStack(List.of("Amazon Web Services"));
        project.setTags(List.of("PYTHON"));
        when(projects.findAll()).thenReturn(List.of(project, new Project()));

        int made = suggester().suggest(summary(60, "Kafka", 50, "Docker", 45, "Kubernetes", 40, "AWS", 35,
                "Python", 30, "Terraform", 25));

        assertThat(made).isEqualTo(1);
        assertThat(created(1).get(0).proposedValue()).isEqualTo(List.of("Java", "apache kafka", "Terraform"));
    }

    @Test
    void aSkillAlreadyWaitingInTheQueueIsNotSuggestedAgain_fromAnySource() {
        existing("pending",
                row("market-research", "[\"Java\",\"Kafka\"]", "[\"Java\",\"Kafka\",\"Kubernetes\"]"),
                row("manual", "[\"Java\",\"Kafka\"]", "[\"Java\",\"Kafka\",\"docker\"]"));

        int made = suggester().suggest(summary(60, "Kubernetes", 40, "Docker", 35, "AWS", 30));

        assertThat(made).isEqualTo(1);
        assertThat(created(1).get(0).proposedValue()).isEqualTo(List.of("Java", "Kafka", "AWS"));
    }

    @Test
    void aSkillTheOwnerRejectedIsNeverSuggestedAgain() {
        existing("rejected", row("market-research", "[\"Java\"]", "[\"Java\",\"K8s\"]"));

        int made = suggester().suggest(summary(60, "Kubernetes", 40));

        assertThat(made).isZero();
        verifyNoInteractions(suggestions);
    }

    @Test
    void acceptedAndSupersededSuggestionsDoNotBlock_andOddStoredValuesAreIgnored() {
        // Only pending and rejected rows are looked at; these would be returned for other statuses.
        existing("pending",
                row("manual", null, "\"just text\""),
                row("manual", "not json", "[1, 2, {\"a\": 1}]"),
                row("manual", "[\"Java\"]", null),
                row("manual", "[\"Java\"]", "{broken"));

        int made = suggester().suggest(summary(60, "Kubernetes", 40));

        assertThat(made).isEqualTo(1);
        verify(rows, never()).findByTargetTypeAndTargetIdAndFieldAndStatus("profile", PROFILE_ID, "techStack", "accepted");
        verify(rows, never()).findByTargetTypeAndTargetIdAndFieldAndStatus("profile", PROFILE_ID, "techStack", "superseded");
    }

    @Test
    void noMoreAreAddedWhileEnoughFromMarketResearchAreStillWaiting() {
        ContentSuggestion[] waiting = new ContentSuggestion[4];
        for (int i = 0; i < waiting.length; i++) {
            waiting[i] = row("market-research", "[\"Java\"]", "[\"Java\",\"Skill " + i + "\"]");
        }
        existing("pending", waiting);

        // Five may wait at once: four already do, so one more.
        assertThat(suggester().suggest(summary(60, "Kubernetes", 40, "Docker", 35))).isEqualTo(1);

        existing("pending", waiting[0], waiting[1], waiting[2], waiting[3],
                row("market-research", "[\"Java\"]", "[\"Java\",\"Skill 4\"]"),
                row("manual", "[\"Java\"]", "[\"Java\",\"Other\"]"));
        assertThat(suggester().suggest(summary(60, "Kubernetes", 40, "Docker", 35))).isZero();
        verify(suggestions, times(1)).create(any());
    }

    @Test
    void aSuggestionTheQueueRefuses_isSkipped_andTheNextSkillTakesItsPlace() {
        when(suggestions.create(any()))
                .thenThrow(SuggestionException.refused("duplicate", "The same change is already waiting for a decision."))
                .thenReturn(null);

        int made = suggester().suggest(summary(60, "Kubernetes", 40, "Docker", 35));

        assertThat(made).isEqualTo(1);
        verify(suggestions, times(2)).create(any());
    }

    // ── edge cases ───────────────────────────────────────────────────────────

    @Test
    void withoutAProfileNothingIsSuggested() {
        when(profiles.findAll()).thenReturn(List.of());

        assertThat(suggester().suggest(summary(60, "Kubernetes", 40))).isZero();
        verifyNoInteractions(suggestions);
    }

    @Test
    void anEmptyTechStackGetsTheSkillAlone() {
        profile.setTechStack(null);

        suggester().suggest(summary(60, "Kubernetes", 40));

        assertThat(created(1).get(0).proposedValue()).isEqualTo(List.of("Kubernetes"));
    }

    @Test
    void aFullTechStackGetsNothingMore() {
        List<String> full = new ArrayList<>(Collections.nCopies(49, "placeholder"));
        for (int i = 0; i < full.size(); i++) full.set(i, "Tech " + i);
        full.add("Java");
        profile.setTechStack(full);

        assertThat(suggester().suggest(summary(60, "Kubernetes", 40, "Docker", 35))).isZero();
        verifyNoInteractions(suggestions);
    }
}
