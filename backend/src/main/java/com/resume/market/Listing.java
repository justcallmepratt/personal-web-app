package com.resume.market;

/**
 * One job listing as far as the research needs it. Held in memory during a run only:
 * listings are never written to the database or the logs.
 */
public record Listing(String id, String title, String company, String description) {}
