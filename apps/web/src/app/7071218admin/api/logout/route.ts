import { NextResponse } from 'next/server';
import { signOut } from '@/lib/auth';
import { recordAudit } from '@/lib/audit';

export async function POST() {
  await recordAudit({ action: 'user.signout' });
  await signOut();
  return NextResponse.json({ ok: true });
}
