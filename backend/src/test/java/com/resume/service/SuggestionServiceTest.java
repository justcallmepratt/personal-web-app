package com.resume.service;

import com.resume.dto.SuggestionRequest;
import com.resume.dto.SuggestionResponse;
import com.resume.dto.SuggestionTarget;
import com.resume.model.ContentSuggestion;
import com.resume.model.Experience;
import com.resume.model.Profile;
import com.resume.model.Project;
import com.resume.repository.ContentSuggestionRepository;
import com.resume.repository.ExperienceRepository;
import com.resume.repository.ProfileRepository;
import com.resume.repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import tools.jackson.databind.json.JsonMapper;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SuggestionServiceTest {

    @Mock private ContentSuggestionRepository suggestions;
    @Mock private ProfileRepository profiles;
    @Mock private ExperienceRepository experiences;
    @Mock private ProjectRepository projects;

    private SuggestionService service;

    @BeforeEach
    void setUp() {
        service = new SuggestionService(suggestions, profiles, experiences, projects, JsonMapper.builder().build());
        lenient().when(suggestions.save(any())).thenAnswer(call -> call.getArgument(0));
    }

    // ── fixtures ─────────────────────────────────────────────────────────────

    private static Profile profile() {
        Profile p = new Profile();
        p.setId(1L);
        p.setName("Ada");
        p.setTagline("Engineer");
        p.setTechStack(List.of("Java"));
        return p;
    }

    private static Experience experience() {
        Experience e = new Experience();
        e.setId(7L);
        e.setCompany("Acme");
        e.setRole("Engineer");
        e.setHighlights(List.of("Shipped X"));
        e.setTechnologies(List.of("Java"));
        return e;
    }

    private static Project project() {
        Project p = new Project();
        p.setId(3L);
        p.setTitle("Site");
        p.setTags(List.of("web"));
        p.setStack(List.of("Next.js"));
        return p;
    }

    private static ContentSuggestion suggestion(long id, String type, long targetId, String field,
                                                String current, String proposed, String status) {
        ContentSuggestion s = new ContentSuggestion();
        s.setId(id);
        s.setTargetType(type);
        s.setTargetId(targetId);
        s.setField(field);
        s.setCurrentValue(current);
        s.setProposedValue(proposed);
        s.setReason("Because");
        s.setSource("manual");
        s.setStatus(status);
        s.setCreatedAt(LocalDateTime.of(2026, 11, 21, 10, 0));
        return s;
    }

    private static ContentSuggestion pendingRole(long id) {
        return suggestion(id, "experience", 7L, "role", "\"Engineer\"", "\"Senior Engineer\"", "pending");
    }

    private static SuggestionRequest request(String type, Long targetId, String field, Object proposed) {
        return new SuggestionRequest(type, targetId, field, proposed, "Matches the job title on the contract", null);
    }

    private SuggestionException refusal(Runnable call) {
        SuggestionException e = catchThrowableOfType(SuggestionException.class, call::run);
        assertThat(e).as("expected a SuggestionException").isNotNull();
        return e;
    }

    private void assertInvalid(Runnable call, String messagePart) {
        SuggestionException e = refusal(call);
        assertThat(e.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(e.getCode()).isEqualTo("invalid");
        assertThat(e.getMessage()).contains(messagePart);
    }

    // ── list / get / targets ─────────────────────────────────────────────────

    @Test
    void list_withoutStatus_returnsEverythingWithLabelsLookedUpOncePerTarget() {
        when(suggestions.findTop200ByOrderByCreatedAtDescIdDesc()).thenReturn(List.of(
                pendingRole(2),
                suggestion(1, "experience", 7L, "highlights", "[\"Shipped X\"]", "[\"Shipped X\",\"Led Y\"]", "accepted")));
        when(experiences.findById(7L)).thenReturn(Optional.of(experience()));

        List<SuggestionResponse> result = service.list(null);

        assertThat(result).extracting(SuggestionResponse::id).containsExactly(2L, 1L);
        SuggestionResponse first = result.get(0);
        assertThat(first.targetType()).isEqualTo("experience");
        assertThat(first.targetId()).isEqualTo(7L);
        assertThat(first.targetLabel()).isEqualTo("Engineer at Acme");
        assertThat(first.field()).isEqualTo("role");
        assertThat(first.fieldKind()).isEqualTo("text");
        assertThat(first.currentValue()).isEqualTo("Engineer");
        assertThat(first.proposedValue()).isEqualTo("Senior Engineer");
        assertThat(first.reason()).isEqualTo("Because");
        assertThat(first.source()).isEqualTo("manual");
        assertThat(first.status()).isEqualTo("pending");
        assertThat(first.createdAt()).isEqualTo(LocalDateTime.of(2026, 11, 21, 10, 0));
        assertThat(first.decidedAt()).isNull();
        assertThat(result.get(1).fieldKind()).isEqualTo("list");
        assertThat(result.get(1).proposedValue()).isEqualTo(List.of("Shipped X", "Led Y"));
        verify(experiences, times(1)).findById(7L);
    }

    @Test
    void list_blankStatus_isTreatedAsNoFilter() {
        when(suggestions.findTop200ByOrderByCreatedAtDescIdDesc()).thenReturn(List.of());
        assertThat(service.list("  ")).isEmpty();
    }

    @Test
    void list_withStatus_filters() {
        when(suggestions.findTop200ByStatusOrderByCreatedAtDescIdDesc("pending")).thenReturn(List.of(pendingRole(2)));

        assertThat(service.list("pending")).extracting(SuggestionResponse::id).containsExactly(2L);
        verify(suggestions, never()).findTop200ByOrderByCreatedAtDescIdDesc();
    }

    @Test
    void list_withUnknownStatus_isInvalid() {
        assertInvalid(() -> service.list("approved"), "Unknown status");
        assertInvalid(() -> service.list("PENDING"), "Unknown status");
    }

    @Test
    void list_survivesRowsItCannotFullyResolve() {
        when(suggestions.findTop200ByOrderByCreatedAtDescIdDesc()).thenReturn(List.of(
                // target row deleted since
                suggestion(4, "project", 99L, "title", "\"Old\"", "\"New\"", "pending"),
                // written by hand: unknown target type, plain text instead of JSON
                suggestion(3, "certification", 1L, "name", "not json", "[\"a\"]", "pending"),
                suggestion(2, "certification", 2L, "name", null, "plain words", "rejected"),
                // field no longer on the whitelist
                suggestion(1, "profile", 1L, "email", null, "\"a@example.com\"", "pending")));
        when(projects.findById(99L)).thenReturn(Optional.empty());
        when(profiles.findById(1L)).thenReturn(Optional.of(profile()));

        List<SuggestionResponse> result = service.list(null);

        assertThat(result.get(0).targetLabel()).isNull();
        assertThat(result.get(1).targetLabel()).isNull();
        assertThat(result.get(1).currentValue()).isEqualTo("not json");
        assertThat(result.get(1).fieldKind()).isEqualTo("list");
        assertThat(result.get(2).currentValue()).isNull();
        assertThat(result.get(2).proposedValue()).isEqualTo("plain words");
        assertThat(result.get(2).fieldKind()).isEqualTo("text");
        assertThat(result.get(3).targetLabel()).isEqualTo("Profile");
        assertThat(result.get(3).fieldKind()).isEqualTo("text");
    }

    @Test
    void get_returnsTheSuggestion_orNotFound() {
        when(suggestions.findById(2L)).thenReturn(Optional.of(
                suggestion(2, "project", 3L, "tags", "[\"web\"]", "[\"web\",\"java\"]", "pending")));
        when(projects.findById(3L)).thenReturn(Optional.of(project()));
        when(suggestions.findById(9L)).thenReturn(Optional.empty());

        SuggestionResponse found = service.get(2L);
        assertThat(found.targetLabel()).isEqualTo("Site");
        assertThat(found.fieldKind()).isEqualTo("list");

        SuggestionException e = refusal(() -> service.get(9L));
        assertThat(e.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(e.getCode()).isEqualTo("not_found");
    }

    @Test
    void targets_listsProfileThenExperienceThenProjectsWithLiveValues() {
        when(profiles.findAll()).thenReturn(List.of(profile()));
        when(experiences.findAllByOrderBySortOrderAsc()).thenReturn(List.of(experience()));
        when(projects.findAllByOrderBySortOrderAsc()).thenReturn(List.of(project()));

        List<SuggestionTarget> targets = service.targets();

        assertThat(targets).extracting(SuggestionTarget::targetType)
                .containsExactly("profile", "experience", "project");
        assertThat(targets).extracting(SuggestionTarget::label)
                .containsExactly("Profile", "Engineer at Acme", "Site");
        assertThat(targets).extracting(SuggestionTarget::targetId).containsExactly(1L, 7L, 3L);

        SuggestionTarget.Field tagline = targets.get(0).fields().get(1);
        assertThat(tagline).isEqualTo(new SuggestionTarget.Field("tagline", "text", false, 255, "Engineer"));
        SuggestionTarget.Field highlights = targets.get(1).fields().get(4);
        assertThat(highlights).isEqualTo(
                new SuggestionTarget.Field("highlights", "list", true, 255, List.of("Shipped X")));
        assertThat(targets.get(2).fields()).extracting(SuggestionTarget.Field::name)
                .containsExactly("title", "description", "longDescription", "tags", "stack");
    }

    @Test
    void targets_withoutAProfile_listsTheRest() {
        when(profiles.findAll()).thenReturn(List.of());
        when(experiences.findAllByOrderBySortOrderAsc()).thenReturn(List.of());
        when(projects.findAllByOrderBySortOrderAsc()).thenReturn(List.of(project()));

        assertThat(service.targets()).extracting(SuggestionTarget::targetType).containsExactly("project");
    }

    // ── create ───────────────────────────────────────────────────────────────

    @Test
    void create_recordsTheCurrentAndProposedValuesAsPending_withoutTouchingTheTarget() {
        Experience e = experience();
        when(experiences.findById(7L)).thenReturn(Optional.of(e));
        when(suggestions.findByTargetTypeAndTargetIdAndFieldAndStatus("experience", 7L, "role", "pending"))
                .thenReturn(List.of());

        SuggestionResponse created = service.create(new SuggestionRequest(
                "experience", 7L, "role", "Senior Engineer", "  Promoted in 2025  ", null));

        ArgumentCaptor<ContentSuggestion> saved = ArgumentCaptor.forClass(ContentSuggestion.class);
        verify(suggestions).save(saved.capture());
        ContentSuggestion s = saved.getValue();
        assertThat(s.getTargetType()).isEqualTo("experience");
        assertThat(s.getTargetId()).isEqualTo(7L);
        assertThat(s.getField()).isEqualTo("role");
        assertThat(s.getCurrentValue()).isEqualTo("\"Engineer\"");
        assertThat(s.getProposedValue()).isEqualTo("\"Senior Engineer\"");
        assertThat(s.getReason()).isEqualTo("Promoted in 2025");
        assertThat(s.getSource()).isEqualTo("manual");
        assertThat(s.getStatus()).isEqualTo("pending");
        assertThat(s.getCreatedAt()).isNotNull();
        assertThat(s.getDecidedAt()).isNull();

        assertThat(created.currentValue()).isEqualTo("Engineer");
        assertThat(created.proposedValue()).isEqualTo("Senior Engineer");
        assertThat(created.targetLabel()).isEqualTo("Engineer at Acme");

        // Proposing never writes to the content tables.
        assertThat(e.getRole()).isEqualTo("Engineer");
        verify(experiences, never()).save(any());
        verify(experiences, never()).findByIdForUpdate(any());
    }

    @Test
    void create_forTheProfile_needsNoTargetId_andStoresAListAsJson() {
        when(profiles.findAll()).thenReturn(List.of(profile()));
        when(suggestions.findByTargetTypeAndTargetIdAndFieldAndStatus("profile", 1L, "techStack", "pending"))
                .thenReturn(List.of());

        SuggestionResponse created = service.create(new SuggestionRequest(
                "profile", null, "techStack", List.of("Java", "Kafka"), "Used daily", "  market-research "));

        ArgumentCaptor<ContentSuggestion> saved = ArgumentCaptor.forClass(ContentSuggestion.class);
        verify(suggestions).save(saved.capture());
        assertThat(saved.getValue().getTargetId()).isEqualTo(1L);
        assertThat(saved.getValue().getCurrentValue()).isEqualTo("[\"Java\"]");
        assertThat(saved.getValue().getProposedValue()).isEqualTo("[\"Java\",\"Kafka\"]");
        assertThat(saved.getValue().getSource()).isEqualTo("market-research");
        assertThat(created.fieldKind()).isEqualTo("list");
    }

    @Test
    void create_whenTheFieldIsCurrentlyNull_storesNoCurrentValue() {
        when(profiles.findById(1L)).thenReturn(Optional.of(profile())); // bio is null
        when(suggestions.findByTargetTypeAndTargetIdAndFieldAndStatus("profile", 1L, "bio", "pending"))
                .thenReturn(List.of());

        SuggestionResponse created = service.create(request("profile", 1L, "bio", "Backend engineer."));

        ArgumentCaptor<ContentSuggestion> saved = ArgumentCaptor.forClass(ContentSuggestion.class);
        verify(suggestions).save(saved.capture());
        assertThat(saved.getValue().getCurrentValue()).isNull();
        assertThat(created.currentValue()).isNull();
    }

    @Test
    void create_forAProject_works() {
        when(projects.findById(3L)).thenReturn(Optional.of(project()));
        when(suggestions.findByTargetTypeAndTargetIdAndFieldAndStatus("project", 3L, "title", "pending"))
                .thenReturn(List.of());

        assertThat(service.create(request("project", 3L, "title", "Portfolio site")).targetLabel()).isEqualTo("Site");
    }

    @Test
    void create_refusesUnknownTargetsAndFieldsOffTheWhitelist() {
        assertInvalid(() -> service.create(request("messages", 1L, "body", "x")), "Unknown target");
        assertInvalid(() -> service.create(request(null, 1L, "name", "x")), "Unknown target");
        assertInvalid(() -> service.create(request("profile", 1L, "email", "a@example.com")), "cannot be changed");
        assertInvalid(() -> service.create(request("project", 3L, "featured", "true")), "cannot be changed");
        assertInvalid(() -> service.create(request("experience", 7L, null, "x")), "cannot be changed");
        verifyNoInteractions(suggestions, profiles, experiences, projects);
    }

    @Test
    void create_refusesAMissingTarget() {
        when(profiles.findAll()).thenReturn(List.of());
        when(profiles.findById(5L)).thenReturn(Optional.empty());
        when(experiences.findById(8L)).thenReturn(Optional.empty());
        when(projects.findById(8L)).thenReturn(Optional.empty());

        assertThat(refusal(() -> service.create(request("profile", null, "name", "x"))).getCode()).isEqualTo("not_found");
        assertThat(refusal(() -> service.create(request("profile", 5L, "name", "x"))).getCode()).isEqualTo("not_found");
        assertThat(refusal(() -> service.create(request("experience", 8L, "role", "x"))).getCode()).isEqualTo("not_found");
        assertThat(refusal(() -> service.create(request("project", 8L, "title", "x"))).getStatus())
                .isEqualTo(HttpStatus.NOT_FOUND);
        assertInvalid(() -> service.create(request("experience", null, "role", "x")), "target id is required");
        verify(suggestions, never()).save(any());
    }

    @Test
    void create_refusesInvalidValues_andValuesThatChangeNothing() {
        when(experiences.findById(7L)).thenReturn(Optional.of(experience()));

        assertInvalid(() -> service.create(request("experience", 7L, "role", "")), "cannot be empty");
        assertInvalid(() -> service.create(request("experience", 7L, "role", 5)), "takes text");
        assertInvalid(() -> service.create(request("experience", 7L, "highlights", "one line")), "takes a list");
        assertInvalid(() -> service.create(request("experience", 7L, "role", "Engineer")), "same as the current");
        assertInvalid(() -> service.create(request("experience", 7L, "highlights", List.of("Shipped X"))),
                "same as the current");
        verify(suggestions, never()).save(any());
    }

    @Test
    void create_requiresAReason_andLimitsReasonAndSource() {
        when(experiences.findById(7L)).thenReturn(Optional.of(experience()));

        assertInvalid(() -> service.create(new SuggestionRequest("experience", 7L, "role", "Lead", null, null)),
                "reason is required");
        assertInvalid(() -> service.create(new SuggestionRequest("experience", 7L, "role", "Lead", "   ", null)),
                "reason is required");
        assertInvalid(() -> service.create(new SuggestionRequest("experience", 7L, "role", "Lead", "r".repeat(501), null)),
                "limited to 500");
        assertInvalid(() -> service.create(new SuggestionRequest("experience", 7L, "role", "Lead", "ok", "s".repeat(51))),
                "limited to 50");
        verify(suggestions, never()).save(any());
    }

    @Test
    void create_refusesACopyOfAPendingSuggestion_butAllowsADifferentProposal() {
        when(experiences.findById(7L)).thenReturn(Optional.of(experience()));
        when(suggestions.findByTargetTypeAndTargetIdAndFieldAndStatus("experience", 7L, "role", "pending"))
                .thenReturn(List.of(pendingRole(2)));

        SuggestionException e = refusal(() -> service.create(request("experience", 7L, "role", "Senior Engineer")));
        assertThat(e.getStatus()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(e.getCode()).isEqualTo("duplicate");
        assertThat(e.hasLiveValue()).isFalse();
        verify(suggestions, never()).save(any());

        assertThat(service.create(request("experience", 7L, "role", "Staff Engineer")).proposedValue())
                .isEqualTo("Staff Engineer");
    }

    // ── accept ───────────────────────────────────────────────────────────────

    @Test
    void accept_appliesExactlyThatFieldAndMarksTheSuggestionAccepted() {
        Experience e = experience();
        ContentSuggestion s = pendingRole(2);
        when(suggestions.findByIdForUpdate(2L)).thenReturn(Optional.of(s));
        when(experiences.findByIdForUpdate(7L)).thenReturn(Optional.of(e));
        when(suggestions.findByTargetTypeAndTargetIdAndFieldAndStatus("experience", 7L, "role", "pending"))
                .thenReturn(List.of());

        SuggestionResponse result = service.accept(2L);

        assertThat(e.getRole()).isEqualTo("Senior Engineer");
        assertThat(e.getCompany()).isEqualTo("Acme");
        assertThat(e.getHighlights()).containsExactly("Shipped X");
        assertThat(e.getTechnologies()).containsExactly("Java");
        verify(experiences).save(e);
        assertThat(s.getStatus()).isEqualTo("accepted");
        assertThat(s.getDecidedAt()).isNotNull();
        assertThat(result.status()).isEqualTo("accepted");
        assertThat(result.decidedAt()).isNotNull();
        // The response still shows what was replaced.
        assertThat(result.currentValue()).isEqualTo("Engineer");
        verifyNoInteractions(profiles, projects);
    }

    @Test
    void accept_appliesAListToAProject() {
        Project p = project();
        ContentSuggestion s = suggestion(5, "project", 3L, "tags", "[\"web\"]", "[\"web\",\"java\"]", "pending");
        when(suggestions.findByIdForUpdate(5L)).thenReturn(Optional.of(s));
        when(projects.findByIdForUpdate(3L)).thenReturn(Optional.of(p));
        when(suggestions.findByTargetTypeAndTargetIdAndFieldAndStatus("project", 3L, "tags", "pending"))
                .thenReturn(List.of(s));

        service.accept(5L);

        assertThat(p.getTags()).containsExactly("web", "java");
        assertThat(p.getStack()).containsExactly("Next.js");
        verify(projects).save(p);
        // The accepted suggestion is not superseded by itself.
        assertThat(s.getStatus()).isEqualTo("accepted");
    }

    @Test
    void accept_fillsAFieldThatWasNull_onTheProfile() {
        Profile p = profile();
        ContentSuggestion s = suggestion(6, "profile", 1L, "bio", null, "\"Backend engineer.\"", "pending");
        when(suggestions.findByIdForUpdate(6L)).thenReturn(Optional.of(s));
        when(profiles.findByIdForUpdate(1L)).thenReturn(Optional.of(p));
        when(suggestions.findByTargetTypeAndTargetIdAndFieldAndStatus("profile", 1L, "bio", "pending"))
                .thenReturn(List.of());

        service.accept(6L);

        assertThat(p.getBio()).isEqualTo("Backend engineer.");
        assertThat(p.getTagline()).isEqualTo("Engineer");
        verify(profiles).save(p);
    }

    @Test
    void accept_supersedesTheOtherPendingSuggestionsForTheSameField() {
        ContentSuggestion accepted = pendingRole(2);
        ContentSuggestion rival = suggestion(3, "experience", 7L, "role", "\"Engineer\"", "\"Staff Engineer\"", "pending");
        when(suggestions.findByIdForUpdate(2L)).thenReturn(Optional.of(accepted));
        when(experiences.findByIdForUpdate(7L)).thenReturn(Optional.of(experience()));
        when(suggestions.findByTargetTypeAndTargetIdAndFieldAndStatus("experience", 7L, "role", "pending"))
                .thenReturn(List.of(accepted, rival));

        service.accept(2L);

        assertThat(accepted.getStatus()).isEqualTo("accepted");
        assertThat(rival.getStatus()).isEqualTo("superseded");
        assertThat(rival.getDecidedAt()).isEqualTo(accepted.getDecidedAt());
        verify(suggestions).save(rival);
    }

    @Test
    void accept_whenTheTargetChangedSinceTheSuggestion_refusesAndChangesNothing() {
        Experience e = experience();
        e.setRole("Lead Engineer"); // edited after the suggestion recorded "Engineer"
        ContentSuggestion s = pendingRole(2);
        when(suggestions.findByIdForUpdate(2L)).thenReturn(Optional.of(s));
        when(experiences.findByIdForUpdate(7L)).thenReturn(Optional.of(e));

        SuggestionException ex = refusal(() -> service.accept(2L));

        assertThat(ex.getStatus()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(ex.getCode()).isEqualTo("conflict");
        assertThat(ex.hasLiveValue()).isTrue();
        assertThat(ex.getLiveValue()).isEqualTo("Lead Engineer");
        assertThat(ex.getMessage()).contains("role").contains("changed");
        assertThat(e.getRole()).isEqualTo("Lead Engineer");
        assertThat(s.getStatus()).isEqualTo("pending");
        assertThat(s.getDecidedAt()).isNull();
        verify(experiences, never()).save(any());
        verify(suggestions, never()).save(any());
    }

    @Test
    void accept_detectsAConflictOnAList_andWhenAValueAppearedWhereThereWasNone() {
        Project p = project();
        p.setTags(List.of("web", "portfolio"));
        ContentSuggestion list = suggestion(5, "project", 3L, "tags", "[\"web\"]", "[\"web\",\"java\"]", "pending");
        when(suggestions.findByIdForUpdate(5L)).thenReturn(Optional.of(list));
        when(projects.findByIdForUpdate(3L)).thenReturn(Optional.of(p));

        assertThat(refusal(() -> service.accept(5L)).getLiveValue()).isEqualTo(List.of("web", "portfolio"));
        assertThat(p.getTags()).containsExactly("web", "portfolio");

        Profile profile = profile();
        profile.setBio("Written by hand meanwhile.");
        ContentSuggestion bio = suggestion(6, "profile", 1L, "bio", null, "\"Backend engineer.\"", "pending");
        when(suggestions.findByIdForUpdate(6L)).thenReturn(Optional.of(bio));
        when(profiles.findByIdForUpdate(1L)).thenReturn(Optional.of(profile));

        assertThat(refusal(() -> service.accept(6L)).getCode()).isEqualTo("conflict");
        assertThat(profile.getBio()).isEqualTo("Written by hand meanwhile.");
        verify(suggestions, never()).save(any());
    }

    @Test
    void accept_refusesADecidedOrUnknownSuggestion() {
        when(suggestions.findByIdForUpdate(9L)).thenReturn(Optional.empty());
        assertThat(refusal(() -> service.accept(9L)).getCode()).isEqualTo("not_found");

        for (String status : List.of("accepted", "rejected", "superseded")) {
            ContentSuggestion s = pendingRole(2);
            s.setStatus(status);
            when(suggestions.findByIdForUpdate(2L)).thenReturn(Optional.of(s));

            SuggestionException e = refusal(() -> service.accept(2L));
            assertThat(e.getStatus()).isEqualTo(HttpStatus.CONFLICT);
            assertThat(e.getCode()).isEqualTo("not_pending");
            assertThat(e.getMessage()).contains(status);
        }
        verifyNoInteractions(experiences);
        verify(suggestions, never()).save(any());
    }

    @Test
    void accept_refusesWhenTheTargetRowIsGone() {
        when(suggestions.findByIdForUpdate(2L)).thenReturn(Optional.of(pendingRole(2)));
        when(experiences.findByIdForUpdate(7L)).thenReturn(Optional.empty());

        SuggestionException e = refusal(() -> service.accept(2L));

        assertThat(e.getStatus()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(e.getCode()).isEqualTo("target_missing");
        verify(suggestions, never()).save(any());
    }

    @Test
    void accept_recheckTheWhitelistAndTheStoredValue() {
        // A row written by another tool for a field or target that is not allowed.
        when(suggestions.findByIdForUpdate(1L)).thenReturn(Optional.of(
                suggestion(1, "profile", 1L, "email", null, "\"a@example.com\"", "pending")));
        when(suggestions.findByIdForUpdate(2L)).thenReturn(Optional.of(
                suggestion(2, "certification", 1L, "name", null, "\"x\"", "pending")));
        assertInvalid(() -> service.accept(1L), "cannot be changed");
        assertInvalid(() -> service.accept(2L), "cannot be changed");
        verifyNoInteractions(profiles);

        // A stored proposal that would not pass validation today is not applied.
        Experience e = experience();
        when(suggestions.findByIdForUpdate(3L)).thenReturn(Optional.of(
                suggestion(3, "experience", 7L, "role", "\"Engineer\"", "\"   \"", "pending")));
        when(experiences.findByIdForUpdate(7L)).thenReturn(Optional.of(e));
        assertInvalid(() -> service.accept(3L), "cannot be empty");
        assertThat(e.getRole()).isEqualTo("Engineer");
        verify(experiences, never()).save(any());
        verify(suggestions, never()).save(any());
    }

    // ── reject ───────────────────────────────────────────────────────────────

    @Test
    void reject_marksTheSuggestionRejectedAndTouchesNothingElse() {
        ContentSuggestion s = pendingRole(2);
        when(suggestions.findByIdForUpdate(2L)).thenReturn(Optional.of(s));
        when(experiences.findById(7L)).thenReturn(Optional.of(experience()));

        SuggestionResponse result = service.reject(2L);

        assertThat(result.status()).isEqualTo("rejected");
        assertThat(s.getDecidedAt()).isNotNull();
        verify(experiences, never()).save(any());
        verify(experiences, never()).findByIdForUpdate(any());
        verify(suggestions, never()).findByTargetTypeAndTargetIdAndFieldAndStatus(any(), any(), any(), any());
    }

    @Test
    void reject_refusesADecidedOrUnknownSuggestion() {
        ContentSuggestion decided = pendingRole(2);
        decided.setStatus("accepted");
        when(suggestions.findByIdForUpdate(2L)).thenReturn(Optional.of(decided));
        when(suggestions.findByIdForUpdate(9L)).thenReturn(Optional.empty());

        assertThat(refusal(() -> service.reject(2L)).getCode()).isEqualTo("not_pending");
        assertThat(refusal(() -> service.reject(9L)).getCode()).isEqualTo("not_found");
        assertThat(decided.getStatus()).isEqualTo("accepted");
        verify(suggestions, never()).save(any());
    }
}
