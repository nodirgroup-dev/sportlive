#!/bin/bash
# Sportlive — daily Postgres backup.
# Dumps the sportlive db via the postgres container, gzips, writes to
# /opt/sportlive/backups/, prunes anything older than 14 days.
#
# Install: copy to /opt/sportlive/cron-backup.sh, make executable, then
#   crontab -e
#   30 3 * * * /opt/sportlive/cron-backup.sh >> /var/log/sportlive-backup.log 2>&1

set -euo pipefail

BACKUP_DIR=/opt/sportlive/backups
RETAIN_DAYS=14
CONTAINER=sportlive-postgres
DB_NAME=sportlive
DB_USER=sportlive

mkdir -p "$BACKUP_DIR"

LOCK=/tmp/sportlive-backup.lock
exec 9>"$LOCK"
flock -n 9 || { echo "another backup in progress"; exit 0; }

PG_PASS=$(grep '^POSTGRES_PASSWORD=' /opt/sportlive/.env.postgres | cut -d= -f2)
if [ -z "${PG_PASS}" ]; then
  echo "POSTGRES_PASSWORD not found in /opt/sportlive/.env.postgres"
  exit 1
fi

STAMP=$(date -u +%Y-%m-%d-%H%M)
OUT="$BACKUP_DIR/sportlive-${STAMP}.sql.gz"
TMP="${OUT}.partial"

echo "[$(date -Iseconds)] dumping to $OUT"

docker exec -i -e PGPASSWORD="$PG_PASS" "$CONTAINER" \
  pg_dump --no-owner --no-acl --clean --if-exists -U "$DB_USER" "$DB_NAME" \
  | gzip -9 > "$TMP"

mv "$TMP" "$OUT"
chmod 0640 "$OUT"

echo "[$(date -Iseconds)] done: $(du -h "$OUT" | cut -f1)"

# Prune old dumps
find "$BACKUP_DIR" -maxdepth 1 -name 'sportlive-*.sql.gz' -mtime +$RETAIN_DAYS -delete

echo "[$(date -Iseconds)] retention applied (>${RETAIN_DAYS}d removed)"
