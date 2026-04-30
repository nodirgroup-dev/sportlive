'use server';

import { redirect } from 'next/navigation';
import { db, rssSources } from '@sportlive/db';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { recordAudit } from '@/lib/audit';
import { importRssFeed } from '@/lib/rss';
import { hasLocale } from '@/i18n/routing';

export async function createRssSource(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/7071218admin/login');

  const name = ((formData.get('name') as string) || '').trim();
  const feedUrl = ((formData.get('feedUrl') as string) || '').trim();
  const localeRaw = ((formData.get('locale') as string) || '').trim();
  const locale = hasLocale(localeRaw) ? (localeRaw as 'uz' | 'ru' | 'en') : 'uz';
  const categoryIdRaw = ((formData.get('categoryId') as string) || '').trim();
  const categoryId = categoryIdRaw ? parseInt(categoryIdRaw, 10) : null;
  const rewriteEnabled = formData.get('rewriteEnabled') === '1' ? 1 : 0;

  if (!name || !feedUrl) redirect('/7071218admin/rss?error=missing');

  const inserted = await db
    .insert(rssSources)
    .values({ name, feedUrl, locale, categoryId, rewriteEnabled })
    .returning({ id: rssSources.id });

  await recordAudit({
    action: 'rss.source.create',
    entityType: 'rss_source',
    entityId: inserted[0]!.id,
    summary: name,
    meta: { feedUrl, locale, rewriteEnabled },
  });

  revalidatePath('/7071218admin/rss');
  redirect('/7071218admin/rss');
}

export async function toggleRssEnabled(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/7071218admin/login');
  const id = parseInt((formData.get('id') as string) || '', 10);
  if (!Number.isFinite(id)) redirect('/7071218admin/rss');
  const cur = await db.select({ enabled: rssSources.enabled }).from(rssSources).where(eq(rssSources.id, id)).limit(1);
  if (cur.length === 0) redirect('/7071218admin/rss');
  const next = cur[0]!.enabled === 0 ? 1 : 0;
  await db.update(rssSources).set({ enabled: next }).where(eq(rssSources.id, id));
  revalidatePath('/7071218admin/rss');
}

export async function deleteRssSource(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/7071218admin/login');
  const id = parseInt((formData.get('id') as string) || '', 10);
  if (!Number.isFinite(id)) redirect('/7071218admin/rss');
  await db.delete(rssSources).where(eq(rssSources.id, id));
  await recordAudit({ action: 'rss.source.delete', entityType: 'rss_source', entityId: id });
  revalidatePath('/7071218admin/rss');
}

export async function importRssNow(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/7071218admin/login');
  const id = parseInt((formData.get('id') as string) || '', 10);
  if (!Number.isFinite(id)) redirect('/7071218admin/rss');

  try {
    const stats = await importRssFeed(id);
    await recordAudit({
      action: 'rss.import',
      entityType: 'rss_source',
      entityId: id,
      summary: `${stats.created}/${stats.fetched} imported`,
      meta: { ...stats },
    });
    revalidatePath('/7071218admin/rss');
    revalidatePath('/7071218admin/news');
    redirect(
      `/7071218admin/rss?ok=1&fetched=${stats.fetched}&created=${stats.created}&skipped=${stats.skipped}&errors=${stats.errors}`,
    );
  } catch (e) {
    redirect(`/7071218admin/rss?error=${encodeURIComponent(e instanceof Error ? e.message : 'unknown')}`);
  }
}
