'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import type { AdminUser } from '@/lib/auth';
import { ADMIN_LANGS, type AdminLang, ADMIN_T, useAdminLang, writeAdminLang, readAdminLang } from '../_lang';

const LANG_LABEL: Record<AdminLang, string> = { uz: 'UZ', ru: 'RU', en: 'EN' };

const CRUMBS: Array<[RegExp, keyof (typeof ADMIN_T)['ru']]> = [
  [/^\/7071218admin\/?$/, 'crumb_dashboard'],
  [/^\/7071218admin\/news\/new/, 'crumb_news_new'],
  [/^\/7071218admin\/news\/\d+\/edit/, 'crumb_news_edit'],
  [/^\/7071218admin\/news/, 'crumb_news'],
  [/^\/7071218admin\/categories\/new/, 'crumb_categories_new'],
  [/^\/7071218admin\/categories\/\d+\/edit/, 'crumb_categories_edit'],
  [/^\/7071218admin\/categories/, 'crumb_categories'],
  [/^\/7071218admin\/static\/new/, 'crumb_static_new'],
  [/^\/7071218admin\/static\/\d+\/edit/, 'crumb_static_edit'],
  [/^\/7071218admin\/static/, 'crumb_static'],
  [/^\/7071218admin\/media/, 'crumb_media'],
  [/^\/7071218admin\/matches/, 'crumb_matches'],
  [/^\/7071218admin\/standings/, 'crumb_standings'],
  [/^\/7071218admin\/teams/, 'crumb_teams'],
  [/^\/7071218admin\/comments/, 'crumb_comments'],
  [/^\/7071218admin\/users/, 'crumb_users'],
  [/^\/7071218admin\/authors/, 'crumb_authors'],
  [/^\/7071218admin\/push/, 'crumb_push'],
  [/^\/7071218admin\/newsletter/, 'crumb_newsletter'],
  [/^\/7071218admin\/rss/, 'crumb_rss'],
  [/^\/7071218admin\/banners\/new/, 'crumb_banners_new'],
  [/^\/7071218admin\/banners\/\d+\/edit/, 'crumb_banners_edit'],
  [/^\/7071218admin\/banners/, 'crumb_banners'],
  [/^\/7071218admin\/analytics/, 'crumb_analytics'],
  [/^\/7071218admin\/seo/, 'crumb_seo'],
  [/^\/7071218admin\/settings/, 'crumb_settings'],
  [/^\/7071218admin\/audit/, 'crumb_audit'],
  [/^\/7071218admin\/backups/, 'crumb_backups'],
  [/^\/7071218admin\/calendar/, 'crumb_calendar'],
  [/^\/7071218admin\/live/, 'crumb_live'],
];

function crumbFor(pathname: string | null, lang: AdminLang): string {
  const t = ADMIN_T[lang];
  if (!pathname) return t.crumb_admin;
  for (const [re, key] of CRUMBS) if (re.test(pathname)) return t[key];
  return t.crumb_admin;
}

export function AdminTopbar({ user }: { user: AdminUser }) {
  const router = useRouter();
  const pathname = usePathname();
  const lang = useAdminLang();
  const t = ADMIN_T[lang];
  const crumb = crumbFor(pathname, lang);
  const [profileOpen, setProfileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [search, setSearch] = useState('');
  const profileRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Restore theme + sync admin-lang attribute on first paint.
  useEffect(() => {
    try {
      const th = (localStorage.getItem('sl_admin_theme') as 'dark' | 'light' | null) ?? 'dark';
      setTheme(th);
      document.documentElement.dataset.theme = th;
      document.documentElement.dataset.adminLang = readAdminLang();
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
          placeholder={t.searchPlaceholder}
        />
        <kbd>⌘K</kbd>
      </form>

      <div className="topbar-spacer" />

      <div className="lang-group">
        {ADMIN_LANGS.map((l) => (
          <button
            key={l}
            className={l === lang ? 'active' : ''}
            onClick={() => writeAdminLang(l)}
            type="button"
          >
            {LANG_LABEL[l]}
          </button>
        ))}
      </div>

      <button type="button" className="iconbtn" onClick={toggleTheme} title={t.changeTheme} aria-label="Theme">
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
          title={t.notifications}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: 18, height: 18 }}>
            <path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 3h16l-2-3zM10 21a2 2 0 0 0 4 0" />
          </svg>
        </button>
        {bellOpen ? (
          <div className="menu-pop" style={{ minWidth: 280, padding: 12 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>
              {t.notifications}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-2)', padding: '8px 0' }}>
              {t.noNotifications}
            </div>
            <hr />
            <Link href="/7071218admin/comments?tab=pending" style={{ fontSize: 12, color: 'var(--accent)' }}>
              {t.toModeration}
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
              {t.settings}
            </Link>
            <Link href="/" target="_blank" onClick={() => setProfileOpen(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: 14, height: 14 }}>
                <path d="M14 3h7v7M10 14L21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
              </svg>
              {t.openSite}
            </Link>
            <hr />
            <button className="danger" onClick={logout}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: 14, height: 14 }}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              {t.logout}
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
