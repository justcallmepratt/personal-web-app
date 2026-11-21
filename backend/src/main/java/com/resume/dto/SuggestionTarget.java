package com.resume.dto;

import java.util.List;

/**
 * One row a suggestion can point at, with the fields that may be changed and their live
 * values. Drives the "create a suggestion" form, so the form can only offer what the
 * whitelist allows.
 */
public record SuggestionTarget(String targetType, Long targetId, String label, List<Field> fields) {

    /** {@code kind} is "text" or "list"; {@code maxLength} applies to the text or to each list item. */
    public record Field(String name, String kind, boolean required, int maxLength, Object value) {}
}
