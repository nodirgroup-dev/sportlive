#!/bin/bash
# Sportlive — push the latest local DB backup to an offsite target.
#
# Configure ONE of the following in /opt/sportlive/.env:
#   OFFSITE_RSYNC_TARGET=user@host:/path
#   OFFSITE_S3_BUCKET=s3://bucket/path        (requires aws cli installed)
#   OFFSITE_B2_BUCKET=b2://bucket/path        (requires b2 cli installed)
#
# Install:
#   crontab -e
#   45 3 * * * /opt/sportlive/cron-backup-offsite.sh >> /var/log/sportlive-offsite.log 2>&1

set -euo pipefail
cd /opt/sportlive

LOCK=/tmp/sportlive-offsite.lock
exec 9>"$LOCK"
flock -n 9 || { echo "another offsite run in progress"; exit 0; }

LATEST=$(ls -1t /opt/sportlive/backups/sportlive-*.sql.gz 2>/dev/null | head -1)
if [ -z "$LATEST" ]; then
  echo "[$(date -Iseconds)] no local backup to ship"
  exit 0
fi

. /opt/sportlive/.env

echo "[$(date -Iseconds)] shipping $LATEST"
NAME=$(basename "$LATEST")

if [ -n "${OFFSITE_RSYNC_TARGET:-}" ]; then
  rsync -av --partial "$LATEST" "${OFFSITE_RSYNC_TARGET%/}/$NAME"
elif [ -n "${OFFSITE_S3_BUCKET:-}" ]; then
  aws s3 cp "$LATEST" "${OFFSITE_S3_BUCKET%/}/$NAME"
elif [ -n "${OFFSITE_B2_BUCKET:-}" ]; then
  b2 upload-file "${OFFSITE_B2_BUCKET#b2://}" "$LATEST" "$NAME"
else
  echo "no offsite target configured (OFFSITE_RSYNC_TARGET / OFFSITE_S3_BUCKET / OFFSITE_B2_BUCKET)"
  exit 0
fi

echo "[$(date -Iseconds)] done"
