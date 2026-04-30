#!/bin/bash
# Sportlive — periodic RSS source import.
# Pings the Next.js app's /api/cron/rss-import endpoint, which fetches
# every enabled rss_sources row, parses items, optionally rewrites via
# Anthropic, and stores new posts as drafts.
#
# Install:
#   crontab -e
#   */15 * * * * /opt/sportlive/cron-rss-import.sh >> /var/log/sportlive-rss.log 2>&1

set -euo pipefail
cd /opt/sportlive

CRON_SECRET=$(grep '^CRON_SECRET=' .env | cut -d= -f2)
if [ -z "${CRON_SECRET:-}" ]; then
  echo "CRON_SECRET missing"; exit 1
fi

LOCK=/tmp/sportlive-cron-rss.lock
exec 9>"$LOCK"
flock -n 9 || { echo "another rss run in progress"; exit 0; }

curl -sS -m 280 \
  -H "Authorization: Bearer $CRON_SECRET" \
  "http://127.0.0.1:3001/api/cron/rss-import"
echo
