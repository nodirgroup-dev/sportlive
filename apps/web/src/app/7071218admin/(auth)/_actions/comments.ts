'use server';

import { db, comments } from '@sportlive/db';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { recordAudit } from '@/lib/audit';

async function requireAdmin() {
  const u = await getCurrentUser();
  if (!u || (u.role !== 'admin' && u.role !== 'editor')) redirect('/7071218admin/login');
}

export async function setCommentStatus(
  id: number,
  status: 'approved' | 'pending' | 'spam' | 'rejected',
) {
  await requireAdmin();
  await db.update(comments).set({ status, updatedAt: new Date() }).where(eq(comments.id, id));
  await recordAudit({
    action: `comment.${status}`,
    entityType: 'comment',
    entityId: id,
  });
  revalidatePath('/7071218admin/comments');
}

export async function deleteComment(id: number) {
  await requireAdmin();
  await db.delete(comments).where(eq(comments.id, id));
  await recordAudit({
    action: 'comment.delete',
    entityType: 'comment',
    entityId: id,
  });
  revalidatePath('/7071218admin/comments');
}
