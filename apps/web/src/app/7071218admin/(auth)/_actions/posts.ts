'use server';

import { db, posts } from '@sportlive/db';
import { eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { recordAudit } from '@/lib/audit';
import { autoSummary } from '@/lib/text';
import { setPostTags } from '@/lib/db';

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
  const featured = formData.get('featured') === '1';

  if (!title || !body) {
    throw new Error('title and body required');
  }
  const slug = slugRaw ? slugify(slugRaw) : slugify(title);
  const categoryId = categoryIdRaw ? parseInt(categoryIdRaw, 10) : null;
  const finalSummary = summary ?? autoSummary(body);
  const tagsRaw = ((formData.get('tags') as string) || '').trim();
  const tagNames = tagsRaw ? tagsRaw.split(',').map((s) => s.trim()).filter(Boolean) : [];

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
      summary: finalSummary,
      body,
      authorId: user.id,
      categoryId,
      status,
      publishedAt: status === 'published' ? new Date() : null,
      metaTitle: title.slice(0, 300),
      metaDescription: finalSummary
        ? finalSummary.replace(/<[^>]*>/g, '').slice(0, 500)
        : null,
      groupId: newGroupId,
      coverImage,
      featuredAt: featured ? new Date() : null,
    })
    .returning({ id: posts.id });

  await setPostTags(row!.id, locale as 'uz' | 'ru' | 'en', tagNames);

  await recordAudit({
    action: status === 'published' ? 'post.publish' : 'post.create',
    entityType: 'post',
    entityId: row!.id,
    summary: title.slice(0, 200),
    meta: { locale, status, categoryId },
  });

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
  const featured = formData.get('featured') === '1';

  if (!title || !body) throw new Error('title and body required');
  const slug = slugRaw ? slugify(slugRaw) : slugify(title);
  const categoryId = categoryIdRaw ? parseInt(categoryIdRaw, 10) : null;
  const finalSummary = summary ?? autoSummary(body);
  const tagsRaw = ((formData.get('tags') as string) || '').trim();
  const tagNames = tagsRaw ? tagsRaw.split(',').map((s) => s.trim()).filter(Boolean) : [];

  const existing = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (existing.length === 0) throw new Error('post not found');

  const wasPublished = existing[0]!.status === 'published';
  const publishedAt =
    status === 'published' && !wasPublished
      ? new Date()
      : status !== 'published'
        ? null
        : existing[0]!.publishedAt;

  const wasFeatured = existing[0]!.featuredAt !== null;
  const featuredAt = featured
    ? wasFeatured
      ? existing[0]!.featuredAt
      : new Date()
    : null;

  await db
    .update(posts)
    .set({
      slug,
      title,
      summary: finalSummary,
      body,
      categoryId,
      status,
      publishedAt,
      metaTitle: title.slice(0, 300),
      metaDescription: finalSummary
        ? finalSummary.replace(/<[^>]*>/g, '').slice(0, 500)
        : null,
      coverImage,
      featuredAt,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, id));

  await setPostTags(id, existing[0]!.locale, tagNames);

  const statusFlippedToPublished = status === 'published' && !wasPublished;
  await recordAudit({
    action: statusFlippedToPublished ? 'post.publish' : 'post.update',
    entityType: 'post',
    entityId: id,
    summary: title.slice(0, 200),
    meta: { fromStatus: existing[0]!.status, toStatus: status, categoryId },
  });

  revalidatePath('/7071218admin/news');
  revalidatePath('/');
  redirect(`/7071218admin/news/${id}/edit?saved=1`);
}

export async function deletePost(id: number) {
  const user = await getCurrentUser();
  if (!user) redirect('/7071218admin/login');

  const existing = await db
    .select({ title: posts.title })
    .from(posts)
    .where(eq(posts.id, id))
    .limit(1);

  await db.delete(posts).where(eq(posts.id, id));

  await recordAudit({
    action: 'post.delete',
    entityType: 'post',
    entityId: id,
    summary: existing[0]?.title.slice(0, 200),
  });

  revalidatePath('/7071218admin/news');
  redirect('/7071218admin/news');
}

export async function togglePostStatus(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/7071218admin/login');

  const id = parseInt((formData.get('id') as string) || '', 10);
  if (!Number.isFinite(id)) redirect('/7071218admin/news');

  const existing = await db
    .select({ status: posts.status, publishedAt: posts.publishedAt, title: posts.title })
    .from(posts)
    .where(eq(posts.id, id))
    .limit(1);
  if (existing.length === 0) redirect('/7071218admin/news');

  const wasPublished = existing[0]!.status === 'published';
  const nextStatus = wasPublished ? 'draft' : 'published';
  const publishedAt = !wasPublished
    ? existing[0]!.publishedAt ?? new Date()
    : existing[0]!.publishedAt;

  await db
    .update(posts)
    .set({ status: nextStatus, publishedAt, updatedAt: new Date() })
    .where(eq(posts.id, id));

  await recordAudit({
    action: wasPublished ? 'post.unpublish' : 'post.publish',
    entityType: 'post',
    entityId: id,
    summary: existing[0]!.title.slice(0, 200),
    meta: { fromStatus: existing[0]!.status, toStatus: nextStatus },
  });

  revalidatePath('/7071218admin/news');
  revalidatePath('/');
}

export async function togglePostFeature(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/7071218admin/login');

  const id = parseInt((formData.get('id') as string) || '', 10);
  if (!Number.isFinite(id)) redirect('/7071218admin/news');

  const existing = await db
    .select({ featuredAt: posts.featuredAt, title: posts.title })
    .from(posts)
    .where(eq(posts.id, id))
    .limit(1);
  if (existing.length === 0) redirect('/7071218admin/news');

  const wasFeatured = existing[0]!.featuredAt !== null;
  await db
    .update(posts)
    .set({ featuredAt: wasFeatured ? null : new Date(), updatedAt: new Date() })
    .where(eq(posts.id, id));

  await recordAudit({
    action: wasFeatured ? 'post.unfeature' : 'post.feature',
    entityType: 'post',
    entityId: id,
    summary: existing[0]!.title.slice(0, 200),
  });

  revalidatePath('/7071218admin/news');
  revalidatePath('/');
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

  await recordAudit({
    action: `post.bulk.${action}`,
    entityType: 'post',
    summary: `${ids.length} posts`,
    meta: { ids, action },
  });

  revalidatePath('/7071218admin/news');
  revalidatePath('/');
  redirect(`/7071218admin/news?bulk=${action}&n=${ids.length}`);
}

