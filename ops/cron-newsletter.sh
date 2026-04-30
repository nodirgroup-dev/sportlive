#!/bin/bash
# Sportlive — weekly newsletter digest.
# Pings the Next.js app's /api/cron/newsletter endpoint, which builds and
# sends a digest of the last 7 days' top stories per locale via SMTP.
#
# Install:
#   crontab -e
#   0 9 * * 1 /opt/sportlive/cron-newsletter.sh >> /var/log/sportlive-newsletter.log 2>&1

set -euo pipefail

cd /opt/sportlive

CRON_SECRET=$(grep '^CRON_SECRET=' .env | cut -d= -f2)
if [ -z "${CRON_SECRET:-}" ]; then
  echo "CRON_SECRET missing in /opt/sportlive/.env"
  exit 1
fi

LOCK=/tmp/sportlive-cron-newsletter.lock
exec 9>"$LOCK"
flock -n 9 || { echo "another newsletter run in progress"; exit 0; }

echo "[$(date -Iseconds)] sending weekly digest"

curl -sS -m 300 \
  -H "Authorization: Bearer $CRON_SECRET" \
  "http://127.0.0.1:3001/api/cron/newsletter" \
  | tee -a /var/log/sportlive-newsletter.log

echo
echo "[$(date -Iseconds)] done"
