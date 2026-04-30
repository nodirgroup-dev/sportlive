'use server';

import { db, users } from '@sportlive/db';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { getCurrentUser, hashPassword, verifyPassword } from '@/lib/auth';

export async function changePassword(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/7071218admin/login');

  const current = ((formData.get('current') as string) || '').trim();
  const next = ((formData.get('next') as string) || '').trim();
  const confirm = ((formData.get('confirm') as string) || '').trim();

  if (!current || !next || !confirm) {
    redirect('/7071218admin/settings?err=empty');
  }
  if (next.length < 8) {
    redirect('/7071218admin/settings?err=weak');
  }
  if (next !== confirm) {
    redirect('/7071218admin/settings?err=mismatch');
  }

  const rows = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);
  if (!(await verifyPassword(current, rows[0]?.passwordHash ?? null))) {
    redirect('/7071218admin/settings?err=wrong');
  }

  const hash = await hashPassword(next);
  await db.update(users).set({ passwordHash: hash, updatedAt: new Date() }).where(eq(users.id, user.id));
  redirect('/7071218admin/settings?saved=1');
}
