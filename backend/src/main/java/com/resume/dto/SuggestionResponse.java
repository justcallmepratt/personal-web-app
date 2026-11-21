package com.resume.dto;

import java.time.LocalDateTime;

/**
 * A suggestion as the admin app sees it. {@code currentValue} is the value recorded when
 * the suggestion was made, not the live one; both values are a string, an array of
 * strings, or null. {@code targetLabel} is null when the target row no longer exists.
 */
public record SuggestionResponse(
        Long id,
        String targetType,
        Long targetId,
        String targetLabel,
        String field,
        String fieldKind,
        Object currentValue,
        Object proposedValue,
        String reason,
        String source,
        String status,
        LocalDateTime createdAt,
        LocalDateTime decidedAt
) {}
