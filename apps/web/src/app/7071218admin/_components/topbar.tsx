'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import type { AdminUser } from '@/lib/auth';

const LANGS = ['RU', 'UZ', 'EN'] as const;

const CRUMBS: Array<[RegExp, string]> = [
  [/^\/7071218admin\/?$/, 'Дашборд'],
  [/^\/7071218admin\/news\/new/, 'Новая статья'],
  [/^\/7071218admin\/news\/\d+\/edit/, 'Редактирование статьи'],
  [/^\/7071218admin\/news/, 'Новости'],
  [/^\/7071218admin\/categories\/new/, 'Новая категория'],
  [/^\/7071218admin\/categories\/\d+\/edit/, 'Редактирование категории'],
  [/^\/7071218admin\/categories/, 'Категории'],
  [/^\/7071218admin\/static\/new/, 'Новая страница'],
  [/^\/7071218admin\/static\/\d+\/edit/, 'Редактирование страницы'],
  [/^\/7071218admin\/static/, 'Статические страницы'],
  [/^\/7071218admin\/media/, 'Медиатека'],
  [/^\/7071218admin\/matches/, 'Матчи'],
  [/^\/7071218admin\/standings/, 'Турнирные таблицы'],
  [/^\/7071218admin\/teams/, 'Команды'],
  [/^\/7071218admin\/comments/, 'Комментарии'],
  [/^\/7071218admin\/users/, 'Пользователи'],
  [/^\/7071218admin\/authors/, 'Авторы'],
  [/^\/7071218admin\/push/, 'Push-уведомления'],
  [/^\/7071218admin\/banners\/new/, 'Новый баннер'],
  [/^\/7071218admin\/banners\/\d+\/edit/, 'Редактирование баннера'],
  [/^\/7071218admin\/banners/, 'Баннеры'],
  [/^\/7071218admin\/analytics/, 'Аналитика'],
  [/^\/7071218admin\/seo/, 'SEO'],
  [/^\/7071218admin\/settings/, 'Настройки'],
];

function crumbFor(pathname: string | null): string {
  if (!pathname) return 'Админка';
  for (const [re, label] of CRUMBS) if (re.test(pathname)) return label;
  return 'Админка';
}

export function AdminTopbar({ user }: { user: AdminUser }) {
  const router = useRouter();
  const pathname = usePathname();
  const crumb = crumbFor(pathname);
  const [profileOpen, setProfileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [lang, setLang] = useState<(typeof LANGS)[number]>('RU');
  const [search, setSearch] = useState('');
  const profileRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Restore theme + lang
  useEffect(() => {
    try {
      const t = (localStorage.getItem('sl_admin_theme') as 'dark' | 'light' | null) ?? 'dark';
      const l = (localStorage.getItem('sl_admin_lang') as (typeof LANGS)[number] | null) ?? 'RU';
      setTheme(t);
      setLang(l);
      document.documentElement.dataset.theme = t;
    } catch {}
  }, []);

  // Cmd/Ctrl + K to focus search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'Escape') {
        setProfileOpen(false);
        setBellOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Click outside to close popups
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem('sl_admin_theme', next);
    } catch {}
    document.documentElement.dataset.theme = next;
  };

  const setLanguage = (l: (typeof LANGS)[number]) => {
    setLang(l);
    try {
      localStorage.setItem('sl_admin_lang', l);
    } catch {}
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    router.push(`/7071218admin/news?q=${encodeURIComponent(q)}`);
  };

  const logout = async () => {
    try {
      await fetch('/7071218admin/api/logout', { method: 'POST' });
    } catch {}
    router.push('/7071218admin/login');
  };

  return (
    <header className="topbar">
      <div className="crumbs">
        <span>SportLive</span>
        <span className="sep">/</span>
        <b>{crumb}</b>
      </div>

      <form className="topbar-search" onSubmit={submitSearch}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: 16, height: 16 }}>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          ref={searchRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по новостям…"
        />
        <kbd>⌘K</kbd>
      </form>

      <div className="topbar-spacer" />

      <div className="lang-group">
        {LANGS.map((l) => (
          <button key={l} className={l === lang ? 'active' : ''} onClick={() => setLanguage(l)} type="button">
            {l}
          </button>
        ))}
      </div>

      <button type="button" className="iconbtn" onClick={toggleTheme} title="Сменить тему" aria-label="Theme">
        {theme === 'dark' ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: 18, height: 18 }}>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: 18, height: 18 }}>
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>

      <div ref={bellRef} style={{ position: 'relative' }}>
        <button
          type="button"
          className="iconbtn has-dot"
          onClick={() => setBellOpen((o) => !o)}
          title="Уведомления"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: 18, height: 18 }}>
            <path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 3h16l-2-3zM10 21a2 2 0 0 0 4 0" />
          </svg>
        </button>
        {bellOpen ? (
          <div className="menu-pop" style={{ minWidth: 280, padding: 12 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>
              Уведомления
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-2)', padding: '8px 0' }}>
              Новых уведомлений нет
            </div>
            <hr />
            <Link href="/7071218admin/comments?tab=pending" style={{ fontSize: 12, color: 'var(--accent)' }}>
              К комментариям на модерации →
            </Link>
          </div>
        ) : null}
      </div>

      <div ref={profileRef} className="profile" onClick={() => setProfileOpen((o) => !o)}>
        <div className="avatar">{user.name.slice(0, 1).toUpperCase()}</div>
        <div className="who">
          <b>{user.name}</b>
          <span>{user.role}</span>
        </div>
        {profileOpen ? (
          <div className="menu-pop">
            <Link href="/7071218admin/settings" onClick={() => setProfileOpen(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: 14, height: 14 }}>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09c0 .67.39 1.27 1 1.51a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.24.61.84 1 1.51 1H21a2 2 0 1 1 0 4h-.09c-.67 0-1.27.39-1.51 1z" />
              </svg>
              Настройки
            </Link>
            <Link href="/" target="_blank" onClick={() => setProfileOpen(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: 14, height: 14 }}>
                <path d="M14 3h7v7M10 14L21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
              </svg>
              Открыть сайт
            </Link>
            <hr />
            <button className="danger" onClick={logout}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: 14, height: 14 }}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Выйти
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
