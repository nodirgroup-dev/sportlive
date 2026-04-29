import { pgTable, integer, varchar, text, index } from 'drizzle-orm/pg-core';
import { createdAt } from './_shared.js';
import { users } from './users.js';

export const media = pgTable(
  'media',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    /** Original URL or relative path on disk (e.g. /uploads/posts/2026/04/foo.jpg). */
    path: varchar({ length: 500 }).notNull(),
    alt: text(),
    title: varchar({ length: 300 }),
    width: integer(),
    height: integer(),
    mimeType: varchar({ length: 100 }),
    sizeBytes: integer(),
    uploadedBy: integer().references(() => users.id, { onDelete: 'set null' }),
    legacyId: integer(),
    createdAt,
  },
  (t) => [index('media_legacy_idx').on(t.legacyId)],
);

export type MediaItem = typeof media.$inferSelect;
export type NewMediaItem = typeof media.$inferInsert;
