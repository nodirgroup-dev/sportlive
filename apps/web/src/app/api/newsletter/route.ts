import { NextRequest, NextResponse } from 'next/server';
import { db, newsletterSubscribers } from '@sportlive/db';
import { eq, sql } from 'drizzle-orm';
import { hasLocale } from '@/i18n/routing';

export const runtime = 'nodejs';

const ipFromRequest = (req: NextRequest) =>
  req.headers.get('cf-connecting-ip') ||
  req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
  req.headers.get('x-real-ip') ||
  null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: { email?: string; locale?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const email = (body.email ?? '').trim().toLowerCase();
  const locale = hasLocale(body.locale ?? '') ? body.locale : null;

  if (!email || email.length > 320 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'invalid email' }, { status: 400 });
  }

  const ip = ipFromRequest(req)?.slice(0, 64) ?? null;

  // Upsert: if the email is already there, clear unsubscribed_at so they re-opt-in.
  await db
    .insert(newsletterSubscribers)
    .values({ email, locale: (locale as 'uz' | 'ru' | 'en' | null) ?? null, ip })
    .onConflictDoUpdate({
      target: newsletterSubscribers.email,
      set: { unsubscribedAt: sql`NULL` },
    });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const email = (url.searchParams.get('email') ?? '').trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'invalid email' }, { status: 400 });
  }
  await db
    .update(newsletterSubscribers)
    .set({ unsubscribedAt: new Date() })
    .where(eq(newsletterSubscribers.email, email));
  return NextResponse.json({ ok: true });
}
