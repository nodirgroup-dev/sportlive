import {
  pgTable,
  integer,
  varchar,
  uniqueIndex,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core';
import { localeEnum, createdAt } from './_shared.js';
import { posts } from './posts.js';

export const tags = pgTable(
  'tags',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    locale: localeEnum().notNull(),
    slug: varchar({ length: 200 }).notNull(),
    name: varchar({ length: 200 }).notNull(),
    createdAt,
  },
  (t) => [uniqueIndex('tags_locale_slug_idx').on(t.locale, t.slug)],
);

export const postTags = pgTable(
  'post_tags',
  {
    postId: integer()
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    tagId: integer()
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.postId, t.tagId] }), index('post_tags_tag_idx').on(t.tagId)],
);

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
