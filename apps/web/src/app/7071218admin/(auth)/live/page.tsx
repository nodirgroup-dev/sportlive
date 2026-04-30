import Link from 'next/link';
import { db, fixtures, leagues, teams } from '@sportlive/db';
import { and, asc, eq, gte, lt, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function LiveBlogIndex() {
  // Today's matches across our leagues, ordered by kickoff
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const list = await db
    .select({
      id: fixtures.id,
      kickoffAt: fixtures.kickoffAt,
      statusShort: fixtures.statusShort,
      elapsed: fixtures.elapsed,
      homeGoals: fixtures.homeGoals,
      awayGoals: fixtures.awayGoals,
      leagueName: leagues.name,
      home: { name: teams.name, logo: teams.logo },
    })
    .from(fixtures)
    .leftJoin(leagues, eq(leagues.id, fixtures.leagueId))
    .leftJoin(teams, eq(teams.id, fixtures.homeTeamId))
    .where(and(gte(fixtures.kickoffAt, start), lt(fixtures.kickoffAt, end)))
    .orderBy(asc(fixtures.kickoffAt))
    .limit(60);

  // Live blog entry counts per fixture
  const counts = (await db.execute(sql`
    SELECT fixture_id AS "id", COUNT(*)::int AS c FROM live_entries GROUP BY fixture_id
  `)) as unknown as Array<{ id: number; c: number }>;
  const countMap = new Map<number, number>();
  for (const c of counts) countMap.set(Number(c.id), Number(c.c));

  return (
    <>
      <div className="page-h">
        <div>
          <h1>Live blog</h1>
          <div className="sub">
            Минутные комментарии — выберите матч, чтобы открыть live-blog
          </div>
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Турнир</th>
              <th>Команда (хозяева)</th>
              <th>Статус</th>
              <th className="num">Записей</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((f) => {
              const dateStr = new Intl.DateTimeFormat('ru-RU', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              }).format(new Date(f.kickoffAt));
              const live = ['1H', '2H', 'HT', 'ET', 'P'].includes(f.statusShort);
              const c = countMap.get(f.id) ?? 0;
              return (
                <tr key={f.id}>
                  <td className="t-mono" style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>
                    {dateStr}
                  </td>
                  <td><span className="pill gray">{f.leagueName ?? '—'}</span></td>
                  <td style={{ fontWeight: 500 }}>{f.home?.name ?? '—'}</td>
                  <td>
                    <span className={`pill ${live ? 'red' : 'gray'}`}>
                      {live ? `${f.elapsed ?? 0}'` : f.statusShort}
                    </span>
                  </td>
                  <td className="num">{c}</td>
                  <td style={{ textAlign: 'right' }}>
                    <Link href={`/7071218admin/live/${f.id}`} className="btn primary" style={{ height: 28, fontSize: 11.5 }}>
                      Открыть
                    </Link>
                  </td>
                </tr>
              );
            })}
            {list.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-3)' }}>
                  На ближайшую неделю матчей нет
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
