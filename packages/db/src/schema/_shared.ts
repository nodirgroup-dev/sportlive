import { pgEnum, timestamp, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const localeEnum = pgEnum('locale', ['uz', 'ru', 'en']);

export const createdAt = timestamp('created_at', { withTimezone: true })
  .notNull()
  .default(sql`now()`);

export const updatedAt = timestamp('updated_at', { withTimezone: true })
  .notNull()
  .default(sql`now()`);

export const slug = (name = 'slug') => varchar(name, { length: 200 }).notNull();
