# job-scout

Once a week, finds open software developer postings that fit the resume and adds the best
new ones to the local [JobSync](https://github.com/Gsync/jobsync). Then it hands every
tracked job to [`tools/jobsync-importer`](../jobsync-importer/README.md), which logs the
skill suggestions it would file at `/admin/suggestions`.

It only searches and reads postings. It never applies, submits a form or contacts anyone.
Jobs go into JobSync as **New** with `applied: false`; JobSync 1.2.1 has no "Saved" status.

## The weekly run (`weekly.sh`)

1. Starts Colima and JobSync if they are down.
2. **job-scout** searches the careers sites in `src/sources-config.mjs`, the companies' own public
   search APIs (Workday, JPMorgan's Oracle site, Bank of America's). A source runs only when
   its `allowListName` is `included` in the reviewed allow-list
   (`backend/src/main/resources/market/allow-list.json`: Fortune 500 and FINRA-regulated).
   It keeps US developer and engineer titles below senior, drops postings asking 5+ years
   and any URL already in JobSync, scores the rest (skills 55, seniority 30, location 15:
   Tampa first, then remote), and adds the top 20 scoring 55 or more. Each run's picks are in
   `state/runs/shortlist-YYYY-MM-DD.csv`.
3. It writes JobSync's jobs, read through `docker compose exec` (no database port is
   published), as a backup-style `state/jobsync-data.json` (mode 600). That replaces the
   weekly manual backup download.
4. **jobsync-importer** runs as a dry run on that file. Filing stays manual, because it needs
   the admin password, which is never stored:

   ```bash
   node ~/.local/share/job-scout/jobsync-importer/bin/jobsync-importer.mjs --backup ~/.local/share/job-scout/state/jobsync-data.json --api-url https://personal-web-app-api-production.up.railway.app --allowlist ~/.local/share/job-scout/allow-list.json --file
   ```

The log is `~/Library/Logs/job-scout.log`.

## Setup

1. JobSync running locally (see `docs/JOBSYNC_IMPORTER.md`, "Running JobSync locally").
2. A JobSync MCP token with `jobs:write` (JobSync → Settings → MCP Access), stored in the
   Keychain by you. It prompts, so the token never appears in shell history:

   ```bash
   security add-generic-password -U -a "$USER" -s jobsync-mcp -w
   ```

3. Install the weekly job (Monday 08:00 by default; arguments are weekday 0-6 and hour). It
   copies the tools and the allow-list to `~/.local/share/job-scout`, because macOS blocks
   launchd jobs from reading Desktop, Documents and Downloads. Re-run it after pulling changes.

   ```bash
   tools/job-scout/install.sh
   ```

Run once now: `launchctl kickstart gui/$(id -u)/dev.justcallmepratt.job-scout`.
Remove: `launchctl bootout gui/$(id -u)/dev.justcallmepratt.job-scout`, then delete
`~/Library/LaunchAgents/dev.justcallmepratt.job-scout.plist` and `~/.local/share/job-scout`.

## By hand

```bash
node tools/job-scout/bin/job-scout.mjs --dry-run --out-dir /tmp/scout
```

`--help` lists the options (`--max`, `--min-score`, `--dump`, `--allowlist`).
Tests: `node --test tools/job-scout/test/*.test.mjs`.

## Limits

- Careers sites rate-limit (HTTP 429). The scout waits and retries up to four times; a
  source that still fails is logged and skipped, and the others still run.
- Goldman Sachs, Charles Schwab, Edward Jones, BNY, Principal, Voya, Citizens, Equitable,
  Lincoln and ICE are not read: no public search API was found for them. Add a source by
  checking its Workday tenant and site (`/wday/cxs/<tenant>/<site>/jobs`) answers.
- Scoring is keyword-based against the resume's skills, not a reading of the posting.
- Company names in `src/sources-config.mjs` must contain one of the allow-list entry's aliases, or the
  importer leaves those jobs out.
