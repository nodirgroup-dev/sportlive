import { NextRequest, NextResponse } from 'next/server';
import { db, pushSubscriptions } from '@sportlive/db';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const endpoint = (body.endpoint ?? '').trim();
  if (!endpoint) return NextResponse.json({ error: 'missing endpoint' }, { status: 400 });
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  return NextResponse.json({ ok: true });
}
