package com.resume.persistence;

import com.resume.model.Experience;
import com.resume.model.Message;
import com.resume.model.Profile;
import com.resume.model.Project;
import com.resume.model.Skill;
import com.resume.repository.ExperienceRepository;
import com.resume.repository.MessageRepository;
import com.resume.repository.ProfileRepository;
import com.resume.repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;
import org.testcontainers.utility.MountableFile;

import javax.sql.DataSource;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Runs the whole application against a real PostgreSQL whose schema is created by
 * {@code supabase/init.sql}, unchanged, with Hibernate in {@code validate} mode. This is
 * the only place the JSONB-backed entities meet a real database: the {@code test} profile
 * uses H2, which cannot create those tables.
 *
 * <p>Needs Docker. Without it the class is skipped ("Docker is not available") instead of
 * failing or hanging; CI fails the build if that happens there.
 *
 * <p>The image defaults to the major version in {@code docker-compose.yml} and can be
 * changed with {@code -Dpostgres.image=postgres:17-alpine}.
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
// A profile of its own: neither "dev" (Supabase URL, seed data) nor "test" (H2, create-drop).
@ActiveProfiles("postgres-it")
class PostgresPersistenceTest {

    private static final Path INIT_SQL = Path.of("..", "supabase", "init.sql").toAbsolutePath().normalize();

    @Container
    static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer(
            DockerImageName.parse(System.getProperty("postgres.image", "postgres:15-alpine"))
                    .asCompatibleSubstituteFor("postgres"))
            .withDatabaseName("postgres")
            .withUsername("postgres")
            .withPassword("postgres")
            // Same mechanism docker-compose.yml uses: the image runs it once on first start.
            .withCopyFileToContainer(MountableFile.forHostPath(INIT_SQL), "/docker-entrypoint-initdb.d/init.sql");

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired ProfileRepository profiles;
    @Autowired ProjectRepository projects;
    @Autowired ExperienceRepository experiences;
    @Autowired MessageRepository messages;
    @Autowired DataSource dataSource;
    @Autowired Environment env;

    JdbcTemplate jdbc;

    @BeforeEach
    void cleanTables() {
        jdbc = new JdbcTemplate(dataSource);
        messages.deleteAll();
        experiences.deleteAll();
        projects.deleteAll();
        profiles.deleteAll();
    }

    // ── schema ───────────────────────────────────────────────────────────────

    @Test
    void initSqlIsTheFileInTheRepository() {
        assertThat(Files.isRegularFile(INIT_SQL)).as("%s exists", INIT_SQL).isTrue();
    }

    @Test
    void contextStartsWithHibernateValidatingAgainstInitSql() {
        // Reaching this point means schema validation passed: the context would not have started otherwise.
        assertThat(env.getProperty("spring.jpa.hibernate.ddl-auto")).isEqualTo("validate");
        assertThat(jdbc.queryForObject("select version()", String.class)).startsWith("PostgreSQL");

        List<String> tables = jdbc.queryForList(
                "select table_name from information_schema.tables where table_schema = 'public' order by 1",
                String.class);
        assertThat(tables).containsExactly("content_suggestions", "experience", "market_research_runs",
                "market_role_totals", "market_skill_counts", "messages", "profile", "projects");
    }

    @Test
    void listAndMapColumnsAreJsonb() {
        List<String> jsonbColumns = jdbc.queryForList(
                "select table_name || '.' || column_name from information_schema.columns "
                        + "where table_schema = 'public' and data_type = 'jsonb' order by 1",
                String.class);
        assertThat(jsonbColumns).containsExactly(
                "experience.highlights", "experience.technologies",
                "profile.skills", "profile.socials", "profile.tech_stack",
                "projects.stack", "projects.tags");
    }

    @Test
    void initSqlCreatesTheBtreeAndGinIndexes() {
        Map<String, String> indexes = new HashMap<>();
        for (Map<String, Object> row : jdbc.queryForList(
                "select indexname, indexdef from pg_indexes where schemaname = 'public'")) {
            indexes.put((String) row.get("indexname"), (String) row.get("indexdef"));
        }

        assertThat(indexes).containsKeys(
                "idx_projects_featured", "idx_projects_sort", "idx_experience_sort", "idx_messages_sent_at");
        for (String gin : List.of("idx_projects_tags_gin", "idx_projects_stack_gin",
                "idx_experience_tech_gin", "idx_profile_skills_gin")) {
            assertThat(indexes).containsKey(gin);
            assertThat(indexes.get(gin)).containsIgnoringCase("using gin");
        }
    }

