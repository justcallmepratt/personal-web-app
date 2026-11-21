package com.resume.market;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

/**
 * The roles the market research looks at, read from {@code market/roles.json}: for each
 * role, the job-title variants that count and the query sent to the listings API.
 *
 * <p>A listing belongs to a role when its title contains one of the role's variants as
 * whole words (case and punctuation ignored). When variants of more than one role match,
 * the longest wins, so "Forward Deployed Software Engineer" is a forward deployed engineer
 * and not a software developer; a listing never counts for two roles.
 *
 * <p>An entry that is incomplete is left out, and a file that cannot be read leaves the
 * list empty instead of failing application startup; the job then stays off.
 */
@Component
public class TargetRoles {
    private static final Logger log = LoggerFactory.getLogger(TargetRoles.class);
    static final String RESOURCE = "market/roles.json";
    /** Fits the {@code role} columns. */
    static final int ID_MAX = 50;
    /** Keeps a suggestion's reason within its limit. */
    static final int NAME_MAX = 40;

    /** The query for a role: {@code what} (keywords) or {@code whatPhrase} (exact phrase), and an optional category. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Search(String what, String whatPhrase, String category) {}

    /** One entry of the file. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Entry(String id, String name, List<String> titles, Search search) {}

    /** The file's shape. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RolesFile(String reviewedOn, List<Entry> roles) {}

    /** A role that is used. {@code titles} are normalised. */
    public record Role(String id, String name, Set<String> titles, Search search) {}

    private final List<Role> roles;
    private final String loadError;

    @Autowired
    public TargetRoles(ObjectMapper mapper) {
        List<Entry> loaded = List.of();
        String error = null;
        try (InputStream in = new ClassPathResource(RESOURCE).getInputStream()) {
            RolesFile file = mapper.readValue(in, RolesFile.class);
            loaded = file == null || file.roles() == null ? List.of() : file.roles();
        } catch (Exception e) {
            error = RESOURCE + " could not be read (" + e.getClass().getSimpleName() + ")";
            log.error("Market research: {}", error);
        }
        this.roles = usable(loaded);
        this.loadError = error;
    }

    private TargetRoles(List<Entry> entries) {
        this.roles = usable(entries);
        this.loadError = null;
    }

    public static TargetRoles of(List<Entry> entries) {
        return new TargetRoles(entries);
    }

    /** The roles in use, in file order. */
    public List<Role> roles() { return roles; }

    /** Why the file could not be read, or null. */
    public String loadError() { return loadError; }

    /** The role with this id, if it is in the file. */
    public Optional<Role> byId(String id) {
        return roles.stream().filter(r -> r.id().equals(id)).findFirst();
    }

    /** How the role is written for the owner: its name, or the id itself for a role no longer in the file. */
    public String nameOf(String id) {
        return byId(id).map(Role::name).orElse(id);
    }

    /** The role a job title belongs to, if any: the one with the longest matching variant. */
    public Optional<Role> classify(String title) {
        String padded = " " + normalize(title) + " ";
        Role best = null;
        int bestLength = 0;
        for (Role role : roles) {
            for (String variant : role.titles()) {
                if (variant.length() > bestLength && padded.contains(" " + variant + " ")) {
                    best = role;
                    bestLength = variant.length();
                }
            }
        }
        return Optional.ofNullable(best);
    }

    /** Lower case, with everything that is not a letter or digit turned into single spaces. */
    static String normalize(String value) {
        if (value == null) return "";
        return value.toLowerCase(Locale.ROOT).replaceAll("[^\\p{Alnum}]+", " ").strip();
    }

    private static List<Role> usable(List<Entry> entries) {
        List<Role> result = new ArrayList<>();
        Set<String> ids = new HashSet<>();
        if (entries == null) return result;
        for (Entry entry : entries) {
            if (entry == null) continue;
            String id = entry.id() == null ? "" : entry.id().strip();
            if (!id.matches("[a-z0-9-]{1," + ID_MAX + "}")) {
                log.warn("Market research: a role with the id '{}' was left out (lower case letters, digits and "
                        + "hyphens, up to {} characters)", id, ID_MAX);
                continue;
            }
            String name = entry.name() == null ? "" : entry.name().strip();
            if (name.isEmpty() || name.length() > NAME_MAX) {
                log.warn("Market research: role '{}' needs a name of up to {} characters and was left out", id, NAME_MAX);
                continue;
            }
            Set<String> titles = new LinkedHashSet<>();
            if (entry.titles() != null) {
                for (String title : entry.titles()) titles.add(normalize(title));
            }
            titles.remove("");
            Search search = clean(entry.search());
            if (titles.isEmpty() || search == null) {
                log.warn("Market research: role '{}' needs at least one title and a search (what or whatPhrase) "
                        + "and was left out", id);
                continue;
            }
            if (!ids.add(id)) {
                log.warn("Market research: role '{}' is listed twice; the second entry was left out", id);
                continue;
            }
            result.add(new Role(id, name, Set.copyOf(titles), search));
        }
        return List.copyOf(result);
    }

    /** Blank parts become null; a search with neither keywords nor a phrase is no search. */
    private static Search clean(Search search) {
        if (search == null) return null;
        String what = blankToNull(search.what());
        String phrase = blankToNull(search.whatPhrase());
        if (what == null && phrase == null) return null;
        return new Search(what, phrase, blankToNull(search.category()));
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }
}
