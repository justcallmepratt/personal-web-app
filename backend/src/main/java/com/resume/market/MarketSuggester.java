package com.resume.market;

import com.resume.dto.SuggestionRequest;
import com.resume.model.ContentSuggestion;
import com.resume.model.Experience;
import com.resume.model.MarketSkillCount;
import com.resume.model.Profile;
import com.resume.model.Project;
import com.resume.model.Skill;
import com.resume.repository.ContentSuggestionRepository;
import com.resume.repository.ExperienceRepository;
import com.resume.repository.ProfileRepository;
import com.resume.repository.ProjectRepository;
import com.resume.service.SuggestionException;
import com.resume.service.SuggestionFields;
import com.resume.service.SuggestionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Turns a week's summary into suggestions for the owner to decide on.
 *
 * <p>The rule this class exists to keep: <strong>it never states that the owner has a
 * skill.</strong> The only thing it can propose is adding one dictionary skill name to the
 * profile's {@code techStack} list, through the same queue as every other suggestion, with
 * a reason that gives the market evidence and asks the owner to accept only if they have
 * that experience. It never touches experience entries, projects, descriptions or any
 * free text, and it writes no content itself: {@link SuggestionService#create} only
 * records a pending row.
 *
 * <p>It proposes nothing when the sample is too small, for a skill the owner already
 * lists anywhere, for a skill that is already waiting in the queue, or for one the owner
 * has rejected before.
 */
@Service
public class MarketSuggester {
    private static final Logger log = LoggerFactory.getLogger(MarketSuggester.class);

    public static final String SOURCE = "market-research";
    static final String TARGET_TYPE = "profile";
    static final String FIELD = "techStack";

    private final MarketResearchSettings settings;
    private final SkillDictionary dictionary;
    private final SuggestionService suggestions;
    private final ContentSuggestionRepository suggestionRows;
    private final ProfileRepository profiles;
    private final ExperienceRepository experiences;
    private final ProjectRepository projects;
    private final ObjectMapper mapper;

    public MarketSuggester(MarketResearchSettings settings, SkillDictionary dictionary,
                           SuggestionService suggestions, ContentSuggestionRepository suggestionRows,
                           ProfileRepository profiles, ExperienceRepository experiences,
                           ProjectRepository projects, ObjectMapper mapper) {
        this.settings = settings;
        this.dictionary = dictionary;
        this.suggestions = suggestions;
        this.suggestionRows = suggestionRows;
        this.profiles = profiles;
        this.experiences = experiences;
        this.projects = projects;
        this.mapper = mapper;
    }

    /**
     * Creates pending suggestions from a completed week. Safe to call again for the same
     * week: what is already pending or was rejected is not proposed again.
     *
     * @return how many suggestions were created
     */
    public int suggest(MarketSummaryStore.Summary summary) {
        int examined = summary.run().getListingsExamined();
        String week = String.valueOf(summary.run().getWeekStart());
        if (examined < settings.minListings()) {
            log.info("Market research: no suggestions for the week of {}: {} listings examined, fewer than the {} needed",
                    week, examined, settings.minListings());
            return 0;
        }
        Optional<Profile> found = profiles.findAll().stream().findFirst();
        if (found.isEmpty()) {
            log.info("Market research: no suggestions, there is no profile to suggest against");
            return 0;
        }
        Profile profile = found.get();
        List<String> techStack = profile.getTechStack() == null ? List.of() : profile.getTechStack();

        Set<String> listed = skillsTheOwnerLists(profile);
        Set<String> decided = new HashSet<>();
        int pendingFromHere = 0;
        for (ContentSuggestion row : suggestionRows.findByTargetTypeAndTargetIdAndFieldAndStatus(
                TARGET_TYPE, profile.getId(), FIELD, SuggestionService.PENDING)) {
            decided.addAll(added(row));
            if (SOURCE.equals(row.getSource())) pendingFromHere++;
        }
        for (ContentSuggestion row : suggestionRows.findByTargetTypeAndTargetIdAndFieldAndStatus(
                TARGET_TYPE, profile.getId(), FIELD, SuggestionService.REJECTED)) {
            decided.addAll(added(row));
        }

        int room = Math.min(settings.maxSuggestionsPerRun(), settings.maxPendingSuggestions() - pendingFromHere);
        int created = 0;
        for (MarketSkillCount count : summary.skills()) {
            if (created >= room) break;
            String skill = count.getSkill();
            int mentioned = count.getListingsMentioned();
            if (!common(mentioned, examined)) continue;
            // Only names from the dictionary are ever proposed, whatever the table holds.
            Optional<String> name = dictionary.canonical(skill).filter(skill::equals);
            if (name.isEmpty()) continue;
            String key = key(skill);
            if (listed.contains(key) || decided.contains(key)) continue;
            if (techStack.size() >= SuggestionFields.LIST_MAX_ITEMS) {
                log.info("Market research: the tech stack list is full, so nothing more is suggested");
                break;
            }

            List<String> proposed = new ArrayList<>(techStack);
            proposed.add(skill);
            try {
                suggestions.create(new SuggestionRequest(TARGET_TYPE, profile.getId(), FIELD, proposed,
                        reason(skill, mentioned, examined, week), SOURCE));
                created++;
            } catch (SuggestionException e) {
                log.info("Market research: the suggestion for '{}' was not created: {}", skill, e.getMessage());
            }
        }
        log.info("Market research: {} suggestion(s) created for the week of {}", created, week);
        return created;
    }

    /** Mentioned often enough, in absolute and relative terms, to be worth the owner's attention. */
    boolean common(int mentioned, int examined) {
        return mentioned >= settings.minMentions()
                && (long) mentioned * 100 >= (long) settings.minSharePercent() * examined;
    }

    /**
     * The evidence, and the question. Deliberately says nothing about the owner except
     * that the decision is theirs.
     */
    static String reason(String skill, int mentioned, int examined, String week) {
        return "Market research, week of " + week + ": \"" + skill + "\" was mentioned in " + mentioned + " of "
                + examined + " software-developer listings examined at allow-listed firms (source: Adzuna). "
                + "This is what those listings ask for, not a statement about you. "
                + "Accept only if you have real experience with " + skill + "; otherwise reject.";
    }

    /** Everything the owner already lists, anywhere in the content, as comparison keys. */
    private Set<String> skillsTheOwnerLists(Profile profile) {
        Set<String> keys = new HashSet<>();
        addAll(keys, profile.getTechStack());
        if (profile.getSkills() != null) {
            for (Skill skill : profile.getSkills()) {
                if (skill != null) add(keys, skill.getName());
            }
        }
        for (Experience experience : experiences.findAll()) addAll(keys, experience.getTechnologies());
        for (Project project : projects.findAll()) {
            addAll(keys, project.getStack());
            addAll(keys, project.getTags());
        }
        return keys;
    }

    private void addAll(Set<String> keys, Collection<String> items) {
        if (items == null) return;
        for (String item : items) add(keys, item);
    }

    private void add(Set<String> keys, String item) {
        if (item != null && !item.isBlank()) keys.add(key(item));
    }

    /** Two spellings of the same dictionary skill share a key; anything else compares by its own text. */
    private String key(String item) {
        return dictionary.canonical(item).map(SkillDictionary::normalize).orElseGet(() -> SkillDictionary.normalize(item));
    }

    /** The items a techStack suggestion would add: proposed minus the value it was made against. */
    private Set<String> added(ContentSuggestion row) {
        Set<String> before = new HashSet<>();
        for (String item : items(row.getCurrentValue())) before.add(key(item));
        Set<String> result = new HashSet<>();
        for (String item : items(row.getProposedValue())) {
            String key = key(item);
            if (!before.contains(key)) result.add(key);
        }
        return result;
    }

    /** A stored value as a list of text; anything that is not a JSON array of text is no items. */
    private List<String> items(String stored) {
        if (stored == null) return List.of();
        try {
            Object value = mapper.readValue(stored, Object.class);
            if (!(value instanceof List<?> list)) return List.of();
            List<String> result = new ArrayList<>();
            for (Object item : list) {
                if (item instanceof String text) result.add(text);
            }
            return result;
        } catch (RuntimeException e) {
            return List.of();
        }
    }
}
