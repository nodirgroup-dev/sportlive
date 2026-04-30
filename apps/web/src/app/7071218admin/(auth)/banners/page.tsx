import Link from 'next/link';
import { db, banners } from '@sportlive/db';
import { asc } from 'drizzle-orm';
import { deleteBanner } from '../_actions/banners';

export const dynamic = 'force-dynamic';

const POSITION_LABEL: Record<string, string> = {
  header: 'Шапка',
  sidebar: 'Сайдбар',
  in_article_top: 'В статье ↑',
  in_article_bottom: 'В статье ↓',
  footer: 'Подвал',
};

export default async function BannersPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const sp = await searchParams;
  const list = await db.select().from(banners).orderBy(asc(banners.position), asc(banners.sortOrder));

  return (
    <>
      <div className="page-h">
        <div>
          <h1>Баннеры</h1>
          <div className="sub">{list.length} объявлений</div>
        </div>
        <div className="actions">
          <Link href="/7071218admin/banners/new" className="btn primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 14, height: 14 }}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Новый баннер
          </Link>
        </div>
      </div>

      {sp.saved ? (
        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac', marginBottom: 14, fontSize: 12.5 }}>
          Сохранено
        </div>
      ) : null}

      {list.length === 0 ? (
        <div className="stub">
          <div>
            <b>Пока нет баннеров</b>
            Нажмите «Новый баннер», чтобы добавить первое объявление
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Превью</th>
                <th>Название</th>
                <th>Позиция</th>
                <th className="num">Порядок</th>
                <th>Статус</th>
                <th className="num">Показы</th>
                <th className="num">Клики</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((b) => (
                <tr key={b.id}>
                  <td className="num" style={{ color: 'var(--text-3)' }}>{b.id}</td>
                  <td>
                    {b.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={b.imageUrl}
                        alt={b.altText ?? ''}
                        style={{ width: 80, height: 40, objectFit: 'cover', borderRadius: 4 }}
                      />
                    ) : (
                      <span style={{ color: 'var(--text-3)' }}>—</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 500 }}>{b.name}</td>
                  <td>
                    <span className="pill gray">{POSITION_LABEL[b.position] ?? b.position}</span>
                  </td>
                  <td className="num">{b.sortOrder}</td>
                  <td>
                    <span className={`pill ${b.active ? 'green' : 'gray'}`}>{b.active ? 'Активен' : 'Выкл.'}</span>
                  </td>
                  <td className="num">{b.impressions.toLocaleString('ru-RU')}</td>
                  <td className="num">{b.clicks.toLocaleString('ru-RU')}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <Link href={`/7071218admin/banners/${b.id}/edit`} className="btn" style={{ height: 28, fontSize: 11.5 }}>Изменить</Link>
                      <form action={deleteBanner.bind(null, b.id)}>
                        <button className="btn danger" style={{ height: 28, fontSize: 11.5 }}>Удалить</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
