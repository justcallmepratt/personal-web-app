package com.resume.dto;

/**
 * Body of {@code POST /api/admin/suggestions}. {@code proposedValue} is a JSON string for
 * a text field or an array of strings for a list field; it is typed {@code Object} so the
 * service can reject anything else with a clear message. {@code targetId} may be omitted
 * for the profile (there is one). {@code source} defaults to "manual".
 */
public record SuggestionRequest(
        String targetType,
        Long targetId,
        String field,
        Object proposedValue,
        String reason,
        String source
) {}
