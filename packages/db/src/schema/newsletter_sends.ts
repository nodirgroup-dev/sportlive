import { pgTable, integer, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { localeEnum } from './_shared';

export const newsletterSends = pgTable(
  'newsletter_sends',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    locale: localeEnum(),
    subject: varchar({ length: 300 }).notNull(),
    /** First post id included in the digest, so we don't resend the same posts. */
    sinceCutoff: timestamp({ withTimezone: true }),
    recipientCount: integer().notNull().default(0),
    sentCount: integer().notNull().default(0),
    failedCount: integer().notNull().default(0),
    error: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [index('newsletter_sends_created_idx').on(t.createdAt)],
);

export type NewsletterSend = typeof newsletterSends.$inferSelect;
