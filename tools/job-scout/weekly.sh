#!/bin/bash
# The weekly run launchd starts (installed by install.sh). Two steps:
#   1. job-scout: search the careers sites and add up to 20 new postings to JobSync.
#   2. jobsync-importer (dry run): read every JobSync job and log the skill suggestions it
#      would file at /admin/suggestions. Filing stays a manual `--file` run.
# The MCP token comes from the macOS Keychain (service jobsync-mcp) and is never logged.
set -uo pipefail
APP="${JOB_SCOUT_HOME:-$HOME/.local/share/job-scout}"
STATE="$APP/state"
SITE_API_URL="${SITE_API_URL:-https://personal-web-app-api-production.up.railway.app}"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
export DOCKER_HOST="${DOCKER_HOST:-unix://$HOME/.colima/default/docker.sock}"
export DOCKER_CONFIG="${DOCKER_CONFIG:-$HOME/.config/jobsync-docker}"
export JOBSYNC_DIR="${JOBSYNC_DIR:-$HOME/Developer/jobsync}"
mkdir -p "$STATE/runs" && chmod 700 "$STATE"
echo "=== job-scout weekly run $(date '+%Y-%m-%d %H:%M') ==="

# JobSync must be up: start Colima and the containers if they are not.
if ! curl -s -o /dev/null -m 5 http://localhost:3737/; then
  colima status >/dev/null 2>&1 || colima start || { echo "Colima would not start; stopping."; exit 1; }
  (cd "$JOBSYNC_DIR" && docker compose up -d) || { echo "JobSync would not start; stopping."; exit 1; }
  for _ in $(seq 1 30); do curl -s -o /dev/null -m 5 http://localhost:3737/ && break; sleep 5; done
fi

JOBSYNC_MCP_TOKEN="$(security find-generic-password -s jobsync-mcp -w 2>/dev/null)" || {
  echo "No Keychain item 'jobsync-mcp'. Store the JobSync MCP token: security add-generic-password -U -a \"\$USER\" -s jobsync-mcp -w"; exit 1; }
export JOBSYNC_MCP_TOKEN

node "$APP/job-scout/bin/job-scout.mjs" --max "${JOB_SCOUT_MAX:-20}" --out-dir "$STATE/runs" \
  --dump "$STATE/jobsync-data.json" --allowlist "$APP/allow-list.json"
scout=$?
unset JOBSYNC_MCP_TOKEN

echo "--- jobsync-importer (dry run) ---"
node "$APP/jobsync-importer/bin/jobsync-importer.mjs" --backup "$STATE/jobsync-data.json" \
  --api-url "$SITE_API_URL" --allowlist "$APP/allow-list.json"
importer=$?
echo "=== done: scout exit $scout, importer exit $importer ==="
[ $scout -eq 0 ] && [ $importer -eq 0 ]
