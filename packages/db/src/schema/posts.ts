import {
  pgEnum,
  pgTable,
  integer,
  varchar,
  text,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { localeEnum, createdAt, updatedAt } from './_shared';
import { users } from './users';
import { categories } from './categories';

export const postStatusEnum = pgEnum('post_status', ['draft', 'published', 'archived']);

export const posts = pgTable(
  'posts',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    legacyId: integer().unique(),
    locale: localeEnum().notNull(),
    slug: varchar({ length: 200 }).notNull(),
    title: varchar({ length: 300 }).notNull(),
    summary: text(),
    body: text().notNull(),
    coverImage: varchar({ length: 500 }),
    coverImageWidth: integer(),
    coverImageHeight: integer(),
    authorId: integer().references(() => users.id, { onDelete: 'set null' }),
    categoryId: integer().references(() => categories.id, { onDelete: 'set null' }),
    status: postStatusEnum().notNull().default('draft'),
    publishedAt: timestamp({ withTimezone: true }),
    metaTitle: varchar({ length: 300 }),
    metaDescription: varchar({ length: 500 }),
    metaKeywords: text(),
    viewCount: integer().notNull().default(0),
    commentCount: integer().notNull().default(0),
    /** Group key linking the same article across locales (uz/ru/en versions share groupId). */
    groupId: integer().notNull(),
    createdAt,
    updatedAt,
  },
  (t) => [
    uniqueIndex('posts_locale_slug_idx').on(t.locale, t.slug),
    uniqueIndex('posts_locale_group_idx').on(t.locale, t.groupId),
    index('posts_published_idx').on(t.status, t.publishedAt),
    index('posts_category_idx').on(t.categoryId, t.publishedAt),
    index('posts_legacy_idx').on(t.legacyId),
  ],
);

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
