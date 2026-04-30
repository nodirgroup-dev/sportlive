import { pgTable, integer, varchar, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { localeEnum } from './_shared';

export const newsletterSubscribers = pgTable(
  'newsletter_subscribers',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    email: varchar({ length: 320 }).notNull(),
    locale: localeEnum(),
    /** Best-effort client IP at signup. */
    ip: varchar({ length: 64 }),
    /** Set when the user explicitly unsubscribed. */
    unsubscribedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    uniqueIndex('newsletter_email_idx').on(t.email),
    index('newsletter_locale_idx').on(t.locale, t.unsubscribedAt),
  ],
);

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
