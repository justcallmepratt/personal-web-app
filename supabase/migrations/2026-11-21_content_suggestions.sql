-- One-time migration: the content_suggestions table (suggest-and-approve).
--
-- RUN THIS ON THE LIVE DATABASE BEFORE THE API CODE THAT USES IT IS DEPLOYED.
-- The API starts with Hibernate in `validate` mode, so it will not start if this
-- table is missing. Railway deploys `main` automatically: run this first, then merge.
--
-- How: Supabase dashboard → SQL editor → paste this file → Run.
-- Safe to run more than once, and it changes no existing table or row.
-- The same definition is in supabase/init.sql for fresh databases; keep the two in step
-- (PostgresSuggestionTest fails if they differ).

CREATE TABLE IF NOT EXISTS content_suggestions (
    id             BIGSERIAL PRIMARY KEY,
    target_type    VARCHAR(20)  NOT NULL CHECK (target_type IN ('profile', 'experience', 'project')),
    target_id      BIGINT       NOT NULL,
    field          VARCHAR(50)  NOT NULL,
    current_value  TEXT,
    proposed_value TEXT         NOT NULL,
    reason         VARCHAR(500) NOT NULL,
    source         VARCHAR(50)  NOT NULL DEFAULT 'manual',
    status         VARCHAR(20)  NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'accepted', 'rejected', 'superseded')),
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    decided_at     TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_content_suggestions_status_created
    ON content_suggestions (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_suggestions_target
    ON content_suggestions (target_type, target_id, field);

-- Private data: with row level security on and no policies, Supabase's public Data API
-- roles (anon, authenticated) cannot read or write this table. The API connects as the
-- table owner, which row level security does not restrict.
ALTER TABLE content_suggestions ENABLE ROW LEVEL SECURITY;
