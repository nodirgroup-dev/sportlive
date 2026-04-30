import { NextRequest, NextResponse } from 'next/server';
import { db, pushSubscriptions } from '@sportlive/db';
import { sql } from 'drizzle-orm';
import { hasLocale } from '@/i18n/routing';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let body: {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
    locale?: string;
    categoryIds?: number[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const endpoint = body.endpoint?.trim();
  const p256dh = body.keys?.p256dh?.trim();
  const auth = body.keys?.auth?.trim();
  const locale = hasLocale(body.locale ?? '') ? (body.locale as 'uz' | 'ru' | 'en') : null;

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  }

  const userAgent = req.headers.get('user-agent')?.slice(0, 500) ?? null;
  const cats = Array.isArray(body.categoryIds)
    ? body.categoryIds.filter((n) => Number.isFinite(n)).slice(0, 50)
    : null;
  const catFilters = cats && cats.length > 0 ? cats : null;

  await db
    .insert(pushSubscriptions)
    .values({ endpoint, p256dh, auth, locale, userAgent, categoryFilters: catFilters })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { p256dh, auth, locale, userAgent, categoryFilters: catFilters, invalidatedAt: sql`NULL` },
    });

  return NextResponse.json({ ok: true });
}
