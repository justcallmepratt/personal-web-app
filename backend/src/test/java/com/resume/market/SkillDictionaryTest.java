package com.resume.market;

import com.resume.market.SkillDictionary.Entry;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class SkillDictionaryTest {

    private static Entry entry(String name, String... aliases) {
        return new Entry(name, List.of(aliases), null);
    }

    private final SkillDictionary dictionary = SkillDictionary.of(List.of(
            entry("Java"),
            entry("JavaScript"),
            entry("Spring Boot", "SpringBoot"),
            entry("Kubernetes", "K8s"),
            entry("C++"),
            entry("C#"),
            entry(".NET", "ASP.NET"),
            entry("Node.js"),
            entry("CI/CD"),
            entry("SQL"),
            new Entry("Spring Framework", List.of("Spring"), true)));

    // ── extraction ───────────────────────────────────────────────────────────

    @Test
    void aTermMatchesOnlyAsAWholeWord() {
        assertThat(dictionary.extract("We use JavaScript and TypeScript.")).containsExactly("JavaScript");
        assertThat(dictionary.extract("Java, JavaScript")).containsExactly("Java", "JavaScript");
        assertThat(dictionary.extract("Javanese speakers; NoSQL; MySQLite")).isEmpty();
        assertThat(dictionary.extract("(Java)/SQL.")).containsExactly("Java", "SQL");
    }

    @Test
    void matchingIgnoresCase_andAnyWhitespaceInsideAPhrase() {
        assertThat(dictionary.extract("JAVA with spring   boot")).containsExactly("Java", "Spring Boot");
        assertThat(dictionary.extract("Spring\nBoot services")).contains("Spring Boot");
    }

    @Test
    void namesWithSymbolsMatchExactly() {
        assertThat(dictionary.extract("C++, C# and .NET; Node.js; CI/CD pipelines"))
                .containsExactly("C++", "C#", ".NET", "Node.js", "CI/CD");
        // "C" alone, or with other symbols, is none of them.
        assertThat(dictionary.extract("Objective-C and C")).isEmpty();
        assertThat(dictionary.extract("ASP.NET MVC")).containsExactly(".NET");
    }

    @Test
    void anAliasCountsAsItsSkill_andASkillIsReportedOncePerText() {
        assertThat(dictionary.extract("K8s, Kubernetes and more k8s; SpringBoot"))
                .containsExactly("Spring Boot", "Kubernetes");
    }

    @Test
    void aCaseSensitiveEntryDoesNotMatchTheOrdinaryWord() {
        assertThat(dictionary.extract("spring internship, starting in the spring")).isEmpty();
        assertThat(dictionary.extract("Spring and Hibernate")).containsExactly("Spring Framework");
        assertThat(dictionary.extract("SPRING FRAMEWORK")).isEmpty();
    }

    @Test
    void emptyTextMentionsNothing() {
        assertThat(dictionary.extract(null)).isEmpty();
        assertThat(dictionary.extract("  ")).isEmpty();
        assertThat(dictionary.extract("Excellent communication skills")).isEmpty();
    }

    // ── the owner's own spelling ─────────────────────────────────────────────

    @Test
    void canonical_findsTheDictionaryNameForANameOrAlias_ignoringCase() {
        assertThat(dictionary.canonical("springboot")).contains("Spring Boot");
        assertThat(dictionary.canonical("  KUBERNETES ")).contains("Kubernetes");
        assertThat(dictionary.canonical("k8s")).contains("Kubernetes");
        // Even for a case-sensitive entry: this decides "the owner already lists it".
        assertThat(dictionary.canonical("spring")).contains("Spring Framework");
        assertThat(dictionary.canonical("Rust")).isEmpty();
        assertThat(dictionary.canonical(" ")).isEmpty();
        assertThat(dictionary.canonical(null)).isEmpty();
    }

    @Test
    void normalize_lowersTrimsAndCollapsesSpaces() {
        assertThat(SkillDictionary.normalize("  Spring \t Boot ")).isEqualTo("spring boot");
        assertThat(SkillDictionary.normalize(null)).isEmpty();
    }

    // ── loading ──────────────────────────────────────────────────────────────

    @Test
    void entriesThatCannotBeUsedAreIgnored() {
        List<Entry> raw = new ArrayList<>();
        raw.add(null);
        raw.add(new Entry(null, null, null));
        raw.add(new Entry("  ", null, null));
        raw.add(new Entry("x".repeat(SkillDictionary.NAME_MAX + 1), null, null));
        raw.add(new Entry("Kafka", null, null));
        raw.add(new Entry("kafka", List.of("Apache Kafka"), null));
        List<String> aliases = new ArrayList<>();
        aliases.add(null);
        aliases.add(" ");
        aliases.add("Postgres");
        aliases.add("postgres");
        raw.add(new Entry(" PostgreSQL ", aliases, false));

        SkillDictionary loaded = SkillDictionary.of(raw);

        assertThat(loaded.names()).containsExactly("Kafka", "PostgreSQL");
        assertThat(loaded.size()).isEqualTo(2);
        assertThat(loaded.loadError()).isNull();
        // The duplicate's alias was dropped with it.
        assertThat(loaded.extract("Apache Kafka on Postgres")).containsExactly("Kafka", "PostgreSQL");
    }

    @Test
    void theFileInTheRepositoryLoads_andEveryNameFitsTheColumn() {
        SkillDictionary real = new SkillDictionary(JsonMapper.builder().build());

        assertThat(real.loadError()).isNull();
        assertThat(real.size()).isGreaterThan(40);
        assertThat(real.names()).contains("Java", "Spring Boot", "Kafka", "SQL Server", "Oracle", "Splunk",
                "Dynatrace", "Kubernetes");
        assertThat(real.names()).allSatisfy(name -> assertThat(name.length()).isBetween(1, SkillDictionary.NAME_MAX));
        assertThat(real.names()).doesNotHaveDuplicates();
        // Ambiguous words stay out of the file.
        assertThat(real.names()).doesNotContain("Go", "R", "C");

        assertThat(real.extract("Java developer: Spring Boot, Apache Kafka, MS SQL, PL/SQL, K8s, REST APIs"))
                .contains("Java", "Spring Boot", "Kafka", "SQL Server", "Oracle", "Kubernetes", "REST");
        assertThat(real.extract("Get some rest; we react quickly to oracle-like predictions in spring"))
                .isEmpty();
    }

    @Test
    void aFileThatCannotBeRead_leavesAnEmptyDictionaryInsteadOfFailing() throws Exception {
        ObjectMapper broken = mock(ObjectMapper.class);
        when(broken.readValue(any(InputStream.class), eq(SkillDictionary.SkillsFile.class)))
                .thenThrow(new IllegalStateException("boom"));

        SkillDictionary dictionary = new SkillDictionary(broken);

        assertThat(dictionary.size()).isZero();
        assertThat(dictionary.loadError()).contains("market/skills.json").contains("IllegalStateException");

        // A file that parses to nothing, or has no skills key, is empty but not an error.
        ObjectMapper empty = mock(ObjectMapper.class);
        assertThat(new SkillDictionary(empty).size()).isZero();
        assertThat(new SkillDictionary(empty).loadError()).isNull();
        when(empty.readValue(any(InputStream.class), eq(SkillDictionary.SkillsFile.class)))
                .thenReturn(new SkillDictionary.SkillsFile("2026-11-21", null));
        assertThat(new SkillDictionary(empty).size()).isZero();
    }
}
