import { pgTable, integer, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { posts } from './posts';
import { users } from './users';

export const postRevisions = pgTable(
  'post_revisions',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    postId: integer()
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    title: varchar({ length: 300 }).notNull(),
    summary: text(),
    body: text().notNull(),
    coverImage: varchar({ length: 500 }),
    /** Editor who saved the prior version (null if system / cron). */
    savedById: integer().references(() => users.id, { onDelete: 'set null' }),
    savedByLabel: varchar({ length: 200 }),
    createdAt: timestamp({ withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [index('post_revisions_post_idx').on(t.postId, t.createdAt)],
);

export type PostRevision = typeof postRevisions.$inferSelect;
