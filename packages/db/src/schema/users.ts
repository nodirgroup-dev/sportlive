import { pgEnum, pgTable, varchar, text, integer, boolean } from 'drizzle-orm/pg-core';
import { createdAt, updatedAt } from './_shared';

export const userRoleEnum = pgEnum('user_role', ['admin', 'editor', 'author', 'reader']);

export const users = pgTable('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: varchar({ length: 255 }).notNull().unique(),
  passwordHash: varchar({ length: 255 }),
  name: varchar({ length: 100 }).notNull(),
  avatar: text(),
  role: userRoleEnum().notNull().default('reader'),
  bio: text(),
  emailVerified: boolean().notNull().default(false),
  legacyId: integer().unique(),
  createdAt,
  updatedAt,
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
