package com.resume.service;

import com.resume.dto.SuggestionRequest;
import com.resume.dto.SuggestionResponse;
import com.resume.dto.SuggestionTarget;
import com.resume.model.ContentSuggestion;
import com.resume.model.Experience;
import com.resume.model.Profile;
import com.resume.model.Project;
import com.resume.repository.ContentSuggestionRepository;
import com.resume.repository.ExperienceRepository;
import com.resume.repository.ProfileRepository;
import com.resume.repository.ProjectRepository;
import com.resume.service.SuggestionFields.Field;
import com.resume.service.SuggestionFields.Kind;
import com.resume.service.SuggestionFields.TargetType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

/**
 * Suggest-and-approve for profile, experience and project content.
 *
 * <p>A suggestion records one proposed value for one whitelisted field, together with the
 * value the field held at that moment. It changes nothing until it is accepted. Accepting
 * re-reads the target under a row lock and applies the change only if the field still
 * holds the recorded value; otherwise it refuses and nothing is written.
 *
 * <p>States: {@code pending} → {@code accepted} | {@code rejected} | {@code superseded}
 * (another suggestion for the same field was accepted first). Decided states are final.
 */
@Service
public class SuggestionService {
    public static final String PENDING = "pending";
    public static final String ACCEPTED = "accepted";
    public static final String REJECTED = "rejected";
    public static final String SUPERSEDED = "superseded";
    static final Set<String> STATUSES = Set.of(PENDING, ACCEPTED, REJECTED, SUPERSEDED);

    public static final String DEFAULT_SOURCE = "manual";
    public static final int REASON_MAX = 500;
    public static final int SOURCE_MAX = 50;

    private final ContentSuggestionRepository suggestions;
    private final ProfileRepository profiles;
    private final ExperienceRepository experiences;
    private final ProjectRepository projects;
    private final ObjectMapper mapper;

    public SuggestionService(ContentSuggestionRepository suggestions,
                             ProfileRepository profiles,
                             ExperienceRepository experiences,
                             ProjectRepository projects,
                             ObjectMapper mapper) {
        this.suggestions = suggestions;
        this.profiles = profiles;
        this.experiences = experiences;
        this.projects = projects;
        this.mapper = mapper;
    }

    // ── reading ──────────────────────────────────────────────────────────────

    /** Newest first, at most 200; {@code status} null or blank means every status. */
    @Transactional(readOnly = true)
    public List<SuggestionResponse> list(String status) {
        List<ContentSuggestion> rows;
        if (status == null || status.isBlank()) {
            rows = suggestions.findTop200ByOrderByCreatedAtDescIdDesc();
        } else if (STATUSES.contains(status)) {
            rows = suggestions.findTop200ByStatusOrderByCreatedAtDescIdDesc(status);
        } else {
            throw SuggestionException.invalid("Unknown status. Use pending, accepted, rejected or superseded.");
        }
        Map<String, Optional<String>> labels = new HashMap<>();
        return rows.stream().map(s -> toResponse(s, labels)).toList();
    }

    @Transactional(readOnly = true)
    public SuggestionResponse get(Long id) {
        ContentSuggestion s = suggestions.findById(id).orElseThrow(SuggestionService::noSuchSuggestion);
        return toResponse(s, new HashMap<>());
    }

    /** Every row a suggestion can point at, with its changeable fields and their live values. */
    @Transactional(readOnly = true)
    public List<SuggestionTarget> targets() {
        List<SuggestionTarget> result = new ArrayList<>();
        profiles.findAll().stream().findFirst()
                .ifPresent(p -> result.add(target(TargetType.PROFILE, p.getId(), p)));
        for (Experience e : experiences.findAllByOrderBySortOrderAsc()) {
            result.add(target(TargetType.EXPERIENCE, e.getId(), e));
        }
        for (Project p : projects.findAllByOrderBySortOrderAsc()) {
            result.add(target(TargetType.PROJECT, p.getId(), p));
        }
        return result;
    }

    // ── proposing ────────────────────────────────────────────────────────────

