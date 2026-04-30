#!/usr/bin/env node
/**
 * Fetch leagues, teams, venues, and fixtures from API-Football v3 into Postgres.
 *
 * Auth — set ONE of:
 *   API_FOOTBALL_KEY   (direct API-SPORTS subscription, host: v3.football.api-sports.io)
 *   RAPIDAPI_KEY       (RapidAPI subscription, host: api-football-v1.p.rapidapi.com)
 *
 * Usage:
 *   node scripts/fetch-fixtures.mjs --leagues 39,140,135,78,61,2,3,848  --season 2026
 *   node scripts/fetch-fixtures.mjs --leagues 140 --season 2026 --range 7      # next 7 days only
 *   node scripts/fetch-fixtures.mjs --live                                       # current live fixtures
 *
 * Free tier (API-Football): 100 req/day. The script paginates and respects rate-limit headers.
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
  console.error('Need API_FOOTBALL_KEY (direct) or RAPIDAPI_KEY (via RapidAPI)');
  process.exit(1);
}

const HOST = APISPORTS_KEY ? 'v3.football.api-sports.io' : 'api-football-v1.p.rapidapi.com';
const BASE = `https://${HOST}`;
const HEADERS = APISPORTS_KEY
  ? { 'x-apisports-key': APISPORTS_KEY }
  : { 'x-rapidapi-host': HOST, 'x-rapidapi-key': RAPIDAPI_KEY };

const args = parseArgs(process.argv.slice(2));
const LEAGUES = (args.leagues ?? '39,140,135,78,61,2,3,848')
  .split(',')
  .map((s) => parseInt(s.trim(), 10))
  .filter(Number.isFinite);
const SEASON = parseInt(args.season ?? `${new Date().getFullYear()}`, 10);
const DAYS = args.range ? parseInt(args.range, 10) : null;
const LIVE_ONLY = !!args.live;
const TEAMS_ONLY = !!args['teams-only'];
const TOPSCORERS_ONLY = !!args['topscorers-only'];
const LINEUPS_ONLY = !!args['lineups-only'];

const sql = postgres(DATABASE_URL, { prepare: false, max: 5, onnotice: () => {} });
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

let reqCount = 0;
let rateLimit = null;

async function api(path, params = {}) {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: HEADERS });
  reqCount++;
  rateLimit = {
    dayLimit: res.headers.get('x-ratelimit-requests-limit'),
    dayRemain: res.headers.get('x-ratelimit-requests-remaining'),
    minLimit: res.headers.get('X-RateLimit-Limit'),
    minRemain: res.headers.get('X-RateLimit-Remaining'),
  };
  if (res.status === 429) {
    log('  RATE LIMIT — sleeping 60s');
    await new Promise((r) => setTimeout(r, 60000));
    return api(path, params);
  }
  if (!res.ok) {
    throw new Error(`API ${path} → ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const json = await res.json();
  if (json.errors && Object.keys(json.errors).length > 0) {
    throw new Error(`API ${path} errors: ${JSON.stringify(json.errors)}`);
  }
  return json;
}

async function upsertLeague(item) {
  const l = item.league;
  const c = item.country;
  const season = item.seasons?.find((s) => s.year === SEASON) ?? item.seasons?.[item.seasons.length - 1];
  await sql`
    INSERT INTO leagues (id, name, type, country, country_code, logo, flag, season, season_start, season_end)
    VALUES (
      ${l.id}, ${l.name}, ${l.type}, ${c?.name ?? null}, ${c?.code ?? null},
      ${l.logo ?? null}, ${c?.flag ?? null}, ${season?.year ?? SEASON},
      ${season?.start ?? null}, ${season?.end ?? null}
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name, type = EXCLUDED.type, country = EXCLUDED.country,
      country_code = EXCLUDED.country_code, logo = EXCLUDED.logo, flag = EXCLUDED.flag,
      season = EXCLUDED.season, season_start = EXCLUDED.season_start, season_end = EXCLUDED.season_end,
      updated_at = now()
  `;
}

async function upsertTeam(team, venue) {
  if (venue?.id) {
    await sql`
      INSERT INTO venues (id, name, city, country, capacity, surface, image)
      VALUES (${venue.id}, ${venue.name ?? 'Unknown'}, ${venue.city ?? null}, ${venue.country ?? null},
              ${venue.capacity ?? null}, ${venue.surface ?? null}, ${venue.image ?? null})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name, city = EXCLUDED.city, country = EXCLUDED.country,
        capacity = EXCLUDED.capacity, surface = EXCLUDED.surface, image = EXCLUDED.image
    `;
  }
  await sql`
    INSERT INTO teams (id, name, code, country, logo, founded, venue_id)
    VALUES (${team.id}, ${team.name}, ${team.code ?? null}, ${team.country ?? null}, ${team.logo ?? null}, ${team.founded ?? null}, ${venue?.id ?? null})
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name, code = EXCLUDED.code, country = EXCLUDED.country,
      logo = EXCLUDED.logo, founded = EXCLUDED.founded,
      venue_id = COALESCE(EXCLUDED.venue_id, teams.venue_id),
      updated_at = now()
  `;
}

async function upsertFixture(item) {
  const f = item.fixture;
  const lg = item.league;
  const tm = item.teams;
  const goals = item.goals;
  const score = item.score;
  const venueId = f.venue?.id && f.venue.id > 0 ? f.venue.id : null;

  if (venueId && f.venue?.name) {
    await sql`
      INSERT INTO venues (id, name, city)
      VALUES (${venueId}, ${f.venue.name}, ${f.venue.city ?? null})
      ON CONFLICT (id) DO NOTHING
    `;
  }

  // Ensure both teams exist
  await sql`
    INSERT INTO teams (id, name, logo) VALUES (${tm.home.id}, ${tm.home.name}, ${tm.home.logo ?? null})
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, logo = EXCLUDED.logo, updated_at = now()
  `;
  await sql`
    INSERT INTO teams (id, name, logo) VALUES (${tm.away.id}, ${tm.away.name}, ${tm.away.logo ?? null})
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, logo = EXCLUDED.logo, updated_at = now()
  `;

  await sql`
    INSERT INTO fixtures (
      id, league_id, season, round, kickoff_at, status_short, status_long, elapsed,
      venue_id, referee_name, home_team_id, away_team_id, home_goals, away_goals, score_detail, raw
    ) VALUES (
      ${f.id}, ${lg.id}, ${lg.season ?? SEASON}, ${lg.round ?? null},
      ${f.date}, ${f.status?.short ?? 'NS'}, ${f.status?.long ?? null}, ${f.status?.elapsed ?? null},
      ${venueId}, ${f.referee ?? null},
      ${tm.home.id}, ${tm.away.id},
      ${goals?.home ?? null}, ${goals?.away ?? null},
      ${score ? sql.json(score) : null},
      ${sql.json(item)}
    )
    ON CONFLICT (id) DO UPDATE SET
      league_id = EXCLUDED.league_id, season = EXCLUDED.season, round = EXCLUDED.round,
      kickoff_at = EXCLUDED.kickoff_at, status_short = EXCLUDED.status_short,
      status_long = EXCLUDED.status_long, elapsed = EXCLUDED.elapsed,
      venue_id = EXCLUDED.venue_id, referee_name = EXCLUDED.referee_name,
      home_goals = EXCLUDED.home_goals, away_goals = EXCLUDED.away_goals,
      score_detail = EXCLUDED.score_detail, raw = EXCLUDED.raw, updated_at = now()
  `;
}

async function fetchLeagues() {
  log(`fetching ${LEAGUES.length} league(s)…`);
  for (const id of LEAGUES) {
    const r = await api('/leagues', { id });
    for (const item of r.response ?? []) await upsertLeague(item);
  }
  log(`  rate: ${rateLimit?.dayRemain}/${rateLimit?.dayLimit} left today`);
}

async function upsertPlayer(item) {
  // API-Football /players response: { player: {...}, statistics: [{league:{...},team:{...},games:{...},goals:{...},...}, ...] }
  const p = item.player;
  if (!p?.id) return;
  const birthYear = p.birth?.date ? parseInt(p.birth.date.slice(0, 4), 10) : null;
  // Pick latest team from the first statistics block (or null).
  const firstStat = item.statistics?.[0];
  const teamId = firstStat?.team?.id ?? null;
  const position = firstStat?.games?.position ?? null;
  await sql`
    INSERT INTO players (id, name, firstname, lastname, nationality, photo, height, weight, birth_year, team_id, position)
    VALUES (
      ${p.id}, ${p.name}, ${p.firstname ?? null}, ${p.lastname ?? null},
      ${p.nationality ?? null}, ${p.photo ?? null},
      ${p.height ?? null}, ${p.weight ?? null}, ${birthYear},
      ${teamId}, ${position}
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name, firstname = EXCLUDED.firstname, lastname = EXCLUDED.lastname,
      nationality = EXCLUDED.nationality, photo = EXCLUDED.photo,
      height = EXCLUDED.height, weight = EXCLUDED.weight, birth_year = EXCLUDED.birth_year,
      team_id = COALESCE(EXCLUDED.team_id, players.team_id),
      position = COALESCE(EXCLUDED.position, players.position),
      updated_at = now()
  `;
  for (const s of item.statistics ?? []) {
    if (!s?.league?.id || s?.league?.season == null) continue;
    await sql`
      INSERT INTO player_stats (player_id, league_id, season, team_id, appearances, minutes, goals, assists, yellow_cards, red_cards, rating)
      VALUES (
        ${p.id}, ${s.league.id}, ${s.league.season},
        ${s.team?.id ?? null},
        ${s.games?.appearences ?? 0},
        ${s.games?.minutes ?? 0},
        ${s.goals?.total ?? 0},
        ${s.goals?.assists ?? 0},
        ${s.cards?.yellow ?? 0},
        ${s.cards?.red ?? 0},
        ${s.games?.rating ?? null}
      )
      ON CONFLICT (player_id, league_id, season) DO UPDATE SET
        team_id = COALESCE(EXCLUDED.team_id, player_stats.team_id),
        appearances = EXCLUDED.appearances, minutes = EXCLUDED.minutes,
        goals = EXCLUDED.goals, assists = EXCLUDED.assists,
        yellow_cards = EXCLUDED.yellow_cards, red_cards = EXCLUDED.red_cards,
        rating = EXCLUDED.rating, updated_at = now()
    `;
  }
}

async function fetchTopScorersForLeague(leagueId) {
  const r = await api('/players/topscorers', { league: leagueId, season: SEASON });
  const items = r.response ?? [];
  log(`  league ${leagueId} → ${items.length} top scorers`);
  for (const item of items) {
    await upsertPlayer(item);
  }
}

async function fetchLineupsForFixture(fixtureId) {
  const r = await api('/fixtures/lineups', { fixture: fixtureId });
  const items = r.response ?? [];
  for (const it of items) {
    await sql`
      INSERT INTO match_lineups (fixture_id, team_id, formation, coach_name, start_xi, substitutes, fetched_at)
      VALUES (
        ${fixtureId}, ${it.team?.id}, ${it.formation ?? null}, ${it.coach?.name ?? null},
        ${it.startXI ? sql.json(it.startXI) : null},
        ${it.substitutes ? sql.json(it.substitutes) : null},
        now()
      )
      ON CONFLICT (fixture_id, team_id) DO UPDATE SET
        formation = EXCLUDED.formation, coach_name = EXCLUDED.coach_name,
        start_xi = EXCLUDED.start_xi, substitutes = EXCLUDED.substitutes,
        fetched_at = now()
    `;
  }
}

async function fetchAllUpcomingLineups(daysAhead = 2) {
  // Get fixtures kicking off in the next N days that don't have lineups yet.
  const rows = await sql`
    SELECT f.id FROM fixtures f
    LEFT JOIN match_lineups m ON m.fixture_id = f.id
    WHERE m.fixture_id IS NULL
      AND f.kickoff_at >= now()
      AND f.kickoff_at < now() + (${daysAhead} || ' days')::interval
      AND f.status_short IN ('NS','TBD','1H','HT','2H','ET','P','LIVE')
    ORDER BY f.kickoff_at ASC
    LIMIT 30
  `;
  log(`  fetching lineups for ${rows.length} upcoming/live fixtures`);
  for (const r of rows) {
    try {
      await fetchLineupsForFixture(r.id);
    } catch (e) {
      log(`  lineup fixture=${r.id} failed: ${e.message?.slice(0, 100)}`);
    }
  }
}

async function fetchTeamsForLeague(leagueId) {
  const r = await api('/teams', { league: leagueId, season: SEASON });
  const items = r.response ?? [];
  log(`  league ${leagueId} → ${items.length} teams`);
  for (const item of items) {
    await upsertTeam(item.team, item.venue);
  }
}

async function fetchFixturesForLeague(leagueId) {
  if (LIVE_ONLY) {
    const r = await api('/fixtures', { live: 'all' });
    let count = 0;
    for (const item of r.response ?? []) {
      if (LEAGUES.includes(item.league.id)) {
        await upsertFixture(item);
        count++;
      }
    }
    log(`  live: ${count} fixtures across selected leagues`);
    return;
  }

  let params = { league: leagueId, season: SEASON };
  if (DAYS) {
    const from = new Date();
    const to = new Date(Date.now() + DAYS * 24 * 60 * 60 * 1000);
    params = { ...params, from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
  }
  const r = await api('/fixtures', params);
  log(`  league ${leagueId}: ${r.response?.length ?? 0} fixtures`);
  for (const item of r.response ?? []) {
    await upsertFixture(item);
  }
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) out[key] = 'true';
      else {
        out[key] = next;
        i++;
      }
    }
  }
  if (out.live === 'true') out.live = true;
  return out;
}

async function main() {
  log(`API host: ${HOST}, season: ${SEASON}, leagues: ${LEAGUES.join(',')}${LIVE_ONLY ? ' (LIVE)' : ''}`);

  if (LIVE_ONLY) {
    await fetchFixturesForLeague();
  } else if (TEAMS_ONLY) {
    for (const lid of LEAGUES) {
      await fetchTeamsForLeague(lid);
    }
  } else if (TOPSCORERS_ONLY) {
    for (const lid of LEAGUES) {
      await fetchTopScorersForLeague(lid);
    }
  } else if (LINEUPS_ONLY) {
    await fetchAllUpcomingLineups(DAYS ?? 2);
  } else {
    await fetchLeagues();
    for (const lid of LEAGUES) {
      await fetchFixturesForLeague(lid);
    }
  }

  log(`done. requests this run: ${reqCount}. day remaining: ${rateLimit?.dayRemain}`);
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
