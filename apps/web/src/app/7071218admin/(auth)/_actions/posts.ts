'use server';

import { db, posts } from '@sportlive/db';
import { desc, eq, inArray, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { recordAudit } from '@/lib/audit';
import { autoSummary } from '@/lib/text';
import { setPostTags } from '@/lib/db';
import { broadcastPush } from '@/lib/push';
import { siteConfig } from '@/lib/site';
import { categories } from '@sportlive/db';

async function maybeBroadcastPostPush(post: {
  id: number;
  legacyId: number | null;
  slug: string;
  title: string;
  summary: string | null;
  body: string;
  coverImage: string | null;
  locale: 'uz' | 'ru' | 'en';
  categoryId: number | null;
}): Promise<{ sent: number; total: number } | null> {
  let categoryPath: string | null = null;
  if (post.categoryId) {
    const c = await db
      .select({ slug: categories.slug })
      .from(categories)
      .where(eq(categories.id, post.categoryId))
      .limit(1);
    categoryPath = c[0]?.slug ?? null;
  }
  const url = `${siteConfig.url}/${post.locale === 'uz' ? '' : post.locale + '/'}${categoryPath ? categoryPath + '/' : ''}${post.legacyId ?? post.id}-${post.slug}`;
  const body = (post.summary && post.summary.trim()) || autoSummary(post.body, 140);
  try {
    const stats = await broadcastPush(
      {
        title: post.title,
        body: body.slice(0, 200),
        url,
        image: post.coverImage ?? undefined,
        tag: `post-${post.id}`,
      },
      post.locale,
    );
    await recordAudit({
      action: 'push.broadcast',
      entityType: 'post',
      entityId: post.id,
      summary: `${stats.sent}/${stats.total} delivered`,
      meta: { ...stats, url, source: 'auto' },
    });
    return { sent: stats.sent, total: stats.total };
  } catch (e) {
    console.error('[push] auto-broadcast failed', e);
    return null;
  }
}

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
  const status = ((formData.get('status') as string) || 'draft') as
    | 'draft'
    | 'scheduled'
    | 'published'
    | 'archived';
  const coverImage = ((formData.get('coverImage') as string) || '').trim() || null;
  const featured = formData.get('featured') === '1';
  const publishedAtRaw = ((formData.get('publishedAt') as string) || '').trim();
  const requestedPublishAt = publishedAtRaw ? new Date(publishedAtRaw) : null;

  if (!title || !body) {
    throw new Error('title and body required');
  }
  const slug = slugRaw ? slugify(slugRaw) : slugify(title);
  const categoryId = categoryIdRaw ? parseInt(categoryIdRaw, 10) : null;
  const finalSummary = summary ?? autoSummary(body);
  const tagsRaw = ((formData.get('tags') as string) || '').trim();
  const tagNames = tagsRaw ? tagsRaw.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const sendPush = formData.get('sendPush') === '1';

  let computedPublishedAt: Date | null = null;
  let computedStatus: 'draft' | 'scheduled' | 'published' | 'archived' = status;
  if (status === 'scheduled') {
    if (!requestedPublishAt || Number.isNaN(requestedPublishAt.getTime())) {
      throw new Error('scheduled status requires publishedAt');
    }
    computedPublishedAt = requestedPublishAt;
    // If schedule is in the past, just publish now.
    if (requestedPublishAt <= new Date()) computedStatus = 'published';
  } else if (status === 'published') {
    computedPublishedAt = requestedPublishAt && !Number.isNaN(requestedPublishAt.getTime())
      ? requestedPublishAt
      : new Date();
  }

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
      status: computedStatus,
      publishedAt: computedPublishedAt,
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
    action:
      computedStatus === 'published'
        ? 'post.publish'
        : computedStatus === 'scheduled'
          ? 'post.schedule'
          : 'post.create',
    entityType: 'post',
    entityId: row!.id,
    summary: title.slice(0, 200),
    meta: { locale, status: computedStatus, categoryId, publishedAt: computedPublishedAt },
  });

  let pushQuery = '';
  if (sendPush && computedStatus === 'published') {
    const stats = await maybeBroadcastPostPush({
      id: row!.id,
      legacyId: null,
      slug,
      title,
      summary: finalSummary,
      body,
      coverImage,
      locale: locale as 'uz' | 'ru' | 'en',
      categoryId,
    });
    if (stats) pushQuery = `&push=${stats.sent}/${stats.total}`;
  }

  revalidatePath('/7071218admin/news');
  revalidatePath('/');
  redirect(`/7071218admin/news/${row!.id}/edit?saved=1${pushQuery}`);
}

