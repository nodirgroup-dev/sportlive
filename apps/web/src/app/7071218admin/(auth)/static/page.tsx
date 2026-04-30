import Link from 'next/link';
import { db, staticPages } from '@sportlive/db';
import { asc } from 'drizzle-orm';
import { deleteStaticPage } from '../_actions/static';

export const dynamic = 'force-dynamic';

export default async function StaticPagesList({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const sp = await searchParams;
  const list = await db
    .select()
    .from(staticPages)
    .orderBy(asc(staticPages.locale), asc(staticPages.sortOrder));

  return (
    <>
      <div className="page-h">
        <div>
          <h1>Статические страницы</h1>
          <div className="sub">{list.length} страниц</div>
        </div>
        <div className="actions">
          <Link href="/7071218admin/static/new" className="btn primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 14, height: 14 }}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Новая страница
          </Link>
        </div>
      </div>

      {sp.saved ? (
        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac', marginBottom: 14, fontSize: 12.5 }}>
          Сохранено
        </div>
      ) : null}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Заголовок</th>
              <th>URL</th>
              <th>Язык</th>
              <th>В подвале</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id}>
                <td className="num" style={{ color: 'var(--text-3)' }}>{p.legacyId ?? p.id}</td>
                <td style={{ fontWeight: 500 }}>{p.title}</td>
                <td>
                  <a href={`/${p.slug}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>
                    /{p.slug}
                  </a>
                </td>
                <td>
                  <span className={`pill ${p.locale === 'uz' ? 'green' : p.locale === 'ru' ? 'red' : 'yellow'}`}>{p.locale}</span>
                </td>
                <td>
                  <span className={`pill ${p.showInFooter === 1 ? 'green' : 'gray'}`}>{p.showInFooter === 1 ? 'да' : 'нет'}</span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: 6 }}>
                    <Link href={`/7071218admin/static/${p.id}/edit`} className="btn" style={{ height: 28, fontSize: 11.5 }}>Изменить</Link>
                    <form action={deleteStaticPage.bind(null, p.id)}>
                      <button type="submit" className="btn danger" style={{ height: 28, fontSize: 11.5 }}>Удалить</button>
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
