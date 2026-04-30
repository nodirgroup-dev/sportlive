'use server';

import { redirect } from 'next/navigation';
import { db, posts, categories } from '@sportlive/db';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { recordAudit } from '@/lib/audit';
import { broadcastPush } from '@/lib/push';
import { autoSummary } from '@/lib/text';
import { siteConfig } from '@/lib/site';

export async function broadcastPostPush(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/7071218admin/login');

  const id = parseInt((formData.get('id') as string) || '', 10);
  if (!Number.isFinite(id)) redirect('/7071218admin/push?error=bad_id');

  const rows = await db
    .select({
      id: posts.id,
      legacyId: posts.legacyId,
      slug: posts.slug,
      title: posts.title,
      summary: posts.summary,
      body: posts.body,
      coverImage: posts.coverImage,
      locale: posts.locale,
      categoryId: posts.categoryId,
      categoryPath: categories.slug,
    })
    .from(posts)
    .leftJoin(categories, eq(categories.id, posts.categoryId))
    .where(eq(posts.id, id))
    .limit(1);
  if (rows.length === 0) redirect('/7071218admin/push?error=not_found');
  const p = rows[0]!;

  const url = `${siteConfig.url}/${p.locale === 'uz' ? '' : p.locale + '/'}${p.categoryPath ? p.categoryPath + '/' : ''}${p.legacyId}-${p.slug}`;
  const body = (p.summary && p.summary.trim()) || autoSummary(p.body, 140);

  const stats = await broadcastPush(
    {
      title: p.title,
      body: body.slice(0, 200),
      url,
      image: p.coverImage ?? undefined,
      tag: `post-${p.id}`,
    },
    p.locale as 'uz' | 'ru' | 'en',
  );

  await recordAudit({
    action: 'push.broadcast',
    entityType: 'post',
    entityId: p.id,
    summary: `${stats.sent}/${stats.total} delivered`,
    meta: { ...stats, url },
  });

  redirect(
    `/7071218admin/push?ok=1&sent=${stats.sent}&total=${stats.total}&invalidated=${stats.invalidated}&errors=${stats.errors}&id=${p.id}`,
  );
}
