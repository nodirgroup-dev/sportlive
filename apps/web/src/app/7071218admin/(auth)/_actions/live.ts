'use server';

import { db, liveEntries } from '@sportlive/db';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

type EntryType =
  | 'comment'
  | 'goal'
  | 'yellow_card'
  | 'red_card'
  | 'sub'
  | 'var'
  | 'kickoff'
  | 'half_time'
  | 'full_time'
  | 'general';

const TYPES: ReadonlySet<EntryType> = new Set([
  'comment',
  'goal',
  'yellow_card',
  'red_card',
  'sub',
  'var',
  'kickoff',
  'half_time',
  'full_time',
  'general',
]);

async function requireAdmin() {
  const u = await getCurrentUser();
  if (!u || (u.role !== 'admin' && u.role !== 'editor' && u.role !== 'author')) {
    redirect('/7071218admin/login');
  }
  return u;
}

export async function addLiveEntry(formData: FormData) {
  const user = await requireAdmin();
  const fixtureId = parseInt((formData.get('fixtureId') as string) || '0', 10);
  const minuteRaw = (formData.get('minute') as string) || '';
  const type = (formData.get('type') as string) || 'comment';
  const body = ((formData.get('body') as string) || '').trim();
  const embedUrl = ((formData.get('embedUrl') as string) || '').trim() || null;

  if (!Number.isFinite(fixtureId) || !body) throw new Error('fixture and body required');
  const minute = minuteRaw ? Math.max(0, Math.min(150, parseInt(minuteRaw, 10) || 0)) : null;
  const safeType = (TYPES.has(type as EntryType) ? type : 'comment') as EntryType;

  await db.insert(liveEntries).values({
    fixtureId,
    minute,
    type: safeType,
    body,
    embedUrl,
    authorId: user.id,
  });
  revalidatePath(`/7071218admin/live/${fixtureId}`);
  revalidatePath(`/match/${fixtureId}`);
  redirect(`/7071218admin/live/${fixtureId}`);
}

export async function deleteLiveEntry(id: number, fixtureId: number) {
  await requireAdmin();
  await db.delete(liveEntries).where(eq(liveEntries.id, id));
  revalidatePath(`/7071218admin/live/${fixtureId}`);
  revalidatePath(`/match/${fixtureId}`);
}

export async function togglePinLiveEntry(id: number, fixtureId: number, pinned: number) {
  await requireAdmin();
  await db.update(liveEntries).set({ pinned }).where(eq(liveEntries.id, id));
  revalidatePath(`/7071218admin/live/${fixtureId}`);
  revalidatePath(`/match/${fixtureId}`);
}
