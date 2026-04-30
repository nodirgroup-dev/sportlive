import { NextRequest, NextResponse } from 'next/server';
import { db, rssSources } from '@sportlive/db';
import { eq } from 'drizzle-orm';
import { importRssFeed } from '@/lib/rss';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const TOKEN = process.env.CRON_SECRET;

function authorized(req: NextRequest): boolean {
  if (!TOKEN) return false;
  const header = req.headers.get('authorization') ?? '';
  return header === `Bearer ${TOKEN}` || req.nextUrl.searchParams.get('token') === TOKEN;
}

export async function GET(req: NextRequest) {
  return run(req);
}
export async function POST(req: NextRequest) {
  return run(req);
}

async function run(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const enabled = await db
    .select({ id: rssSources.id, name: rssSources.name })
    .from(rssSources)
    .where(eq(rssSources.enabled, 1));

  const results: Record<string, unknown> = {};
  for (const s of enabled) {
    try {
      results[s.name] = await importRssFeed(s.id);
    } catch (e) {
      results[s.name] = { error: e instanceof Error ? e.message : 'unknown' };
    }
  }
  return NextResponse.json({ ok: true, sources: enabled.length, results });
}
