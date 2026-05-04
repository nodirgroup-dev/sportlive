import { db, leagues, fixtures } from '@sportlive/db';
import { asc, eq, sql } from 'drizzle-orm';
import { AdminPageHeader } from '../../_components/page-header';
import { TH } from '../../_components/t';

export const dynamic = 'force-dynamic';

async function getLeagues() {
  const counts = await db
    .select({ leagueId: fixtures.leagueId, c: sql<number>`count(*)::int` })
    .from(fixtures)
    .groupBy(fixtures.leagueId);
  const countMap = new Map<number, number>();
  for (const r of counts) countMap.set(r.leagueId, r.c);

  const list = await db
    .select()
    .from(leagues)
    .orderBy(asc(leagues.country), asc(leagues.sortOrder));
  return list.map((l) => ({ ...l, fixturesCount: countMap.get(l.id) ?? 0 }));
}

export default async function StandingsPage() {
  const list = await getLeagues();

  return (
    <>
      <AdminPageHeader pageId="standings">{list.length} чемпионатов</AdminPageHeader>

      {list.length === 0 ? (
        <div className="stub">
          <div>
            <b>Нет чемпионатов</b>
            Запустите{' '}
            <code style={{ fontFamily: 'var(--font-mono)' }}>scripts/fetch-fixtures.mjs --leagues 39,140,135,78,61,2 --season 2026</code>
            , чтобы импортировать.
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <TH tk="th_id" />
                <TH tk="th_logo" />
                <TH tk="th_league" />
                <TH tk="th_type" />
                <TH tk="th_country" />
                <TH tk="th_season" />
                <TH tk="th_matches" style={{ textAlign: 'right' }} />
              </tr>
            </thead>
            <tbody>
              {list.map((l) => (
                <tr key={l.id}>
                  <td className="num" style={{ color: 'var(--text-3)' }}>{l.id}</td>
                  <td>
                    {l.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={l.logo} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
                    ) : null}
                  </td>
                  <td style={{ fontWeight: 500 }}>{l.name}</td>
                  <td><span className="pill gray">{l.type ?? '—'}</span></td>
                  <td>{l.country ?? '—'}</td>
                  <td className="num">{l.season}</td>
                  <td className="num">{l.fixturesCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
