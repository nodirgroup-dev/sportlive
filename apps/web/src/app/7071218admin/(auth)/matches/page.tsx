import { db, fixtures, leagues, teams } from '@sportlive/db';
import { desc, eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  NS: 'Не начался',
  TBD: 'TBD',
  '1H': 'Первый тайм',
  HT: 'Перерыв',
  '2H': 'Второй тайм',
  ET: 'Доп. время',
  P: 'Серия пенальти',
  FT: 'Завершён',
  AET: 'Завершён (доп.)',
  PEN: 'Завершён (пен.)',
  LIVE: 'Live',
  PST: 'Перенесён',
  CANC: 'Отменён',
  ABD: 'Прерван',
};

async function getRecent() {
  const rows = await db
    .select({
      id: fixtures.id,
      kickoffAt: fixtures.kickoffAt,
      statusShort: fixtures.statusShort,
      elapsed: fixtures.elapsed,
      homeGoals: fixtures.homeGoals,
      awayGoals: fixtures.awayGoals,
      leagueName: leagues.name,
      leagueLogo: leagues.logo,
      home: { id: teams.id, name: teams.name, logo: teams.logo },
    })
    .from(fixtures)
    .leftJoin(leagues, eq(leagues.id, fixtures.leagueId))
    .leftJoin(teams, eq(teams.id, fixtures.homeTeamId))
    .orderBy(desc(fixtures.kickoffAt))
    .limit(50);
  const totalRows = await db.select({ c: sql<number>`count(*)::int` }).from(fixtures);
  return { rows, total: totalRows[0]?.c ?? 0 };
}

export default async function MatchesPage() {
  const { rows, total } = await getRecent();

  return (
    <>
      <div className="page-h">
        <div>
          <h1>Матчи</h1>
          <div className="sub">{total.toLocaleString('ru-RU')} матчей в базе</div>
        </div>
      </div>

      {total === 0 ? (
        <div className="stub">
          <div>
            <b>Нет матчей</b>
            Запустите{' '}
            <code style={{ fontFamily: 'var(--font-mono)' }}>scripts/fetch-fixtures.mjs</code> на сервере с ключом
            API-Football, чтобы импортировать чемпионаты и расписание.
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Турнир</th>
                <th>Команда</th>
                <th className="num">Счёт</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const dateStr = new Intl.DateTimeFormat('ru-RU', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(new Date(r.kickoffAt));
                const finished = ['FT', 'AET', 'PEN'].includes(r.statusShort);
                const live = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(r.statusShort);
                return (
                  <tr key={r.id}>
                    <td className="t-mono" style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>
                      {dateStr}
                    </td>
                    <td>
                      <span className="pill gray">{r.leagueName ?? '—'}</span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{r.home?.name ?? '—'}</td>
                    <td className="num">
                      {finished || live ? (
                        <b style={{ color: live ? '#ef4444' : 'var(--text)' }}>
                          {r.homeGoals ?? 0}:{r.awayGoals ?? 0}
                        </b>
                      ) : (
                        <span style={{ color: 'var(--text-3)' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`pill ${live ? 'red' : finished ? 'green' : 'gray'}`}
                      >
                        {live && r.elapsed ? `${r.elapsed}'` : STATUS_LABEL[r.statusShort] ?? r.statusShort}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
