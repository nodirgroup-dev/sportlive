'use server';

import { db, banners } from '@sportlive/db';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

async function requireAdmin() {
  const u = await getCurrentUser();
  if (!u || (u.role !== 'admin' && u.role !== 'editor')) redirect('/7071218admin/login');
}

type Position = 'header' | 'sidebar' | 'in_article_top' | 'in_article_bottom' | 'footer';

function readForm(formData: FormData) {
  return {
    name: ((formData.get('name') as string) || '').trim(),
    position: ((formData.get('position') as string) || 'sidebar') as Position,
    imageUrl: ((formData.get('imageUrl') as string) || '').trim(),
    linkUrl: ((formData.get('linkUrl') as string) || '').trim() || null,
    altText: ((formData.get('altText') as string) || '').trim() || null,
    htmlSnippet: ((formData.get('htmlSnippet') as string) || '').trim() || null,
    sortOrder: parseInt(((formData.get('sortOrder') as string) || '0').trim(), 10) || 0,
    active: formData.get('active') === 'on',
  };
}

export async function createBanner(formData: FormData) {
  await requireAdmin();
  const v = readForm(formData);
  if (!v.name || !v.imageUrl) throw new Error('name + imageUrl required');
  const [row] = await db.insert(banners).values(v).returning({ id: banners.id });
  revalidatePath('/7071218admin/banners');
  redirect(`/7071218admin/banners/${row!.id}/edit?saved=1`);
}

export async function updateBanner(id: number, formData: FormData) {
  await requireAdmin();
  const v = readForm(formData);
  if (!v.name || !v.imageUrl) throw new Error('name + imageUrl required');
  await db.update(banners).set({ ...v, updatedAt: new Date() }).where(eq(banners.id, id));
  revalidatePath('/7071218admin/banners');
  redirect(`/7071218admin/banners/${id}/edit?saved=1`);
}

export async function deleteBanner(id: number) {
  await requireAdmin();
  await db.delete(banners).where(eq(banners.id, id));
  revalidatePath('/7071218admin/banners');
  redirect('/7071218admin/banners?saved=1');
}

export async function toggleBanner(id: number, active: boolean) {
  await requireAdmin();
  await db.update(banners).set({ active, updatedAt: new Date() }).where(eq(banners.id, id));
  revalidatePath('/7071218admin/banners');
}
