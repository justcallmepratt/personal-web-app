# JobSync importer

A command-line tool, `tools/jobsync-importer/`, that reads the jobs you track in
[JobSync](https://github.com/Gsync/jobsync) and proposes additions to the profile tech
stack through the [content suggestions](CODEBASE_STRUCTURE.md#content-suggestions-suggest-and-approve)
queue. It only proposes. Nothing reaches the site until you accept a suggestion at
`/admin/suggestions`.

Written 2026-11-21. Part 1 is how to use it, part 2 is its limits, part 3 is the research
behind it.

## 1. Using it

### What it does on each run

1. Reads a JobSync backup file. It never connects to JobSync and never writes to the file.
2. Keeps the tracked jobs that match your targets: a title in
   `data/target-titles.json` (software developer, forward deployed engineer and their
   variants) at a company on the allow-list. Jobs an automation found that you have not
   accepted into the tracker are left out.
3. Finds the skills in `data/skills-dictionary.json` that those jobs ask for, in the
   description and the tags, counting each skill once per job.
4. Reads your public profile (`GET /api/profile`) and drops every skill already in the
   tech stack.
5. Proposes at most three (never more than five) of the rest, most asked-for first. Each
   one adds a single item to the profile tech stack, with source `jobsync` and a reason
   like: *"Kubernetes" is asked for in 3 of your 4 tracked jobs that match your targets …
   It is not on your profile. Is it true of you? Accept only if you have real experience
   with it; reject if not.*

By default it prints these and stops (a dry run). With `--file` it signs in and files them.

### The company allow-list

Your rule: only companies that are on the Fortune 500 and are, or own, a FINRA member
broker-dealer. The tool does not know which companies those are and never guesses.

- **There is one list, and it lives in the backend:**
  `backend/src/main/resources/market/allow-list.json`, the reviewed list the weekly market
  research also uses. Run from this repository,
  the tool reads that file by default; nothing is copied. To add, drop or correct a
  company, edit that file, and both tools follow.
- The tool applies the backend's rule (`AllowList.java`) to it. An entry is used only when
  `"included"` is `true` and it has a `fortune500.rank` from 1 to 500, at least one `finra`
  firm with a name and a `crd` number, and at least one alias. An entry marked
  `"included": false` is left out and counted; an entry marked included but missing any of
  that is ignored and reported, so an incomplete edit can only shrink the list.
- A company matches when one of its **aliases** appears as whole words in the company name
  on the JobSync job, ignoring case and punctuation: the alias `citi` matches "Citi" and
  "Citi Group", and never "Citizens Bank". The company's own `name` is not an alias (a name
  like "Block" is too generic), so if a spelling you use in JobSync is not matched, add it
  to that entry's `aliases`. A dry run lists the companies in your tracker that had a
  matching title and were left out, so you can see what is missing.
- `--allowlist <path>` or `JOBSYNC_ALLOWLIST` points the tool at another file. If the
  backend file is absent (the tool copied out of the repository), it falls back to
  `tools/jobsync-importer/data/companies-allowlist.json`, which ships **empty**: no job
  matches and the tool proposes nothing. A backend file that is present but unreadable
  stops the run; it does not fall back.
- Those other files may use the backend's format or the tool's own simpler one:
  `{"companies": [{"name": "…", "aliases": ["…"], "fortune500": true,
  "finraRegulated": true, "source": "…"}]}`. There an entry counts only when both flags
  are literally `true`, and it matches a whole company name by its name or an alias,
  ignoring case, punctuation and a trailing legal form (Inc., LLC, & Co., N.A.).
- "In financial services" is not tested separately: every allow-listed company is, or
  owns, a FINRA member, which is the narrower condition.

### One-time setup

1. **Install JobSync** (not done on this Mac as of 2026-11-21). It needs Docker Desktop
   running:

   ```bash
   git clone https://github.com/Gsync/jobsync.git
   ```

   ```bash
   cd jobsync && docker compose up -d
   ```

   Open `http://localhost:3737`, create your account and add jobs. Paste the full job
   description when you add one: the importer has nothing else to read.
2. **Node 22 or newer** is all the importer needs. It has no dependencies, so there is
   nothing to install.
3. **Make a folder for backups** outside Downloads, Desktop and Documents (macOS blocks
   scheduled jobs from those), for example `~/jobsync-backups`.

### Each week

1. In JobSync: avatar menu → **Settings → Data → Download backup**. Move the
   `jobsync-backup-YYYY-MM-DD.zip` into `~/jobsync-backups`. The importer uses the newest
   one in the folder. The file holds every job description, note and resume on your
   account, so keep it private and delete old ones.
2. Dry run:

   ```bash
   node tools/jobsync-importer/bin/jobsync-importer.mjs --backup ~/jobsync-backups --api-url https://personal-web-app-api-production.up.railway.app
   ```

3. If the proposals look right, file them. Add `--file`; you are asked for the admin
   username and password (typing is not echoed). Nothing is stored.

   ```bash
   node tools/jobsync-importer/bin/jobsync-importer.mjs --backup ~/jobsync-backups --api-url https://personal-web-app-api-production.up.railway.app --file
   ```

   To skip the prompts, set `SITE_ADMIN_USERNAME` and `SITE_ADMIN_PASSWORD` in the
   environment for that one command, for example from your password manager's
   command-line tool. Do not put them in a file, a shell profile or the launchd job.
4. Open `/admin/suggestions`, accept what is true of you and reject the rest. A rejected
   skill is not proposed again.

All the suggestions change the same field, so accepting one marks the other pending ones
"superseded" (that is how the queue works: they were made against the old value). Reject
the ones that are not true first, accept one, then run the importer again to refile the
rest.

Filing needs admin sign-in to be on ([Turn on admin](DEPLOYMENT.md#turn-on-admin)); until
then `--file` reports "Admin sign-in is not switched on" and stops.

### Options

`--help` lists them. The ones you may want: `--min-jobs <n>` (how many matching jobs must
ask for a skill, default 2), `--max <n>` (suggestions per run, default 3, at most 5),
`--exclude-status <status>` (leave out, say, `archived` jobs; repeatable), `--titles`,
`--skills` and `--allowlist` (other data files), `--profile-file` (dry run from a saved
copy of the profile, no network), `--max-age-days` (when to warn about an old backup,
default 8). `JOBSYNC_BACKUP` and `SITE_API_URL` stand in for `--backup` and `--api-url`.

Exit codes: `0` done, including "nothing to do"; `1` the run failed part-way (API down,
sign-in refused, a suggestion refused); `2` it could not start (options, a data file, the
backup).

### Scheduling it weekly on a Mac

The scheduled job is a **dry run**: it cannot file, because filing needs your password and
the tool does not store one. It writes what it would file to a log; you then run `--file`
by hand.

1. Copy `tools/jobsync-importer/launchd/dev.justcallmepratt.jobsync-importer.plist.example`
   to `~/Library/LaunchAgents/dev.justcallmepratt.jobsync-importer.plist` and replace the
   three `/Users/YOU/...` paths (`which node` gives the first).
2. Load it:

   ```bash
   launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/dev.justcallmepratt.jobsync-importer.plist
   ```

3. It runs on Mondays at 09:00 (or at the next wake). Read
   `~/Library/Logs/jobsync-importer.log`. To run it now:

   ```bash
   launchctl kickstart gui/$(id -u)/dev.justcallmepratt.jobsync-importer
   ```

4. To remove it:

   ```bash
   launchctl bootout gui/$(id -u)/dev.justcallmepratt.jobsync-importer
   ```

It still needs a fresh backup each week; with an old one it runs and warns.

### When something is wrong

| Situation | What the tool does |
|---|---|
| No backup at the path, or no `jobsync-backup-*.zip` in the folder | Says so and how to download one; exit 2 |
| Backup cannot be opened (permissions, still being written) | Says which; exit 2. For a scheduled job, keep backups outside Downloads |
| Download cut short, another zip, or the jobs CSV | "not a complete zip" / "not a JobSync backup"; exit 2 |
| Backup in a newer format, or without the expected tables | Refuses and names the format version; exit 2. The tool needs updating |
| Some job rows lack a title, company or description | Skips and counts them |
| JobSync has no jobs, none match, or the allow-list is empty | Says so; exit 0 |
| API down, slow (10 s) or answering nonsense | Says which; exit 1; nothing filed |
| Sign-in refused, locked (429) or switched off (503) | One attempt, then stops; exit 1. Never retried, because the API locks sign-in after 5 failures |
| API rate limits another call (429) | Waits for `Retry-After` (up to 2 minutes, twice), then gives up |
| The API address forwards elsewhere (a redirect) | Not followed, so the password and token never go to another host; says so; exit 1. Give the final https address |
| The secure connection fails (certificate) | Says so with the cause; nothing is sent; exit 1 |
| You press Ctrl-C at the password prompt | "Cancelled at the prompt"; no sign-in is attempted; exit 1 |
| The same posting is in JobSync twice (same title, company and description) | Counted once, and reported |
| A very long job description | Only its first 200,000 characters are read |
| A skill whose name is too long for a suggestion (roughly 190 characters and up), or that cannot be worded as a question | Left out and named; the rest of the run continues |
| Text in a backup or from the server contains control characters | Replaced by spaces before anything is printed or put in a reason |
| The same suggestion is pending, or you rejected that skill | Skipped, with the reason |
| A suggestion fails part-way | The ones already filed stay; the error is shown; exit 1. Running again does not duplicate them |

## 2. Limits

- **It reads a backup you download, not JobSync live.** JobSync's database is a Postgres
  inside Docker with no published port, and JobSync has no token-authenticated export
  (see part 3), so a fully hands-off weekly run is not possible without opening that
  database to the host. A direct, read-only database reader is the natural follow-up if
  the weekly download becomes a chore.
- **It has not been run against a real JobSync.** Docker is not running on this Mac, so
  the backup reader was written from JobSync's source (its backup schema, version 1,
  JobSync 1.2.1) and tested on synthetic backups in that layout. Check the first real dry
  run by eye.
- **It has not been run against the live API.** The client was written from the backend
  source and tested against a mock server.
- **Keyword matching, not understanding.** A skill counts when its name or an alias
  appears as a whole word. It does not tell "required" from "nice to have", and a skill
  missing from the dictionary is never found. Edit the dictionary as you go.
- **One kind of proposal:** adding one skill to the profile tech stack. It never touches
  experience, projects, the bio or the skills list (the API does not allow suggestions for
  the skills list).
- **The queue check sees the newest 200 suggestions** (the API's limit). Past that, an old
  rejection could be missed and a skill proposed again; the tool says when the list is
  that long.
- **The fallback content file** `frontend/src/content/index.ts` is not updated by an
  accept; that is the existing behaviour of suggestions, not something this tool changes.

## 3. Research: JobSync (2026-11-21)

Read from the repository at commit
[`4be4faa`](https://github.com/Gsync/jobsync/tree/4be4faa0a3132358157f0446388a1b6db255e10c)
(`main`, release v1.2.1 of 2026-11-14). Not installed or run: Docker is not running here,
and its other way to run (`npm run dev`) needs a Postgres server, which would mean
installing software beyond this tool.

| Question | Finding | Source |
|---|---|---|
| What is it | A self-hosted job-application tracker (Next.js, Prisma) with resume storage, contacts, interviews, tasks, AI resume review and job matching, automated job discovery and an MCP server | [README](https://github.com/Gsync/jobsync/blob/4be4faa0a3132358157f0446388a1b6db255e10c/README.md) |
| Licence | MIT, "Copyright (c) 2024 gsync" | [LICENSE](https://github.com/Gsync/jobsync/blob/4be4faa0a3132358157f0446388a1b6db255e10c/LICENSE) |
| How it runs | `docker compose up`: an app container (`ghcr.io/gsync/jobsync`, port 3737) and a database container (`pgvector/pgvector:pg18`). Local development without Docker needs `DATABASE_URL` pointing at a Postgres | [docker-compose.yml](https://github.com/Gsync/jobsync/blob/4be4faa0a3132358157f0446388a1b6db255e10c/docker-compose.yml), [.env.example](https://github.com/Gsync/jobsync/blob/4be4faa0a3132358157f0446388a1b6db255e10c/.env.example) |
| Where data lives | **PostgreSQL**, in the Docker volume `jobsync_pgdata`. The database port is not published; an opt-in file publishes 5432, and its comment warns the default password is public. Uploaded resumes are files under `./jobsyncdb/data`. Earlier releases used SQLite; 1.2.0 migrated, one-way | [docker-compose.yml](https://github.com/Gsync/jobsync/blob/4be4faa0a3132358157f0446388a1b6db255e10c/docker-compose.yml), [docker-compose.lan-db.yml](https://github.com/Gsync/jobsync/blob/4be4faa0a3132358157f0446388a1b6db255e10c/docker-compose.lan-db.yml), README "Updating" |
| What a tracked job holds | `Job`: `description` (text), `jobType`, `workplaceType`, `jobUrl`, `salaryRange`, `createdAt`, `applied`, `appliedDate`, `dueDate`, `matchScore`, `discoveryStatus`; links to `JobTitle`, `Company` (with optional `industry`), `Location`, `JobSource`, `JobStatus` (new, draft, applied, interview, offer, rejected, expired, archived, withdrawn and others) and many `Tag`s. A resume's skills are tags too | [schema.prisma](https://github.com/Gsync/jobsync/blob/4be4faa0a3132358157f0446388a1b6db255e10c/prisma/schema.prisma), [constants.ts](https://github.com/Gsync/jobsync/blob/4be4faa0a3132358157f0446388a1b6db255e10c/src/lib/constants.ts) |
| CSV export | `POST /api/jobs/export`, browser session only. Eleven columns (dates, company, title, type, location, source, status); **no description and no tags**, so it cannot feed skill extraction | [route.ts](https://github.com/Gsync/jobsync/blob/4be4faa0a3132358157f0446388a1b6db255e10c/src/app/api/jobs/export/route.ts) |
| Data Backup | Settings → Data → Download backup (`GET /api/backup/export`, browser session only): a zip with `manifest.json` (`formatVersion: 1`, `appVersion`, `exportedAt`) and `data.json`, one array per table for the signed-in account, job tags as `_JobToTag` id pairs, the status as `statusValue`. Leaves out API keys, MCP tokens and the password | [wiki/backup.md](https://github.com/Gsync/jobsync/blob/4be4faa0a3132358157f0446388a1b6db255e10c/wiki/backup.md), [export.ts](https://github.com/Gsync/jobsync/blob/4be4faa0a3132358157f0446388a1b6db255e10c/src/lib/backup/export.ts), [schema.ts](https://github.com/Gsync/jobsync/blob/4be4faa0a3132358157f0446388a1b6db255e10c/src/lib/backup/schema.ts) |
| An API | No token-authenticated REST endpoint for reading jobs was found among the routes under `src/app/api`. The MCP server (`/api/mcp`, bearer token from Settings → MCP Access) has `add_job`, `find_job`, `update_job` and others; `find_job` demands the `jobs:write` scope, so reading through it needs a write-capable token. What `find_job` returns was not read: **unconfirmed** whether it could list every job with its description | [mcp/route.ts](https://github.com/Gsync/jobsync/blob/4be4faa0a3132358157f0446388a1b6db255e10c/src/app/api/mcp/route.ts) |
| Whole-instance dump | `backup-db.sh` runs `pg_dump` through Docker into `jobsyncdb/data/backups/*.sql.gz` | [backup-db.sh](https://github.com/Gsync/jobsync/blob/4be4faa0a3132358157f0446388a1b6db255e10c/backup-db.sh) |

**Unconfirmed:** everything above is from source, not from a running instance; that a
backup made by a real JobSync 1.2.1 loads in this tool; the wiki's "Upgrading to
Postgres" page was not read.

### Why this shape

JobSync runs on your machine and the site's API on Railway, so the API cannot reach it;
something local has to carry the data across. Among the local options:

| Read from | Verdict |
|---|---|
| **Data Backup zip** (chosen) | Read-only by construction (a file), needs no database credentials or open port, carries descriptions and tags, has a version number to check, and needs no dependency. Cost: a manual download each week |
| Postgres directly | Hands-off, but needs the database published to the host (public default password unless changed) or `docker exec`, and a database driver. The table layout has no version to check. Possible follow-up |
| CSV export | No descriptions or tags |
| MCP server | Built for adding jobs; needs a write-scoped token for a read-only task |

The tool is plain JavaScript on Node (already required by the repository's three apps),
with no dependencies, so there is no lockfile to maintain or audit. It files through the
existing `POST /api/admin/suggestions`; the API, the admin app and the site are unchanged.
