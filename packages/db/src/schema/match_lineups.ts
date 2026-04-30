import { pgTable, integer, varchar, jsonb, timestamp, index, primaryKey } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { fixtures, teams } from './fixtures';

export const matchLineups = pgTable(
  'match_lineups',
  {
    fixtureId: integer()
      .notNull()
      .references(() => fixtures.id, { onDelete: 'cascade' }),
    teamId: integer()
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    formation: varchar({ length: 16 }),
    coachName: varchar({ length: 200 }),
    /** Array of starters, each with { player: {id,name,number,pos}, grid: "1:1" } */
    startXi: jsonb(),
    /** Array of substitutes. */
    substitutes: jsonb(),
    fetchedAt: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [primaryKey({ columns: [t.fixtureId, t.teamId] }), index('match_lineups_fixture_idx').on(t.fixtureId)],
);

export type MatchLineup = typeof matchLineups.$inferSelect;
