import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Pin } from 'lucide-react';
import { getFixtureById, getLiveEntries } from '@/lib/db';
import { addLiveEntry, deleteLiveEntry, togglePinLiveEntry } from '../../_actions/live';

export const dynamic = 'force-dynamic';

const TYPE_LABEL: Record<string, string> = {
  comment: '💬 Сharх',
  goal: '⚽ Гол',
  yellow_card: '🟨 Жёлтая',
  red_card: '🟥 Красная',
  sub: '🔄 Замена',
  var: '📺 VAR',
  kickoff: '🟢 Стартовый свисток',
  half_time: '⏸ Перерыв',
  full_time: '🏁 Конец матча',
  general: '📢 Общее',
};

const TYPE_TINT: Record<string, string> = {
  goal: 'var(--green-soft, rgba(34,197,94,0.14))',
  yellow_card: 'rgba(234, 179, 8, 0.14)',
  red_card: 'rgba(239, 68, 68, 0.12)',
  sub: 'rgba(59, 130, 246, 0.12)',
  var: 'rgba(168, 85, 247, 0.14)',
};

export default async function LiveBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (!Number.isFinite(id)) notFound();
  const fix = await getFixtureById(id);
  if (!fix) notFound();
  const entries = await getLiveEntries(id);

  return (
    <>
      <div className="page-h">
        <div>
          <h1>Live blog</h1>
          <div className="sub">
            <Link href="/7071218admin/live" className="t-dim" style={{ color: 'var(--text-3)' }}>
              ← все матчи
            </Link>
            {' · '}
            <b>
              {fix.homeTeam.name} vs {fix.awayTeam.name}
            </b>{' '}
            · {fix.league.name}
          </div>
        </div>
        <div className="actions">
          <Link href={`/match/${id}`} target="_blank" className="btn">
            Открыть на сайте ↗
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--gap)' }}>
        {/* Feed */}
        <div className="card" style={{ padding: 22 }}>
          <h2 style={{ margin: '0 0 14px', fontSize: 11.5, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-2)' }}>
            Тайминг ({entries.length})
          </h2>
          {entries.length === 0 ? (
            <div className="stub">
              <div>
                <b>Лента пустая</b>
                Добавьте первое событие в правой панели
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {entries.map((e) => (
                <article
                  key={e.id}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    border: '1px solid var(--line)',
                    background: TYPE_TINT[e.type] ?? 'var(--surface-2)',
                  }}
                >
                  <header style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, fontSize: 11.5 }}>
                    {e.minute !== null ? (
                      <b style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>{e.minute}&apos;</b>
                    ) : null}
                    <span style={{ color: 'var(--text-2)', fontWeight: 600 }}>{TYPE_LABEL[e.type] ?? e.type}</span>
                    {e.pinned ? (
                      <span
                        className="pill yellow"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <Pin size={11} strokeWidth={2} />
                        Закреплено
                      </span>
                    ) : null}
                    <span style={{ marginLeft: 'auto', color: 'var(--text-3)', fontSize: 10.5 }}>
                      {new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }).format(e.occurredAt)}
                    </span>
                  </header>
                  <div style={{ fontSize: 13, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{e.body}</div>
                  {e.embedUrl ? (
                    <a href={e.embedUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontSize: 11.5 }}>
                      ↗ {e.embedUrl}
                    </a>
                  ) : null}
                  <footer style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                    <form action={togglePinLiveEntry.bind(null, e.id, id, e.pinned ? 0 : 1)}>
                      <button className="btn" style={{ height: 24, fontSize: 11 }}>
                        {e.pinned ? 'Открепить' : 'Закрепить'}
                      </button>
                    </form>
                    <form action={deleteLiveEntry.bind(null, e.id, id)}>
                      <button className="btn danger" style={{ height: 24, fontSize: 11 }}>
                        Удалить
                      </button>
                    </form>
                  </footer>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Compose */}
        <div className="card" style={{ padding: 16, alignSelf: 'flex-start', position: 'sticky', top: 70 }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 11.5, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-2)' }}>
            Новая запись
          </h3>
          <form action={addLiveEntry}>
            <input type="hidden" name="fixtureId" value={id} />
            <div className="field">
              <label>Тип</label>
              <select name="type" defaultValue="comment" className="select">
                {Object.entries(TYPE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Минута</label>
              <input type="number" name="minute" min={0} max={150} className="input" />
            </div>
            <div className="field">
              <label>Текст</label>
              <textarea name="body" required className="textarea" style={{ minHeight: 100 }} />
            </div>
            <div className="field">
              <label>Embed-URL (твит, видео)</label>
              <input type="url" name="embedUrl" className="input" />
            </div>
            <button type="submit" className="btn primary" style={{ width: '100%' }}>
              Опубликовать
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
