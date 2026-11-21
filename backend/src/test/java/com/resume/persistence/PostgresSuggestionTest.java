package com.resume.persistence;

import com.resume.dto.SuggestionRequest;
import com.resume.dto.SuggestionResponse;
import com.resume.model.ContentSuggestion;
import com.resume.model.Experience;
import com.resume.model.Profile;
import com.resume.model.Project;
import com.resume.repository.ContentSuggestionRepository;
import com.resume.repository.ExperienceRepository;
import com.resume.repository.ProfileRepository;
import com.resume.repository.ProjectRepository;
import com.resume.security.JwtUtil;
import com.resume.service.SuggestionException;
import com.resume.service.SuggestionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.core.io.FileSystemResource;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
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
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The suggest-and-approve flow against a real PostgreSQL, set up the same way as
 * {@link PostgresPersistenceTest}: the schema comes from {@code supabase/init.sql}
 * unchanged and Hibernate runs in {@code validate} mode. Accepting a suggestion writes to
 * the JSONB-backed content tables, which only exist here (the {@code test} profile's H2
 * cannot create them).
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
        "spring.mail.port=25"
})
@AutoConfigureMockMvc
@ActiveProfiles("postgres-it")
class PostgresSuggestionTest {

    private static final Path INIT_SQL = Path.of("..", "supabase", "init.sql").toAbsolutePath().normalize();
    private static final Path MIGRATION = Path.of("..", "supabase", "migrations",
            "2026-11-21_content_suggestions.sql").toAbsolutePath().normalize();

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

    @Autowired ContentSuggestionRepository suggestions;
    @Autowired ProfileRepository profiles;
    @Autowired ProjectRepository projects;
    @Autowired ExperienceRepository experiences;
    @Autowired SuggestionService service;
    @Autowired JwtUtil jwt;
    @Autowired MockMvc mockMvc;
    @Autowired DataSource dataSource;

    JdbcTemplate jdbc;
    Long profileId;
    Long experienceId;
    Long projectId;

    @BeforeEach
    void cleanTablesAndSeed() {
        jdbc = new JdbcTemplate(dataSource);
        suggestions.deleteAll();
        experiences.deleteAll();
        projects.deleteAll();
        profiles.deleteAll();

        Profile profile = new Profile();
        profile.setName("Ada");
        profile.setTagline("Engineer");
        profile.setTechStack(List.of("Java"));
        profile.setSocials(Map.of("github", "https://github.com/example"));
        profile.setSkills(List.of());
        profileId = profiles.save(profile).getId();

        Experience experience = new Experience();
        experience.setCompany("Acme");
        experience.setRole("Engineer");
        experience.setStartDate(LocalDate.of(2022, 1, 1));
        experience.setDescription("Platform team.");
        experience.setHighlights(List.of("Shipped X"));
        experience.setTechnologies(List.of("Java"));
        experience.setSortOrder(1);
        experienceId = experiences.save(experience).getId();

        Project project = new Project();
        project.setTitle("Site");
        project.setTags(List.of("web"));
        project.setStack(List.of("Next.js"));
        projectId = projects.save(project).getId();
    }

    // ── schema ───────────────────────────────────────────────────────────────

    @Test
    void initSqlCreatesTheTableWithItsConstraintsIndexesAndRowLevelSecurity() {
        List<String> columns = jdbc.queryForList(
                "select column_name || ' ' || data_type || ' ' || is_nullable from information_schema.columns "
                        + "where table_schema = 'public' and table_name = 'content_suggestions' order by ordinal_position",
                String.class);
        assertThat(columns).containsExactly(
                "id bigint NO",
                "target_type character varying NO",
                "target_id bigint NO",
                "field character varying NO",
                "current_value text YES",
                "proposed_value text NO",
                "reason character varying NO",
                "source character varying NO",
                "status character varying NO",
                "created_at timestamp without time zone NO",
                "decided_at timestamp without time zone YES");

        List<String> indexes = jdbc.queryForList(
                "select indexname from pg_indexes where schemaname = 'public' and tablename = 'content_suggestions'",
                String.class);
        assertThat(indexes).contains("idx_content_suggestions_status_created", "idx_content_suggestions_target");

        assertThat(jdbc.queryForObject(
                "select relrowsecurity from pg_class where oid = 'public.content_suggestions'::regclass",
                Boolean.class)).isTrue();
    }

