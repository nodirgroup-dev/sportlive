import { db, newsletterSubscribers } from '@sportlive/db';
import { desc, sql } from 'drizzle-orm';
import { Download } from 'lucide-react';
import { AdminPageHeader } from '../../_components/page-header';

export const dynamic = 'force-dynamic';

export default async function NewsletterPage() {
  const [list, totals] = await Promise.all([
    db
      .select({
        id: newsletterSubscribers.id,
        email: newsletterSubscribers.email,
        locale: newsletterSubscribers.locale,
        createdAt: newsletterSubscribers.createdAt,
        unsubscribedAt: newsletterSubscribers.unsubscribedAt,
        ip: newsletterSubscribers.ip,
      })
      .from(newsletterSubscribers)
      .orderBy(desc(newsletterSubscribers.createdAt))
      .limit(500),
    db.execute(sql`
      SELECT
        count(*)::int AS total,
        count(*) FILTER (WHERE unsubscribed_at IS NULL)::int AS active,
        count(*) FILTER (WHERE unsubscribed_at IS NOT NULL)::int AS unsub
      FROM newsletter_subscribers
    `),
  ]);
  const t = (totals as unknown as Array<{ total: number; active: number; unsub: number }>)[0] ?? {
    total: 0,
    active: 0,
    unsub: 0,
  };

  return (
    <>
      <AdminPageHeader
        pageId="newsletter"
        actions={
          <a
            href="/7071218admin/api/newsletter-export"
            download
            className="btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Download size={14} strokeWidth={1.8} />
            Экспорт CSV ({t.active})
          </a>
        }
      >
        {t.active} активных · {t.unsub} отписались · {t.total} всего
      </AdminPageHeader>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Email</th>
              <th style={{ width: 80 }}>Язык</th>
              <th style={{ width: 130 }}>Подписан</th>
              <th style={{ width: 130 }}>Отписан</th>
              <th style={{ width: 130 }}>IP</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id}>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.email}</td>
                <td>
                  {r.locale ? (
                    <span
                      className={`pill ${r.locale === 'uz' ? 'green' : r.locale === 'ru' ? 'red' : 'yellow'}`}
                    >
                      {r.locale}
                    </span>
                  ) : (
                    <span className="t-dim">—</span>
                  )}
                </td>
                <td className="t-mono" style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-2)' }}>
                  {new Intl.DateTimeFormat('ru-RU', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(new Date(r.createdAt))}
                </td>
                <td className="t-mono" style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-3)' }}>
                  {r.unsubscribedAt
                    ? new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short' }).format(
                        new Date(r.unsubscribedAt),
                      )
                    : '—'}
                </td>
                <td className="t-dim" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                  {r.ip ?? '—'}
                </td>
              </tr>
            ))}
            {list.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-3)' }}>
                  Подписок пока нет
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
