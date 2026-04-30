import { db, posts } from '@sportlive/db';
import { desc, isNotNull, sql } from 'drizzle-orm';
import { AdminPageHeader } from '../../_components/page-header';

export const dynamic = 'force-dynamic';

async function getCovers(page: number, perPage: number) {
  const offset = (page - 1) * perPage;
  const rows = await db
    .select({
      id: posts.id,
      legacyId: posts.legacyId,
      title: posts.title,
      coverImage: posts.coverImage,
      coverImageWidth: posts.coverImageWidth,
      coverImageHeight: posts.coverImageHeight,
      publishedAt: posts.publishedAt,
    })
    .from(posts)
    .where(isNotNull(posts.coverImage))
    .orderBy(desc(posts.publishedAt))
    .limit(perPage)
    .offset(offset);

  const totalRows = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(posts)
    .where(isNotNull(posts.coverImage));

  return { rows, total: totalRows[0]?.c ?? 0 };
}

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const perPage = 60;
  const { rows, total } = await getCovers(page, perPage);
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <>
      <AdminPageHeader pageId="media">
        {total.toLocaleString('ru-RU')} обложек статей · стр. {page}/{totalPages}
      </AdminPageHeader>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--gap)' }}>
        {rows.map((r) => (
          <a
            key={r.id}
            href={`/7071218admin/news/${r.id}/edit`}
            className="card"
            style={{
              padding: 8,
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              transition: 'border-color 0.15s',
            }}
          >
            <div style={{ aspectRatio: '16/10', overflow: 'hidden', borderRadius: 6, background: 'var(--surface-3)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={r.coverImage!}
                alt={r.title}
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div
              style={{
                fontSize: 11.5,
                lineHeight: 1.4,
                color: 'var(--text-2)',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {r.title}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
              #{r.legacyId ?? r.id} · {r.coverImageWidth}×{r.coverImageHeight}
            </div>
          </a>
        ))}
      </div>

      {totalPages > 1 ? (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          {page > 1 ? (
            <a className="btn" href={`?page=${page - 1}`}>
              ← Предыдущая
            </a>
          ) : null}
          <span style={{ alignSelf: 'center', color: 'var(--text-3)', fontSize: 12 }}>
            {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <a className="btn" href={`?page=${page + 1}`}>
              Следующая →
            </a>
          ) : null}
        </div>
      ) : null}

      <div className="card" style={{ marginTop: 28, padding: 16, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
        <b style={{ fontSize: 13, color: 'var(--text)' }}>О загрузке файлов</b>
        <br />
        Все обложки старого DLE-сайта (1132 файла) хранятся на VPS в каталоге{' '}
        <code style={{ fontFamily: 'var(--font-mono)' }}>/var/www/sportlive/data/www/sportlive.uz/uploads/posts/</code> и
        отдаются напрямую через Apache. Загрузка новых файлов реализуется отдельно (нужен upload-endpoint и
        директория с правами для веб-процесса). Пока используйте полный путь{' '}
        <code style={{ fontFamily: 'var(--font-mono)' }}>/uploads/posts/...</code> в поле «Обложка» при создании статьи.
      </div>
    </>
  );
}