    /** Records a pending suggestion. The target row is read, never written. */
    @Transactional
    public SuggestionResponse create(SuggestionRequest req) {
        TargetType type = TargetType.parse(req.targetType()).orElseThrow(() ->
                SuggestionException.invalid("Unknown target. Use profile, experience or project."));
        Field field = SuggestionFields.find(type, req.field()).orElseThrow(() ->
                SuggestionException.invalid("That field cannot be changed through suggestions."));

        Object entity = loadForProposal(type, req.targetId());
        Long targetId = idOf(entity);

        Object proposed = field.validate(req.proposedValue());
        Object current = field.read(entity);
        if (Objects.equals(proposed, current)) {
            throw SuggestionException.invalid("The proposed value is the same as the current one.");
        }

        String reason = req.reason() == null ? "" : req.reason().strip();
        if (reason.isEmpty()) throw SuggestionException.invalid("A reason is required.");
        if (reason.length() > REASON_MAX) {
            throw SuggestionException.invalid("The reason is limited to " + REASON_MAX + " characters.");
        }
        String source = req.source() == null || req.source().isBlank() ? DEFAULT_SOURCE : req.source().strip();
        if (source.length() > SOURCE_MAX) {
            throw SuggestionException.invalid("The source is limited to " + SOURCE_MAX + " characters.");
        }

        // An automatic source that runs again must not pile up copies of the same proposal.
        boolean duplicate = suggestions
                .findByTargetTypeAndTargetIdAndFieldAndStatus(type.value(), targetId, field.name(), PENDING)
                .stream().anyMatch(other -> Objects.equals(decode(other.getProposedValue()), proposed));
        if (duplicate) {
            throw SuggestionException.refused("duplicate", "The same change is already waiting for a decision.");
        }

        ContentSuggestion s = new ContentSuggestion();
        s.setTargetType(type.value());
        s.setTargetId(targetId);
        s.setField(field.name());
        s.setCurrentValue(current == null ? null : encode(current));
        s.setProposedValue(encode(proposed));
        s.setReason(reason);
        s.setSource(source);
        s.setStatus(PENDING);
        s.setCreatedAt(LocalDateTime.now());
        return toResponse(suggestions.save(s), new HashMap<>());
    }

    // ── deciding ─────────────────────────────────────────────────────────────

    /**
     * Applies the one field change and marks the suggestion accepted, in one transaction.
     * Refuses, changing nothing, when the suggestion is already decided, the target row is
     * gone, or the field no longer holds the value recorded with the suggestion.
     */
    @Transactional
    public SuggestionResponse accept(Long id) {
        ContentSuggestion s = lockPending(id);

        // Checked again here: a row may have been written by another tool, or the
        // whitelist may have been narrowed since the suggestion was made.
        Optional<TargetType> type = TargetType.parse(s.getTargetType());
        Optional<Field> known = type.flatMap(t -> SuggestionFields.find(t, s.getField()));
        if (known.isEmpty()) {
            throw SuggestionException.invalid("That field cannot be changed through suggestions. Reject this suggestion.");
        }
        Field field = known.get();
        Object entity = loadForUpdate(type.get(), s.getTargetId()).orElseThrow(() ->
                SuggestionException.refused("target_missing",
                        "The " + s.getTargetType() + " this suggestion points at no longer exists. Reject this suggestion."));

        Object live = field.read(entity);
        if (!Objects.equals(live, decode(s.getCurrentValue()))) {
            throw SuggestionException.conflict(
                    "'" + field.name() + "' has changed since this suggestion was made, so it was not applied. "
                            + "Reject it and make a new suggestion against the current value.", live);
        }

        field.write(entity, field.validate(decode(s.getProposedValue())));
        save(type.get(), entity);

        LocalDateTime now = LocalDateTime.now();
        s.setStatus(ACCEPTED);
        s.setDecidedAt(now);
        ContentSuggestion saved = suggestions.save(s);

        // The other pending suggestions for this field were made against the old value.
        for (ContentSuggestion other : suggestions.findByTargetTypeAndTargetIdAndFieldAndStatus(
                s.getTargetType(), s.getTargetId(), s.getField(), PENDING)) {
            if (other.getId().equals(saved.getId())) continue;
            other.setStatus(SUPERSEDED);
            other.setDecidedAt(now);
            suggestions.save(other);
        }
        return toResponse(saved, new HashMap<>());
    }

