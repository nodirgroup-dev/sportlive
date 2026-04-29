import {
  pgTable,
  integer,
  varchar,
  text,
  uniqueIndex,
  index,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { localeEnum, createdAt, updatedAt } from './_shared.js';

export const categories = pgTable(
  'categories',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    parentId: integer().references((): AnyPgColumn => categories.id, { onDelete: 'set null' }),
    slug: varchar({ length: 200 }).notNull(),
    locale: localeEnum().notNull(),
    name: varchar({ length: 200 }).notNull(),
    description: text(),
    sortOrder: integer().notNull().default(0),
    legacyId: integer(),
    createdAt,
    updatedAt,
  },
  (t) => [
    uniqueIndex('categories_slug_locale_idx').on(t.slug, t.locale),
    index('categories_parent_idx').on(t.parentId),
    index('categories_legacy_idx').on(t.legacyId),
  ],
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
