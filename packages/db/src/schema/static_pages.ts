import { pgTable, integer, varchar, text, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { localeEnum, createdAt, updatedAt } from './_shared';

export const staticPages = pgTable(
  'static_pages',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    legacyId: integer(),
    locale: localeEnum().notNull(),
    slug: varchar({ length: 200 }).notNull(),
    title: varchar({ length: 300 }).notNull(),
    description: varchar({ length: 500 }),
    body: text().notNull(),
    metaTitle: varchar({ length: 300 }),
    metaDescription: varchar({ length: 500 }),
    metaKeywords: text(),
    /** Lower numbers show first in footer. */
    sortOrder: integer().notNull().default(0),
    /** Show in footer / nav menus. */
    showInFooter: integer().notNull().default(1),
    createdAt,
    updatedAt,
  },
  (t) => [
    uniqueIndex('static_pages_locale_slug_idx').on(t.locale, t.slug),
    index('static_pages_legacy_idx').on(t.legacyId),
  ],
);

export type StaticPage = typeof staticPages.$inferSelect;
export type NewStaticPage = typeof staticPages.$inferInsert;
