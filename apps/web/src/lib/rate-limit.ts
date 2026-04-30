import 'server-only';
import { db, rateLimits } from '@sportlive/db';
import { sql } from 'drizzle-orm';
import { headers } from 'next/headers';

export type RateLimitResult = { ok: boolean; remaining: number; resetMs: number };

/**
 * Postgres-backed sliding-window rate limit. Cheap (one upsert + one select)
 * and durable across container restarts. The `key` typically combines a
 * scope and a bucket, e.g. `comments:1.2.3.4`. `windowMs` defaults to 1 min.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number = 60_000,
): Promise<RateLimitResult> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowMs);

  // Upsert: if the key exists and is not expired, +1; if expired, reset.
  // Postgres UPSERT can't conditionally pick which path, so we run two
  // statements but inside a single round-trip RETURNING.
  const rows = (await db.execute(sql`
    INSERT INTO rate_limits (key, count, expires_at)
    VALUES (${key}, 1, ${expiresAt.toISOString()}::timestamptz)
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN rate_limits.expires_at < now() THEN 1
        ELSE rate_limits.count + 1
      END,
      expires_at = CASE
        WHEN rate_limits.expires_at < now() THEN ${expiresAt.toISOString()}::timestamptz
        ELSE rate_limits.expires_at
      END
    RETURNING count, expires_at
  `)) as unknown as Array<{ count: number; expires_at: string }>;

  if (rows.length === 0) return { ok: true, remaining: limit - 1, resetMs: windowMs };
  const { count, expires_at } = rows[0]!;
  const resetMs = Math.max(0, new Date(expires_at).getTime() - now.getTime());
  return { ok: count <= limit, remaining: Math.max(0, limit - count), resetMs };
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get('cf-connecting-ip') ||
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    'unknown'
  );
}

/** Sweep expired rows; called by cron-cleanup script. */
export async function pruneExpiredRateLimits(): Promise<number> {
  const r = (await db.execute(sql`
    DELETE FROM rate_limits WHERE expires_at < now() RETURNING key
  `)) as unknown as Array<{ key: string }>;
  return r.length;
}