    /** Marks the suggestion rejected. Touches nothing else. */
    @Transactional
    public SuggestionResponse reject(Long id) {
        ContentSuggestion s = lockPending(id);
        s.setStatus(REJECTED);
        s.setDecidedAt(LocalDateTime.now());
        return toResponse(suggestions.save(s), new HashMap<>());
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private ContentSuggestion lockPending(Long id) {
        ContentSuggestion s = suggestions.findByIdForUpdate(id).orElseThrow(SuggestionService::noSuchSuggestion);
        if (!PENDING.equals(s.getStatus())) {
            throw SuggestionException.refused("not_pending", "This suggestion was already " + s.getStatus() + ".");
        }
        return s;
    }

    private static SuggestionException noSuchSuggestion() {
        return SuggestionException.notFound("That suggestion does not exist.");
    }

    private Object loadForProposal(TargetType type, Long targetId) {
        if (type == TargetType.PROFILE && targetId == null) {
            // There is one profile; callers need not know its id.
            return profiles.findAll().stream().findFirst().map(Object.class::cast)
                    .orElseThrow(() -> SuggestionException.notFound("There is no profile yet."));
        }
        if (targetId == null) throw SuggestionException.invalid("A target id is required.");
        return find(type, targetId).orElseThrow(() ->
                SuggestionException.notFound("That " + type.value() + " does not exist."));
    }

    private Optional<Object> find(TargetType type, Long id) {
        return switch (type) {
            case PROFILE -> profiles.findById(id).map(Object.class::cast);
            case EXPERIENCE -> experiences.findById(id).map(Object.class::cast);
            case PROJECT -> projects.findById(id).map(Object.class::cast);
        };
    }

    private Optional<Object> loadForUpdate(TargetType type, Long id) {
        return switch (type) {
            case PROFILE -> profiles.findByIdForUpdate(id).map(Object.class::cast);
            case EXPERIENCE -> experiences.findByIdForUpdate(id).map(Object.class::cast);
            case PROJECT -> projects.findByIdForUpdate(id).map(Object.class::cast);
        };
    }

    private void save(TargetType type, Object entity) {
        switch (type) {
            case PROFILE -> profiles.save((Profile) entity);
            case EXPERIENCE -> experiences.save((Experience) entity);
            case PROJECT -> projects.save((Project) entity);
        }
    }

    private static Long idOf(Object entity) {
        if (entity instanceof Profile p) return p.getId();
        if (entity instanceof Experience e) return e.getId();
        return ((Project) entity).getId();
    }

    private static String labelOf(Object entity) {
        if (entity instanceof Profile) return "Profile";
        if (entity instanceof Experience e) return e.getRole() + " at " + e.getCompany();
        return ((Project) entity).getTitle();
    }

    private SuggestionTarget target(TargetType type, Long id, Object entity) {
        List<SuggestionTarget.Field> fields = SuggestionFields.of(type).stream()
                .map(f -> new SuggestionTarget.Field(
                        f.name(), f.kind().value(), f.required(), f.maxLength(), f.read(entity)))
                .toList();
        return new SuggestionTarget(type.value(), id, labelOf(entity), fields);
    }

    private SuggestionResponse toResponse(ContentSuggestion s, Map<String, Optional<String>> labels) {
        Optional<TargetType> type = TargetType.parse(s.getTargetType());
        Object proposed = decode(s.getProposedValue());
        String kind = type.flatMap(t -> SuggestionFields.find(t, s.getField()))
                .map(Field::kind)
                .orElse(proposed instanceof List ? Kind.LIST : Kind.TEXT)
                .value();
        String label = labels.computeIfAbsent(s.getTargetType() + ":" + s.getTargetId(), key ->
                type.flatMap(t -> find(t, s.getTargetId())).map(SuggestionService::labelOf)).orElse(null);
        return new SuggestionResponse(s.getId(), s.getTargetType(), s.getTargetId(), label, s.getField(), kind,
                decode(s.getCurrentValue()), proposed, s.getReason(), s.getSource(), s.getStatus(),
                s.getCreatedAt(), s.getDecidedAt());
    }

    private String encode(Object value) {
        return mapper.writeValueAsString(value);
    }

    /**
     * Stored values are JSON text. A row written by hand may hold plain text instead;
     * that is read as the text itself rather than failing the whole request.
     */
    private Object decode(String stored) {
        if (stored == null) return null;
        try {
            return mapper.readValue(stored, Object.class);
        } catch (JacksonException e) {
            return stored;
        }
    }
}