    // ── profile ──────────────────────────────────────────────────────────────

    @Test
    void profileRoundTripsWithSkillsSocialsAndTechStack() {
        Profile p = new Profile();
        p.setName("V");
        p.setTagline("Night City Developer");
        p.setBio("Long bio text.\nSecond line.");
        p.setEmail("v@example.com");
        p.setLocation("Night City");
        p.setAvatarUrl("/avatar.png");
        p.setCvUrl("/cv.pdf");
        p.setTechStack(List.of("Java", "Spring Boot", "Postgres"));
        p.setSocials(Map.of("github", "https://github.com/example", "linkedin", "https://linkedin.com/in/example"));
        p.setSkills(List.of(new Skill("Java", "Backend", 90), new Skill("React", "Frontend", 85),
                new Skill("Kafka", "Backend")));

        Long id = profiles.save(p).getId();
        Profile loaded = profiles.findById(id).orElseThrow();

        assertThat(loaded.getName()).isEqualTo("V");
        assertThat(loaded.getTagline()).isEqualTo("Night City Developer");
        assertThat(loaded.getBio()).isEqualTo("Long bio text.\nSecond line.");
        assertThat(loaded.getEmail()).isEqualTo("v@example.com");
        assertThat(loaded.getLocation()).isEqualTo("Night City");
        assertThat(loaded.getAvatarUrl()).isEqualTo("/avatar.png");
        assertThat(loaded.getCvUrl()).isEqualTo("/cv.pdf");
        assertThat(loaded.getTechStack()).containsExactly("Java", "Spring Boot", "Postgres");
        assertThat(loaded.getSocials()).containsOnly(
                Map.entry("github", "https://github.com/example"),
                Map.entry("linkedin", "https://linkedin.com/in/example"));
        assertThat(loaded.getSkills()).hasSize(3);
        Skill first = loaded.getSkills().get(0);
        assertThat(first.getName()).isEqualTo("Java");
        assertThat(first.getCategory()).isEqualTo("Backend");
        assertThat(first.getLevel()).isEqualTo(90);
        assertThat(loaded.getSkills().get(1).getName()).isEqualTo("React");
        // A skill without a level stays without one: null in Java, no key in the stored JSON.
        assertThat(loaded.getSkills().get(2).getName()).isEqualTo("Kafka");
        assertThat(loaded.getSkills().get(2).getLevel()).isNull();
        assertThat(jdbc.queryForObject(
                "select jsonb_exists(skills -> 2, 'level') from profile where id = ?", Boolean.class, id)).isFalse();
        assertThat(loaded.getUpdatedAt()).isNotNull();

        // Stored as real JSONB, in the shape the GIN index on skills can serve.
        assertThat(jdbc.queryForObject("select jsonb_typeof(skills) from profile where id = ?", String.class, id))
                .isEqualTo("array");
        assertThat(jdbc.queryForObject("select jsonb_typeof(socials) from profile where id = ?", String.class, id))
                .isEqualTo("object");
        assertThat(jdbc.queryForObject(
                "select count(*) from profile where skills @> '[{\"name\":\"Java\",\"level\":90}]'::jsonb",
                Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("select socials ->> 'github' from profile where id = ?", String.class, id))
                .isEqualTo("https://github.com/example");
    }

    @Test
    void profileUpdateRewritesJsonColumns() {
        Profile p = new Profile();
        p.setName("V");
        p.setTechStack(List.of("Java"));
        p.setSocials(Map.of());
        p.setSkills(List.of());
        Long id = profiles.save(p).getId();

        Profile toUpdate = profiles.findById(id).orElseThrow();
        toUpdate.setTechStack(List.of("Java", "Kafka"));
        toUpdate.setSkills(List.of(new Skill("Kafka", "Backend", 70)));
        profiles.save(toUpdate);

        Profile loaded = profiles.findById(id).orElseThrow();
        assertThat(loaded.getTechStack()).containsExactly("Java", "Kafka");
        assertThat(loaded.getSkills()).hasSize(1);
        assertThat(loaded.getSkills().get(0).getName()).isEqualTo("Kafka");
        assertThat(loaded.getSocials()).isEmpty();
        assertThat(profiles.count()).isEqualTo(1);
    }

    // ── projects ─────────────────────────────────────────────────────────────

    @Test
    void projectRoundTripsWithTagsAndStack() {
        Project p = project("Neon Dashboard", true, 1);
        p.setDescription("Short");
        p.setLongDescription("Long description");
        p.setTags(List.of("React", "WebGL"));
        p.setStack(List.of("Next.js", "TypeScript"));
        p.setDemoUrl("https://example.com/demo");
        p.setRepoUrl("https://example.com/repo");
        p.setImageUrl("/img.png");

        Long id = projects.save(p).getId();
        Project loaded = projects.findById(id).orElseThrow();

        assertThat(loaded.getTitle()).isEqualTo("Neon Dashboard");
        assertThat(loaded.getDescription()).isEqualTo("Short");
        assertThat(loaded.getLongDescription()).isEqualTo("Long description");
        assertThat(loaded.getTags()).containsExactly("React", "WebGL");
        assertThat(loaded.getStack()).containsExactly("Next.js", "TypeScript");
        assertThat(loaded.getDemoUrl()).isEqualTo("https://example.com/demo");
        assertThat(loaded.getRepoUrl()).isEqualTo("https://example.com/repo");
        assertThat(loaded.getImageUrl()).isEqualTo("/img.png");
        assertThat(loaded.isFeatured()).isTrue();
        assertThat(loaded.getSortOrder()).isEqualTo(1);
        assertThat(loaded.getCreatedAt()).isNotNull();

        assertThat(jdbc.queryForObject("select jsonb_typeof(tags) from projects where id = ?", String.class, id))
                .isEqualTo("array");
        assertThat(jdbc.queryForObject("select count(*) from projects where tags @> '[\"WebGL\"]'::jsonb",
                Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("select count(*) from projects where stack @> '[\"Rust\"]'::jsonb",
                Integer.class)).isZero();
    }

    @Test
    void projectQueriesOrderBySortOrderAndFilterFeatured() {
        projects.saveAll(List.of(
                project("third", false, 3),
                project("first-featured", true, 1),
                project("fourth-featured", true, 4),
                project("second", false, 2)));

        assertThat(projects.findAllByOrderBySortOrderAsc()).extracting(Project::getTitle)
                .containsExactly("first-featured", "second", "third", "fourth-featured");
        assertThat(projects.findByFeaturedTrueOrderBySortOrderAsc()).extracting(Project::getTitle)
                .containsExactly("first-featured", "fourth-featured");
    }

    @Test
    void jsonbDefaultsInInitSqlDoNotApplyToRowsWrittenThroughJpa() {
        // Hibernate sends an explicit NULL for an unset field, so the column DEFAULT '[]'
        // is never used and NOT NULL rejects the row. Callers must set the lists.
        Project noLists = new Project();
        noLists.setTitle("no lists");
        assertThatThrownBy(() -> projects.saveAndFlush(noLists))
                .isInstanceOf(DataIntegrityViolationException.class);

        Project noTitle = project(null, false, 1);
        assertThatThrownBy(() -> projects.saveAndFlush(noTitle))
                .isInstanceOf(DataIntegrityViolationException.class);

        assertThat(projects.count()).isZero();
    }

    // ── experience ───────────────────────────────────────────────────────────

    @Test
    void experienceRoundTripsWithHighlightsAndTechnologies() {
        Experience e = experience("Arasaka", 1);
        e.setRole("Senior Engineer");
        e.setLocation("Night City");
        e.setStartDate(LocalDate.of(2024, 3, 1));
        e.setEndDate(null);
        e.setCurrent(true);
        e.setDescription("Platform team.");
        e.setHighlights(List.of("Cut deploy time 40%", "Mentored 4 engineers"));
        e.setTechnologies(List.of("Java", "Kubernetes"));

        Long id = experiences.save(e).getId();
        Experience loaded = experiences.findById(id).orElseThrow();

        assertThat(loaded.getCompany()).isEqualTo("Arasaka");
        assertThat(loaded.getRole()).isEqualTo("Senior Engineer");
        assertThat(loaded.getLocation()).isEqualTo("Night City");
        assertThat(loaded.getStartDate()).isEqualTo(LocalDate.of(2024, 3, 1));
        assertThat(loaded.getEndDate()).isNull();
        assertThat(loaded.isCurrent()).isTrue();
        assertThat(loaded.getDescription()).isEqualTo("Platform team.");
        assertThat(loaded.getHighlights()).containsExactly("Cut deploy time 40%", "Mentored 4 engineers");
        assertThat(loaded.getTechnologies()).containsExactly("Java", "Kubernetes");
        assertThat(loaded.getSortOrder()).isEqualTo(1);

        assertThat(jdbc.queryForObject(
                "select count(*) from experience where technologies @> '[\"Kubernetes\"]'::jsonb",
                Integer.class)).isEqualTo(1);
    }

    @Test
    void experienceWithEndDateRoundTripsAndQueryOrdersBySortOrder() {
        Experience past = experience("Militech", 2);
        past.setStartDate(LocalDate.of(2022, 1, 1));
        past.setEndDate(LocalDate.of(2024, 2, 28));
        experiences.saveAll(List.of(experience("NetWatch", 3), past, experience("Arasaka", 1)));

        List<Experience> ordered = experiences.findAllByOrderBySortOrderAsc();
        assertThat(ordered).extracting(Experience::getCompany).containsExactly("Arasaka", "Militech", "NetWatch");
        assertThat(ordered.get(1).getEndDate()).isEqualTo(LocalDate.of(2024, 2, 28));
        assertThat(ordered.get(1).isCurrent()).isFalse();
    }

    // ── messages ─────────────────────────────────────────────────────────────

    @Test
    void messageRoundTripsAndCanBeMarkedRead() {
        Message m = message("Alt", null);
        m.setBody("Line one.\nLine two.");

        Long id = messages.save(m).getId();
        Message loaded = messages.findById(id).orElseThrow();

        assertThat(loaded.getName()).isEqualTo("Alt");
        assertThat(loaded.getEmail()).isEqualTo("alt@example.com");
        assertThat(loaded.getSubject()).isEqualTo("Hello");
        assertThat(loaded.getBody()).isEqualTo("Line one.\nLine two.");
        assertThat(loaded.isRead()).isFalse();
        assertThat(loaded.getSentAt()).isNotNull(); // set by @PrePersist

        loaded.setRead(true);
        messages.save(loaded);
        assertThat(messages.findById(id).orElseThrow().isRead()).isTrue();
    }

    @Test
    void messagesAreListedNewestFirst() {
        LocalDateTime base = LocalDateTime.of(2026, 1, 1, 12, 0);
        messages.saveAll(List.of(
                message("middle", base.plusHours(1)),
                message("oldest", base),
                message("newest", base.plusDays(1))));

        assertThat(messages.findAllByOrderBySentAtDesc()).extracting(Message::getName)
                .containsExactly("newest", "middle", "oldest");
        assertThat(messages.findAllByOrderBySentAtDesc().get(0).getSentAt()).isEqualTo(base.plusDays(1));
    }

    // ── fixtures ─────────────────────────────────────────────────────────────

    private static Project project(String title, boolean featured, int sortOrder) {
        Project p = new Project();
        p.setTitle(title);
        p.setTags(List.of());
        p.setStack(List.of());
        p.setFeatured(featured);
        p.setSortOrder(sortOrder);
        return p;
    }

    private static Experience experience(String company, int sortOrder) {
        Experience e = new Experience();
        e.setCompany(company);
        e.setRole("Engineer");
        e.setStartDate(LocalDate.of(2020, 1, 1));
        e.setHighlights(List.of());
        e.setTechnologies(List.of());
        e.setSortOrder(sortOrder);
        return e;
    }

    private static Message message(String name, LocalDateTime sentAt) {
        Message m = new Message();
        m.setName(name);
        m.setEmail("alt@example.com");
        m.setSubject("Hello");
        m.setBody("Body");
        m.setSentAt(sentAt);
        return m;
    }
}
