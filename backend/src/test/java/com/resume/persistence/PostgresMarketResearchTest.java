package com.resume.persistence;

import com.resume.market.AllowList;
import com.resume.market.Listing;
import com.resume.market.ListingsClient;
import com.resume.market.ListingsException;
import com.resume.market.MarketResearchService;
import com.resume.market.MarketResearchService.Outcome;
import com.resume.market.MarketResearchService.Status;
import com.resume.market.MarketSummaryStore;
import com.resume.model.ContentSuggestion;
import com.resume.model.MarketResearchRun;
import com.resume.model.MarketSkillCount;
import com.resume.model.Profile;
import com.resume.repository.ContentSuggestionRepository;
import com.resume.repository.ExperienceRepository;
import com.resume.repository.MarketResearchRunRepository;
import com.resume.repository.MarketSkillCountRepository;
import com.resume.repository.ProfileRepository;
import com.resume.repository.ProjectRepository;
import com.resume.security.JwtUtil;
import com.resume.service.SuggestionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.core.io.FileSystemResource;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;
import org.testcontainers.utility.MountableFile;

import javax.sql.DataSource;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The market-research tables and the whole weekly flow against a real PostgreSQL, set up
 * like {@link PostgresPersistenceTest}: the schema comes from {@code supabase/init.sql}
 * unchanged and Hibernate runs in {@code validate} mode. Only the listings API is
 * replaced (no request leaves the machine); the job is switched on with test credentials.
 *
 * <p>Needs Docker; skipped with a message without it, and CI fails if it is skipped.
 */
@Testcontainers(disabledWithoutDocker = true)
@SpringBootTest(properties = {
        "spring.jpa.hibernate.ddl-auto=validate",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect",
        "spring.datasource.driver-class-name=org.postgresql.Driver",
        "jwt.secret=test-secret-key-min-256-bits-long-aaaaaaaaaaaaaaaaaaa",
        "contact.notify-to=",
        "spring.mail.host=localhost",
        "spring.mail.port=25",
        "market-research.enabled=true",
        "market-research.adzuna.app-id=test-id",
        "market-research.adzuna.app-key=test-key",
        "market-research.adzuna.pause-millis=0",
        // Never fires during a test run: 1 January, 03:00.
        "market-research.cron=0 0 3 1 1 *",
        "market-research.min-listings=10",
        "market-research.min-mentions=3"
})
@AutoConfigureMockMvc
@ActiveProfiles("postgres-it")
class PostgresMarketResearchTest {

    private static final Path INIT_SQL = Path.of("..", "supabase", "init.sql").toAbsolutePath().normalize();
    private static final Path MIGRATION = Path.of("..", "supabase", "migrations",
            "2026-11-21_market_research.sql").toAbsolutePath().normalize();
    private static final LocalDate WEEK = LocalDate.of(2026, 11, 16);
    private static final LocalDateTime STARTED = LocalDateTime.of(2026, 11, 16, 6, 0);
    private static final List<String> TABLES = List.of("market_research_runs", "market_skill_counts");

    @Container
    static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer(
            DockerImageName.parse(System.getProperty("postgres.image", "postgres:15-alpine"))
                    .asCompatibleSubstituteFor("postgres"))
            .withDatabaseName("postgres")
            .withUsername("postgres")
            .withPassword("postgres")
            .withCopyFileToContainer(MountableFile.forHostPath(INIT_SQL), "/docker-entrypoint-initdb.d/init.sql");

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    /** The only thing replaced: where listings come from. */
    @MockitoBean ListingsClient client;

    @Autowired MarketResearchService service;
    @Autowired MarketSummaryStore store;
    @Autowired AllowList allowList;
    @Autowired MarketResearchRunRepository runs;
    @Autowired MarketSkillCountRepository counts;
    @Autowired ContentSuggestionRepository suggestions;
    @Autowired SuggestionService suggestionService;
    @Autowired ProfileRepository profiles;
    @Autowired ProjectRepository projects;
    @Autowired ExperienceRepository experiences;
    @Autowired JwtUtil jwt;
    @Autowired MockMvc mockMvc;
    @Autowired DataSource dataSource;

    JdbcTemplate jdbc;
    Long profileId;
    AllowList.Company firstCompany;

