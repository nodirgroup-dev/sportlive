#!/bin/bash
# Sportlive — weekly team metadata refresh.
# Calls API-Football's /teams endpoint to keep team country / founded /
# venue / logo current as squads change between seasons. Cheap (one
# request per league, ~8 calls/run).
#
# Install: copy to /opt/sportlive/cron-teams.sh, make executable, then
#   crontab -e
#   0 4 * * 0 /opt/sportlive/cron-teams.sh >> /var/log/sportlive-teams.log 2>&1

set -euo pipefail

cd /opt/sportlive

PG_PASS=$(grep '^POSTGRES_PASSWORD=' .env.postgres | cut -d= -f2)
API_KEY=$(grep '^API_FOOTBALL_KEY=' .env | cut -d= -f2)

LOCK=/tmp/sportlive-cron-teams.lock
exec 9>"$LOCK"
flock -n 9 || { echo "another teams refresh in progress"; exit 0; }

LEAGUES="${LEAGUES:-39,140,135,78,61,2,3,203}"
SEASON="${SEASON:-2025}"

echo "[$(date -Iseconds)] refreshing teams for leagues=${LEAGUES} season=${SEASON}"

docker run --rm --network host \
  -e DATABASE_URL="postgres://sportlive:${PG_PASS}@127.0.0.1:5434/sportlive" \
  -e API_FOOTBALL_KEY="${API_KEY}" \
  -v /opt/sportlive/app:/app -w /app \
  node:22-alpine sh -c "npm install --silent --no-save postgres@3.4 >/dev/null 2>&1 && node scripts/fetch-fixtures.mjs --leagues ${LEAGUES} --season ${SEASON} --teams-only"

echo "[$(date -Iseconds)] done"
