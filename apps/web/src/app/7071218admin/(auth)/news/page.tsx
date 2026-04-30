import Link from 'next/link';
import { db, posts, categories } from '@sportlive/db';
import { desc, eq, sql } from 'drizzle-orm';
import { bulkPostsAction } from '../_actions/posts';

export const dynamic = 'force-dynamic';

async function getList(localeFilter: string | null, q: string | null, statusFilter: string | null) {
  const where: ReturnType<typeof eq>[] = [];
  if (localeFilter) where.push(eq(posts.locale, localeFilter as 'uz' | 'ru' | 'en'));
  if (statusFilter) where.push(eq(posts.status, statusFilter as 'draft' | 'published' | 'archived'));

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
      <div className="page-h">
        <div>
          <h1>Новости</h1>
          <div className="sub">{list.length} статей</div>
        </div>
        <div className="actions">
          <Link href="/7071218admin/news/new" className="btn primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 14, height: 14 }}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Создать статью
          </Link>
        </div>
      </div>

      {sp.bulk ? (
        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac', marginBottom: 14, fontSize: 12.5 }}>
          {sp.bulk === 'publish' ? 'Опубликовано' : sp.bulk === 'unpublish' ? 'Снято с публикации' : sp.bulk === 'archive' ? 'Перемещено в архив' : 'Удалено'}{' '}
          <b>{sp.n ?? '?'}</b> ст.
        </div>
      ) : null}

      <form className="card" style={{ padding: 12, display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
        <input
          name="q"
          defaultValue={sp.q ?? ''}
          placeholder="Поиск по заголовку…"
          className="input"
          style={{ flex: 1, height: 32 }}
        />
        <select name="locale" defaultValue={sp.locale ?? ''} className="select" style={{ height: 32, width: 100 }}>
          <option value="">Все языки</option>
          <option value="uz">UZ</option>
          <option value="ru">RU</option>
          <option value="en">EN</option>
        </select>
        <select name="status" defaultValue={sp.status ?? ''} className="select" style={{ height: 32, width: 130 }}>
          <option value="">Все статусы</option>
          <option value="published">Опубликовано</option>
          <option value="draft">Черновик</option>
          <option value="archived">В архиве</option>
        </select>
        <button type="submit" className="btn">Применить</button>
      </form>

      <form action={bulkPostsAction}>
        <div className="card" style={{ padding: 10, display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Массовое действие:</span>
          <select name="action" defaultValue="" className="select" style={{ height: 30, fontSize: 12.5 }}>
            <option value="">— выбрать —</option>
            <option value="publish">Опубликовать</option>
            <option value="unpublish">Снять с публикации</option>
            <option value="archive">В архив</option>
            <option value="delete">Удалить</option>
          </select>
          <button type="submit" className="btn" style={{ height: 30, fontSize: 12.5 }}>
            Применить к выбранным
          </button>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-3)' }}>
            Используйте чекбоксы в таблице
          </span>
        </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 32 }} />
              <th style={{ width: 64 }}>Фото</th>
              <th>Заголовок</th>
              <th>Категория</th>
              <th>Язык</th>
              <th>Статус</th>
              <th>Дата</th>
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
                    <span title="Закреплено на главной" style={{ marginRight: 6 }}>
                      📌
                    </span>
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
                  <span
                    className={`pill ${r.status === 'published' ? 'green' : r.status === 'draft' ? 'gray' : 'yellow'}`}
                  >
                    {r.status === 'published' ? 'Опубл.' : r.status === 'draft' ? 'Черн.' : 'Архив'}
                  </span>
                </td>
                <td className="t-dim" style={{ color: 'var(--text-3)' }}>
                  {r.publishedAt
                    ? new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' }).format(
                        new Date(r.publishedAt),
                      )
                    : '—'}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <Link href={`/7071218admin/news/${r.id}/edit`} className="btn" style={{ height: 28, fontSize: 11.5 }}>
                    Изменить
                  </Link>
                </td>
              </tr>
            ))}
            {list.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-3)' }}>
                  Нет статей по выбранным фильтрам
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      </form>
    </>
  );
}
