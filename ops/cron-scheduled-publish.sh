#!/bin/bash
# Sportlive — promote scheduled posts whose publishedAt is in the past.
# Runs every 5 minutes. Cheap (single SQL UPDATE).
#
# Install:
#   crontab -e
#   */5 * * * * /opt/sportlive/cron-scheduled-publish.sh >> /var/log/sportlive-scheduled.log 2>&1

set -euo pipefail

cd /opt/sportlive

CRON_SECRET=$(grep '^CRON_SECRET=' .env | cut -d= -f2)
if [ -z "${CRON_SECRET:-}" ]; then
  echo "CRON_SECRET missing in /opt/sportlive/.env"
  exit 1
fi

curl -sS -m 30 \
  -H "Authorization: Bearer $CRON_SECRET" \
  "http://127.0.0.1:3001/api/cron/scheduled-publish"
echo
