import { pgTable, integer, varchar, smallint, timestamp, index, primaryKey } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { teams, leagues } from './fixtures';

export const players = pgTable(
  'players',
  {
    /** API-Football player id. */
    id: integer().primaryKey(),
    name: varchar({ length: 200 }).notNull(),
    firstname: varchar({ length: 100 }),
    lastname: varchar({ length: 100 }),
    nationality: varchar({ length: 100 }),
    photo: varchar({ length: 500 }),
    height: varchar({ length: 16 }),
    weight: varchar({ length: 16 }),
    /** Birth year (or full birth date if we capture it later). */
    birthYear: smallint(),
    /** Most recent known team. */
    teamId: integer().references(() => teams.id, { onDelete: 'set null' }),
    position: varchar({ length: 32 }),
    createdAt: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index('players_team_idx').on(t.teamId),
    index('players_nationality_idx').on(t.nationality),
  ],
);

export const playerStats = pgTable(
  'player_stats',
  {
    playerId: integer()
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    leagueId: integer()
      .notNull()
      .references(() => leagues.id, { onDelete: 'cascade' }),
    season: integer().notNull(),
    teamId: integer().references(() => teams.id, { onDelete: 'set null' }),
    appearances: smallint().notNull().default(0),
    minutes: integer().notNull().default(0),
    goals: smallint().notNull().default(0),
    assists: smallint().notNull().default(0),
    yellowCards: smallint().notNull().default(0),
    redCards: smallint().notNull().default(0),
    rating: varchar({ length: 8 }),
    updatedAt: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    primaryKey({ columns: [t.playerId, t.leagueId, t.season] }),
    index('player_stats_league_season_goals_idx').on(t.leagueId, t.season, t.goals),
    index('player_stats_league_season_assists_idx').on(t.leagueId, t.season, t.assists),
  ],
);

export type Player = typeof players.$inferSelect;
export type PlayerStat = typeof playerStats.$inferSelect;
