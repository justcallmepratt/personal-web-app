package com.resume.market;

/**
 * The listings source could not be read. The message is safe to log and store: it never
 * contains the request address, which carries the API credentials.
 */
public class ListingsException extends RuntimeException {
    private final int apiCalls;

    public ListingsException(String message, int apiCalls) {
        super(message);
        this.apiCalls = apiCalls;
    }

    /** HTTP requests made for the failed query, retries included. */
    public int apiCalls() { return apiCalls; }
}
