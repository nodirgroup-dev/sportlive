import { pgTable, integer, varchar, text, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { localeEnum } from './_shared';

export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    /** Browser-provided unique endpoint URL (e.g. https://fcm.googleapis.com/wp/...) */
    endpoint: text().notNull(),
    p256dh: varchar({ length: 200 }).notNull(),
    auth: varchar({ length: 100 }).notNull(),
    locale: localeEnum(),
    userAgent: varchar({ length: 500 }),
    createdAt: timestamp({ withTimezone: true })
      .notNull()
      .default(sql`now()`),
    /** Set when web-push reports 410/404 (subscription expired). */
    invalidatedAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    uniqueIndex('push_subscriptions_endpoint_idx').on(t.endpoint),
    index('push_subscriptions_locale_idx').on(t.locale, t.invalidatedAt),
  ],
);

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
