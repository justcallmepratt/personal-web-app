package com.resume.service;

import org.springframework.http.HttpStatus;

/**
 * A refusal the caller can act on. {@code code} is stable and machine-readable:
 * {@code invalid} (400), {@code not_found} (404), and with 409 {@code conflict} (the
 * target's value changed since the suggestion was made), {@code not_pending},
 * {@code target_missing} and {@code duplicate}.
 */
public class SuggestionException extends RuntimeException {
    private final HttpStatus status;
    private final String code;
    private final boolean hasLiveValue;
    private final transient Object liveValue;

    private SuggestionException(HttpStatus status, String code, String message, boolean hasLiveValue, Object liveValue) {
        super(message);
        this.status = status;
        this.code = code;
        this.hasLiveValue = hasLiveValue;
        this.liveValue = liveValue;
    }

    public static SuggestionException invalid(String message) {
        return new SuggestionException(HttpStatus.BAD_REQUEST, "invalid", message, false, null);
    }

    public static SuggestionException notFound(String message) {
        return new SuggestionException(HttpStatus.NOT_FOUND, "not_found", message, false, null);
    }

    public static SuggestionException refused(String code, String message) {
        return new SuggestionException(HttpStatus.CONFLICT, code, message, false, null);
    }

    /** The target no longer holds the value the suggestion was made against. */
    public static SuggestionException conflict(String message, Object liveValue) {
        return new SuggestionException(HttpStatus.CONFLICT, "conflict", message, true, liveValue);
    }

    public HttpStatus getStatus() { return status; }
    public String getCode() { return code; }
    /** True only for {@code conflict}; the live value itself may be null. */
    public boolean hasLiveValue() { return hasLiveValue; }
    public Object getLiveValue() { return liveValue; }
}
