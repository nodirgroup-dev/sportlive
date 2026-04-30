import { pgTable, varchar, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * Sliding-window rate limit counter. Key is `<scope>:<bucket>` (e.g.
 * `comments:1.2.3.4` or `newsletter:user@example.com`). When the cron sweep
 * deletes rows whose `expires_at` has passed, the next request creates a
 * fresh row.
 */
export const rateLimits = pgTable(
  'rate_limits',
  {
    key: varchar({ length: 200 }).primaryKey(),
    count: integer().notNull().default(1),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [index('rate_limits_expires_idx').on(t.expiresAt)],
);

export type RateLimit = typeof rateLimits.$inferSelect;
