import { NextResponse } from 'next/server';
import { db, posts } from '@sportlive/db';
import { sql } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const startedAt = Date.now();

/**
 * Cheap health probe used by uptime monitors. Touches the DB but doesn't
 * scan large tables. Returns 200 only when both the app and Postgres
 * respond; otherwise 503 with an error body the monitor can alert on.
 */
export async function GET() {
  const started = process.hrtime.bigint();
  try {
    const r = (await db.execute(sql`SELECT count(*)::int AS c FROM ${posts} WHERE status = 'published'`)) as unknown as Array<{ c: number }>;
    const dbMs = Number((process.hrtime.bigint() - started) / 1_000_000n);
    return NextResponse.json(
      {
        ok: true,
        publishedPosts: r[0]?.c ?? 0,
        uptimeMs: Date.now() - startedAt,
        dbLatencyMs: dbMs,
        timestamp: new Date().toISOString(),
        version: process.env.GIT_SHA || 'dev',
      },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : 'unknown',
        uptimeMs: Date.now() - startedAt,
      },
      { status: 503, headers: { 'cache-control': 'no-store' } },
    );
  }
}
