import { db, rssSources, categories } from '@sportlive/db';
import { desc, eq } from 'drizzle-orm';
import { Sparkles, Play, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  createRssSource,
  toggleRssEnabled,
  deleteRssSource,
  importRssNow,
} from '../_actions/rss';

export const dynamic = 'force-dynamic';

export default async function RssPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; fetched?: string; created?: string; skipped?: string; errors?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const sources = await db
    .select({
      id: rssSources.id,
      name: rssSources.name,
      feedUrl: rssSources.feedUrl,
      locale: rssSources.locale,
      enabled: rssSources.enabled,
      rewriteEnabled: rssSources.rewriteEnabled,
      lastFetchedAt: rssSources.lastFetchedAt,
      lastError: rssSources.lastError,
      categoryName: categories.name,
    })
    .from(rssSources)
    .leftJoin(categories, eq(categories.id, rssSources.categoryId))
    .orderBy(desc(rssSources.id));

  const cats = await db
    .select({ id: categories.id, name: categories.name, locale: categories.locale })
    .from(categories);

  return (
    <>
      <div className="page-h">
        <div>
          <h1>RSS импорт</h1>
          <div className="sub">{sources.length} источников</div>
        </div>
      </div>

      {sp.ok ? (
        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac', marginBottom: 14, fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={14} strokeWidth={1.8} />
          <span>
            Импорт: получено <b>{sp.fetched}</b>, создано <b>{sp.created}</b>, пропущено <b>{sp.skipped}</b>
            {Number(sp.errors) > 0 ? <> · ошибок {sp.errors}</> : null}
          </span>
        </div>
      ) : null}
      {sp.error ? (
        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', marginBottom: 14, fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={14} strokeWidth={1.8} />
          {sp.error}
        </div>
      ) : null}

      <form action={createRssSource} className="card" style={{ padding: 16, marginBottom: 14 }}>
        <h2 style={{ margin: 0, marginBottom: 10, fontSize: 13, fontWeight: 600 }}>Добавить источник</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 1fr 120px', gap: 8 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="rname">Название</label>
            <input id="rname" name="name" type="text" required maxLength={200} className="input" />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="rurl">Feed URL</label>
            <input
              id="rurl"
              name="feedUrl"
              type="url"
              required
              placeholder="https://example.com/rss"
              className="input"
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="rlocale">Язык</label>
            <select id="rlocale" name="locale" defaultValue="uz" className="select">
              <option value="uz">UZ</option>
              <option value="ru">RU</option>
              <option value="en">EN</option>
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="rcat">Категория</label>
            <select id="rcat" name="categoryId" defaultValue="" className="select">
              <option value="">—</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.locale} — {c.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5 }}>
              <input type="checkbox" name="rewriteEnabled" value="1" defaultChecked />
              <Sparkles size={12} strokeWidth={1.8} />
              <span>AI</span>
            </label>
            <button type="submit" className="btn primary" style={{ flex: 1 }}>
              Добавить
            </button>
          </div>
        </div>
      </form>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>Вкл</th>
              <th>Название / URL</th>
              <th style={{ width: 80 }}>Язык</th>
              <th style={{ width: 60 }}>AI</th>
              <th style={{ width: 130 }}>Категория</th>
              <th style={{ width: 130 }}>Послед. импорт</th>
              <th style={{ width: 250 }} />
            </tr>
          </thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s.id}>
                <td>
                  <form action={toggleRssEnabled} style={{ display: 'inline' }}>
                    <input type="hidden" name="id" value={s.id} />
                    <button
                      type="submit"
                      className={`pill ${s.enabled ? 'green' : 'gray'}`}
                      style={{ border: 0, cursor: 'pointer' }}
                    >
                      {s.enabled ? 'on' : 'off'}
                    </button>
                  </form>
                </td>
                <td>
                  <div style={{ fontWeight: 500 }}>{s.name}</div>
                  <div className="t-dim" style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                    {s.feedUrl}
                  </div>
                  {s.lastError ? (
                    <div
                      style={{
                        fontSize: 11,
                        color: '#fca5a5',
                        marginTop: 2,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <AlertTriangle size={11} strokeWidth={1.8} />
                      {s.lastError}
                    </div>
                  ) : null}
                </td>
                <td>
                  <span
                    className={`pill ${s.locale === 'uz' ? 'green' : s.locale === 'ru' ? 'red' : 'yellow'}`}
                  >
                    {s.locale}
                  </span>
                </td>
                <td>
                  {s.rewriteEnabled ? (
                    <Sparkles size={14} strokeWidth={1.8} style={{ color: 'var(--accent)' }} />
                  ) : (
                    '—'
                  )}
                </td>
                <td className="t-dim" style={{ fontSize: 12 }}>
                  {s.categoryName ?? '—'}
                </td>
                <td className="t-mono t-dim" style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                  {s.lastFetchedAt
                    ? new Intl.DateTimeFormat('ru-RU', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      }).format(new Date(s.lastFetchedAt))
                    : '—'}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <form action={importRssNow} style={{ display: 'inline' }}>
                    <input type="hidden" name="id" value={s.id} />
                    <button
                      type="submit"
                      className="btn primary"
                      style={{ height: 28, fontSize: 11.5, marginRight: 6, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Play size={12} strokeWidth={1.8} />
                      Импорт
                    </button>
                  </form>
                  <form action={deleteRssSource} style={{ display: 'inline' }}>
                    <input type="hidden" name="id" value={s.id} />
                    <button
                      type="submit"
                      className="btn"
                      style={{ height: 28, width: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Trash2 size={12} strokeWidth={1.8} />
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {sources.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-3)' }}>
                  Источников пока нет
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
