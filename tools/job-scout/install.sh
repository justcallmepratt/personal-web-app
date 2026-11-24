#!/bin/bash
# Installs the weekly run outside the repository (macOS blocks launchd jobs from reading
# Desktop, Documents and Downloads) and loads it with launchd. Re-run after pulling changes.
# Usage: tools/job-scout/install.sh [weekday 0-6, default 1 = Monday] [hour, default 8]
set -euo pipefail
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
APP="$HOME/.local/share/job-scout"
LABEL=dev.justcallmepratt.job-scout
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
NODE="$(command -v node)"
mkdir -p "$APP" "$HOME/Library/Logs" "$HOME/Library/LaunchAgents"
rm -rf "$APP/job-scout" "$APP/jobsync-importer"
cp -R "$REPO/tools/job-scout" "$APP/job-scout"
cp -R "$REPO/tools/jobsync-importer" "$APP/jobsync-importer"
cp "$REPO/backend/src/main/resources/market/allow-list.json" "$APP/allow-list.json"
chmod +x "$APP/job-scout/weekly.sh"
cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key><array><string>/bin/bash</string><string>$APP/job-scout/weekly.sh</string></array>
  <key>EnvironmentVariables</key><dict><key>PATH</key><string>$(dirname "$NODE"):/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string></dict>
  <key>StartCalendarInterval</key><dict><key>Weekday</key><integer>${1:-1}</integer><key>Hour</key><integer>${2:-8}</integer><key>Minute</key><integer>0</integer></dict>
  <key>StandardOutPath</key><string>$HOME/Library/Logs/job-scout.log</string>
  <key>StandardErrorPath</key><string>$HOME/Library/Logs/job-scout.log</string>
</dict></plist>
PLIST
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
echo "Installed. Runs weekday ${1:-1} at ${2:-8}:00. Log: ~/Library/Logs/job-scout.log"
echo "Run it now: launchctl kickstart gui/$(id -u)/$LABEL"
