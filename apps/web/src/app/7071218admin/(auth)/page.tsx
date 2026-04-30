import Link from 'next/link';
import { db, posts, categories, staticPages } from '@sportlive/db';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

async function getStats() {
  const [allPosts, uzPosts, ruPosts, enPosts, cats, statics] = await Promise.all([
    db.select({ c: sql<number>`count(*)::int` }).from(posts),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(posts)
      .where(eq(posts.locale, 'uz')),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(posts)
      .where(eq(posts.locale, 'ru')),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(posts)
      .where(eq(posts.locale, 'en')),
    db.select({ c: sql<number>`count(*)::int` }).from(categories),
    db.select({ c: sql<number>`count(*)::int` }).from(staticPages),
  ]);
  return {
    posts: allPosts[0]?.c ?? 0,
    uz: uzPosts[0]?.c ?? 0,
    ru: ruPosts[0]?.c ?? 0,
    en: enPosts[0]?.c ?? 0,
    categories: cats[0]?.c ?? 0,
    staticPages: statics[0]?.c ?? 0,
  };
}

async function getRecent() {
  return db.execute(sql`
    SELECT p.id, p.legacy_id, p.locale, p.slug, LEFT(p.title, 80) AS title,
           p.published_at, c.name AS category
      FROM posts p LEFT JOIN categories c ON c.id = p.category_id
     ORDER BY p.published_at DESC NULLS LAST LIMIT 10
  `);
}

export default async function Dashboard() {
  const s = await getStats();
  const recent = (await getRecent()) as unknown as Array<Record<string, unknown>>;

  return (
    <>
      <div className="page-h">
        <div>
          <h1>Дашборд</h1>
          <div className="sub">Обзор контента и аудитории</div>
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

      <div className="grid-4">
        <div className="tile">
          <div className="tile-head">Всего статей</div>
          <div className="tile-val">{s.posts.toLocaleString('ru-RU')}</div>
          <div className="tile-foot">опубликовано во всех языках</div>
        </div>
        <div className="tile">
          <div className="tile-head">UZ</div>
          <div className="tile-val">{s.uz.toLocaleString('ru-RU')}</div>
          <div className="tile-foot">статей на узбекском</div>
        </div>
        <div className="tile">
          <div className="tile-head">RU</div>
          <div className="tile-val">{s.ru.toLocaleString('ru-RU')}</div>
          <div className="tile-foot">{s.ru === 0 ? 'требует AI-перевода' : 'переведённых статей'}</div>
        </div>
        <div className="tile">
          <div className="tile-head">EN</div>
          <div className="tile-val">{s.en.toLocaleString('ru-RU')}</div>
          <div className="tile-foot">{s.en === 0 ? 'требует AI-перевода' : 'переведённых статей'}</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 14 }}>
        <div className="tile">
          <div className="tile-head">Категории</div>
          <div className="tile-val">{s.categories}</div>
          <div className="tile-foot">активных рубрик</div>
        </div>
        <div className="tile">
          <div className="tile-head">Статических страниц</div>
          <div className="tile-val">{s.staticPages}</div>
          <div className="tile-foot">в подвале сайта</div>
        </div>
      </div>

      <h2 className="section-h" style={{ marginTop: 24, marginBottom: 10, fontSize: 11.5, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-2)', display: 'flex', alignItems: 'center' }}>
        <span style={{ width: 3, height: 14, background: 'var(--accent)', marginRight: 10, borderRadius: 2, display: 'inline-block' }} />
        Последние статьи
      </h2>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Заголовок</th>
              <th>Категория</th>
              <th>Язык</th>
              <th>Дата</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {recent.map((r) => {
              const id = Number(r.id);
              const legacyId = r.legacy_id ? Number(r.legacy_id) : null;
              const title = String(r.title ?? '');
              const cat = String(r.category ?? '—');
              const locale = String(r.locale);
              const date = r.published_at
                ? new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' }).format(
                    new Date(r.published_at as string),
                  )
                : '—';
              return (
                <tr key={id}>
                  <td className="num" style={{ color: 'var(--text-3)' }}>{legacyId ?? id}</td>
                  <td style={{ fontWeight: 500 }}>{title}</td>
                  <td><span className="pill gray">{cat}</span></td>
                  <td><span className={`pill ${locale === 'uz' ? 'green' : locale === 'ru' ? 'red' : 'yellow'}`}>{locale}</span></td>
                  <td className="t-dim" style={{ color: 'var(--text-3)' }}>{date}</td>
                  <td style={{ textAlign: 'right' }}>
                    <Link href={`/7071218admin/news/${id}/edit`} className="btn" style={{ height: 28, fontSize: 11.5 }}>
                      Изменить
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
