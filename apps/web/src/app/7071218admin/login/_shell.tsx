'use client';

import { useAdminLang, ADMIN_T } from '../_lang';

const HERO: Record<'uz' | 'ru' | 'en', { line1: string; line2: string; tagline: string; sub: string; statsLabel: { posts: string; categories: string; langs: string } }> = {
  ru: {
    line1: 'Управляй счётом.',
    line2: 'Управляй историей.',
    tagline: 'Live · Editorial CMS',
    sub: 'Полнофункциональная админка sportlive.uz — публикации, матчи, переводы и аналитика в одном интерфейсе.',
    statsLabel: { posts: 'статей', categories: 'категорий', langs: 'языка' },
  },
  uz: {
    line1: 'Hisobni boshqar.',
    line2: 'Tarixni yaratib bor.',
    tagline: 'Live · Editorial CMS',
    sub: 'sportlive.uz to‘liq adminkasi — nashrlar, o‘yinlar, tarjimalar va analitika bitta interfeysda.',
    statsLabel: { posts: 'maqola', categories: 'kategoriya', langs: 'til' },
  },
  en: {
    line1: 'Run the score.',
    line2: 'Run the story.',
    tagline: 'Live · Editorial CMS',
    sub: 'Full sportlive.uz admin — publishing, matches, translations and analytics in one interface.',
    statsLabel: { posts: 'articles', categories: 'categories', langs: 'languages' },
  },
};

export function LoginShell({
  errMsg,
  errKind,
  action,
}: {
  errMsg: string | null;
  errKind: 'invalid' | 'empty' | null;
  action: (formData: FormData) => Promise<void>;
}) {
  const lang = useAdminLang();
  const t = ADMIN_T[lang];
  const h = HERO[lang];
  const finalErr =
    errKind === 'invalid' ? t.login_err_invalid : errKind === 'empty' ? t.login_err_empty : errMsg;

  return (
    <div className="login-shell">
      <div className="login-brand">
        <div className="lb-grid" />
        <div className="lb-glow lb-glow-1" />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 32, height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="brand-mark" style={{ width: 40, height: 40, fontSize: 16 }}>SL</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Sportlive.uz</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                Admin Panel
              </div>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24, maxWidth: 540 }}>
            <span className="login-tag">
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
              {h.tagline}
            </span>
            <h1 className="login-h1">
              {h.line1}
              <br />
              {h.line2}
            </h1>
            <p style={{ color: 'var(--text-2)', fontSize: 15, lineHeight: 1.5, position: 'relative', maxWidth: 480 }}>
              {h.sub}
            </p>
          </div>
          <div style={{ position: 'relative', display: 'flex', gap: 28, paddingTop: 24, borderTop: '1px solid var(--line)' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>1132</div>
              <div style={{ fontSize: 10.5, letterSpacing: '0.14em', color: 'var(--text-3)', textTransform: 'uppercase', marginTop: 2 }}>
                {h.statsLabel.posts}
              </div>
            </div>
            <div style={{ width: 1, background: 'var(--line-strong)' }} />
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>9</div>
              <div style={{ fontSize: 10.5, letterSpacing: '0.14em', color: 'var(--text-3)', textTransform: 'uppercase', marginTop: 2 }}>
                {h.statsLabel.categories}
              </div>
            </div>
            <div style={{ width: 1, background: 'var(--line-strong)' }} />
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>3</div>
              <div style={{ fontSize: 10.5, letterSpacing: '0.14em', color: 'var(--text-3)', textTransform: 'uppercase', marginTop: 2 }}>
                {h.statsLabel.langs}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="login-form-side">
        <form className="login-form" action={action}>
          <div className="login-form-head">
            <h2>{t.login_title}</h2>
            <p className="login-sub">{t.login_sub}</p>
          </div>
          <div className="field">
            <label htmlFor="email">{t.email}</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              defaultValue=""
              className="input login-input"
              placeholder="you@sportlive.uz"
            />
          </div>
          <div className="field">
            <label htmlFor="password">{t.password}</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="input login-input"
              placeholder="••••••••"
            />
          </div>
          {finalErr ? <div className="login-err">{finalErr}</div> : null}
          <button type="submit" className="login-cta" style={{ marginTop: 16 }}>
            {t.login_submit}
          </button>
          <div style={{ marginTop: 24, fontSize: 11.5, color: 'var(--text-3)', textAlign: 'center' }}>
            Sportlive.uz · Editorial CMS · v0.1
          </div>
        </form>
      </div>
    </div>
  );
}
