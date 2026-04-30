import { db, posts, redirects, staticPages } from '@sportlive/db';
import { and, eq, gte, sql } from 'drizzle-orm';
import { AdminPageHeader } from '../../_components/page-header';

export const dynamic = 'force-dynamic';

async function getStats() {
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const [allPosts, recent48, redirCount, staticCount] = await Promise.all([
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(posts)
      .where(eq(posts.status, 'published')),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(posts)
      .where(and(eq(posts.status, 'published'), gte(posts.publishedAt, cutoff))),
    db.select({ c: sql<number>`count(*)::int` }).from(redirects),
    db.select({ c: sql<number>`count(*)::int` }).from(staticPages),
  ]);
  return {
    posts: allPosts[0]?.c ?? 0,
    recent48: recent48[0]?.c ?? 0,
    redirects: redirCount[0]?.c ?? 0,
    staticPages: staticCount[0]?.c ?? 0,
  };
}

export default async function SeoPage() {
  const s = await getStats();

  return (
    <>
      <AdminPageHeader pageId="seo" />

      <div className="grid-4">
        <div className="tile">
          <div className="tile-head">Опубл. статей</div>
          <div className="tile-val">{s.posts.toLocaleString('ru-RU')}</div>
          <div className="tile-foot">в sitemap.xml</div>
        </div>
        <div className="tile">
          <div className="tile-head">Окно Google News</div>
          <div className="tile-val">{s.recent48}</div>
          <div className="tile-foot">статей за последние 48ч</div>
        </div>
        <div className="tile">
          <div className="tile-head">Redirect-карта</div>
          <div className="tile-val">{s.redirects.toLocaleString('ru-RU')}</div>
          <div className="tile-foot">старых .html → канонический</div>
        </div>
        <div className="tile">
          <div className="tile-head">Статических страниц</div>
          <div className="tile-val">{s.staticPages}</div>
          <div className="tile-foot">в подвале</div>
        </div>
      </div>

      <h2 style={{ marginTop: 28, marginBottom: 12, fontSize: 11.5, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-2)', display: 'flex', alignItems: 'center' }}>
        <span style={{ width: 3, height: 14, background: 'var(--accent)', marginRight: 10, borderRadius: 2 }} />
        Файлы дискавери
      </h2>
      <div className="card" style={{ padding: 22 }}>
        <table className="table" style={{ marginTop: -12 }}>
          <thead>
            <tr>
              <th>Файл</th>
              <th>Назначение</th>
              <th>Тип</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {[
              { url: '/sitemap.xml', purpose: 'Карта всех опубликованных URL с hreflang-альтернативами', type: 'XML' },
              { url: '/google_news.xml', purpose: 'Google News (последние 48ч с news:news разметкой)', type: 'XML' },
              { url: '/rss.xml', purpose: 'RSS UZ — последние 50 статей', type: 'RSS 2.0' },
              { url: '/ru/rss.xml', purpose: 'RSS RU', type: 'RSS 2.0' },
              { url: '/en/rss.xml', purpose: 'RSS EN', type: 'RSS 2.0' },
              { url: '/robots.txt', purpose: 'Правила индексации, ссылки на sitemap', type: 'TXT' },
              { url: '/llms.txt', purpose: 'LLM-friendly «карта» сайта', type: 'TXT' },
            ].map((f) => (
              <tr key={f.url}>
                <td>
                  <a href={f.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>
                    {f.url}
                  </a>
                </td>
                <td>{f.purpose}</td>
                <td><span className="pill gray">{f.type}</span></td>
                <td style={{ textAlign: 'right' }}>
                  <a href={f.url} target="_blank" rel="noreferrer" className="btn" style={{ height: 28, fontSize: 11.5 }}>
                    Открыть
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ marginTop: 28, marginBottom: 12, fontSize: 11.5, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-2)', display: 'flex', alignItems: 'center' }}>
        <span style={{ width: 3, height: 14, background: 'var(--accent)', marginRight: 10, borderRadius: 2 }} />
        Внешние инструменты
      </h2>
      <div className="grid-3">
        {[
          { name: 'Google Search Console', url: 'https://search.google.com/search-console', desc: 'Покрытие, sitemap, ошибки индексации' },
          { name: 'Google News Publisher Center', url: 'https://publishercenter.google.com/', desc: 'Регистрация издания, верификация' },
          { name: 'Bing Webmaster Tools', url: 'https://www.bing.com/webmasters', desc: 'Индексация в Bing' },
          { name: 'Yandex Webmaster', url: 'https://webmaster.yandex.com/', desc: 'Индексация в Яндексе' },
          { name: 'Schema.org Validator', url: 'https://validator.schema.org/', desc: 'Проверка JSON-LD на статьях' },
          { name: 'Rich Results Test', url: 'https://search.google.com/test/rich-results', desc: 'Превью карточек Google' },
        ].map((t) => (
          <a
            key={t.url}
            href={t.url}
            target="_blank"
            rel="noreferrer"
            className="tile"
            style={{ textDecoration: 'none', display: 'block' }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{t.name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{t.desc}</div>
          </a>
        ))}
      </div>
    </>
  );
}
