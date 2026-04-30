'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search as SearchIcon,
  Sun,
  Moon,
  Bell,
  Settings as SettingsIcon,
  ExternalLink,
  LogOut,
} from 'lucide-react';
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
        <SearchIcon size={16} strokeWidth={1.6} />
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
        {theme === 'dark' ? <Sun size={18} strokeWidth={1.6} /> : <Moon size={18} strokeWidth={1.6} />}
      </button>

      <div ref={bellRef} style={{ position: 'relative' }}>
        <button
          type="button"
          className="iconbtn has-dot"
          onClick={() => setBellOpen((o) => !o)}
          title={t.notifications}
        >
          <Bell size={18} strokeWidth={1.6} />
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
              <SettingsIcon size={14} strokeWidth={1.6} />
              {t.settings}
            </Link>
            <Link href="/" target="_blank" onClick={() => setProfileOpen(false)}>
              <ExternalLink size={14} strokeWidth={1.6} />
              {t.openSite}
            </Link>
            <hr />
            <button className="danger" onClick={logout}>
              <LogOut size={14} strokeWidth={1.6} />
              {t.logout}
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
