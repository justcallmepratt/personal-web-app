-- Database initialization — matches JPA entity definitions exactly
-- Used by Docker Compose (supabase/postgres image) for local development

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- profile
CREATE TABLE IF NOT EXISTS profile (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    tagline     VARCHAR(255),
    bio         TEXT,
    email       VARCHAR(255),
    location    VARCHAR(255),
    avatar_url  VARCHAR(500),
    cv_url      VARCHAR(500),
    tech_stack  JSONB NOT NULL DEFAULT '[]',
    socials     JSONB NOT NULL DEFAULT '{}',
    skills      JSONB NOT NULL DEFAULT '[]',
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- projects
CREATE TABLE IF NOT EXISTS projects (
    id               BIGSERIAL PRIMARY KEY,
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    long_description TEXT,
    tags             JSONB NOT NULL DEFAULT '[]',
    stack            JSONB NOT NULL DEFAULT '[]',
    demo_url         VARCHAR(500),
    repo_url         VARCHAR(500),
    image_url        VARCHAR(500),
    featured         BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order       INT NOT NULL DEFAULT 0,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- experience
CREATE TABLE IF NOT EXISTS experience (
    id           BIGSERIAL PRIMARY KEY,
    company      VARCHAR(255) NOT NULL,
    role         VARCHAR(255) NOT NULL,
    location     VARCHAR(255),
    start_date   DATE NOT NULL,
    end_date     DATE,
    current      BOOLEAN NOT NULL DEFAULT FALSE,
    description  TEXT,
    highlights   JSONB NOT NULL DEFAULT '[]',
    technologies JSONB NOT NULL DEFAULT '[]',
    sort_order   INT NOT NULL DEFAULT 0
);

-- messages
CREATE TABLE IF NOT EXISTS messages (
    id       BIGSERIAL PRIMARY KEY,
    name     VARCHAR(255) NOT NULL,
    email    VARCHAR(255) NOT NULL,
    subject  VARCHAR(255) NOT NULL,
    body     TEXT NOT NULL,
    read     BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- indexes
CREATE INDEX IF NOT EXISTS idx_projects_featured  ON projects(featured);
CREATE INDEX IF NOT EXISTS idx_projects_sort      ON projects(sort_order);
CREATE INDEX IF NOT EXISTS idx_experience_sort    ON experience(sort_order);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at   ON messages(sent_at DESC);

-- GIN indexes on JSONB columns (containment queries such as tags @> '["java"]').
-- These exist in the hosted Supabase database; defined here so a fresh database matches it.
CREATE INDEX IF NOT EXISTS idx_projects_tags_gin    ON projects   USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_projects_stack_gin   ON projects   USING GIN (stack);
CREATE INDEX IF NOT EXISTS idx_experience_tech_gin  ON experience USING GIN (technologies);
CREATE INDEX IF NOT EXISTS idx_profile_skills_gin   ON profile    USING GIN (skills);
