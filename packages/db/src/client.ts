import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';
import * as schema from './schema/index';

type Schema = typeof schema;

let _client: Sql | null = null;
let _db: PostgresJsDatabase<Schema> | null = null;

function getClient(): Sql {
  if (_client) return _client;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not defined (queried before runtime config loaded)');
  }
  _client = postgres(url, {
    max: 10,
    idle_timeout: 20,
    prepare: false,
  });
  return _client;
}

function getDb(): PostgresJsDatabase<Schema> {
  if (_db) return _db;
  _db = drizzle(getClient(), { schema, casing: 'snake_case' });
  return _db;
}

export const db: PostgresJsDatabase<Schema> = new Proxy({} as PostgresJsDatabase<Schema>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});

export type Db = PostgresJsDatabase<Schema>;
export { schema };
