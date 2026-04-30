import {
  pgTable,
  integer,
  varchar,
  text,
  timestamp,
  smallint,
  boolean,
  index,
  uniqueIndex,
  jsonb,
} from 'drizzle-orm/pg-core';
import { createdAt, updatedAt } from './_shared';

/** Top-level competition (e.g. La Liga, Premier League). */
export const leagues = pgTable(
  'leagues',
  {
    id: integer().primaryKey(),
    /** API-Football league id (matches `id`). */
    name: varchar({ length: 200 }).notNull(),
    type: varchar({ length: 30 }), // "League" | "Cup"
    country: varchar({ length: 100 }),
    countryCode: varchar({ length: 8 }),
    logo: varchar({ length: 500 }),
    flag: varchar({ length: 500 }),
    season: integer().notNull(),
    seasonStart: timestamp({ withTimezone: true }),
    seasonEnd: timestamp({ withTimezone: true }),
    /** Show on /schedule and /results lists by default. */
    featured: boolean().notNull().default(false),
    sortOrder: integer().notNull().default(0),
    createdAt,
    updatedAt,
  },
  (t) => [
    index('leagues_country_idx').on(t.country),
    index('leagues_featured_idx').on(t.featured, t.sortOrder),
  ],
);

export const teams = pgTable(
  'teams',
  {
    id: integer().primaryKey(),
    name: varchar({ length: 200 }).notNull(),
    code: varchar({ length: 16 }),
    country: varchar({ length: 100 }),
    logo: varchar({ length: 500 }),
    venueId: integer(),
    founded: smallint(),
    createdAt,
    updatedAt,
  },
  (t) => [index('teams_country_idx').on(t.country)],
);

export const venues = pgTable('venues', {
  id: integer().primaryKey(),
  name: varchar({ length: 200 }).notNull(),
  city: varchar({ length: 200 }),
  country: varchar({ length: 100 }),
  capacity: integer(),
  surface: varchar({ length: 50 }),
  image: varchar({ length: 500 }),
  createdAt,
});

export const fixtures = pgTable(
  'fixtures',
  {
    /** API-Football fixture id. */
    id: integer().primaryKey(),
    leagueId: integer()
      .notNull()
      .references(() => leagues.id, { onDelete: 'cascade' }),
    season: integer().notNull(),
    round: varchar({ length: 100 }),
    /** Match kickoff in UTC. */
    kickoffAt: timestamp({ withTimezone: true }).notNull(),
    /** API short status code: NS, 1H, HT, 2H, ET, P, FT, AET, PEN, BT, SUSP, INT, PST, CANC, ABD, AWD, WO, LIVE. */
    statusShort: varchar({ length: 8 }).notNull(),
    statusLong: varchar({ length: 64 }),
    /** Minutes elapsed (for live/in-play). */
    elapsed: smallint(),
    venueId: integer().references(() => venues.id, { onDelete: 'set null' }),
    refereeName: varchar({ length: 200 }),
    homeTeamId: integer()
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    awayTeamId: integer()
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    homeGoals: smallint(),
    awayGoals: smallint(),
    /** Detailed score breakdown: halftime, fulltime, extratime, penalty. */
    scoreDetail: jsonb(),
    /** Bookmark ↗ raw API payload for debugging / future fields. */
    raw: jsonb(),
    createdAt,
    updatedAt,
  },
  (t) => [
    index('fixtures_kickoff_idx').on(t.kickoffAt),
    index('fixtures_league_kickoff_idx').on(t.leagueId, t.kickoffAt),
    index('fixtures_status_idx').on(t.statusShort),
    index('fixtures_home_team_idx').on(t.homeTeamId),
    index('fixtures_away_team_idx').on(t.awayTeamId),
    uniqueIndex('fixtures_unique_idx').on(t.id),
  ],
);

export const standings = pgTable(
  'standings',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    leagueId: integer()
      .notNull()
      .references(() => leagues.id, { onDelete: 'cascade' }),
    season: integer().notNull(),
    teamId: integer()
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    rank: smallint().notNull(),
    /** Group letter for cup competitions (e.g. "A", "B"); NULL for flat leagues. */
    groupName: varchar({ length: 50 }),
    points: smallint().notNull().default(0),
    played: smallint().notNull().default(0),
    won: smallint().notNull().default(0),
    drew: smallint().notNull().default(0),
    lost: smallint().notNull().default(0),
    goalsFor: smallint().notNull().default(0),
    goalsAgainst: smallint().notNull().default(0),
    goalsDiff: smallint().notNull().default(0),
    /** Last 5 results pattern, e.g. "WWDLW". */
    form: varchar({ length: 10 }),
    /** Status hint from API, e.g. "Promotion - Champions League". */
    description: varchar({ length: 200 }),
    updatedAt,
  },
  (t) => [
    uniqueIndex('standings_unique_idx').on(t.leagueId, t.season, t.teamId, t.groupName),
    index('standings_league_rank_idx').on(t.leagueId, t.season, t.rank),
  ],
);

export type League = typeof leagues.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type Venue = typeof venues.$inferSelect;
export type Fixture = typeof fixtures.$inferSelect;
export type Standing = typeof standings.$inferSelect;
