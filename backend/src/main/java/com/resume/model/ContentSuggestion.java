package com.resume.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * A proposed change to one field of the profile, an experience entry or a project.
 * Nothing here is public: a suggestion only reaches the content tables when the owner
 * accepts it (see {@code SuggestionService}).
 *
 * <p>{@code targetType} and {@code status} are plain strings constrained by CHECKs in
 * {@code supabase/init.sql}; {@code currentValue} and {@code proposedValue} hold the value
 * as JSON text (a string, or an array of strings).
 */
@Entity
@Table(name = "content_suggestions")
public class ContentSuggestion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "target_type") private String targetType;
    @Column(name = "target_id") private Long targetId;
    private String field;
    @Column(name = "current_value", columnDefinition = "text") private String currentValue;
    @Column(name = "proposed_value", columnDefinition = "text") private String proposedValue;
    private String reason;
    private String source;
    private String status;
    @Column(name = "created_at") private LocalDateTime createdAt;
    @Column(name = "decided_at") private LocalDateTime decidedAt;

    @PrePersist
    void onCreate() { if (createdAt == null) createdAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTargetType() { return targetType; }
    public void setTargetType(String targetType) { this.targetType = targetType; }
    public Long getTargetId() { return targetId; }
    public void setTargetId(Long targetId) { this.targetId = targetId; }
    public String getField() { return field; }
    public void setField(String field) { this.field = field; }
    public String getCurrentValue() { return currentValue; }
    public void setCurrentValue(String currentValue) { this.currentValue = currentValue; }
    public String getProposedValue() { return proposedValue; }
    public void setProposedValue(String proposedValue) { this.proposedValue = proposedValue; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getDecidedAt() { return decidedAt; }
    public void setDecidedAt(LocalDateTime decidedAt) { this.decidedAt = decidedAt; }
}
