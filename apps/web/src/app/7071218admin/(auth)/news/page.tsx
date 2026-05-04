import Link from 'next/link';
import { db, posts, categories } from '@sportlive/db';
import { desc, eq, sql } from 'drizzle-orm';
import { Plus } from 'lucide-react';
import { bulkPostsAction } from '../_actions/posts';
import { AdminPageHeader } from '../../_components/page-header';
import { TH, T } from '../../_components/t';
import { NewsFilters, StatusPill } from './_filters';
import { NewsBulkForm, BulkDoneBanner } from './_bulk-form';
import { NewsRowActions, PinnedMark } from './_row-actions';

export const dynamic = 'force-dynamic';

async function getList(localeFilter: string | null, q: string | null, statusFilter: string | null) {
  const where: ReturnType<typeof eq>[] = [];
  if (localeFilter) where.push(eq(posts.locale, localeFilter as 'uz' | 'ru' | 'en'));
  if (statusFilter)
    where.push(eq(posts.status, statusFilter as 'draft' | 'scheduled' | 'published' | 'archived'));

  let query = db
    .select({
      id: posts.id,
      legacyId: posts.legacyId,
      locale: posts.locale,
      title: posts.title,
      slug: posts.slug,
      status: posts.status,
      publishedAt: posts.publishedAt,
      categoryId: posts.categoryId,
      categoryName: categories.name,
      coverImage: posts.coverImage,
      featuredAt: posts.featuredAt,
    })
    .from(posts)
    .leftJoin(categories, eq(categories.id, posts.categoryId))
    .orderBy(desc(posts.publishedAt))
    .limit(50)
    .$dynamic();
  if (where.length > 0) {
    query = query.where(where[0]!);
  }
  if (q) {
    query = query.where(sql`${posts.title} ILIKE ${'%' + q + '%'}`);
  }
  return query;
}

export default async function NewsList({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string; q?: string; status?: string; bulk?: string; n?: string }>;
}) {
  const sp = await searchParams;
  const list = await getList(sp.locale ?? null, sp.q ?? null, sp.status ?? null);

  return (
    <>
      <AdminPageHeader
        pageId="news"
        actions={
          <Link href="/7071218admin/news/new" className="btn primary">
            <Plus size={14} strokeWidth={2.5} />
            <T tk="news_create_article_btn" />
          </Link>
        }
      >
        {list.length} <T tk="news_count_articles" />
      </AdminPageHeader>

      {sp.bulk ? (
        <BulkDoneBanner
          kind={
            sp.bulk === 'publish'
              ? 'publish'
              : sp.bulk === 'unpublish'
                ? 'unpublish'
                : sp.bulk === 'archive'
                  ? 'archive'
                  : 'delete'
          }
          count={sp.n ?? '?'}
        />
      ) : null}

      <NewsFilters
        defaultQ={sp.q ?? ''}
        defaultLocale={sp.locale ?? ''}
        defaultStatus={sp.status ?? ''}
      />

      <NewsBulkForm action={bulkPostsAction}>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 32 }} />
              <TH tk="th_photo" style={{ width: 64 }} />
              <TH tk="title" />
              <TH tk="category" />
              <TH tk="language" />
              <TH tk="status" />
              <TH tk="date" />
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id}>
                <td>
                  <input type="checkbox" name="ids" value={r.id} className="chk-input" />
                </td>
                <td>
                  {r.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.coverImage}
                      alt=""
                      loading="lazy"
                      style={{
                        width: 56,
                        height: 36,
                        objectFit: 'cover',
                        borderRadius: 4,
                        display: 'block',
                        background: 'var(--bg-2)',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 56,
                        height: 36,
                        borderRadius: 4,
                        background: 'var(--bg-2)',
                        border: '1px dashed var(--border)',
                      }}
                    />
                  )}
                </td>
                <td style={{ fontWeight: 500 }}>
                  {r.featuredAt ? (
                    <PinnedMark />
                  ) : null}
                  {r.title}
                </td>
                <td>
                  {r.categoryName ? (
                    <span className="pill gray">{r.categoryName}</span>
                  ) : (
                    <span className="t-dim">—</span>
                  )}
                </td>
                <td>
                  <span
                    className={`pill ${r.locale === 'uz' ? 'green' : r.locale === 'ru' ? 'red' : 'yellow'}`}
                  >
                    {r.locale}
                  </span>
                </td>
                <td>
                  <StatusPill status={r.status as 'published' | 'scheduled' | 'draft' | 'archived'} />
                </td>
                <td className="t-dim" style={{ color: 'var(--text-3)' }}>
                  {r.publishedAt
                    ? new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' }).format(
                        new Date(r.publishedAt),
                      )
                    : '—'}
                </td>
                <NewsRowActions
                  id={r.id}
                  status={r.status}
                  featured={Boolean(r.featuredAt)}
                />
              </tr>
            ))}
            {list.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-3)' }}>
                  <T tk="news_empty_filtered" />
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      </NewsBulkForm>
    </>
  );
}
