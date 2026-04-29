import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined');
}

const queryClient = postgres(databaseUrl, {
  max: 10,
  idle_timeout: 20,
  prepare: false,
});

export const db = drizzle(queryClient, { schema, casing: 'snake_case' });
export type Db = typeof db;
export { schema };
