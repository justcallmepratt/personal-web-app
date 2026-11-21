package com.resume.service;

import com.resume.model.Experience;
import com.resume.model.Profile;
import com.resume.model.Project;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.BiConsumer;
import java.util.function.Function;

/**
 * The whitelist: which fields of which rows a suggestion may change, and how a value for
 * each is validated. Anything not listed here cannot be changed through suggestions.
 *
 * <p>Listed: the descriptive text and string-list fields. Left out on purpose: the contact
 * email, URLs, socials, skills (objects with a level), dates, flags and sort order.
 */
public final class SuggestionFields {
    private SuggestionFields() {}

    /** Length of the {@code VARCHAR(255)} columns in {@code supabase/init.sql}. */
    public static final int SHORT_TEXT_MAX = 255;
    /** {@code TEXT} columns have no database limit; this keeps a value a sane size. */
    public static final int LONG_TEXT_MAX = 10_000;
    public static final int LIST_MAX_ITEMS = 50;

    public enum Kind {
        TEXT, LIST;

        public String value() { return name().toLowerCase(); }
    }

    public enum TargetType {
        PROFILE, EXPERIENCE, PROJECT;

        public String value() { return name().toLowerCase(); }

        public static Optional<TargetType> parse(String value) {
            for (TargetType t : values()) {
                if (t.value().equals(value)) return Optional.of(t);
            }
            return Optional.empty();
        }
    }

    /**
     * One changeable field. {@code required} mirrors {@code NOT NULL} on a text column;
     * {@code maxLength} is the limit for the text, or for each item of a list.
     */
    public record Field(String name, Kind kind, boolean required, int maxLength,
                        Function<Object, Object> getter, BiConsumer<Object, Object> setter) {

        public Object read(Object entity) { return getter.apply(entity); }

        public void write(Object entity, Object value) { setter.accept(entity, value); }

        /**
         * Checks a proposed value and returns it in the form it is stored and applied in:
         * a {@code String} for text, an unmodifiable {@code List<String>} for a list.
         */
        public Object validate(Object raw) {
            return kind == Kind.TEXT ? validateText(raw) : validateList(raw);
        }

        private String validateText(Object raw) {
            if (!(raw instanceof String text)) {
                throw SuggestionException.invalid("'" + name + "' takes text.");
            }
            if (required && text.isBlank()) {
                throw SuggestionException.invalid("'" + name + "' cannot be empty.");
            }
            if (text.length() > maxLength) {
                throw SuggestionException.invalid("'" + name + "' is limited to " + maxLength + " characters.");
            }
            return text;
        }

        private List<String> validateList(Object raw) {
            if (!(raw instanceof List<?> items)) {
                throw SuggestionException.invalid("'" + name + "' takes a list of text items.");
            }
            if (items.size() > LIST_MAX_ITEMS) {
                throw SuggestionException.invalid("'" + name + "' is limited to " + LIST_MAX_ITEMS + " items.");
            }
            List<String> result = new ArrayList<>(items.size());
            Set<String> seen = new HashSet<>();
            for (Object item : items) {
                if (!(item instanceof String text) || text.isBlank()) {
                    throw SuggestionException.invalid("Every item of '" + name + "' must be non-empty text.");
                }
                if (text.length() > maxLength) {
                    throw SuggestionException.invalid(
                            "Each item of '" + name + "' is limited to " + maxLength + " characters.");
                }
                if (!seen.add(text)) {
                    throw SuggestionException.invalid("'" + name + "' lists \"" + text + "\" more than once.");
                }
                result.add(text);
            }
            return List.copyOf(result);
        }
    }

    private static final Map<TargetType, Map<String, Field>> FIELDS = Map.of(
            TargetType.PROFILE, index(
                    text(Profile.class, "name", true, SHORT_TEXT_MAX, Profile::getName, Profile::setName),
                    text(Profile.class, "tagline", false, SHORT_TEXT_MAX, Profile::getTagline, Profile::setTagline),
                    text(Profile.class, "bio", false, LONG_TEXT_MAX, Profile::getBio, Profile::setBio),
                    text(Profile.class, "location", false, SHORT_TEXT_MAX, Profile::getLocation, Profile::setLocation),
                    list(Profile.class, "techStack", Profile::getTechStack, Profile::setTechStack)),
            TargetType.EXPERIENCE, index(
                    text(Experience.class, "company", true, SHORT_TEXT_MAX, Experience::getCompany, Experience::setCompany),
                    text(Experience.class, "role", true, SHORT_TEXT_MAX, Experience::getRole, Experience::setRole),
                    text(Experience.class, "location", false, SHORT_TEXT_MAX, Experience::getLocation, Experience::setLocation),
                    text(Experience.class, "description", false, LONG_TEXT_MAX, Experience::getDescription, Experience::setDescription),
                    list(Experience.class, "highlights", Experience::getHighlights, Experience::setHighlights),
                    list(Experience.class, "technologies", Experience::getTechnologies, Experience::setTechnologies)),
            TargetType.PROJECT, index(
                    text(Project.class, "title", true, SHORT_TEXT_MAX, Project::getTitle, Project::setTitle),
                    text(Project.class, "description", false, LONG_TEXT_MAX, Project::getDescription, Project::setDescription),
                    text(Project.class, "longDescription", false, LONG_TEXT_MAX, Project::getLongDescription, Project::setLongDescription),
                    list(Project.class, "tags", Project::getTags, Project::setTags),
                    list(Project.class, "stack", Project::getStack, Project::setStack)));

    /** The changeable fields of a target type, in display order. */
    public static List<Field> of(TargetType type) {
        return List.copyOf(FIELDS.get(type).values());
    }

    public static Optional<Field> find(TargetType type, String name) {
        return Optional.ofNullable(FIELDS.get(type).get(name));
    }

    private static Map<String, Field> index(Field... fields) {
        Map<String, Field> map = new LinkedHashMap<>();
        for (Field f : fields) map.put(f.name(), f);
        return map;
    }

    private static <T> Field text(Class<T> type, String name, boolean required, int maxLength,
                                  Function<T, String> getter, BiConsumer<T, String> setter) {
        return new Field(name, Kind.TEXT, required, maxLength,
                entity -> getter.apply(type.cast(entity)),
                (entity, value) -> setter.accept(type.cast(entity), (String) value));
    }

    @SuppressWarnings("unchecked")
    private static <T> Field list(Class<T> type, String name,
                                  Function<T, List<String>> getter, BiConsumer<T, List<String>> setter) {
        // Items share the short-text limit; the list itself lives in a JSONB column.
        return new Field(name, Kind.LIST, true, SHORT_TEXT_MAX,
                entity -> getter.apply(type.cast(entity)),
                (entity, value) -> setter.accept(type.cast(entity), (List<String>) value));
    }
}
