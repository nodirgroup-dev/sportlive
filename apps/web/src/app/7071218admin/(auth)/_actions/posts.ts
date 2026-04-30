'use server';

import { db, posts } from '@sportlive/db';
import { eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[''ʻ`]/g, '')
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

export async function createPost(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/7071218admin/login');

  const locale = (formData.get('locale') as string) || 'uz';
  const title = ((formData.get('title') as string) || '').trim();
  const summary = ((formData.get('summary') as string) || '').trim() || null;
  const body = ((formData.get('body') as string) || '').trim();
  const slugRaw = ((formData.get('slug') as string) || '').trim();
  const categoryIdRaw = ((formData.get('categoryId') as string) || '').trim();
  const status = ((formData.get('status') as string) || 'draft') as 'draft' | 'published';
  const coverImage = ((formData.get('coverImage') as string) || '').trim() || null;

  if (!title || !body) {
    throw new Error('title and body required');
  }
  const slug = slugRaw ? slugify(slugRaw) : slugify(title);
  const categoryId = categoryIdRaw ? parseInt(categoryIdRaw, 10) : null;

  // groupId: pick max + 1 to avoid collision with legacy_id range
  const maxGroup = await db
    .select({ m: posts.groupId })
    .from(posts)
    .orderBy(posts.groupId)
    .limit(1);
  const newGroupId = (maxGroup[0]?.m ?? 0) + 100000;

  const [row] = await db
    .insert(posts)
    .values({
      locale: locale as 'uz' | 'ru' | 'en',
      slug,
      title,
      summary,
      body,
      authorId: user.id,
      categoryId,
      status,
      publishedAt: status === 'published' ? new Date() : null,
      metaTitle: title.slice(0, 300),
      metaDescription: summary ? summary.replace(/<[^>]*>/g, '').slice(0, 500) : null,
      groupId: newGroupId,
      coverImage,
    })
    .returning({ id: posts.id });

  revalidatePath('/7071218admin/news');
  revalidatePath('/');
  redirect(`/7071218admin/news/${row!.id}/edit?saved=1`);
}

export async function updatePost(id: number, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/7071218admin/login');

  const title = ((formData.get('title') as string) || '').trim();
  const summary = ((formData.get('summary') as string) || '').trim() || null;
  const body = ((formData.get('body') as string) || '').trim();
  const slugRaw = ((formData.get('slug') as string) || '').trim();
  const categoryIdRaw = ((formData.get('categoryId') as string) || '').trim();
  const status = ((formData.get('status') as string) || 'draft') as 'draft' | 'published' | 'archived';
  const coverImage = ((formData.get('coverImage') as string) || '').trim() || null;

  if (!title || !body) throw new Error('title and body required');
  const slug = slugRaw ? slugify(slugRaw) : slugify(title);
  const categoryId = categoryIdRaw ? parseInt(categoryIdRaw, 10) : null;

  const existing = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (existing.length === 0) throw new Error('post not found');

  const wasPublished = existing[0]!.status === 'published';
  const publishedAt =
    status === 'published' && !wasPublished
      ? new Date()
      : status !== 'published'
        ? null
        : existing[0]!.publishedAt;

  await db
    .update(posts)
    .set({
      slug,
      title,
      summary,
      body,
      categoryId,
      status,
      publishedAt,
      metaTitle: title.slice(0, 300),
      metaDescription: summary ? summary.replace(/<[^>]*>/g, '').slice(0, 500) : null,
      coverImage,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, id));

  revalidatePath('/7071218admin/news');
  revalidatePath('/');
  redirect(`/7071218admin/news/${id}/edit?saved=1`);
}

export async function deletePost(id: number) {
  const user = await getCurrentUser();
  if (!user) redirect('/7071218admin/login');

  await db.delete(posts).where(eq(posts.id, id));
  revalidatePath('/7071218admin/news');
  redirect('/7071218admin/news');
}

export async function bulkPostsAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'admin' && user.role !== 'editor')) redirect('/7071218admin/login');

  const action = (formData.get('action') as string) || '';
  const ids = formData
    .getAll('ids')
    .map((v) => parseInt(String(v), 10))
    .filter(Number.isFinite);
  if (ids.length === 0 || !action) {
    redirect('/7071218admin/news');
  }

  if (action === 'publish') {
    await db
      .update(posts)
      .set({ status: 'published', publishedAt: new Date(), updatedAt: new Date() })
      .where(inArray(posts.id, ids));
  } else if (action === 'unpublish') {
    await db
      .update(posts)
      .set({ status: 'draft', updatedAt: new Date() })
      .where(inArray(posts.id, ids));
  } else if (action === 'archive') {
    await db
      .update(posts)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(inArray(posts.id, ids));
  } else if (action === 'delete') {
    await db.delete(posts).where(inArray(posts.id, ids));
  }
  revalidatePath('/7071218admin/news');
  revalidatePath('/');
  redirect(`/7071218admin/news?bulk=${action}&n=${ids.length}`);
}

