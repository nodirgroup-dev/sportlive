import { pgEnum, pgTable, integer, varchar, text, smallint, timestamp, index } from 'drizzle-orm/pg-core';
import { createdAt, updatedAt } from './_shared';
import { fixtures } from './fixtures';
import { users } from './users';

export const liveEntryTypeEnum = pgEnum('live_entry_type', [
  'comment',
  'goal',
  'yellow_card',
  'red_card',
  'sub',
  'var',
  'kickoff',
  'half_time',
  'full_time',
  'general',
]);

export const liveEntries = pgTable(
  'live_entries',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    fixtureId: integer()
      .notNull()
      .references(() => fixtures.id, { onDelete: 'cascade' }),
    minute: smallint(),
    type: liveEntryTypeEnum().notNull().default('comment'),
    /** Markdown / light HTML body. */
    body: text().notNull(),
    /** Optional embed URL (tweet, youtube). */
    embedUrl: varchar({ length: 500 }),
    authorId: integer().references(() => users.id, { onDelete: 'set null' }),
    /** Pinned to top of feed (ignores minute order). */
    pinned: smallint().notNull().default(0),
    occurredAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt,
    updatedAt,
  },
  (t) => [
    index('live_entries_fixture_idx').on(t.fixtureId, t.occurredAt),
    index('live_entries_pinned_idx').on(t.fixtureId, t.pinned),
  ],
);

export type LiveEntry = typeof liveEntries.$inferSelect;
