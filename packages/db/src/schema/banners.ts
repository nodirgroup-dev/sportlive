import { pgEnum, pgTable, integer, varchar, text, timestamp, boolean, index } from 'drizzle-orm/pg-core';
import { createdAt, updatedAt } from './_shared';

export const bannerPositionEnum = pgEnum('banner_position', [
  'header',
  'sidebar',
  'in_article_top',
  'in_article_bottom',
  'footer',
]);

export const banners = pgTable(
  'banners',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 200 }).notNull(),
    position: bannerPositionEnum().notNull(),
    imageUrl: varchar({ length: 500 }).notNull(),
    linkUrl: varchar({ length: 500 }),
    altText: varchar({ length: 300 }),
    /** Inline HTML/script (e.g. AdSense). Mutually exclusive with imageUrl. */
    htmlSnippet: text(),
    sortOrder: integer().notNull().default(0),
    active: boolean().notNull().default(true),
    startsAt: timestamp({ withTimezone: true }),
    endsAt: timestamp({ withTimezone: true }),
    impressions: integer().notNull().default(0),
    clicks: integer().notNull().default(0),
    createdAt,
    updatedAt,
  },
  (t) => [
    index('banners_position_idx').on(t.position, t.active, t.sortOrder),
    index('banners_active_idx').on(t.active),
  ],
);

export type Banner = typeof banners.$inferSelect;
