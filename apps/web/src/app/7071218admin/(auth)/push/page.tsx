import { db, posts } from '@sportlive/db';
import { desc, eq, sql } from 'drizzle-orm';
import { CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { broadcastPostPush, broadcastCustomPush } from '../_actions/push';
import { PushTemplateForm } from '@/components/push-template-form';

export const dynamic = 'force-dynamic';

export default async function PushPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; sent?: string; total?: string; invalidated?: string; errors?: string; id?: string; error?: string }>;
}) {
  const sp = await searchParams;

  const [recent, totals] = await Promise.all([
    db
      .select({
        id: posts.id,
        legacyId: posts.legacyId,
        title: posts.title,
        slug: posts.slug,
        locale: posts.locale,
        publishedAt: posts.publishedAt,
      })
      .from(posts)
      .where(eq(posts.status, 'published'))
      .orderBy(desc(posts.publishedAt))
      .limit(15),
    db.execute(sql`
      SELECT
        count(*)::int AS total,
        count(*) FILTER (WHERE invalidated_at IS NULL)::int AS active,
        count(*) FILTER (WHERE locale = 'uz')::int AS uz,
        count(*) FILTER (WHERE locale = 'ru')::int AS ru,
        count(*) FILTER (WHERE locale = 'en')::int AS en
      FROM push_subscriptions
    `),
  ]);
  const t =
    (totals as unknown as Array<{ total: number; active: number; uz: number; ru: number; en: number }>)[0] ??
    { total: 0, active: 0, uz: 0, ru: 0, en: 0 };

  const hasVapid = Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

  return (
    <>
      <div className="page-h">
        <div>
          <h1>Push-уведомления</h1>
          <div className="sub">
            {t.active} активных подписчиков · UZ {t.uz} · RU {t.ru} · EN {t.en}
          </div>
        </div>
      </div>

      {sp.ok ? (
        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac', marginBottom: 14, fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={14} strokeWidth={1.8} />
          <span>
            Отправлено <b>{sp.sent}</b> из <b>{sp.total}</b>
            {Number(sp.invalidated) > 0 ? <> · отписано {sp.invalidated}</> : null}
            {Number(sp.errors) > 0 ? <> · ошибок {sp.errors}</> : null}
            {sp.id ? <> · пост <code>#{sp.id}</code></> : null}
          </span>
        </div>
      ) : null}
      {sp.error ? (
        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', marginBottom: 14, fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={14} strokeWidth={1.8} />
          {sp.error}
        </div>
      ) : null}

      {!hasVapid ? (
        <div className="card" style={{ padding: 16, marginBottom: 14 }}>
          <h2 style={{ margin: 0, marginBottom: 6, fontSize: 14, fontWeight: 600 }}>VAPID ключи не настроены</h2>
          <p style={{ margin: 0, color: 'var(--text-2)', fontSize: 13, lineHeight: 1.6 }}>
            Установите переменные окружения <code>VAPID_PUBLIC_KEY</code>, <code>VAPID_PRIVATE_KEY</code> и
            <code> NEXT_PUBLIC_VAPID_PUBLIC_KEY</code> (на клиенте), затем перезапустите контейнер. Без них кнопки
            «Отправить» работать не будут.
          </p>
        </div>
      ) : (
        <PushTemplateForm action={broadcastCustomPush} />
      )}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>ID</th>
              <th>Заголовок</th>
              <th style={{ width: 80 }}>Язык</th>
              <th style={{ width: 130 }}>Опубликовано</th>
              <th style={{ width: 130 }} />
            </tr>
          </thead>
          <tbody>
            {recent.map((p) => (
              <tr key={p.id}>
                <td className="num" style={{ color: 'var(--text-3)' }}>{p.legacyId ?? p.id}</td>
                <td style={{ fontWeight: 500 }}>{p.title}</td>
                <td>
                  <span className={`pill ${p.locale === 'uz' ? 'green' : p.locale === 'ru' ? 'red' : 'yellow'}`}>
                    {p.locale}
                  </span>
                </td>
                <td className="t-mono" style={{ color: 'var(--text-3)', fontSize: 11.5, fontFamily: 'var(--font-mono)' }}>
                  {p.publishedAt
                    ? new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(p.publishedAt))
                    : '—'}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <form action={broadcastPostPush}>
                    <input type="hidden" name="id" value={p.id} />
                    <button
                      type="submit"
                      className="btn primary"
                      disabled={!hasVapid || t.active === 0}
                      style={{ height: 28, fontSize: 11.5, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Send size={12} strokeWidth={1.8} />
                      Отправить ({t.active})
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {recent.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-3)' }}>
                  Нет опубликованных статей
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
