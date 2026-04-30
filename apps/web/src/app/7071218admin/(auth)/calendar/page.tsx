import Link from 'next/link';
import { db, posts } from '@sportlive/db';
import { and, gte, lt, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const STATUS_PILL: Record<string, string> = {
  published: 'green',
  scheduled: 'yellow',
  draft: 'gray',
  archived: 'yellow',
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1);
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default async function EditorialCalendar({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const sp = await searchParams;
  const ref = sp.m ? new Date(`${sp.m}-01`) : new Date();
  if (Number.isNaN(ref.getTime())) ref.setTime(Date.now());

  const start = startOfMonth(ref);
  const end = endOfMonth(ref);

  const list = await db
    .select({
      id: posts.id,
      legacyId: posts.legacyId,
      title: posts.title,
      slug: posts.slug,
      status: posts.status,
      locale: posts.locale,
      publishedAt: posts.publishedAt,
    })
    .from(posts)
    .where(and(gte(posts.publishedAt, start), lt(posts.publishedAt, end)))
    .orderBy(desc(posts.publishedAt))
    .limit(500);

  // Group by day
  const byDay = new Map<string, typeof list>();
  for (const p of list) {
    if (!p.publishedAt) continue;
    const k = ymd(p.publishedAt);
    if (!byDay.has(k)) byDay.set(k, [] as typeof list);
    byDay.get(k)!.push(p);
  }

  // Build calendar grid
  const firstDow = start.getDay() === 0 ? 6 : start.getDay() - 1; // Mon-first
  const days: Array<{ date: Date; key: string } | null> = Array(firstDow).fill(null);
  const cur = new Date(start);
  while (cur < end) {
    days.push({ date: new Date(cur), key: ymd(cur) });
    cur.setDate(cur.getDate() + 1);
  }
  while (days.length % 7 !== 0) days.push(null);

  const fmtMonth = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(ref);
  const prevM = ymd(addMonths(ref, -1)).slice(0, 7);
  const nextM = ymd(addMonths(ref, 1)).slice(0, 7);
  const today = ymd(new Date());

  return (
    <>
      <div className="page-h">
        <div>
          <h1>Календарь</h1>
          <div className="sub">
            {fmtMonth} · {list.length} статей за месяц
          </div>
        </div>
        <div className="actions">
          <Link href={`?m=${prevM}`} className="btn">
            ← {prevM}
          </Link>
          <Link href="/7071218admin/calendar" className="btn">
            Сегодня
          </Link>
          <Link href={`?m=${nextM}`} className="btn">
            {nextM} →
          </Link>
        </div>
      </div>

      <div className="card" style={{ padding: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => (
            <div
              key={d}
              style={{
                fontSize: 10.5,
                color: 'var(--text-3)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                padding: '6px 4px',
              }}
            >
              {d}
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {days.map((d, i) => {
            if (!d) return <div key={i} style={{ minHeight: 100 }} />;
            const items = byDay.get(d.key) ?? [];
            const isToday = d.key === today;
            return (
              <div
                key={d.key}
                style={{
                  minHeight: 100,
                  padding: 6,
                  borderRadius: 8,
                  border: `1px solid ${isToday ? 'var(--accent)' : 'var(--line)'}`,
                  background: 'var(--surface)',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, color: isToday ? 'var(--accent)' : 'var(--text-2)', marginBottom: 4 }}>
                  {d.date.getDate()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {items.slice(0, 4).map((p) => (
                    <Link
                      key={p.id}
                      href={`/7071218admin/news/${p.id}/edit`}
                      style={{
                        fontSize: 10.5,
                        padding: '2px 5px',
                        borderRadius: 4,
                        background: 'var(--surface-2)',
                        color: 'var(--text)',
                        textDecoration: 'none',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        borderLeft: `3px solid ${
                          p.status === 'published'
                            ? 'var(--green)'
                            : p.status === 'scheduled'
                              ? 'var(--accent-2)'
                              : p.status === 'draft'
                                ? 'var(--text-3)'
                                : 'var(--yellow)'
                        }`,
                      }}
                      title={`${p.title} (${p.locale})`}
                    >
                      {p.title}
                    </Link>
                  ))}
                  {items.length > 4 ? (
                    <div style={{ fontSize: 10, color: 'var(--text-3)', paddingLeft: 5 }}>
                      +{items.length - 4} more
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <h2 style={{ marginTop: 24, marginBottom: 12, fontSize: 11.5, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-2)', display: 'flex', alignItems: 'center' }}>
        <span style={{ width: 3, height: 14, background: 'var(--accent)', marginRight: 10, borderRadius: 2 }} />
        Все статьи месяца
      </h2>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Заголовок</th>
              <th>Язык</th>
              <th>Статус</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id}>
                <td className="t-mono" style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>
                  {p.publishedAt
                    ? new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(p.publishedAt))
                    : '—'}
                </td>
                <td style={{ fontWeight: 500 }}>{p.title}</td>
                <td>
                  <span className={`pill ${p.locale === 'uz' ? 'green' : p.locale === 'ru' ? 'red' : 'yellow'}`}>{p.locale}</span>
                </td>
                <td>
                  <span className={`pill ${STATUS_PILL[p.status] ?? 'gray'}`}>{p.status}</span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <Link href={`/7071218admin/news/${p.id}/edit`} className="btn" style={{ height: 26, fontSize: 11 }}>
                    Изменить
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
