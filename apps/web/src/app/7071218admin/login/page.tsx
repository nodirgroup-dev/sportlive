import { redirect } from 'next/navigation';
import { signIn, getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function loginAction(formData: FormData) {
  'use server';
  const email = (formData.get('email') as string | null)?.toString() ?? '';
  const password = (formData.get('password') as string | null)?.toString() ?? '';
  if (!email || !password) {
    redirect('/7071218admin/login?err=empty');
  }
  const user = await signIn(email, password);
  if (!user) {
    redirect('/7071218admin/login?err=invalid');
  }
  redirect('/7071218admin');
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  const sp = await searchParams;
  const existing = await getCurrentUser();
  if (existing) redirect('/7071218admin');

  const err = sp.err;
  const errMsg = err === 'invalid' ? 'Неверный email или пароль' : err === 'empty' ? 'Заполните все поля' : null;

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
              <div style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>Admin Panel</div>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24, maxWidth: 540 }}>
            <span className="login-tag">
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
              Live · Editorial CMS
            </span>
            <h1 className="login-h1">
              Управляй счётом.<br />
              Управляй историей.
            </h1>
            <p style={{ color: 'var(--text-2)', fontSize: 15, lineHeight: 1.5, position: 'relative', maxWidth: 480 }}>
              Полнофункциональная админка sportlive.uz — публикации, матчи, переводы и аналитика в одном интерфейсе.
            </p>
          </div>
          <div style={{ position: 'relative', display: 'flex', gap: 28, paddingTop: 24, borderTop: '1px solid var(--line)' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>1132</div>
              <div style={{ fontSize: 10.5, letterSpacing: '0.14em', color: 'var(--text-3)', textTransform: 'uppercase', marginTop: 2 }}>статей</div>
            </div>
            <div style={{ width: 1, background: 'var(--line-strong)' }} />
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>9</div>
              <div style={{ fontSize: 10.5, letterSpacing: '0.14em', color: 'var(--text-3)', textTransform: 'uppercase', marginTop: 2 }}>категорий</div>
            </div>
            <div style={{ width: 1, background: 'var(--line-strong)' }} />
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>3</div>
              <div style={{ fontSize: 10.5, letterSpacing: '0.14em', color: 'var(--text-3)', textTransform: 'uppercase', marginTop: 2 }}>языка</div>
            </div>
          </div>
        </div>
      </div>

      <div className="login-form-side">
        <form className="login-form" action={loginAction}>
          <div className="login-form-head">
            <h2>Вход в админку</h2>
            <p className="login-sub">Введите свои учётные данные.</p>
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
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
            <label htmlFor="password">Пароль</label>
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
          {errMsg ? <div className="login-err">{errMsg}</div> : null}
          <button type="submit" className="login-cta" style={{ marginTop: 16 }}>
            Войти
          </button>
          <div style={{ marginTop: 24, fontSize: 11.5, color: 'var(--text-3)', textAlign: 'center' }}>
            Sportlive.uz · Editorial CMS · v0.1
          </div>
        </form>
      </div>
    </div>
  );
}
