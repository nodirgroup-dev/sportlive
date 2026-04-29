import { pgTable, integer, varchar, smallint, uniqueIndex } from 'drizzle-orm/pg-core';
import { createdAt } from './_shared.js';

export const redirects = pgTable(
  'redirects',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    /** Old path including query, e.g. /football/12345-old-slug.html */
    fromPath: varchar({ length: 1000 }).notNull(),
    /** New path on the new site, e.g. /football/12345-new-slug */
    toPath: varchar({ length: 1000 }).notNull(),
    statusCode: smallint().notNull().default(301),
    createdAt,
  },
  (t) => [uniqueIndex('redirects_from_idx').on(t.fromPath)],
);

export type Redirect = typeof redirects.$inferSelect;
export type NewRedirect = typeof redirects.$inferInsert;
