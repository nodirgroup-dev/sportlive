import { db, posts, categories, comments } from '@sportlive/db';
import { eq, sql, and, gte, desc } from 'drizzle-orm';
import { AdminPageHeader } from '../../_components/page-header';

export const dynamic = 'force-dynamic';

async function getStats() {
  const day = 24 * 60 * 60 * 1000;
  const cutoff7 = new Date(Date.now() - 7 * day);
  const cutoff30 = new Date(Date.now() - 30 * day);
  const cutoff48h = new Date(Date.now() - 2 * day);

  const [pubAll, pub7, pub30, pub48h] = await Promise.all([
    db.select({ c: sql<number>`count(*)::int` }).from(posts).where(eq(posts.status, 'published')),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(posts)
      .where(and(eq(posts.status, 'published'), gte(posts.publishedAt, cutoff7))),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(posts)
      .where(and(eq(posts.status, 'published'), gte(posts.publishedAt, cutoff30))),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(posts)
      .where(and(eq(posts.status, 'published'), gte(posts.publishedAt, cutoff48h))),
  ]);

  const [byLocale, topCats, topPosts, totalViews, commentsByStatus] = await Promise.all([
    db
      .select({ locale: posts.locale, c: sql<number>`count(*)::int` })
      .from(posts)
      .where(eq(posts.status, 'published'))
      .groupBy(posts.locale),
    db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        c: sql<number>`count(${posts.id})::int`,
      })
      .from(categories)
      .leftJoin(posts, eq(posts.categoryId, categories.id))
      .groupBy(categories.id, categories.name, categories.slug)
      .orderBy(desc(sql`count(${posts.id})`))
      .limit(10),
    db
      .select({
        id: posts.id,
        legacyId: posts.legacyId,
        title: posts.title,
        slug: posts.slug,
        viewCount: posts.viewCount,
      })
      .from(posts)
      .where(eq(posts.status, 'published'))
      .orderBy(desc(posts.viewCount))
      .limit(10),
    db
      .select({ total: sql<number>`coalesce(sum(${posts.viewCount}), 0)::bigint` })
      .from(posts),
    db
      .select({ status: comments.status, c: sql<number>`count(*)::int` })
      .from(comments)
      .groupBy(comments.status),
  ]);

  return {
    pubAll: pubAll[0]?.c ?? 0,
    pub7: pub7[0]?.c ?? 0,
    pub30: pub30[0]?.c ?? 0,
    pub48h: pub48h[0]?.c ?? 0,
    byLocale,
    topCats,
    topPosts,
    totalViews: Number(totalViews[0]?.total ?? 0),
    commentsByStatus,
  };
}

export default async function AnalyticsPage() {
  const s = await getStats();

  const localeMap = Object.fromEntries(s.byLocale.map((r) => [r.locale as string, r.c]));
  const cmtMap = Object.fromEntries(s.commentsByStatus.map((r) => [r.status as string, r.c]));

  return (
    <>
      <AdminPageHeader pageId="analytics" />

      <div className="grid-4">
        <div className="tile">
          <div className="tile-head">Опубл. за 48ч</div>
          <div className="tile-val">{s.pub48h}</div>
          <div className="tile-foot">в окне Google News</div>
        </div>
        <div className="tile">
          <div className="tile-head">За 7 дней</div>
          <div className="tile-val">{s.pub7}</div>
          <div className="tile-foot">статей</div>
        </div>
        <div className="tile">
          <div className="tile-head">За 30 дней</div>
          <div className="tile-val">{s.pub30}</div>
          <div className="tile-foot">статей</div>
        </div>
        <div className="tile">
          <div className="tile-head">Всего</div>
          <div className="tile-val">{s.pubAll.toLocaleString('ru-RU')}</div>
          <div className="tile-foot">опубликованных</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 14 }}>
        <div className="tile">
          <div className="tile-head">По языкам</div>
          <div style={{ display: 'flex', gap: 18, marginTop: 12 }}>
            {(['uz', 'ru', 'en'] as const).map((l) => (
              <div key={l}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, lineHeight: 1 }}>
                  {(localeMap[l] ?? 0).toLocaleString('ru-RU')}
                </div>
                <div className={`pill ${l === 'uz' ? 'green' : l === 'ru' ? 'red' : 'yellow'}`} style={{ marginTop: 6 }}>
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="tile">
          <div className="tile-head">Просмотры (всего по DB)</div>
          <div className="tile-val">{s.totalViews.toLocaleString('ru-RU')}</div>
          <div className="tile-foot">сумма post.view_count</div>
        </div>
      </div>

      <h2 style={{ marginTop: 24, marginBottom: 12, fontSize: 11.5, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-2)', display: 'flex', alignItems: 'center' }}>
        <span style={{ width: 3, height: 14, background: 'var(--accent)', marginRight: 10, borderRadius: 2 }} />
        Топ-10 категорий
      </h2>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Категория</th>
              <th>Slug</th>
              <th className="num">Статей</th>
            </tr>
          </thead>
          <tbody>
            {s.topCats.map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 500 }}>{c.name}</td>
                <td><code style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-2)' }}>{c.slug}</code></td>
                <td className="num">{c.c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ marginTop: 24, marginBottom: 12, fontSize: 11.5, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-2)', display: 'flex', alignItems: 'center' }}>
        <span style={{ width: 3, height: 14, background: 'var(--accent)', marginRight: 10, borderRadius: 2 }} />
        Топ-10 статей по просмотрам
      </h2>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Заголовок</th>
              <th className="num">Просмотры</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {s.topPosts.map((p) => (
              <tr key={p.id}>
                <td className="num" style={{ color: 'var(--text-3)' }}>{p.legacyId ?? p.id}</td>
                <td style={{ fontWeight: 500 }}>{p.title}</td>
                <td className="num">{(p.viewCount ?? 0).toLocaleString('ru-RU')}</td>
                <td style={{ textAlign: 'right' }}>
                  <a href={`/7071218admin/news/${p.id}/edit`} className="btn" style={{ height: 28, fontSize: 11.5 }}>
                    Открыть
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ marginTop: 24, marginBottom: 12, fontSize: 11.5, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-2)', display: 'flex', alignItems: 'center' }}>
        <span style={{ width: 3, height: 14, background: 'var(--accent)', marginRight: 10, borderRadius: 2 }} />
        Комментарии
      </h2>
      <div className="grid-4">
        {(['pending', 'approved', 'spam', 'rejected'] as const).map((st) => (
          <div key={st} className="tile">
            <div className="tile-head">
              {st === 'pending' ? 'На модерации' : st === 'approved' ? 'Одобрены' : st === 'spam' ? 'Спам' : 'Отклонены'}
            </div>
            <div className="tile-val">{(cmtMap[st] ?? 0).toLocaleString('ru-RU')}</div>
          </div>
        ))}
      </div>
    </>
  );
}
