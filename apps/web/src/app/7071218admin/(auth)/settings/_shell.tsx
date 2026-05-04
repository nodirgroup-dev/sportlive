'use client';

import { useAdminLang, ADMIN_T, type AdminStrings } from '../../_lang';

type ErrKind = 'empty' | 'weak' | 'mismatch' | 'wrong';

const ERR_KEY_MAP: Record<ErrKind, keyof AdminStrings> = {
  empty: 'settings_err_empty',
  weak: 'settings_err_weak',
  mismatch: 'settings_err_mismatch',
  wrong: 'settings_err_wrong',
};

export function SettingsShell({
  user,
  sp,
  changePasswordAction,
  siteUrl,
  siteName,
}: {
  user: { name: string | null; email: string; role: string };
  sp: { err?: string; saved?: string };
  changePasswordAction: (formData: FormData) => Promise<void>;
  siteUrl: string;
  siteName: string;
}) {
  const lang = useAdminLang();
  const t = ADMIN_T[lang];
  const errKey = sp.err && (sp.err in ERR_KEY_MAP) ? ERR_KEY_MAP[sp.err as ErrKind] : null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap)' }}>
      <div className="card" style={{ padding: 22 }}>
        <h2
          style={{
            margin: '0 0 14px',
            fontSize: 11.5,
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--text-2)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              width: 3,
              height: 14,
              background: 'var(--accent)',
              marginRight: 10,
              borderRadius: 2,
            }}
          />
          {t.settings_account}
        </h2>
        <div className="field">
          <label>{t.settings_name}</label>
          <div style={{ fontWeight: 600 }}>{user.name}</div>
        </div>
        <div className="field">
          <label>{t.email}</label>
          <div style={{ fontWeight: 500 }}>{user.email}</div>
        </div>
        <div className="field">
          <label>{t.settings_role}</label>
          <span className="pill green" style={{ width: 'fit-content' }}>
            {user.role}
          </span>
        </div>

        <h3
          style={{
            marginTop: 24,
            marginBottom: 10,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-2)',
          }}
        >
          {t.settings_change_password}
        </h3>
        {sp.saved ? (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.3)',
              color: '#86efac',
              marginBottom: 12,
              fontSize: 12.5,
            }}
          >
            {t.settings_password_updated}
          </div>
        ) : null}
        {errKey ? (
          <div className="login-err" style={{ marginBottom: 12 }}>
            {t[errKey]}
          </div>
        ) : null}
        <form action={changePasswordAction}>
          <div className="field">
            <label htmlFor="current">{t.settings_current_password}</label>
            <input
              id="current"
              name="current"
              type="password"
              required
              className="input"
              autoComplete="current-password"
            />
          </div>
          <div className="field">
            <label htmlFor="next">{t.settings_new_password}</label>
            <input
              id="next"
              name="next"
              type="password"
              required
              minLength={8}
              className="input"
              autoComplete="new-password"
            />
          </div>
          <div className="field">
            <label htmlFor="confirm">{t.settings_confirm_password}</label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              required
              className="input"
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="btn primary" style={{ marginTop: 8 }}>
            {t.settings_update_password}
          </button>
        </form>
      </div>

      <div className="card" style={{ padding: 22 }}>
        <h2
          style={{
            margin: '0 0 14px',
            fontSize: 11.5,
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--text-2)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              width: 3,
              height: 14,
              background: 'var(--accent)',
              marginRight: 10,
              borderRadius: 2,
            }}
          />
          {t.settings_site_info}
        </h2>
        <div className="field">
          <label>{t.settings_url}</label>
          <div style={{ fontWeight: 500 }}>{siteUrl}</div>
        </div>
        <div className="field">
          <label>{t.settings_site_name}</label>
          <div style={{ fontWeight: 500 }}>{siteName}</div>
        </div>
        <div className="field">
          <label>{t.settings_supported_langs}</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="pill green">UZ (default)</span>
            <span className="pill red">RU</span>
            <span className="pill yellow">EN</span>
          </div>
        </div>
        <div className="field">
          <label>{t.settings_cache_strategy}</label>
          <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
            {t.settings_cache_strategy_text}
          </div>
        </div>
        <div className="field">
          <label>{t.settings_external_feeds}</label>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.8 }}>
            <li>
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--accent)' }}
              >
                Sitemap
              </a>
            </li>
            <li>
              <a
                href="/google_news.xml"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--accent)' }}
              >
                Google News sitemap
              </a>
            </li>
            <li>
              RSS:{' '}
              <a
                href="/rss.xml"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--accent)' }}
              >
                UZ
              </a>{' '}
              ·{' '}
              <a
                href="/ru/rss.xml"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--accent)' }}
              >
                RU
              </a>{' '}
              ·{' '}
              <a
                href="/en/rss.xml"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--accent)' }}
              >
                EN
              </a>
            </li>
            <li>
              <a
                href="/robots.txt"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--accent)' }}
              >
                robots.txt
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
