import Link from 'next/link';
import { db, posts, categories, staticPages } from '@sportlive/db';
import { eq, sql } from 'drizzle-orm';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getStats() {
  const [allPosts, uzPosts, ruPosts, enPosts, cats, statics, kpi] = await Promise.all([
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
    db.execute(sql`
      SELECT
        (SELECT count(*)::int FROM posts WHERE published_at >= now() - interval '24 hours' AND status = 'published') AS posts_24h,
        (SELECT count(*)::int FROM posts WHERE published_at >= now() - interval '7 days' AND status = 'published') AS posts_7d,
        (SELECT count(*)::int FROM posts WHERE status = 'scheduled') AS scheduled,
        (SELECT count(*)::int FROM comments WHERE status = 'pending') AS pending_comments,
        (SELECT count(*)::int FROM comments WHERE status = 'spam') AS spam_comments,
        (SELECT count(*)::int FROM newsletter_subscribers WHERE unsubscribed_at IS NULL) AS newsletter_active,
        (SELECT count(*)::int FROM push_subscriptions WHERE invalidated_at IS NULL) AS push_active,
        (SELECT coalesce(sum(view_count), 0)::int FROM posts WHERE status = 'published') AS total_views
    `),
  ]);
  const k = (kpi as unknown as Array<Record<string, number>>)[0] ?? {};
  return {
    posts: allPosts[0]?.c ?? 0,
    uz: uzPosts[0]?.c ?? 0,
    ru: ruPosts[0]?.c ?? 0,
    en: enPosts[0]?.c ?? 0,
    categories: cats[0]?.c ?? 0,
    staticPages: statics[0]?.c ?? 0,
    posts24h: Number(k.posts_24h ?? 0),
    posts7d: Number(k.posts_7d ?? 0),
    scheduled: Number(k.scheduled ?? 0),
    pendingComments: Number(k.pending_comments ?? 0),
    spamComments: Number(k.spam_comments ?? 0),
    newsletterActive: Number(k.newsletter_active ?? 0),
    pushActive: Number(k.push_active ?? 0),
    totalViews: Number(k.total_views ?? 0),
  };
}

async function getTopPosts() {
  return db.execute(sql`
    SELECT id, legacy_id, title, view_count, published_at
    FROM posts
    WHERE status = 'published'
    ORDER BY view_count DESC NULLS LAST
    LIMIT 10
  `) as unknown as Promise<Array<{ id: number; legacy_id: number | null; title: string; view_count: number; published_at: Date | null }>>;
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
  const top = await getTopPosts();

  return (
    <>
      <div className="page-h">
        <div>
          <h1>Дашборд</h1>
          <div className="sub">Обзор контента и аудитории</div>
        </div>
        <div className="actions">
          <Link href="/7071218admin/news/new" className="btn primary">
            <Plus size={14} strokeWidth={2.5} />
            Создать статью
          </Link>
        </div>
      </div>

      <div className="grid-4">
        <div className="tile">
          <div className="tile-head">Просмотры</div>
          <div className="tile-val">{s.totalViews >= 1000 ? `${(s.totalViews / 1000).toFixed(1)}k` : s.totalViews}</div>
          <div className="tile-foot">всего по опубликованным</div>
        </div>
        <div className="tile">
          <div className="tile-head">За 24 часа</div>
          <div className="tile-val">{s.posts24h}</div>
          <div className="tile-foot">опубликовано · 7 дн: {s.posts7d}</div>
        </div>
        <div className="tile">
          <div className="tile-head">Запланированы</div>
          <div className="tile-val">{s.scheduled}</div>
          <div className="tile-foot">ждут автопубликации</div>
        </div>
        <div className="tile">
          <div className="tile-head">Очередь модерации</div>
          <div className="tile-val">{s.pendingComments}</div>
          <div className="tile-foot">{s.spamComments > 0 ? `${s.spamComments} в спаме` : 'комментариев'}</div>
        </div>
        <div className="tile">
          <div className="tile-head">Подписчики email</div>
          <div className="tile-val">{s.newsletterActive}</div>
          <div className="tile-foot">активных</div>
        </div>
        <div className="tile">
          <div className="tile-head">Push-подписки</div>
          <div className="tile-val">{s.pushActive}</div>
          <div className="tile-foot">активных устройств</div>
        </div>
        <div className="tile">
          <div className="tile-head">Всего статей</div>
          <div className="tile-val">{s.posts.toLocaleString('ru-RU')}</div>
          <div className="tile-foot">UZ {s.uz} · RU {s.ru} · EN {s.en}</div>
        </div>
      </div>

      <h2 className="section-h" style={{ marginTop: 24, marginBottom: 10, fontSize: 11.5, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-2)', display: 'flex', alignItems: 'center' }}>
        <span style={{ width: 3, height: 14, background: 'var(--accent)', marginRight: 10, borderRadius: 2 }} />
        Топ просмотров
      </h2>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 50 }}>#</th>
              <th>Заголовок</th>
              <th style={{ width: 100 }}>Просмотры</th>
              <th style={{ width: 130 }}>Опубликован</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {top.map((p, i) => (
              <tr key={p.id}>
                <td className="num t-dim" style={{ fontFamily: 'var(--font-mono)' }}>{i + 1}</td>
                <td style={{ fontWeight: 500 }}>{p.title}</td>
                <td className="num" style={{ fontFamily: 'var(--font-mono)' }}>
                  {Number(p.view_count).toLocaleString('ru-RU')}
                </td>
                <td className="t-mono t-dim" style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>
                  {p.published_at
                    ? new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short', year: '2-digit' }).format(new Date(p.published_at))
                    : '—'}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <Link href={`/7071218admin/news/${p.id}/edit`} className="btn" style={{ height: 26, fontSize: 11 }}>
                    Открыть
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
