package com.resume.market;

import com.resume.market.TargetRoles.Entry;
import com.resume.market.TargetRoles.Role;
import com.resume.market.TargetRoles.Search;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TargetRolesTest {

    private static final Search KEYWORDS = new Search("software", null, "it-jobs");

    private static Entry entry(String id, String name, Search search, String... titles) {
        return new Entry(id, name, Arrays.asList(titles), search);
    }

    private final TargetRoles roles = TargetRoles.of(List.of(
            entry("software-developer", "software developer", KEYWORDS,
                    "Software Engineer", "software developer", "back end developer", "full stack engineer"),
            entry("forward-deployed-engineer", "forward deployed engineer", new Search(null, "forward deployed", null),
                    "forward deployed engineer", "forward deployed software engineer")));

    private String roleOf(String title) {
        return roles.classify(title).map(Role::id).orElse(null);
    }

    // ── which titles belong to which role ────────────────────────────────────

    @Test
    void aTitleBelongsToARoleWhenItContainsOneOfItsVariantsAsWholeWords() {
        assertThat(roleOf("Software Engineer")).isEqualTo("software-developer");
        assertThat(roleOf("Senior Software Engineer II - Payments")).isEqualTo("software-developer");
        assertThat(roleOf("SOFTWARE DEVELOPER (Java)")).isEqualTo("software-developer");
        assertThat(roleOf("Forward Deployed Engineer")).isEqualTo("forward-deployed-engineer");
        assertThat(roleOf("Forward Deployed Engineer, Financial Services")).isEqualTo("forward-deployed-engineer");

        // Not a variant, or only part of a word.
        assertThat(roleOf("Software Engineering Manager")).isNull();
        assertThat(roleOf("Business Analyst")).isNull();
        assertThat(roleOf("Sales Engineer")).isNull();
        assertThat(roleOf("Engineer, Software")).isNull();
        assertThat(roleOf("Forward Deployed Strategist")).isNull();
        assertThat(roleOf("")).isNull();
        assertThat(roleOf(null)).isNull();
    }

    @Test
    void punctuationAndCaseInATitleDoNotMatter() {
        assertThat(roleOf("Back-End Developer")).isEqualTo("software-developer");
        assertThat(roleOf("Full-Stack  Engineer")).isEqualTo("software-developer");
        assertThat(roleOf("Forward-Deployed Engineer")).isEqualTo("forward-deployed-engineer");
        assertThat(roleOf("software/engineer")).isEqualTo("software-developer");
    }

    @Test
    void whenTwoRolesMatch_theLongestVariantWins_soAListingCountsForOneRoleOnly() {
        // Contains "software engineer" too, but the forward deployed variant is longer.
        assertThat(roleOf("Forward Deployed Software Engineer")).isEqualTo("forward-deployed-engineer");
        assertThat(roleOf("Sr. Forward Deployed Software Engineer (AI)")).isEqualTo("forward-deployed-engineer");

        // The order of the roles in the file does not change that.
        TargetRoles reversed = TargetRoles.of(List.of(
                entry("fde", "forward deployed engineer", KEYWORDS, "forward deployed software engineer"),
                entry("dev", "software developer", KEYWORDS, "software engineer")));
        assertThat(reversed.classify("Forward Deployed Software Engineer").map(Role::id)).contains("fde");
        assertThat(reversed.classify("Software Engineer").map(Role::id)).contains("dev");
    }

    // ── loading ──────────────────────────────────────────────────────────────

    @Test
    void anIncompleteEntryIsLeftOut() {
        List<Entry> entries = new ArrayList<>();
        entries.add(null);
        entries.add(entry("good", "good role", KEYWORDS, "Good Title"));
        entries.add(entry(null, "no id", KEYWORDS, "x"));
        entries.add(entry("Has Spaces", "bad id", KEYWORDS, "x"));
        entries.add(entry("x".repeat(TargetRoles.ID_MAX + 1), "long id", KEYWORDS, "x"));
        entries.add(entry("no-name", null, KEYWORDS, "x"));
        entries.add(entry("blank-name", " ", KEYWORDS, "x"));
        entries.add(entry("long-name", "n".repeat(TargetRoles.NAME_MAX + 1), KEYWORDS, "x"));
        entries.add(entry("no-titles", "no titles", KEYWORDS));
        entries.add(new Entry("null-titles", "null titles", null, KEYWORDS));
        entries.add(entry("blank-titles", "blank titles", KEYWORDS, " ", "&", null));
        entries.add(entry("no-search", "no search", null, "x"));
        entries.add(entry("empty-search", "empty search", new Search(" ", null, "it-jobs"), "x"));
        entries.add(entry("good", "duplicate id", KEYWORDS, "Other Title"));
        entries.add(entry("phrase-only", " phrase only ", new Search(null, " exact phrase ", " "), "Phrase Title"));

        TargetRoles loaded = TargetRoles.of(entries);

        assertThat(loaded.roles()).extracting(Role::id).containsExactly("good", "phrase-only");
        assertThat(loaded.loadError()).isNull();
        Role phrase = loaded.byId("phrase-only").orElseThrow();
        assertThat(phrase.name()).isEqualTo("phrase only");
        assertThat(phrase.titles()).containsExactly("phrase title");
        assertThat(phrase.search()).isEqualTo(new Search(null, "exact phrase", null));
        assertThat(loaded.byId("good").orElseThrow().titles()).containsExactly("good title");
        assertThat(TargetRoles.of(null).roles()).isEmpty();
    }

    @Test
    void nameOf_givesTheRolesName_orTheIdForARoleNoLongerInTheFile() {
        assertThat(roles.nameOf("forward-deployed-engineer")).isEqualTo("forward deployed engineer");
        assertThat(roles.nameOf("retired-role")).isEqualTo("retired-role");
        assertThat(roles.byId("retired-role")).isEmpty();
    }

    @Test
    void theFileInTheRepositoryHoldsTheTwoTargetRoles_withTheirCommonTitleVariants() {
        TargetRoles real = new TargetRoles(JsonMapper.builder().build());

        assertThat(real.loadError()).isNull();
        assertThat(real.roles()).extracting(Role::id)
                .containsExactly("software-developer", "forward-deployed-engineer");
        assertThat(real.roles()).extracting(Role::name)
                .containsExactly("software developer", "forward deployed engineer");
        assertThat(real.roles()).allSatisfy(role -> {
            assertThat(role.name().length()).isLessThanOrEqualTo(TargetRoles.NAME_MAX);
            assertThat(role.titles()).isNotEmpty();
        });
        assertThat(real.byId("software-developer").orElseThrow().search())
                .isEqualTo(new Search("software", null, "it-jobs"));
        assertThat(real.byId("forward-deployed-engineer").orElseThrow().search())
                .isEqualTo(new Search(null, "forward deployed", null));

        for (String title : List.of("Software Engineer", "Software Developer", "Backend Developer",
                "Back-End Engineer", "Senior Java Developer", "Full Stack Engineer", "Fullstack Developer",
                "Software Development Engineer II", "Application Developer", "Lead Programmer Analyst")) {
            assertThat(real.classify(title).map(Role::id)).as(title).contains("software-developer");
        }
        for (String title : List.of("Forward Deployed Engineer", "Forward Deployed Software Engineer",
                "Senior Forward-Deployed Engineer", "Forward Deployed AI Engineer", "Forward Deployed Developer")) {
            assertThat(real.classify(title).map(Role::id)).as(title).contains("forward-deployed-engineer");
        }
        for (String title : List.of("Business Analyst", "Sales Engineer", "Network Engineer", "Project Manager",
                "Software Engineering Manager", "Data Scientist", "Engineer", "Relationship Banker")) {
            assertThat(real.classify(title)).as(title).isEmpty();
        }
    }

    @Test
    void aFileThatCannotBeRead_leavesNoRolesInsteadOfFailing() throws Exception {
        ObjectMapper broken = mock(ObjectMapper.class);
        when(broken.readValue(any(InputStream.class), eq(TargetRoles.RolesFile.class)))
                .thenThrow(new IllegalStateException("boom"));

        TargetRoles loaded = new TargetRoles(broken);

        assertThat(loaded.roles()).isEmpty();
        assertThat(loaded.loadError()).contains("market/roles.json").contains("IllegalStateException");
        assertThat(loaded.classify("Software Engineer")).isEmpty();

        // A file that parses to nothing, or has no roles key, is empty but not an error.
        ObjectMapper empty = mock(ObjectMapper.class);
        assertThat(new TargetRoles(empty).roles()).isEmpty();
        assertThat(new TargetRoles(empty).loadError()).isNull();
        when(empty.readValue(any(InputStream.class), eq(TargetRoles.RolesFile.class)))
                .thenReturn(new TargetRoles.RolesFile("2026-11-21", null));
        assertThat(new TargetRoles(empty).roles()).isEmpty();
    }
}
