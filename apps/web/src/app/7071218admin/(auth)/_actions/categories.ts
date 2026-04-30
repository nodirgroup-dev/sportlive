'use server';

import { db, categories, posts } from '@sportlive/db';
import { eq, count } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[''ʻ`]/g, '')
    .replace(/[^a-z0-9-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
    redirect('/7071218admin/login');
  }
  return user;
}

export async function createCategory(formData: FormData) {
  await requireAdmin();
  const locale = ((formData.get('locale') as string) || 'uz') as 'uz' | 'ru' | 'en';
  const name = ((formData.get('name') as string) || '').trim();
  const slugRaw = ((formData.get('slug') as string) || '').trim();
  const description = ((formData.get('description') as string) || '').trim() || null;
  const parentIdRaw = ((formData.get('parentId') as string) || '').trim();
  const sortOrderRaw = ((formData.get('sortOrder') as string) || '0').trim();

  if (!name) throw new Error('name required');
  const slug = slugRaw ? slugify(slugRaw) : slugify(name);
  const parentId = parentIdRaw ? parseInt(parentIdRaw, 10) : null;
  const sortOrder = parseInt(sortOrderRaw, 10) || 0;

  await db.insert(categories).values({ locale, slug, name, description, parentId, sortOrder });
  revalidatePath('/7071218admin/categories');
  revalidatePath('/');
  redirect('/7071218admin/categories?saved=1');
}

export async function updateCategory(id: number, formData: FormData) {
  await requireAdmin();
  const name = ((formData.get('name') as string) || '').trim();
  const slugRaw = ((formData.get('slug') as string) || '').trim();
  const description = ((formData.get('description') as string) || '').trim() || null;
  const parentIdRaw = ((formData.get('parentId') as string) || '').trim();
  const sortOrderRaw = ((formData.get('sortOrder') as string) || '0').trim();

  if (!name) throw new Error('name required');
  const slug = slugRaw ? slugify(slugRaw) : slugify(name);
  const parentId = parentIdRaw ? parseInt(parentIdRaw, 10) : null;
  const sortOrder = parseInt(sortOrderRaw, 10) || 0;

  await db
    .update(categories)
    .set({ slug, name, description, parentId: parentId === id ? null : parentId, sortOrder, updatedAt: new Date() })
    .where(eq(categories.id, id));
  revalidatePath('/7071218admin/categories');
  revalidatePath('/');
  redirect(`/7071218admin/categories/${id}/edit?saved=1`);
}

export async function deleteCategory(id: number) {
  await requireAdmin();
  // Don't delete if posts reference it.
  const [{ value: postCount } = { value: 0 }] = await db
    .select({ value: count() })
    .from(posts)
    .where(eq(posts.categoryId, id));
  if (postCount > 0) {
    redirect(`/7071218admin/categories?err=in_use`);
  }
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath('/7071218admin/categories');
  revalidatePath('/');
  redirect('/7071218admin/categories?saved=1');
}