    @Test
    void checkConstraintsRefuseUnknownStatusesAndTargets() {
        String insert = "insert into content_suggestions (target_type, target_id, field, proposed_value, reason, status) "
                + "values (?, 1, 'name', '\"x\"', 'r', ?)";
        assertThatThrownBy(() -> jdbc.update(insert, "profile", "approved"))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbc.update(insert, "messages", "pending"))
                .isInstanceOf(DataIntegrityViolationException.class);

        // The column defaults are for rows written outside the API.
        jdbc.update("insert into content_suggestions (target_type, target_id, field, proposed_value, reason) "
                + "values ('profile', 1, 'name', '\"x\"', 'r')");
        Map<String, Object> row = jdbc.queryForMap("select status, source, created_at, decided_at from content_suggestions");
        assertThat(row.get("status")).isEqualTo("pending");
        assertThat(row.get("source")).isEqualTo("manual");
        assertThat(row.get("created_at")).isNotNull();
        assertThat(row.get("decided_at")).isNull();
    }

    @Test
    void migrationFileBuildsTheSameTableAsInitSql_andIsSafeToRunAgain() throws Exception {
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
                        .as("the migration's table matches supabase/init.sql")
                        .isNotEmpty()
                        .isEqualTo(describe(scratch, "public"));
            } finally {
                connection.rollback();
            }
        }

        // On a database that already has the table (this one), it changes nothing.
        service.create(new SuggestionRequest("profile", null, "tagline", "Backend engineer", "Clearer", null));
        List<String> before = describe(jdbc, "public");
        try (Connection connection = dataSource.getConnection()) {
            ScriptUtils.executeSqlScript(connection, new FileSystemResource(MIGRATION));
            ScriptUtils.executeSqlScript(connection, new FileSystemResource(MIGRATION));
        }
        assertThat(describe(jdbc, "public")).isEqualTo(before);
        assertThat(suggestions.count()).isEqualTo(1);
    }

    /** Columns, check constraints, indexes and row level security of {@code schema.content_suggestions}. */
    private static List<String> describe(JdbcTemplate db, String schema) {
        List<String> lines = new ArrayList<>(db.queryForList(
                "select 'column ' || column_name || ' ' || data_type || ' ' || coalesce(character_maximum_length::text, '-') "
                        + "|| ' ' || is_nullable || ' ' || case when column_name = 'id' then 'serial' "
                        + "else coalesce(column_default, '-') end "
                        + "from information_schema.columns where table_schema = ? and table_name = 'content_suggestions' "
                        + "order by ordinal_position", String.class, schema));
        lines.addAll(db.queryForList(
                "select 'constraint ' || contype || ' ' || pg_get_constraintdef(c.oid) from pg_constraint c "
                        + "join pg_class t on t.oid = c.conrelid join pg_namespace n on n.oid = t.relnamespace "
                        + "where n.nspname = ? and t.relname = 'content_suggestions' order by 1", String.class, schema));
        lines.addAll(db.queryForList(
                "select 'index ' || replace(indexdef, schemaname || '.', '') from pg_indexes "
                        + "where schemaname = ? and tablename = 'content_suggestions' order by 1", String.class, schema));
        lines.addAll(db.queryForList(
                "select 'rls ' || t.relrowsecurity from pg_class t join pg_namespace n on n.oid = t.relnamespace "
                        + "where n.nspname = ? and t.relname = 'content_suggestions'", String.class, schema));
        return lines;
    }

    // ── repository ───────────────────────────────────────────────────────────

    @Test
    void suggestionRoundTripsAndQueriesFilterAndOrderNewestFirst() {
        LocalDateTime base = LocalDateTime.of(2026, 11, 21, 12, 0);
        Long oldest = suggestions.save(row("role", "pending", base)).getId();
        Long decided = suggestions.save(row("role", "rejected", base.plusHours(1))).getId();
        Long newest = suggestions.save(row("highlights", "pending", base.plusHours(2))).getId();
        Long sameInstant = suggestions.save(row("role", "pending", base.plusHours(2))).getId();

        ContentSuggestion loaded = suggestions.findById(oldest).orElseThrow();
        assertThat(loaded.getTargetType()).isEqualTo("experience");
        assertThat(loaded.getTargetId()).isEqualTo(experienceId);
        assertThat(loaded.getField()).isEqualTo("role");
        assertThat(loaded.getCurrentValue()).isEqualTo("\"Engineer\"");
        assertThat(loaded.getProposedValue()).isEqualTo("\"Senior Engineer\"");
        assertThat(loaded.getReason()).isEqualTo("Because");
        assertThat(loaded.getSource()).isEqualTo("manual");
        assertThat(loaded.getStatus()).isEqualTo("pending");
        assertThat(loaded.getCreatedAt()).isEqualTo(base);
        assertThat(loaded.getDecidedAt()).isNull();

        assertThat(suggestions.findTop200ByOrderByCreatedAtDescIdDesc()).extracting(ContentSuggestion::getId)
                .containsExactly(sameInstant, newest, decided, oldest);
        assertThat(suggestions.findTop200ByStatusOrderByCreatedAtDescIdDesc("pending"))
                .extracting(ContentSuggestion::getId).containsExactly(sameInstant, newest, oldest);
        assertThat(suggestions.findTop200ByStatusOrderByCreatedAtDescIdDesc("accepted")).isEmpty();
        assertThat(suggestions.findByTargetTypeAndTargetIdAndFieldAndStatus(
                "experience", experienceId, "role", "pending"))
                .extracting(ContentSuggestion::getId).containsExactlyInAnyOrder(oldest, sameInstant);

        // created_at is filled in when the caller leaves it out.
        ContentSuggestion noDate = row("role", "pending", null);
        assertThat(suggestions.save(noDate).getCreatedAt()).isNotNull();
    }

    private ContentSuggestion row(String field, String status, LocalDateTime createdAt) {
        ContentSuggestion s = new ContentSuggestion();
        s.setTargetType("experience");
        s.setTargetId(experienceId);
        s.setField(field);
        s.setCurrentValue("\"Engineer\"");
        s.setProposedValue("\"Senior Engineer\"");
        s.setReason("Because");
        s.setSource("manual");
        s.setStatus(status);
        s.setCreatedAt(createdAt);
        return s;
    }

    // ── accept, conflict, reject ─────────────────────────────────────────────

    @Test
    void creatingASuggestionChangesNoContent() {
        String before = contentSnapshot();

        SuggestionResponse created = service.create(new SuggestionRequest(
                "experience", experienceId, "highlights", List.of("Shipped X", "Led Y"), "New work", "manual"));

        assertThat(created.status()).isEqualTo("pending");
        assertThat(created.currentValue()).isEqualTo(List.of("Shipped X"));
        assertThat(created.proposedValue()).isEqualTo(List.of("Shipped X", "Led Y"));
        assertThat(created.targetLabel()).isEqualTo("Engineer at Acme");
        assertThat(contentSnapshot()).isEqualTo(before);
    }

    @Test
    void acceptAppliesExactlyThatFieldAndMarksTheSuggestionAccepted() {
        Long textId = service.create(new SuggestionRequest(
                "experience", experienceId, "role", "Senior Engineer", "Promoted", null)).id();
        Long listId = service.create(new SuggestionRequest(
                "experience", experienceId, "highlights", List.of("Shipped X", "Led Y"), "New work", null)).id();
        Long profileSuggestion = service.create(new SuggestionRequest(
                "profile", null, "bio", "Backend engineer.", "There was none", null)).id();
        Long projectSuggestion = service.create(new SuggestionRequest(
                "project", projectId, "tags", List.of("web", "java"), "It is a Java API too", null)).id();

        SuggestionResponse accepted = service.accept(textId);
        service.accept(listId);
        service.accept(profileSuggestion);
        service.accept(projectSuggestion);

        assertThat(accepted.status()).isEqualTo("accepted");
        assertThat(accepted.decidedAt()).isNotNull();
        assertThat(suggestions.findById(textId).orElseThrow().getStatus()).isEqualTo("accepted");

        Experience experience = experiences.findById(experienceId).orElseThrow();
        assertThat(experience.getRole()).isEqualTo("Senior Engineer");
        assertThat(experience.getHighlights()).containsExactly("Shipped X", "Led Y");
        // Everything else on the row is as it was.
        assertThat(experience.getCompany()).isEqualTo("Acme");
        assertThat(experience.getDescription()).isEqualTo("Platform team.");
        assertThat(experience.getTechnologies()).containsExactly("Java");
        assertThat(experience.getStartDate()).isEqualTo(LocalDate.of(2022, 1, 1));
        assertThat(experience.getSortOrder()).isEqualTo(1);
        // Still real JSONB arrays.
        assertThat(jdbc.queryForObject("select jsonb_typeof(highlights) from experience where id = ?",
                String.class, experienceId)).isEqualTo("array");

        Profile profile = profiles.findById(profileId).orElseThrow();
        assertThat(profile.getBio()).isEqualTo("Backend engineer.");
        assertThat(profile.getTagline()).isEqualTo("Engineer");
        assertThat(profile.getSocials()).containsEntry("github", "https://github.com/example");

        Project project = projects.findById(projectId).orElseThrow();
        assertThat(project.getTags()).containsExactly("web", "java");
        assertThat(project.getStack()).containsExactly("Next.js");
        assertThat(project.getTitle()).isEqualTo("Site");
    }

    @Test
    void acceptSupersedesTheOtherPendingSuggestionsForThatField() {
        Long chosen = service.create(new SuggestionRequest(
                "experience", experienceId, "role", "Senior Engineer", "Promoted", null)).id();
        Long rival = service.create(new SuggestionRequest(
                "experience", experienceId, "role", "Staff Engineer", "Market title", "market-research")).id();
        Long otherField = service.create(new SuggestionRequest(
                "experience", experienceId, "company", "Acme Ltd", "Legal name", null)).id();

        service.accept(chosen);

        assertThat(suggestions.findById(rival).orElseThrow().getStatus()).isEqualTo("superseded");
        assertThat(suggestions.findById(rival).orElseThrow().getDecidedAt()).isNotNull();
        assertThat(suggestions.findById(otherField).orElseThrow().getStatus()).isEqualTo("pending");
        assertThat(experiences.findById(experienceId).orElseThrow().getCompany()).isEqualTo("Acme");
    }

    @Test
    void acceptRefusesWithAConflictWhenTheTargetChanged_andLeavesEverythingUnchanged() {
        Long id = service.create(new SuggestionRequest(
                "experience", experienceId, "role", "Senior Engineer", "Promoted", null)).id();
        // The row is edited directly after the suggestion was made.
        jdbc.update("update experience set role = 'Lead Engineer' where id = ?", experienceId);
        String before = contentSnapshot();

        SuggestionException e = catchThrowableOfType(SuggestionException.class, () -> service.accept(id));

        assertThat(e).isNotNull();
        assertThat(e.getCode()).isEqualTo("conflict");
        assertThat(e.getLiveValue()).isEqualTo("Lead Engineer");
        assertThat(contentSnapshot()).isEqualTo(before);
        ContentSuggestion still = suggestions.findById(id).orElseThrow();
        assertThat(still.getStatus()).isEqualTo("pending");
        assertThat(still.getDecidedAt()).isNull();
    }

    @Test
    void acceptRefusesWhenTheTargetRowWasDeleted_andASecondDecisionOnTheSameSuggestion() {
        Long orphan = service.create(new SuggestionRequest(
                "project", projectId, "title", "Portfolio", "Clearer", null)).id();
        projects.deleteById(projectId);
        SuggestionException missing = catchThrowableOfType(SuggestionException.class, () -> service.accept(orphan));
        assertThat(missing.getCode()).isEqualTo("target_missing");
        assertThat(suggestions.findById(orphan).orElseThrow().getStatus()).isEqualTo("pending");
        assertThat(service.get(orphan).targetLabel()).isNull();

        Long id = service.create(new SuggestionRequest(
                "experience", experienceId, "role", "Senior Engineer", "Promoted", null)).id();
        service.accept(id);
        assertThat(catchThrowableOfType(SuggestionException.class, () -> service.accept(id)).getCode())
                .isEqualTo("not_pending");
        assertThat(catchThrowableOfType(SuggestionException.class, () -> service.reject(id)).getCode())
                .isEqualTo("not_pending");
        assertThat(experiences.findById(experienceId).orElseThrow().getRole()).isEqualTo("Senior Engineer");
    }

    @Test
    void rejectChangesNothingButTheSuggestion() {
        Long id = service.create(new SuggestionRequest(
                "profile", profileId, "techStack", List.of("Java", "Kafka"), "Seen in listings", "market-research")).id();
        String before = contentSnapshot();

        SuggestionResponse rejected = service.reject(id);

        assertThat(rejected.status()).isEqualTo("rejected");
        assertThat(rejected.decidedAt()).isNotNull();
        assertThat(contentSnapshot()).isEqualTo(before);
        assertThat(service.list("pending")).isEmpty();
        assertThat(service.list("rejected")).extracting(SuggestionResponse::id).containsExactly(id);
        assertThat(service.list(null)).hasSize(1);
    }

    /** Every content row as text (profile.updated_at aside, which any write to the profile moves). */
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
    void everyEndpointRefusesARequestWithoutAValidToken_andNothingIsWritten() throws Exception {
        Long id = service.create(new SuggestionRequest(
                "experience", experienceId, "role", "Senior Engineer", "Promoted", null)).id();
        String before = contentSnapshot();
        String body = "{\"targetType\":\"profile\",\"field\":\"tagline\",\"proposedValue\":\"x\",\"reason\":\"y\"}";

        for (String header : new String[] {null, "Bearer not-a-jwt"}) {
            List<MockHttpServletRequestBuilder> requests = List.of(
                    get("/api/admin/suggestions"),
                    get("/api/admin/suggestions/targets"),
                    get("/api/admin/suggestions/" + id),
                    post("/api/admin/suggestions").contentType(MediaType.APPLICATION_JSON).content(body),
                    post("/api/admin/suggestions/" + id + "/accept"),
                    post("/api/admin/suggestions/" + id + "/reject"));
            for (MockHttpServletRequestBuilder request : requests) {
                if (header != null) request.header("Authorization", header);
                mockMvc.perform(request).andExpect(status().isForbidden());
            }
        }

        assertThat(contentSnapshot()).isEqualTo(before);
        assertThat(suggestions.count()).isEqualTo(1);
        assertThat(suggestions.findById(id).orElseThrow().getStatus()).isEqualTo("pending");
    }

    @Test
    void withTheAdminToken_aSuggestionIsCreatedAcceptedAndShowsOnThePublicEndpoint() throws Exception {
        String bearer = "Bearer " + jwt.generate("admin");

        mockMvc.perform(get("/api/admin/suggestions/targets").header("Authorization", bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].targetType").value("profile"))
                .andExpect(jsonPath("$[1].label").value("Engineer at Acme"))
                .andExpect(jsonPath("$[1].fields[4].name").value("highlights"))
                .andExpect(jsonPath("$[1].fields[4].value[0]").value("Shipped X"));

        mockMvc.perform(post("/api/admin/suggestions").header("Authorization", bearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"targetType\":\"experience\",\"targetId\":" + experienceId
                                + ",\"field\":\"highlights\",\"proposedValue\":[\"Shipped X\",\"Led Y\"],"
                                + "\"reason\":\"New work\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("pending"))
                .andExpect(jsonPath("$.source").value("manual"))
                .andExpect(jsonPath("$.currentValue[0]").value("Shipped X"))
                .andExpect(jsonPath("$.proposedValue[1]").value("Led Y"));
        Long id = suggestions.findAll().get(0).getId();

        // Pending: the public endpoint still serves the old value.
        mockMvc.perform(get("/api/experience"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].highlights.length()").value(1));

        mockMvc.perform(get("/api/admin/suggestions").param("status", "pending").header("Authorization", bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(id.intValue()));

        mockMvc.perform(post("/api/admin/suggestions/" + id + "/accept").header("Authorization", bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("accepted"));

        mockMvc.perform(get("/api/experience"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].highlights.length()").value(2))
                .andExpect(jsonPath("$[0].highlights[1]").value("Led Y"))
                .andExpect(jsonPath("$[0].role").value("Engineer"));

        // A conflict over HTTP: 409 with the live value, and the suggestion stays pending.
        mockMvc.perform(post("/api/admin/suggestions").header("Authorization", bearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"targetType\":\"profile\",\"field\":\"tagline\","
                                + "\"proposedValue\":\"Backend engineer\",\"reason\":\"Clearer\"}"))
                .andExpect(status().isCreated());
        Long second = suggestions.findTop200ByStatusOrderByCreatedAtDescIdDesc("pending").get(0).getId();
        jdbc.update("update profile set tagline = 'Edited by hand' where id = ?", profileId);

        mockMvc.perform(post("/api/admin/suggestions/" + second + "/accept").header("Authorization", bearer))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("conflict"))
                .andExpect(jsonPath("$.currentValue").value("Edited by hand"));
        mockMvc.perform(get("/api/profile"))
                .andExpect(jsonPath("$.tagline").value("Edited by hand"));
        mockMvc.perform(post("/api/admin/suggestions/" + second + "/reject").header("Authorization", bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("rejected"));
    }
}
