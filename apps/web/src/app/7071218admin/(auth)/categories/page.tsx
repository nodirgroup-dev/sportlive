import Link from 'next/link';
import { db, categories, posts } from '@sportlive/db';
import { asc, sql } from 'drizzle-orm';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { deleteCategory } from '../_actions/categories';

export const dynamic = 'force-dynamic';

const ERR: Record<string, string> = {
  in_use: 'Невозможно удалить — в этой категории есть статьи',
};

async function getList() {
  const rows = await db
    .select({
      id: categories.id,
      slug: categories.slug,
      locale: categories.locale,
      name: categories.name,
      parentId: categories.parentId,
      sortOrder: categories.sortOrder,
      legacyId: categories.legacyId,
    })
    .from(categories)
    .orderBy(asc(categories.locale), asc(categories.sortOrder));

  const counts = await db
    .select({ id: posts.categoryId, c: sql<number>`count(*)::int` })
    .from(posts)
    .groupBy(posts.categoryId);
  const countMap = new Map<number, number>();
  for (const r of counts) if (r.id) countMap.set(r.id, r.c);

  const nameById = new Map<number, string>();
  for (const r of rows) nameById.set(r.id, r.name);

  return rows.map((r) => ({
    ...r,
    posts: countMap.get(r.id) ?? 0,
    parentName: r.parentId ? nameById.get(r.parentId) ?? null : null,
  }));
}

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string; saved?: string }>;
}) {
  const sp = await searchParams;
  const list = await getList();

  return (
    <>
      <div className="page-h">
        <div>
          <h1>Категории</h1>
          <div className="sub">{list.length} рубрик</div>
        </div>
        <div className="actions">
          <Link href="/7071218admin/categories/new" className="btn primary">
            <Plus size={14} strokeWidth={2.5} />
            Новая категория
          </Link>
        </div>
      </div>

      {sp.saved ? (
        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac', marginBottom: 14, fontSize: 12.5 }}>
          Сохранено
        </div>
      ) : null}
      {sp.err && ERR[sp.err] ? <div className="login-err" style={{ marginBottom: 14 }}>{ERR[sp.err]}</div> : null}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Slug</th>
              <th>Родитель</th>
              <th>Язык</th>
              <th className="num">Порядок</th>
              <th className="num">Статей</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id}>
                <td className="num" style={{ color: 'var(--text-3)' }}>
                  {r.legacyId ?? r.id}
                </td>
                <td style={{ fontWeight: 500 }}>{r.name}</td>
                <td>
                  <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-2)' }}>
                    {r.slug}
                  </code>
                </td>
                <td>
                  {r.parentName ? (
                    <span className="pill gray">{r.parentName}</span>
                  ) : (
                    <span style={{ color: 'var(--text-3)' }}>—</span>
                  )}
                </td>
                <td>
                  <span className={`pill ${r.locale === 'uz' ? 'green' : r.locale === 'ru' ? 'red' : 'yellow'}`}>
                    {r.locale}
                  </span>
                </td>
                <td className="num">{r.sortOrder}</td>
                <td className="num">{r.posts}</td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: 6 }}>
                    <Link
                      href={`/7071218admin/categories/${r.id}/edit`}
                      className="btn"
                      style={{ height: 28, fontSize: 11.5, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Pencil size={12} strokeWidth={1.8} />
                      Изменить
                    </Link>
                    <form action={deleteCategory.bind(null, r.id)}>
                      <button
                        type="submit"
                        className="btn danger"
                        style={{ height: 28, fontSize: 11.5, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        <Trash2 size={12} strokeWidth={1.8} />
                        Удалить
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
