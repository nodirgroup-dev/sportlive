import { pgTable, integer, varchar, timestamp, index, primaryKey } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { players } from './players';
import { teams } from './fixtures';

export const transfers = pgTable(
  'transfers',
  {
    /** Synthetic id; API-Football doesn't provide one. */
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    playerId: integer()
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    teamInId: integer().references(() => teams.id, { onDelete: 'set null' }),
    teamOutId: integer().references(() => teams.id, { onDelete: 'set null' }),
    /** Date of the transfer. */
    transferDate: timestamp({ withTimezone: true }),
    /** Loan / Free / Transfer / N/A — values direct from API-Football. */
    type: varchar({ length: 32 }),
    fetchedAt: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index('transfers_player_idx').on(t.playerId, t.transferDate),
    index('transfers_team_in_idx').on(t.teamInId, t.transferDate),
    index('transfers_team_out_idx').on(t.teamOutId, t.transferDate),
  ],
);

export type Transfer = typeof transfers.$inferSelect;
