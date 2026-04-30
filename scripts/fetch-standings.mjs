#!/usr/bin/env node
/**
 * Fetch league standings from API-Football v3 into the standings table.
 *
 * Auth: API_FOOTBALL_KEY (direct) or RAPIDAPI_KEY (via RapidAPI).
 * Usage:
 *   node scripts/fetch-standings.mjs --leagues 39,140,135,78,61,203 --season 2025
 */
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Need DATABASE_URL');
  process.exit(1);
}
const APISPORTS_KEY = process.env.API_FOOTBALL_KEY;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
if (!APISPORTS_KEY && !RAPIDAPI_KEY) {
  console.error('Need API_FOOTBALL_KEY or RAPIDAPI_KEY');
  process.exit(1);
}
const HOST = APISPORTS_KEY ? 'v3.football.api-sports.io' : 'api-football-v1.p.rapidapi.com';
const HEADERS = APISPORTS_KEY
  ? { 'x-apisports-key': APISPORTS_KEY }
  : { 'x-rapidapi-host': HOST, 'x-rapidapi-key': RAPIDAPI_KEY };

const args = parseArgs(process.argv.slice(2));
const LEAGUES = (args.leagues ?? '39,140,135,78,61,203')
  .split(',')
  .map((s) => parseInt(s.trim(), 10))
  .filter(Number.isFinite);
const SEASON = parseInt(args.season ?? `${new Date().getFullYear()}`, 10);

const sql = postgres(DATABASE_URL, { prepare: false, max: 5, onnotice: () => {} });
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

async function api(path, params = {}) {
  const url = new URL(`https://${HOST}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: HEADERS });
  if (res.status === 429) {
    log('  RATE LIMIT — sleeping 60s');
    await new Promise((r) => setTimeout(r, 60000));
    return api(path, params);
  }
  if (!res.ok) throw new Error(`API ${path} → ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  if (j.errors && Object.keys(j.errors).length > 0) {
    throw new Error(`API ${path} errors: ${JSON.stringify(j.errors)}`);
  }
  return j;
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) out[k] = 'true';
      else { out[k] = next; i++; }
    }
  }
  return out;
}

async function main() {
  log(`fetching standings for ${LEAGUES.length} league(s), season ${SEASON}`);
  for (const lid of LEAGUES) {
    const r = await api('/standings', { league: lid, season: SEASON });
    const groups = r.response?.[0]?.league?.standings ?? [];
    let total = 0;
    // Wipe existing rows for this league/season — replace fully each run.
    await sql`DELETE FROM standings WHERE league_id = ${lid} AND season = ${SEASON}`;

    for (const group of groups) {
      // Each group is an array of team rows.
      const groupName = group.length > 0 && group[0].group ? String(group[0].group).slice(0, 50) : null;
      for (const row of group) {
        const teamId = row.team?.id;
        if (!teamId) continue;
        // Ensure team exists (FK).
        await sql`
          INSERT INTO teams (id, name, logo, country)
          VALUES (${teamId}, ${row.team.name}, ${row.team.logo ?? null}, NULL)
          ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, logo = EXCLUDED.logo, updated_at = now()
        `;

        await sql`
          INSERT INTO standings (
            league_id, season, team_id, rank, group_name,
            points, played, won, drew, lost,
            goals_for, goals_against, goals_diff, form, description
          ) VALUES (
            ${lid}, ${SEASON}, ${teamId}, ${row.rank}, ${groupName},
            ${row.points ?? 0}, ${row.all?.played ?? 0}, ${row.all?.win ?? 0},
            ${row.all?.draw ?? 0}, ${row.all?.lose ?? 0},
            ${row.all?.goals?.for ?? 0}, ${row.all?.goals?.against ?? 0},
            ${row.goalsDiff ?? 0}, ${row.form ?? null},
            ${row.description ? String(row.description).slice(0, 200) : null}
          )
          ON CONFLICT (league_id, season, team_id, group_name) DO UPDATE SET
            rank = EXCLUDED.rank, points = EXCLUDED.points, played = EXCLUDED.played,
            won = EXCLUDED.won, drew = EXCLUDED.drew, lost = EXCLUDED.lost,
            goals_for = EXCLUDED.goals_for, goals_against = EXCLUDED.goals_against,
            goals_diff = EXCLUDED.goals_diff, form = EXCLUDED.form,
            description = EXCLUDED.description, updated_at = now()
        `;
        total++;
      }
    }
    log(`  league ${lid}: ${total} rows`);
  }
  log('done');
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
