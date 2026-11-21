package com.resume.model;

import jakarta.persistence.*;

/** How many of one week's examined listings mentioned a skill. */
@Entity
@Table(name = "market_skill_counts")
public class MarketSkillCount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "run_id") private Long runId;
    @Column(length = 100) private String skill;
    @Column(name = "listings_mentioned") private int listingsMentioned;

    public MarketSkillCount() {}

    public MarketSkillCount(Long runId, String skill, int listingsMentioned) {
        this.runId = runId;
        this.skill = skill;
        this.listingsMentioned = listingsMentioned;
    }

    public Long getId() { return id; }
    public Long getRunId() { return runId; }
    public String getSkill() { return skill; }
    public int getListingsMentioned() { return listingsMentioned; }
}
