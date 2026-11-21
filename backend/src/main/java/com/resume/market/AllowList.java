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
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * The companies whose listings count, read from {@code market/allow-list.json}: companies
 * on the Fortune 500 that are, or own, a FINRA member broker-dealer (the owner's rule).
 *
 * <p>The file records the evidence for each company. An entry is used only when it says
 * {@code "included": true} <em>and</em> carries both pieces of evidence (a Fortune 500
 * rank and at least one FINRA firm with its CRD number) and at least one alias; anything
 * else is left out, so an incomplete edit can only shrink the list. A file that cannot be read leaves the list
 * empty instead of failing application startup; the job then stays off.
 */
@Component
public class AllowList {
    private static final Logger log = LoggerFactory.getLogger(AllowList.class);
    static final String RESOURCE = "market/allow-list.json";

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Fortune500(Integer rank, Integer year, String source) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record FinraFirm(String firm, Long crd, String source) {}

    /** One entry of the file, included or not. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Entry(String name, Boolean included, Fortune500 fortune500, List<FinraFirm> finra,
                        String searchName, List<String> aliases, String excludedReason, String note) {}

    /** The file's shape. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record AllowListFile(String compiledOn, List<Entry> companies) {}

    /**
     * A company that counts. {@code searchName} is what is sent to the listings API;
     * {@code aliases} are the employer names a listing may carry, normalised.
     */
    public record Company(String name, String searchName, Set<String> aliases) {

        /** True when the employer name on a listing is this company (one of its aliases, as whole words). */
        public boolean matches(String employer) {
            String padded = " " + normalize(employer) + " ";
            if (padded.isBlank()) return false;
            return aliases.stream().anyMatch(alias -> padded.contains(" " + alias + " "));
        }
    }

    private final List<Company> companies;
    private final String compiledOn;
    private final String loadError;

    @Autowired
    public AllowList(ObjectMapper mapper) {
        AllowListFile file = null;
        String error = null;
        try (InputStream in = new ClassPathResource(RESOURCE).getInputStream()) {
            file = mapper.readValue(in, AllowListFile.class);
        } catch (Exception e) {
            error = RESOURCE + " could not be read (" + e.getClass().getSimpleName() + ")";
            log.error("Market research: {}", error);
        }
        this.companies = usable(file == null ? null : file.companies());
        this.compiledOn = file == null ? null : file.compiledOn();
        this.loadError = error;
    }

    private AllowList(String compiledOn, List<Entry> entries) {
        this.companies = usable(entries);
        this.compiledOn = compiledOn;
        this.loadError = null;
    }

    public static AllowList of(String compiledOn, List<Entry> entries) {
        return new AllowList(compiledOn, entries);
    }

    /** The companies that count, in file order. */
    public List<Company> companies() { return companies; }

    /** The date the list was compiled, as written in the file; may be null. */
    public String compiledOn() { return compiledOn; }

    /** Why the file could not be read, or null. */
    public String loadError() { return loadError; }

    /** Lower case, with everything that is not a letter or digit turned into single spaces. */
    static String normalize(String value) {
        if (value == null) return "";
        return value.toLowerCase(Locale.ROOT).replaceAll("[^\\p{Alnum}]+", " ").strip();
    }

    private static List<Company> usable(List<Entry> entries) {
        List<Company> result = new ArrayList<>();
        if (entries == null) return result;
        for (Entry entry : entries) {
            if (entry == null || !Boolean.TRUE.equals(entry.included())) continue;
            String name = entry.name() == null ? "" : entry.name().strip();
            if (name.isEmpty()) {
                log.warn("Market research: an allow-list entry without a name was left out");
                continue;
            }
            if (!hasFortuneEvidence(entry.fortune500()) || !hasFinraEvidence(entry.finra())) {
                log.warn("Market research: '{}' is marked included but lacks a Fortune 500 rank or a FINRA firm "
                        + "with a CRD number, so it was left out", name);
                continue;
            }
            // The company's own name is not added: a name like "Block" is too generic to match on.
            Set<String> aliases = new LinkedHashSet<>();
            if (entry.aliases() != null) {
                for (String alias : entry.aliases()) aliases.add(normalize(alias));
            }
            aliases.remove("");
            if (aliases.isEmpty()) {
                log.warn("Market research: '{}' is marked included but has no alias to match listings with, "
                        + "so it was left out", name);
                continue;
            }
            String searchName = entry.searchName() == null || entry.searchName().isBlank()
                    ? name : entry.searchName().strip();
            result.add(new Company(name, searchName, Set.copyOf(aliases)));
        }
        return List.copyOf(result);
    }

    private static boolean hasFortuneEvidence(Fortune500 f) {
        return f != null && f.rank() != null && f.rank() >= 1 && f.rank() <= 500;
    }

    private static boolean hasFinraEvidence(List<FinraFirm> firms) {
        return firms != null && firms.stream().anyMatch(f ->
                f != null && f.crd() != null && f.crd() > 0 && f.firm() != null && !f.firm().isBlank());
    }
}
