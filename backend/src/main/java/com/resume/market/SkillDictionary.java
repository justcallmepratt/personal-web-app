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
import java.util.regex.Pattern;

/**
 * The curated list of skills and technologies the market research looks for, read from
 * {@code market/skills.json}. A skill is only ever reported, or suggested, under the
 * {@code name} written in that file; nothing is inferred from listing text.
 *
 * <p>A term matches as a whole word or phrase: "Java" does not match "JavaScript", and
 * "C" would not match "C++". Matching ignores case unless the entry says
 * {@code "caseSensitive": true} (for words that are also ordinary English, like "Spring").
 *
 * <p>A file that cannot be read leaves the dictionary empty (see {@link #loadError()})
 * instead of failing application startup; the job then stays off.
 */
@Component
public class SkillDictionary {
    private static final Logger log = LoggerFactory.getLogger(SkillDictionary.class);
    static final String RESOURCE = "market/skills.json";
    /** Fits {@code market_skill_counts.skill} and keeps a suggestion's reason short. */
    static final int NAME_MAX = 60;

    /** One entry of the file. {@code aliases} are other spellings; the name itself always matches. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Entry(String name, List<String> aliases, Boolean caseSensitive) {}

    /** The file's shape. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record SkillsFile(String reviewedOn, List<Entry> skills) {}

    private record Compiled(String name, Set<String> normalized, List<Pattern> patterns) {}

    private final List<Compiled> entries;
    private final String loadError;

    @Autowired
    public SkillDictionary(ObjectMapper mapper) {
        List<Entry> loaded = List.of();
        String error = null;
        try (InputStream in = new ClassPathResource(RESOURCE).getInputStream()) {
            SkillsFile file = mapper.readValue(in, SkillsFile.class);
            loaded = file == null || file.skills() == null ? List.of() : file.skills();
        } catch (Exception e) {
            error = RESOURCE + " could not be read (" + e.getClass().getSimpleName() + ")";
            log.error("Market research: {}", error);
        }
        this.entries = compile(loaded);
        this.loadError = error;
    }

    private SkillDictionary(List<Entry> entries) {
        this.entries = compile(entries);
        this.loadError = null;
    }

    public static SkillDictionary of(List<Entry> entries) {
        return new SkillDictionary(entries);
    }

    public int size() { return entries.size(); }

    /** Why the file could not be read, or null. */
    public String loadError() { return loadError; }

    /** Every skill name, in file order. */
    public List<String> names() {
        return entries.stream().map(Compiled::name).toList();
    }

    /** The dictionary skills this text mentions, each at most once, in file order. */
    public Set<String> extract(String text) {
        Set<String> found = new LinkedHashSet<>();
        if (text == null || text.isBlank()) return found;
        for (Compiled entry : entries) {
            for (Pattern pattern : entry.patterns()) {
                if (pattern.matcher(text).find()) {
                    found.add(entry.name());
                    break;
                }
            }
        }
        return found;
    }

    /**
     * The dictionary name for an item as the owner wrote it ("springboot" → "Spring Boot"),
     * if it is a name or alias here. Always ignores case: this is used to decide the owner
     * already lists a skill, where missing a match would produce a pointless suggestion.
     */
    public Optional<String> canonical(String item) {
        String key = normalize(item);
        if (key.isEmpty()) return Optional.empty();
        return entries.stream().filter(e -> e.normalized().contains(key)).map(Compiled::name).findFirst();
    }

    /** Lower case, trimmed, runs of whitespace collapsed. */
    public static String normalize(String value) {
        return value == null ? "" : value.strip().toLowerCase(Locale.ROOT).replaceAll("\\s+", " ");
    }

    private static List<Compiled> compile(List<Entry> raw) {
        List<Compiled> result = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (Entry entry : raw) {
            if (entry == null || entry.name() == null || entry.name().isBlank()) {
                log.warn("Market research: a skill without a name was ignored");
                continue;
            }
            String name = entry.name().strip();
            if (name.length() > NAME_MAX) {
                log.warn("Market research: skill '{}' is longer than {} characters and was ignored", name, NAME_MAX);
                continue;
            }
            if (!seen.add(normalize(name))) {
                log.warn("Market research: skill '{}' is listed twice; the second entry was ignored", name);
                continue;
            }
            boolean caseSensitive = Boolean.TRUE.equals(entry.caseSensitive());
            List<String> terms = new ArrayList<>();
            terms.add(name);
            if (entry.aliases() != null) {
                for (String alias : entry.aliases()) {
                    if (alias != null && !alias.isBlank()) terms.add(alias.strip());
                }
            }
            Set<String> normalized = new HashSet<>();
            List<Pattern> patterns = new ArrayList<>();
            for (String term : terms) {
                if (normalized.add(normalize(term))) patterns.add(pattern(term, caseSensitive));
            }
            result.add(new Compiled(name, normalized, patterns));
        }
        return List.copyOf(result);
    }

    /**
     * The term as a whole word or phrase: not directly next to a letter, a digit, '+' or
     * '#', with any whitespace between its words.
     */
    private static Pattern pattern(String term, boolean caseSensitive) {
        StringBuilder regex = new StringBuilder("(?<![\\p{Alnum}+#])");
        String[] words = term.strip().split("\\s+");
        for (int i = 0; i < words.length; i++) {
            if (i > 0) regex.append("\\s+");
            regex.append(Pattern.quote(words[i]));
        }
        regex.append("(?![\\p{Alnum}+#])");
        return Pattern.compile(regex.toString(), caseSensitive ? 0 : Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
    }
}
