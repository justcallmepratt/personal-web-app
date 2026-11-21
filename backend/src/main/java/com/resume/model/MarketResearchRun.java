package com.resume.model;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * One week of job-market research: at most one row per week ({@code weekStart} is the
 * Monday, UTC). {@code status} is {@code completed} or {@code failed}; only a completed
 * row has skill counts ({@link MarketSkillCount}). Nothing about individual listings is
 * stored.
 */
@Entity
@Table(name = "market_research_runs")
public class MarketResearchRun {
    public static final String COMPLETED = "completed";
    public static final String FAILED = "failed";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "week_start") private LocalDate weekStart;
    private String status;
    @Column(name = "listings_examined") private int listingsExamined;
    @Column(name = "companies_queried") private int companiesQueried;
    @Column(name = "api_calls") private int apiCalls;
    @Column(name = "suggestions_created") private int suggestionsCreated;
    @Column(length = 500) private String error;
    @Column(name = "started_at") private LocalDateTime startedAt;
    @Column(name = "finished_at") private LocalDateTime finishedAt;

    public boolean isCompleted() { return COMPLETED.equals(status); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDate getWeekStart() { return weekStart; }
    public void setWeekStart(LocalDate weekStart) { this.weekStart = weekStart; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getListingsExamined() { return listingsExamined; }
    public void setListingsExamined(int listingsExamined) { this.listingsExamined = listingsExamined; }
    public int getCompaniesQueried() { return companiesQueried; }
    public void setCompaniesQueried(int companiesQueried) { this.companiesQueried = companiesQueried; }
    public int getApiCalls() { return apiCalls; }
    public void setApiCalls(int apiCalls) { this.apiCalls = apiCalls; }
    public int getSuggestionsCreated() { return suggestionsCreated; }
    public void setSuggestionsCreated(int suggestionsCreated) { this.suggestionsCreated = suggestionsCreated; }
    public String getError() { return error; }
    public void setError(String error) { this.error = error; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
    public LocalDateTime getFinishedAt() { return finishedAt; }
    public void setFinishedAt(LocalDateTime finishedAt) { this.finishedAt = finishedAt; }
}
