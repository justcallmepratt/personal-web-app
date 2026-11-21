-- One-time migration: the market-research tables (weekly job-market summary).
--
-- RUN THIS ON THE LIVE DATABASE BEFORE THE API CODE THAT USES IT IS DEPLOYED.
-- The API starts with Hibernate in `validate` mode, so it will not start if these
-- tables are missing. Railway deploys `main` automatically: run this first, then merge.
--
-- How: Supabase dashboard → SQL editor → paste this file → Run.
-- Safe to run more than once, and it changes no existing table or row.
-- The same definitions are in supabase/init.sql for fresh databases; keep the two in step
-- (PostgresMarketResearchTest fails if they differ).

-- One row per week (week_start is the Monday, UTC). Only counts are kept: no listing text,
-- listing ids or links are stored.
CREATE TABLE IF NOT EXISTS market_research_runs (
    id                  BIGSERIAL PRIMARY KEY,
    week_start          DATE         NOT NULL UNIQUE,
    status              VARCHAR(20)  NOT NULL CHECK (status IN ('completed', 'failed')),
    listings_examined   INTEGER      NOT NULL DEFAULT 0 CHECK (listings_examined >= 0),
    companies_queried   INTEGER      NOT NULL DEFAULT 0 CHECK (companies_queried >= 0),
    api_calls           INTEGER      NOT NULL DEFAULT 0 CHECK (api_calls >= 0),
    suggestions_created INTEGER      NOT NULL DEFAULT 0 CHECK (suggestions_created >= 0),
    error               VARCHAR(500),
    started_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    finished_at         TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- How many of that week's examined listings mentioned each skill.
CREATE TABLE IF NOT EXISTS market_skill_counts (
    id                 BIGSERIAL PRIMARY KEY,
    run_id             BIGINT       NOT NULL REFERENCES market_research_runs (id) ON DELETE CASCADE,
    skill              VARCHAR(100) NOT NULL,
    listings_mentioned INTEGER      NOT NULL CHECK (listings_mentioned > 0),
    UNIQUE (run_id, skill)
);

-- Private data: with row level security on and no policies, Supabase's public Data API
-- roles (anon, authenticated) cannot read or write these tables. The API connects as the
-- table owner, which row level security does not restrict.
ALTER TABLE market_research_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_skill_counts  ENABLE ROW LEVEL SECURITY;