    @BeforeEach
    void cleanTablesAndSeed() {
        jdbc = new JdbcTemplate(dataSource);
        reset(client);
        counts.deleteAll();
        runs.deleteAll();
        suggestions.deleteAll();
        experiences.deleteAll();
        projects.deleteAll();
        profiles.deleteAll();

        Profile profile = new Profile();
        profile.setName("Ada");
        profile.setTagline("Engineer");
        profile.setTechStack(List.of("Java", "Kafka"));
        profile.setSocials(Map.of());
        profile.setSkills(List.of());
        profileId = profiles.save(profile).getId();

        firstCompany = allowList.companies().get(0);
        when(client.fetch(any())).thenReturn(new ListingsClient.Page(List.of(), 1));
    }

    /** Twenty developer listings at the first allow-listed company: Java in all, Kubernetes in 12, Docker in 8, Python in 2. */
    private void marketAsksForKubernetesAndDocker() {
        String employer = firstCompany.aliases().iterator().next();
        List<Listing> listings = new ArrayList<>();
        for (int i = 0; i < 20; i++) {
            String text = "Java" + (i < 12 ? ", Kubernetes" : "") + (i < 8 ? ", Docker" : "") + (i < 2 ? ", Python" : "");
            listings.add(new Listing("id-" + i, "Software Engineer", employer, text));
        }
        when(client.fetch(firstCompany)).thenReturn(new ListingsClient.Page(listings, 1));
    }

    // ── schema ───────────────────────────────────────────────────────────────

    @Test
    void initSqlCreatesBothTablesWithTheirConstraintsAndRowLevelSecurity() {
        assertThat(columns("market_research_runs")).containsExactly(
                "id bigint NO",
                "week_start date NO",
                "status character varying NO",
                "listings_examined integer NO",
                "companies_queried integer NO",
                "api_calls integer NO",
                "suggestions_created integer NO",
                "error character varying YES",
                "started_at timestamp without time zone NO",
                "finished_at timestamp without time zone NO");
        assertThat(columns("market_skill_counts")).containsExactly(
                "id bigint NO",
                "run_id bigint NO",
                "skill character varying NO",
                "listings_mentioned integer NO");
        for (String table : TABLES) {
            assertThat(jdbc.queryForObject("select relrowsecurity from pg_class where oid = ?::regclass",
                    Boolean.class, "public." + table)).as("row level security on %s", table).isTrue();
        }
    }

    private List<String> columns(String table) {
        return jdbc.queryForList(
                "select column_name || ' ' || data_type || ' ' || is_nullable from information_schema.columns "
                        + "where table_schema = 'public' and table_name = ? order by ordinal_position",
                String.class, table);
    }

