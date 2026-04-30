import { db, teams } from '@sportlive/db';
import { asc, sql } from 'drizzle-orm';
import { CircleDot } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TeamsPage() {
  const list = await db.select().from(teams).orderBy(asc(teams.country), asc(teams.name)).limit(200);
  const totalRows = await db.select({ c: sql<number>`count(*)::int` }).from(teams);
  const total = totalRows[0]?.c ?? 0;

  return (
    <>
      <div className="page-h">
        <div>
          <h1>Команды</h1>
          <div className="sub">
            Показано {list.length} из {total.toLocaleString('ru-RU')}
          </div>
        </div>
      </div>

      {total === 0 ? (
        <div className="stub">
          <div>
            <b>Нет команд</b>
            Команды импортируются вместе с матчами через{' '}
            <code style={{ fontFamily: 'var(--font-mono)' }}>scripts/fetch-fixtures.mjs</code>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--gap)' }}>
          {list.map((t) => (
            <div
              key={t.id}
              className="tile"
              style={{ display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  background: 'var(--surface-3)',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                {t.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.logo} alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                ) : (
                  <CircleDot size={18} strokeWidth={1.6} style={{ color: 'var(--text-3)' }} />
                )}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.2 }}>{t.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                  {t.country ?? '—'}
                  {t.code ? ` · ${t.code}` : ''}
                  {t.founded ? ` · ${t.founded}` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
