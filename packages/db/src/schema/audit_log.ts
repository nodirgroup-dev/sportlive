import { pgTable, integer, varchar, jsonb, index, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

export const auditLog = pgTable(
  'audit_log',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    /** User who performed the action; null for system / unauth events. */
    actorId: integer().references(() => users.id, { onDelete: 'set null' }),
    /** Snapshot of actor email/name so the entry is readable even after the user is deleted. */
    actorLabel: varchar({ length: 200 }),
    /** Free-form short verb like "post.publish", "post.delete", "user.signin", "comment.approve". */
    action: varchar({ length: 64 }).notNull(),
    /** Logical entity name: post, comment, user, banner, etc. */
    entityType: varchar({ length: 32 }),
    /** Numeric id of the entity touched (when applicable). */
    entityId: integer(),
    /** One-line description of what changed (already rendered for the admin UI). */
    summary: varchar({ length: 500 }),
    /** Optional structured payload: previous/next values, request fields, etc. */
    meta: jsonb(),
    /** Best-effort client IP. */
    ip: varchar({ length: 64 }),
    createdAt: timestamp({ withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    index('audit_log_created_idx').on(t.createdAt),
    index('audit_log_actor_idx').on(t.actorId),
    index('audit_log_entity_idx').on(t.entityType, t.entityId),
  ],
);

export type AuditLogEntry = typeof auditLog.$inferSelect;
