'use server';

import { db, staticPages } from '@sportlive/db';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 200);
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'admin' && user.role !== 'editor')) redirect('/7071218admin/login');
  return user;
}

export async function createStaticPage(formData: FormData) {
  await requireAdmin();
  const locale = ((formData.get('locale') as string) || 'uz') as 'uz' | 'ru' | 'en';
  const title = ((formData.get('title') as string) || '').trim();
  const slugRaw = ((formData.get('slug') as string) || '').trim();
  const description = ((formData.get('description') as string) || '').trim() || null;
  const body = ((formData.get('body') as string) || '').trim();
  const metaTitle = ((formData.get('metaTitle') as string) || '').trim() || null;
  const metaDescription = ((formData.get('metaDescription') as string) || '').trim() || null;
  const sortOrderRaw = ((formData.get('sortOrder') as string) || '0').trim();
  const showInFooter = formData.get('showInFooter') === 'on' ? 1 : 0;

  if (!title || !body) throw new Error('title + body required');
  const slug = slugRaw ? slugify(slugRaw) : slugify(title);
  const sortOrder = parseInt(sortOrderRaw, 10) || 0;

  const [row] = await db
    .insert(staticPages)
    .values({
      locale,
      slug,
      title,
      description,
      body,
      metaTitle,
      metaDescription,
      sortOrder,
      showInFooter,
    })
    .returning({ id: staticPages.id });

  revalidatePath('/7071218admin/static');
  revalidatePath('/');
  redirect(`/7071218admin/static/${row!.id}/edit?saved=1`);
}

export async function updateStaticPage(id: number, formData: FormData) {
  await requireAdmin();
  const title = ((formData.get('title') as string) || '').trim();
  const slugRaw = ((formData.get('slug') as string) || '').trim();
  const description = ((formData.get('description') as string) || '').trim() || null;
  const body = ((formData.get('body') as string) || '').trim();
  const metaTitle = ((formData.get('metaTitle') as string) || '').trim() || null;
  const metaDescription = ((formData.get('metaDescription') as string) || '').trim() || null;
  const sortOrderRaw = ((formData.get('sortOrder') as string) || '0').trim();
  const showInFooter = formData.get('showInFooter') === 'on' ? 1 : 0;

  if (!title || !body) throw new Error('title + body required');
  const slug = slugRaw ? slugify(slugRaw) : slugify(title);
  const sortOrder = parseInt(sortOrderRaw, 10) || 0;

  await db
    .update(staticPages)
    .set({
      slug,
      title,
      description,
      body,
      metaTitle,
      metaDescription,
      sortOrder,
      showInFooter,
      updatedAt: new Date(),
    })
    .where(eq(staticPages.id, id));

  revalidatePath('/7071218admin/static');
  revalidatePath('/');
  redirect(`/7071218admin/static/${id}/edit?saved=1`);
}

export async function deleteStaticPage(id: number) {
  await requireAdmin();
  await db.delete(staticPages).where(eq(staticPages.id, id));
  revalidatePath('/7071218admin/static');
  revalidatePath('/');
  redirect('/7071218admin/static?saved=1');
}
