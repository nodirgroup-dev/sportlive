import { pgTable, integer, varchar, text, timestamp, smallint, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { localeEnum } from './_shared';
import { categories } from './categories';

export const rssSources = pgTable(
  'rss_sources',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 200 }).notNull(),
    feedUrl: varchar({ length: 1000 }).notNull(),
    locale: localeEnum().notNull(),
    /** Default category for items imported from this feed. */
    categoryId: integer().references(() => categories.id, { onDelete: 'set null' }),
    /** When non-zero, items are auto-rewritten via Anthropic before being saved as drafts. */
    rewriteEnabled: smallint().notNull().default(0),
    /** When non-zero, the feed is fetched by cron. */
    enabled: smallint().notNull().default(1),
    lastFetchedAt: timestamp({ withTimezone: true }),
    lastError: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [index('rss_sources_enabled_idx').on(t.enabled, t.lastFetchedAt)],
);

/** Tracks which feed items we've already imported so we don't duplicate. */
export const rssImported = pgTable(
  'rss_imported',
  {
    sourceId: integer()
      .notNull()
      .references(() => rssSources.id, { onDelete: 'cascade' }),
    /** Item GUID or link, whichever is present. */
    externalId: varchar({ length: 800 }).notNull(),
    postId: integer(),
    importedAt: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [index('rss_imported_source_idx').on(t.sourceId, t.externalId)],
);

export type RssSource = typeof rssSources.$inferSelect;
