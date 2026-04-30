import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { changePassword } from '../_actions/account';
import { siteConfig } from '@/lib/site';

export const dynamic = 'force-dynamic';

const ERR: Record<string, string> = {
  empty: 'Заполните все поля',
  weak: 'Минимум 8 символов',
  mismatch: 'Новые пароли не совпадают',
  wrong: 'Текущий пароль неверный',
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string; saved?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect('/7071218admin/login');

  return (
    <>
      <div className="page-h">
        <div>
          <h1>Настройки</h1>
          <div className="sub">Аккаунт и параметры сайта</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap)' }}>
        <div className="card" style={{ padding: 22 }}>
          <h2 style={{ margin: '0 0 14px', fontSize: 11.5, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-2)', display: 'flex', alignItems: 'center' }}>
            <span style={{ width: 3, height: 14, background: 'var(--accent)', marginRight: 10, borderRadius: 2 }} />
            Аккаунт
          </h2>
          <div className="field"><label>Имя</label><div style={{ fontWeight: 600 }}>{user.name}</div></div>
          <div className="field"><label>Email</label><div style={{ fontWeight: 500 }}>{user.email}</div></div>
          <div className="field">
            <label>Роль</label>
            <span className="pill green" style={{ width: 'fit-content' }}>{user.role}</span>
          </div>

          <h3 style={{ marginTop: 24, marginBottom: 10, fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-2)' }}>
            Изменить пароль
          </h3>
          {sp.saved ? (
            <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac', marginBottom: 12, fontSize: 12.5 }}>
              Пароль обновлён
            </div>
          ) : null}
          {sp.err && ERR[sp.err] ? <div className="login-err" style={{ marginBottom: 12 }}>{ERR[sp.err]}</div> : null}
          <form action={changePassword}>
            <div className="field">
              <label htmlFor="current">Текущий пароль</label>
              <input id="current" name="current" type="password" required className="input" autoComplete="current-password" />
            </div>
            <div className="field">
              <label htmlFor="next">Новый пароль (мин. 8 символов)</label>
              <input id="next" name="next" type="password" required minLength={8} className="input" autoComplete="new-password" />
            </div>
            <div className="field">
              <label htmlFor="confirm">Повторите новый пароль</label>
              <input id="confirm" name="confirm" type="password" required className="input" autoComplete="new-password" />
            </div>
            <button type="submit" className="btn primary" style={{ marginTop: 8 }}>
              Обновить пароль
            </button>
          </form>
        </div>

        <div className="card" style={{ padding: 22 }}>
          <h2 style={{ margin: '0 0 14px', fontSize: 11.5, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-2)', display: 'flex', alignItems: 'center' }}>
            <span style={{ width: 3, height: 14, background: 'var(--accent)', marginRight: 10, borderRadius: 2 }} />
            Информация о сайте
          </h2>
          <div className="field"><label>URL</label><div style={{ fontWeight: 500 }}>{siteConfig.url}</div></div>
          <div className="field"><label>Название</label><div style={{ fontWeight: 500 }}>{siteConfig.name}</div></div>
          <div className="field">
            <label>Поддерживаемые языки</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className="pill green">UZ (default)</span>
              <span className="pill red">RU</span>
              <span className="pill yellow">EN</span>
            </div>
          </div>
          <div className="field">
            <label>Кеш-стратегия</label>
            <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
              Главная и категории — ISR 60 сек. Статьи — динамические. Cloudflare фронт-кэш.
            </div>
          </div>
          <div className="field">
            <label>Внешние ленты</label>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.8 }}>
              <li><a href="/sitemap.xml" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>Sitemap</a></li>
              <li><a href="/google_news.xml" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>Google News sitemap</a></li>
              <li>
                RSS:{' '}
                <a href="/rss.xml" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>UZ</a> ·{' '}
                <a href="/ru/rss.xml" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>RU</a> ·{' '}
                <a href="/en/rss.xml" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>EN</a>
              </li>
              <li><a href="/robots.txt" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>robots.txt</a></li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