    @Test
    void constraintsRefuseASecondRowForAWeek_unknownStatuses_andCountsWithoutARun() {
        String insertRun = "insert into market_research_runs (week_start, status) values (?, ?)";
        jdbc.update(insertRun, WEEK, "completed");
        assertThatThrownBy(() -> jdbc.update(insertRun, WEEK, "failed"))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbc.update(insertRun, WEEK.plusWeeks(1), "running"))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbc.update(
                "insert into market_research_runs (week_start, status, listings_examined) values (?, 'completed', -1)",
                WEEK.plusWeeks(2))).isInstanceOf(DataIntegrityViolationException.class);

        // The column defaults are for rows written outside the API.
        Map<String, Object> row = jdbc.queryForMap("select * from market_research_runs");
        assertThat(row.get("listings_examined")).isEqualTo(0);
        assertThat(row.get("suggestions_created")).isEqualTo(0);
        assertThat(row.get("error")).isNull();
        assertThat(row.get("started_at")).isNotNull();
        Long runId = ((Number) row.get("id")).longValue();

        String insertCount = "insert into market_skill_counts (run_id, skill, listings_mentioned) values (?, ?, ?)";
        jdbc.update(insertCount, runId, "Java", 3);
        assertThatThrownBy(() -> jdbc.update(insertCount, runId, "Java", 4))
                .as("one row per skill per run").isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbc.update(insertCount, runId, "Kafka", 0))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbc.update(insertCount, runId + 1000, "Kafka", 1))
                .as("a count needs its run").isInstanceOf(DataIntegrityViolationException.class);

        // Deleting a run takes its counts with it.
        jdbc.update("delete from market_research_runs where id = ?", runId);
        assertThat(counts.count()).isZero();
    }

    @Test
    void migrationFileBuildsTheSameTablesAsInitSql_andIsSafeToRunAgain() throws Exception {
        assertThat(Files.isRegularFile(MIGRATION)).as("%s exists", MIGRATION).isTrue();

        // In a scratch schema inside a transaction that is rolled back: nothing is left behind.
        try (Connection connection = dataSource.getConnection()) {
            connection.setAutoCommit(false);
            try {
                JdbcTemplate scratch = new JdbcTemplate(new SingleConnectionDataSource(connection, true));
                scratch.execute("create schema migration_check");
                scratch.execute("set local search_path to migration_check");
                ScriptUtils.executeSqlScript(connection, new FileSystemResource(MIGRATION));
                scratch.execute("set local search_path to public");

                assertThat(describe(scratch, "migration_check"))
                        .as("the migration's tables match supabase/init.sql")
                        .hasSizeGreaterThan(20)
                        .isEqualTo(describe(scratch, "public"));
            } finally {
                connection.rollback();
            }
        }

        // On a database that already has the tables (this one), it changes nothing.
        store.saveCompleted(WEEK, STARTED, 40, 2, 2, Map.of("Java", 30));
        List<String> before = describe(jdbc, "public");
        try (Connection connection = dataSource.getConnection()) {
            ScriptUtils.executeSqlScript(connection, new FileSystemResource(MIGRATION));
            ScriptUtils.executeSqlScript(connection, new FileSystemResource(MIGRATION));
        }
        assertThat(describe(jdbc, "public")).isEqualTo(before);
        assertThat(runs.count()).isEqualTo(1);
        assertThat(counts.count()).isEqualTo(1);
    }

    /** Columns, constraints, indexes and row level security of both tables in {@code schema}. */
    private static List<String> describe(JdbcTemplate db, String schema) {
        List<String> lines = new ArrayList<>();
        for (String table : TABLES) {
            lines.addAll(db.queryForList(
                    "select ? || ' column ' || column_name || ' ' || data_type || ' ' "
                            + "|| coalesce(character_maximum_length::text, '-') || ' ' || is_nullable || ' ' "
                            + "|| case when column_name = 'id' then 'serial' else coalesce(column_default, '-') end "
                            + "from information_schema.columns where table_schema = ? and table_name = ? "
                            + "order by ordinal_position", String.class, table, schema, table));
            lines.addAll(db.queryForList(
                    "select ? || ' constraint ' || contype::text || ' ' "
                            + "|| replace(pg_get_constraintdef(c.oid), ? || '.', '') from pg_constraint c "
                            + "join pg_class t on t.oid = c.conrelid join pg_namespace n on n.oid = t.relnamespace "
                            + "where n.nspname = ? and t.relname = ? order by 1", String.class, table, schema, schema, table));
            lines.addAll(db.queryForList(
                    "select ? || ' index ' || replace(indexdef, schemaname || '.', '') from pg_indexes "
                            + "where schemaname = ? and tablename = ? order by 1", String.class, table, schema, table));
            lines.addAll(db.queryForList(
                    "select ? || ' rls ' || t.relrowsecurity::text from pg_class t "
                            + "join pg_namespace n on n.oid = t.relnamespace where n.nspname = ? and t.relname = ?",
                    String.class, table, schema, table));
        }
        return lines;
    }

    // ── repositories and store ───────────────────────────────────────────────

    @Test
    void entitiesRoundTrip_andEveryRepositoryQueryWorks() {
        MarketSummaryStore.Summary older = store.saveCompleted(WEEK.minusWeeks(1), STARTED.minusWeeks(1), 30, 2, 3,
                Map.of("Java", 20, "Kafka", 20, "Docker", 5));
        store.saveFailed(WEEK, STARTED, 4, "Adzuna request for X failed: HTTP 503");

        MarketResearchRun loaded = runs.findByWeekStart(WEEK.minusWeeks(1)).orElseThrow();
        assertThat(loaded.getId()).isEqualTo(older.run().getId());
        assertThat(loaded.getStatus()).isEqualTo("completed");
        assertThat(loaded.getListingsExamined()).isEqualTo(30);
        assertThat(loaded.getCompaniesQueried()).isEqualTo(2);
        assertThat(loaded.getApiCalls()).isEqualTo(3);
        assertThat(loaded.getSuggestionsCreated()).isZero();
        assertThat(loaded.getError()).isNull();
        assertThat(loaded.getStartedAt()).isEqualTo(STARTED.minusWeeks(1));
        assertThat(loaded.getFinishedAt()).isNotNull();

        assertThat(runs.findByWeekStart(WEEK.plusWeeks(5))).isEmpty();
        assertThat(runs.findFirstByStatusOrderByWeekStartDesc("completed").orElseThrow().getWeekStart())
                .isEqualTo(WEEK.minusWeeks(1));
        assertThat(runs.findFirstByStatusOrderByWeekStartDesc("failed").orElseThrow().getError())
                .isEqualTo("Adzuna request for X failed: HTTP 503");
        assertThat(runs.findFirstByOrderByWeekStartDesc().orElseThrow().getWeekStart()).isEqualTo(WEEK);

        // Most mentioned first, ties by name.
        assertThat(counts.findByRunIdOrderByListingsMentionedDescSkillAsc(older.run().getId()))
                .extracting(MarketSkillCount::getSkill).containsExactly("Java", "Kafka", "Docker");
        assertThat(counts.deleteByRunId(older.run().getId())).isEqualTo(3);
        assertThat(counts.count()).isZero();
    }

    @Test
    void savingAWeekTwiceReplacesItsCountsInPlace_andAFailureNeverReplacesASummary() {
        Long id = store.saveCompleted(WEEK, STARTED, 40, 2, 2, Map.of("Java", 30, "Kafka", 12)).run().getId();
        MarketSummaryStore.Summary again = store.saveCompleted(WEEK, STARTED, 50, 3, 3, Map.of("Java", 35, "Docker", 9));

        assertThat(again.run().getId()).isEqualTo(id);
        assertThat(runs.count()).isEqualTo(1);
        assertThat(jdbc.queryForList("select skill || '=' || listings_mentioned from market_skill_counts order by 1",
                String.class)).containsExactly("Docker=9", "Java=35");

        assertThat(store.saveFailed(WEEK, STARTED, 1, "HTTP 500")).isFalse();
        assertThat(store.latest().orElseThrow().run().getListingsExamined()).isEqualTo(50);
        assertThat(jdbc.queryForObject("select status from market_research_runs", String.class)).isEqualTo("completed");
    }

    // ── the weekly flow ──────────────────────────────────────────────────────

    @Test
    void aRunStoresCountsOnly_andProposesWithoutChangingAnyContent() {
        marketAsksForKubernetesAndDocker();
        String before = contentSnapshot();

        Outcome outcome = service.run(WEEK, false);

        assertThat(outcome.status()).isEqualTo(Status.COMPLETED);
        assertThat(outcome.listingsExamined()).isEqualTo(20);
        assertThat(outcome.suggestionsCreated()).isEqualTo(2);
        verify(client, times(allowList.companies().size())).fetch(any());

        // One row for the week, and counts only: nothing of the listings themselves.
        Map<String, Object> run = jdbc.queryForMap("select * from market_research_runs");
        assertThat(run.get("week_start").toString()).isEqualTo("2026-11-16");
        assertThat(run.get("status")).isEqualTo("completed");
        assertThat(run.get("listings_examined")).isEqualTo(20);
        assertThat(run.get("companies_queried")).isEqualTo(allowList.companies().size());
        assertThat(run.get("suggestions_created")).isEqualTo(2);
        assertThat(jdbc.queryForList("select skill || '=' || listings_mentioned from market_skill_counts "
                + "order by listings_mentioned desc", String.class))
                .containsExactly("Java=20", "Kubernetes=12", "Docker=8", "Python=2");

        // Kubernetes (60%) and Docker (40%) are common and not on the profile. Java is on
        // it already; Python (2 listings) is below the thresholds.
        List<ContentSuggestion> pending = suggestions.findTop200ByStatusOrderByCreatedAtDescIdDesc("pending");
        assertThat(pending).hasSize(2).allSatisfy(s -> {
            assertThat(s.getSource()).isEqualTo("market-research");
            assertThat(s.getTargetType()).isEqualTo("profile");
            assertThat(s.getTargetId()).isEqualTo(profileId);
            assertThat(s.getField()).isEqualTo("techStack");
            assertThat(s.getCurrentValue()).isEqualTo("[\"Java\",\"Kafka\"]");
            assertThat(s.getReason()).contains("week of 2026-11-16").contains("of 20 software-developer listings")
                    .contains("not a statement about you").contains("Accept only if you have real experience with");
        });
        assertThat(pending).extracting(ContentSuggestion::getProposedValue).containsExactlyInAnyOrder(
                "[\"Java\",\"Kafka\",\"Kubernetes\"]", "[\"Java\",\"Kafka\",\"Docker\"]");

        // Nothing public changed: the profile is exactly as it was.
        assertThat(contentSnapshot()).isEqualTo(before);
        assertThat(profiles.findById(profileId).orElseThrow().getTechStack()).containsExactly("Java", "Kafka");
    }

    @Test
    void runningTheSameWeekAgainFetchesNothingAndRepeatsNothing_evenAfterARejection() {
        marketAsksForKubernetesAndDocker();
        service.run(WEEK, false);
        clearInvocations(client);

        Outcome second = service.run(WEEK, false);

        assertThat(second.status()).isEqualTo(Status.ALREADY_DONE);
        assertThat(second.suggestionsCreated()).isZero();
        verify(client, never()).fetch(any());
        assertThat(runs.count()).isEqualTo(1);
        assertThat(counts.count()).isEqualTo(4);
        assertThat(suggestions.count()).isEqualTo(2);

        // The owner says no to Docker: it is never proposed again, this week or a later one.
        Long docker = suggestions.findAll().stream()
                .filter(s -> s.getProposedValue().contains("Docker")).findFirst().orElseThrow().getId();
        suggestionService.reject(docker);
        service.run(WEEK, false);
        service.run(WEEK, true);
        service.run(WEEK.plusWeeks(1), false);

        assertThat(suggestions.count()).isEqualTo(2);
        assertThat(suggestions.findById(docker).orElseThrow().getStatus()).isEqualTo("rejected");
        assertThat(runs.count()).isEqualTo(2);
    }

    @Test
    void afterTheOwnerAcceptsOne_theOthersAreProposedAgainAgainstTheNewValue() {
        marketAsksForKubernetesAndDocker();
        service.run(WEEK, false);
        Long kubernetes = suggestions.findAll().stream()
                .filter(s -> s.getProposedValue().contains("Kubernetes")).findFirst().orElseThrow().getId();

        // Only the owner's accept changes the profile.
        suggestionService.accept(kubernetes);
        assertThat(profiles.findById(profileId).orElseThrow().getTechStack())
                .containsExactly("Java", "Kafka", "Kubernetes");
        // The Docker suggestion was made against the old list, so the queue superseded it.
        assertThat(suggestions.findTop200ByStatusOrderByCreatedAtDescIdDesc("superseded")).hasSize(1);

        clearInvocations(client);
        Outcome again = service.run(WEEK, false);

        verify(client, never()).fetch(any());
        assertThat(again.suggestionsCreated()).isEqualTo(1);
        List<ContentSuggestion> pending = suggestions.findTop200ByStatusOrderByCreatedAtDescIdDesc("pending");
        assertThat(pending).hasSize(1);
        assertThat(pending.get(0).getCurrentValue()).isEqualTo("[\"Java\",\"Kafka\",\"Kubernetes\"]");
        assertThat(pending.get(0).getProposedValue()).isEqualTo("[\"Java\",\"Kafka\",\"Kubernetes\",\"Docker\"]");
        assertThat(jdbc.queryForObject("select suggestions_created from market_research_runs", Integer.class))
                .isEqualTo(3);
    }

    @Test
    void aSampleBelowTheThresholdIsStoredButProducesNoSuggestions() {
        String employer = firstCompany.aliases().iterator().next();
        List<Listing> few = new ArrayList<>();
        for (int i = 0; i < 9; i++) few.add(new Listing("id-" + i, "Java Developer", employer, "Kubernetes"));
        when(client.fetch(firstCompany)).thenReturn(new ListingsClient.Page(few, 1));

        Outcome outcome = service.run(WEEK, false);

        assertThat(outcome.status()).isEqualTo(Status.COMPLETED);
        assertThat(outcome.listingsExamined()).isEqualTo(9);
        assertThat(outcome.suggestionsCreated()).isZero();
        assertThat(suggestions.count()).isZero();
        assertThat(counts.count()).isEqualTo(2);
    }

    @Test
    void aFailedRunLeavesThePreviousSummaryInPlace_andCreatesNothing() {
        marketAsksForKubernetesAndDocker();
        service.run(WEEK, false);
        long suggestionsBefore = suggestions.count();
        when(client.fetch(any())).thenThrow(new ListingsException("Adzuna request for X was rate limited (HTTP 429)", 3));

        Outcome nextWeek = service.run(WEEK.plusWeeks(1), false);
        Outcome forced = service.run(WEEK, true);

        assertThat(nextWeek.status()).isEqualTo(Status.FAILED);
        assertThat(forced.status()).isEqualTo(Status.FAILED);
        MarketResearchRun failed = runs.findByWeekStart(WEEK.plusWeeks(1)).orElseThrow();
        assertThat(failed.getStatus()).isEqualTo("failed");
        assertThat(failed.getError()).isEqualTo("Adzuna request for X was rate limited (HTTP 429)");
        assertThat(failed.getApiCalls()).isEqualTo(3);

        MarketSummaryStore.Summary latest = store.latest().orElseThrow();
        assertThat(latest.run().getWeekStart()).isEqualTo(WEEK);
        assertThat(latest.run().getStatus()).isEqualTo("completed");
        assertThat(latest.run().getListingsExamined()).isEqualTo(20);
        assertThat(latest.skills()).hasSize(4);
        assertThat(suggestions.count()).isEqualTo(suggestionsBefore);
    }

    /** Every content row as text (profile.updated_at aside). */
    private String contentSnapshot() {
        return jdbc.queryForObject(
                "select (select coalesce(string_agg(to_jsonb(p)::text, '|' order by id), '') from "
                        + "(select id, name, tagline, bio, email, location, avatar_url, cv_url, tech_stack, socials, skills "
                        + "from profile) p) || '#' || "
                        + "(select coalesce(string_agg(to_jsonb(e)::text, '|' order by id), '') from experience e) || '#' || "
                        + "(select coalesce(string_agg(to_jsonb(j)::text, '|' order by id), '') from projects j)",
                String.class);
    }

    // ── over HTTP, through the real security filter chain ─────────────────────

    @Test
    void theEndpointsAreAdminOnly_andLatestServesTheStoredSummary() throws Exception {
        marketAsksForKubernetesAndDocker();
        service.run(WEEK, false);

        for (String header : new String[] {null, "Bearer not-a-jwt"}) {
            var latest = get("/api/admin/market-research/latest");
            var run = post("/api/admin/market-research/run");
            if (header != null) {
                latest.header("Authorization", header);
                run.header("Authorization", header);
            }
            mockMvc.perform(latest).andExpect(status().isForbidden());
            mockMvc.perform(run).andExpect(status().isForbidden());
        }

        mockMvc.perform(get("/api/admin/market-research/latest")
                        .header("Authorization", "Bearer " + jwt.generate("admin")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(true))
                .andExpect(jsonPath("$.allowListCompanies").value(allowList.companies().size()))
                .andExpect(jsonPath("$.thresholds.minListings").value(10))
                .andExpect(jsonPath("$.summary.weekStart").value("2026-11-16"))
                .andExpect(jsonPath("$.summary.listingsExamined").value(20))
                .andExpect(jsonPath("$.summary.suggestionsCreated").value(2))
                .andExpect(jsonPath("$.summary.skills[0].skill").value("Java"))
                .andExpect(jsonPath("$.summary.skills[1].skill").value("Kubernetes"))
                .andExpect(jsonPath("$.summary.skills[1].listingsMentioned").value(12))
                .andExpect(jsonPath("$.lastRun.status").value("completed"));
    }
}