export async function updatePost(id: number, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/7071218admin/login');

  const title = ((formData.get('title') as string) || '').trim();
  const summary = ((formData.get('summary') as string) || '').trim() || null;
  const body = ((formData.get('body') as string) || '').trim();
  const slugRaw = ((formData.get('slug') as string) || '').trim();
  const categoryIdRaw = ((formData.get('categoryId') as string) || '').trim();
  const status = ((formData.get('status') as string) || 'draft') as
    | 'draft'
    | 'scheduled'
    | 'published'
    | 'archived';
  const coverImage = ((formData.get('coverImage') as string) || '').trim() || null;
  const featured = formData.get('featured') === '1';
  const publishedAtRaw = ((formData.get('publishedAt') as string) || '').trim();
  const requestedPublishAt = publishedAtRaw ? new Date(publishedAtRaw) : null;

  if (!title || !body) throw new Error('title and body required');
  const slug = slugRaw ? slugify(slugRaw) : slugify(title);
  const categoryId = categoryIdRaw ? parseInt(categoryIdRaw, 10) : null;
  const finalSummary = summary ?? autoSummary(body);
  const tagsRaw = ((formData.get('tags') as string) || '').trim();
  const tagNames = tagsRaw ? tagsRaw.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const sendPush = formData.get('sendPush') === '1';

  const existing = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (existing.length === 0) throw new Error('post not found');

  const wasPublished = existing[0]!.status === 'published';

  let computedStatus = status;
  let publishedAt: Date | null = existing[0]!.publishedAt;
  if (status === 'scheduled') {
    if (!requestedPublishAt || Number.isNaN(requestedPublishAt.getTime())) {
      throw new Error('scheduled status requires publishedAt');
    }
    publishedAt = requestedPublishAt;
    if (requestedPublishAt <= new Date()) computedStatus = 'published';
  } else if (status === 'published') {
    if (requestedPublishAt && !Number.isNaN(requestedPublishAt.getTime())) {
      publishedAt = requestedPublishAt;
    } else if (!wasPublished) {
      publishedAt = new Date();
    }
  } else {
    publishedAt = null;
  }

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
      status: computedStatus,
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

  const statusFlippedToPublished = computedStatus === 'published' && !wasPublished;
  const becameScheduled = computedStatus === 'scheduled' && existing[0]!.status !== 'scheduled';
  await recordAudit({
    action: becameScheduled
      ? 'post.schedule'
      : statusFlippedToPublished
        ? 'post.publish'
        : 'post.update',
    entityType: 'post',
    entityId: id,
    summary: title.slice(0, 200),
    meta: { fromStatus: existing[0]!.status, toStatus: status, categoryId },
  });

  let pushQuery = '';
  if (sendPush && computedStatus === 'published') {
    const stats = await maybeBroadcastPostPush({
      id,
      legacyId: existing[0]!.legacyId,
      slug,
      title,
      summary: finalSummary,
      body,
      coverImage,
      locale: existing[0]!.locale,
      categoryId,
    });
    if (stats) pushQuery = `&push=${stats.sent}/${stats.total}`;
  }

  revalidatePath('/7071218admin/news');
  revalidatePath('/');
  redirect(`/7071218admin/news/${id}/edit?saved=1${pushQuery}`);
}

export async function duplicatePost(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/7071218admin/login');

  const id = parseInt((formData.get('id') as string) || '', 10);
  if (!Number.isFinite(id)) redirect('/7071218admin/news');

  const source = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (source.length === 0) redirect('/7071218admin/news?dup=not_found');
  const s = source[0]!;

  // Group: new groupId so the duplicate doesn't mess with cross-locale linking.
  const maxGroup = await db.select({ m: posts.groupId }).from(posts).orderBy(desc(posts.groupId)).limit(1);
  const newGroupId = (maxGroup[0]?.m ?? 0) + 1;

  // Slug: append -copy and a random suffix to dodge unique (locale, slug) conflicts.
  const dupSuffix = `-copy-${Math.random().toString(36).slice(2, 7)}`;
  const newSlug = (s.slug + dupSuffix).slice(0, 200);
  const newTitle = `[COPY] ${s.title}`.slice(0, 300);

  const [row] = await db
    .insert(posts)
    .values({
      locale: s.locale,
      slug: newSlug,
      title: newTitle,
      summary: s.summary,
      body: s.body,
      authorId: user.id,
      categoryId: s.categoryId,
      status: 'draft',
      publishedAt: null,
      metaTitle: s.metaTitle,
      metaDescription: s.metaDescription,
      metaKeywords: s.metaKeywords,
      groupId: newGroupId,
      coverImage: s.coverImage,
      coverImageWidth: s.coverImageWidth,
      coverImageHeight: s.coverImageHeight,
      featuredAt: null,
    })
    .returning({ id: posts.id });

  // Copy tags as well.
  const srcTags = await db.execute(
    sql`SELECT name FROM tags t JOIN post_tags pt ON pt.tag_id = t.id WHERE pt.post_id = ${id}`,
  );
  const tagNames = (srcTags as unknown as Array<{ name: string }>).map((r) => r.name);
  if (tagNames.length > 0) {
    await setPostTags(row!.id, s.locale, tagNames);
  }

  await recordAudit({
    action: 'post.duplicate',
    entityType: 'post',
    entityId: row!.id,
    summary: newTitle,
    meta: { sourceId: id },
  });

  revalidatePath('/7071218admin/news');
  redirect(`/7071218admin/news/${row!.id}/edit?dup=1`);
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

