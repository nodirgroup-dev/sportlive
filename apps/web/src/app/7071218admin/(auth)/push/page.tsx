import { db, posts } from '@sportlive/db';
import { desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function PushPage() {
  const recent = await db
    .select({
      id: posts.id,
      legacyId: posts.legacyId,
      title: posts.title,
      slug: posts.slug,
      publishedAt: posts.publishedAt,
    })
    .from(posts)
    .where(eq(posts.status, 'published'))
    .orderBy(desc(posts.publishedAt))
    .limit(8);

  return (
    <>
      <div className="page-h">
        <div>
          <h1>Push-уведомления</h1>
          <div className="sub">Рассылка свежих новостей подписчикам</div>
        </div>
      </div>

      <div className="card" style={{ padding: 22, marginBottom: 14 }}>
        <h2 style={{ margin: 0, marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
          Подключение требуется
        </h2>
        <p style={{ margin: 0, color: 'var(--text-2)', fontSize: 13, lineHeight: 1.6 }}>
          Для отправки push-уведомлений нужен поставщик: <b>Firebase Cloud Messaging (FCM)</b> для веб + Android, или
          OneSignal / Pushwoosh для централизованной рассылки. После подключения здесь появится:
        </p>
        <ul style={{ margin: '10px 0 0', paddingLeft: 20, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>
          <li>Кнопка «Отправить» на каждой статье — заголовок + обложка → push</li>
          <li>Сегментация (язык, категория, время суток)</li>
          <li>Журнал отправок (сколько доставлено / открыто / кликнули)</li>
          <li>Шаблоны: «Срочно!», «Live: гол», «Только что опубликовано»</li>
        </ul>
        <div style={{ marginTop: 14, padding: 10, background: 'var(--surface-2)', borderRadius: 8, fontSize: 12, color: 'var(--text-2)' }}>
          📝 Пришлите ключи FCM (Server Key + VAPID public/private), и я добавлю интеграцию.
        </div>
      </div>

      <h2 style={{ marginBottom: 12, fontSize: 11.5, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-2)', display: 'flex', alignItems: 'center' }}>
        <span style={{ width: 3, height: 14, background: 'var(--accent)', marginRight: 10, borderRadius: 2 }} />
        Кандидаты на рассылку (последние статьи)
      </h2>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Заголовок</th>
              <th>Опубликовано</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {recent.map((p) => (
              <tr key={p.id}>
                <td className="num" style={{ color: 'var(--text-3)' }}>{p.legacyId ?? p.id}</td>
                <td style={{ fontWeight: 500 }}>{p.title}</td>
                <td style={{ color: 'var(--text-3)', fontSize: 11.5 }}>
                  {p.publishedAt
                    ? new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(p.publishedAt))
                    : '—'}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button type="button" className="btn" disabled style={{ height: 28, fontSize: 11.5, opacity: 0.6 }}>
                    Отправить (нет ключа)
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
