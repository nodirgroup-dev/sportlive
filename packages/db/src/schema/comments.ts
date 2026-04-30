import {
  pgEnum,
  pgTable,
  integer,
  varchar,
  text,
  index,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { createdAt, updatedAt } from './_shared';
import { posts } from './posts';
import { users } from './users';

export const commentStatusEnum = pgEnum('comment_status', ['pending', 'approved', 'spam', 'rejected']);

export const comments = pgTable(
  'comments',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    legacyId: integer(),
    postId: integer()
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    parentId: integer().references((): AnyPgColumn => comments.id, { onDelete: 'cascade' }),
    /** Logged-in user, if any. Null for anonymous. */
    userId: integer().references(() => users.id, { onDelete: 'set null' }),
    /** Anonymous author display name. */
    authorName: varchar({ length: 100 }),
    authorEmail: varchar({ length: 255 }),
    authorIp: varchar({ length: 45 }),
    body: text().notNull(),
    status: commentStatusEnum().notNull().default('pending'),
    /** Number of public likes (anonymous, IP-rate-limited). */
    likeCount: integer().notNull().default(0),
    /** AI moderation score (0..100, null if not yet scored). Higher = more spammy. */
    aiSpamScore: integer(),
    createdAt,
    updatedAt,
  },
  (t) => [
    index('comments_post_idx').on(t.postId, t.status),
    index('comments_status_idx').on(t.status, t.createdAt),
    index('comments_user_idx').on(t.userId),
  ],
);

export type Comment = typeof comments.$inferSelect;
