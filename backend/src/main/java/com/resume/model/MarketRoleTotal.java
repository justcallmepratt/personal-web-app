package com.resume.model;

import jakarta.persistence.*;

/** How many listings of one role were examined in one week. */
@Entity
@Table(name = "market_role_totals")
public class MarketRoleTotal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "run_id") private Long runId;
    @Column(length = 50) private String role;
    @Column(name = "listings_examined") private int listingsExamined;

    public MarketRoleTotal() {}

    public MarketRoleTotal(Long runId, String role, int listingsExamined) {
        this.runId = runId;
        this.role = role;
        this.listingsExamined = listingsExamined;
    }

    public Long getId() { return id; }
    public Long getRunId() { return runId; }
    public String getRole() { return role; }
    public int getListingsExamined() { return listingsExamined; }
}
