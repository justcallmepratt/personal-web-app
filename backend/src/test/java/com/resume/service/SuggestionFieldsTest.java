package com.resume.service;

import com.resume.model.Experience;
import com.resume.model.Profile;
import com.resume.model.Project;
import com.resume.service.SuggestionFields.Field;
import com.resume.service.SuggestionFields.Kind;
import com.resume.service.SuggestionFields.TargetType;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SuggestionFieldsTest {

    private static Field field(TargetType type, String name) {
        return SuggestionFields.find(type, name).orElseThrow();
    }

    private static void assertInvalid(Field field, Object value, String messagePart) {
        assertThatThrownBy(() -> field.validate(value))
                .isInstanceOf(SuggestionException.class)
                .hasMessageContaining(messagePart)
                .extracting(e -> ((SuggestionException) e).getCode()).isEqualTo("invalid");
    }

    @Test
    void whitelist_listsOnlyDescriptiveTextAndListFields() {
        assertThat(SuggestionFields.of(TargetType.PROFILE)).extracting(Field::name)
                .containsExactly("name", "tagline", "bio", "location", "techStack");
        assertThat(SuggestionFields.of(TargetType.EXPERIENCE)).extracting(Field::name)
                .containsExactly("company", "role", "location", "description", "highlights", "technologies");
        assertThat(SuggestionFields.of(TargetType.PROJECT)).extracting(Field::name)
                .containsExactly("title", "description", "longDescription", "tags", "stack");
    }

    @Test
    void whitelist_refusesEverythingElse() {
        for (String name : List.of("email", "avatarUrl", "cvUrl", "socials", "skills", "id", "updatedAt", "")) {
            assertThat(SuggestionFields.find(TargetType.PROFILE, name)).as(name).isEmpty();
        }
        for (String name : List.of("startDate", "endDate", "current", "sortOrder", "id")) {
            assertThat(SuggestionFields.find(TargetType.EXPERIENCE, name)).as(name).isEmpty();
        }
        for (String name : List.of("demoUrl", "repoUrl", "imageUrl", "featured", "sortOrder", "createdAt")) {
            assertThat(SuggestionFields.find(TargetType.PROJECT, name)).as(name).isEmpty();
        }
        assertThat(SuggestionFields.find(TargetType.PROFILE, null)).isEmpty();
        // A field of one target is not a field of another.
        assertThat(SuggestionFields.find(TargetType.PROJECT, "company")).isEmpty();
    }

    @Test
    void targetType_parsesItsLowercaseNamesOnly() {
        assertThat(TargetType.parse("profile")).contains(TargetType.PROFILE);
        assertThat(TargetType.parse("experience")).contains(TargetType.EXPERIENCE);
        assertThat(TargetType.parse("project")).contains(TargetType.PROJECT);
        assertThat(TargetType.parse("PROFILE")).isEmpty();
        assertThat(TargetType.parse("messages")).isEmpty();
        assertThat(TargetType.parse(null)).isEmpty();
        assertThat(Kind.TEXT.value()).isEqualTo("text");
        assertThat(Kind.LIST.value()).isEqualTo("list");
    }

    @Test
    void limits_mirrorTheColumns() {
        Field role = field(TargetType.EXPERIENCE, "role");
        assertThat(role.kind()).isEqualTo(Kind.TEXT);
        assertThat(role.required()).isTrue();
        assertThat(role.maxLength()).isEqualTo(255);

        Field bio = field(TargetType.PROFILE, "bio");
        assertThat(bio.required()).isFalse();
        assertThat(bio.maxLength()).isEqualTo(SuggestionFields.LONG_TEXT_MAX);

        assertThat(field(TargetType.PROJECT, "tags").kind()).isEqualTo(Kind.LIST);
    }

    @Test
    void text_acceptsAValueUpToTheLimit() {
        Field role = field(TargetType.EXPERIENCE, "role");
        assertThat(role.validate("Senior Engineer")).isEqualTo("Senior Engineer");
        assertThat(role.validate("x".repeat(255))).isEqualTo("x".repeat(255));
    }

    @Test
    void text_refusesWrongTypesBlankRequiredAndTooLong() {
        Field role = field(TargetType.EXPERIENCE, "role");
        assertInvalid(role, null, "takes text");
        assertInvalid(role, 42, "takes text");
        assertInvalid(role, List.of("Engineer"), "takes text");
        assertInvalid(role, Map.of("a", "b"), "takes text");
        assertInvalid(role, "", "cannot be empty");
        assertInvalid(role, "   ", "cannot be empty");
        assertInvalid(role, "x".repeat(256), "limited to 255 characters");
        assertInvalid(field(TargetType.PROFILE, "bio"), "x".repeat(10_001), "limited to 10000 characters");
    }

    @Test
    void optionalText_mayBeEmptied() {
        assertThat(field(TargetType.EXPERIENCE, "description").validate("")).isEqualTo("");
    }

    @Test
    void list_acceptsStringsAndReturnsAnUnmodifiableCopy() {
        Field tags = field(TargetType.PROJECT, "tags");
        List<Object> raw = new ArrayList<>(List.of("Java", "Kafka"));

        Object validated = tags.validate(raw);

        assertThat(validated).isEqualTo(List.of("Java", "Kafka"));
        raw.add("Rust");
        assertThat(validated).isEqualTo(List.of("Java", "Kafka"));
        assertThat(tags.validate(List.of())).isEqualTo(List.of());
    }

    @Test
    void list_refusesWrongShapesBlanksDuplicatesAndOversize() {
        Field tags = field(TargetType.PROJECT, "tags");
        assertInvalid(tags, null, "takes a list");
        assertInvalid(tags, "Java, Kafka", "takes a list");
        assertInvalid(tags, List.of("Java", 7), "non-empty text");
        assertInvalid(tags, Arrays.asList("Java", null), "non-empty text");
        assertInvalid(tags, List.of("Java", " "), "non-empty text");
        assertInvalid(tags, List.of("Java", "x".repeat(256)), "limited to 255 characters");
        assertInvalid(tags, List.of("Java", "Kafka", "Java"), "more than once");

        List<String> tooMany = new ArrayList<>();
        for (int i = 0; i <= SuggestionFields.LIST_MAX_ITEMS; i++) tooMany.add("item " + i);
        assertInvalid(tags, tooMany, "limited to 50 items");
    }

    @Test
    void everyField_readsAndWritesItsOwnPropertyOnly() {
        Profile profile = new Profile();
        Experience experience = new Experience();
        Project project = new Project();
        Map<TargetType, Object> entities = Map.of(
                TargetType.PROFILE, profile, TargetType.EXPERIENCE, experience, TargetType.PROJECT, project);

        for (TargetType type : TargetType.values()) {
            Object entity = entities.get(type);
            for (Field f : SuggestionFields.of(type)) {
                Object value = f.kind() == Kind.TEXT ? type.value() + "." + f.name() : List.of(type.value(), f.name());
                assertThat(f.read(entity)).as("%s.%s starts unset", type, f.name()).isNull();
                f.write(entity, value);
                assertThat(f.read(entity)).as("%s.%s", type, f.name()).isEqualTo(value);
            }
        }

        // Each setter reached a different property.
        assertThat(profile.getName()).isEqualTo("profile.name");
        assertThat(profile.getTagline()).isEqualTo("profile.tagline");
        assertThat(profile.getBio()).isEqualTo("profile.bio");
        assertThat(profile.getLocation()).isEqualTo("profile.location");
        assertThat(profile.getTechStack()).containsExactly("profile", "techStack");
        assertThat(profile.getEmail()).isNull();
        assertThat(experience.getCompany()).isEqualTo("experience.company");
        assertThat(experience.getRole()).isEqualTo("experience.role");
        assertThat(experience.getLocation()).isEqualTo("experience.location");
        assertThat(experience.getDescription()).isEqualTo("experience.description");
        assertThat(experience.getHighlights()).containsExactly("experience", "highlights");
        assertThat(experience.getTechnologies()).containsExactly("experience", "technologies");
        assertThat(project.getTitle()).isEqualTo("project.title");
        assertThat(project.getDescription()).isEqualTo("project.description");
        assertThat(project.getLongDescription()).isEqualTo("project.longDescription");
        assertThat(project.getTags()).containsExactly("project", "tags");
        assertThat(project.getStack()).containsExactly("project", "stack");
        assertThat(project.getDemoUrl()).isNull();
    }
}
