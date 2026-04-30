import { NextRequest, NextResponse } from 'next/server';
import { sendWeeklyDigest } from '@/lib/newsletter';
import { routing } from '@/i18n/routing';

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

  const localeArg = req.nextUrl.searchParams.get('locale');
  const targets = localeArg && routing.locales.includes(localeArg as never) ? [localeArg] : [...routing.locales];

  const results: Record<string, unknown> = {};
  for (const l of targets) {
    try {
      results[l] = await sendWeeklyDigest(l as 'uz' | 'ru' | 'en');
    } catch (e) {
      results[l] = { error: e instanceof Error ? e.message : String(e) };
    }
  }
  return NextResponse.json({ ok: true, results });
}
