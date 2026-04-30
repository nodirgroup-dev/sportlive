import { pgTable, integer, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { createdAt } from './_shared';
import { users } from './users';

export const sessions = pgTable(
  'sessions',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: varchar({ length: 128 }).notNull().unique(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt,
  },
  (t) => [index('sessions_token_idx').on(t.token), index('sessions_user_idx').on(t.userId)],
);

export type Session = typeof sessions.$inferSelect;
