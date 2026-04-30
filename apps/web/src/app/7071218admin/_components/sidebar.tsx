import Link from 'next/link';

const NAV: Array<
  | { type: 'section'; label: string }
  | { type: 'item'; href: string; label: string; icon: string; badge?: string }
> = [
  { type: 'section', label: 'Главная' },
  { type: 'item', href: '/7071218admin', label: 'Дашборд', icon: 'M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z' },
  { type: 'section', label: 'Контент' },
  { type: 'item', href: '/7071218admin/news', label: 'Новости', icon: 'M3 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-4 2V5Z' },
  { type: 'item', href: '/7071218admin/categories', label: 'Категории', icon: 'M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z' },
  { type: 'item', href: '/7071218admin/static', label: 'Статические страницы', icon: 'M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm2 4h10v2H7V8Zm0 4h10v2H7v-2Zm0 4h6v2H7v-2Z' },
  { type: 'item', href: '/7071218admin/media', label: 'Медиатека', icon: 'M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Zm5 4a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm10 9-5-5-3 3-2-2-3 3v1h13v-0Z' },
  { type: 'section', label: 'Спорт' },
  { type: 'item', href: '/7071218admin/matches', label: 'Матчи', icon: 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8Z M12 6l5 6-5 6-5-6 5-6Z' },
  { type: 'item', href: '/7071218admin/standings', label: 'Турнирные таблицы', icon: 'M5 3h14v18l-7-3-7 3V3Z' },
  { type: 'item', href: '/7071218admin/teams', label: 'Команды', icon: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-1a6 6 0 0 1 12 0v1H4Z' },
  { type: 'section', label: 'Сообщество' },
  { type: 'item', href: '/7071218admin/comments', label: 'Комментарии', icon: 'M2 4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8l-6 4V4Z' },
  { type: 'item', href: '/7071218admin/users', label: 'Пользователи', icon: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-1a6 6 0 0 1 12 0v1H4Z' },
  { type: 'item', href: '/7071218admin/authors', label: 'Авторы', icon: 'M14 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM6 20a8 8 0 0 1 16 0v0H6Z' },
  { type: 'section', label: 'Маркетинг' },
  { type: 'item', href: '/7071218admin/push', label: 'Push-уведомления', icon: 'M12 2a6 6 0 0 0-6 6v4l-2 4h16l-2-4V8a6 6 0 0 0-6-6Zm0 20a3 3 0 0 0 3-3H9a3 3 0 0 0 3 3Z' },
  { type: 'item', href: '/7071218admin/banners', label: 'Баннеры', icon: 'M3 5h18v14H3V5Zm0 4h18M3 13h18' },
  { type: 'section', label: 'Аналитика' },
  { type: 'item', href: '/7071218admin/analytics', label: 'Аналитика', icon: 'M3 21V3h2v16h16v2H3Zm5-3 4-6 4 4 4-8' },
  { type: 'item', href: '/7071218admin/seo', label: 'SEO', icon: 'M11 4a7 7 0 1 1-7 7 7 7 0 0 1 7-7Zm0 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm9 4-4-4' },
  { type: 'section', label: 'Система' },
  { type: 'item', href: '/7071218admin/settings', label: 'Настройки', icon: 'M12 8a4 4 0 1 0 4 4 4 4 0 0 0-4-4Zm10 4-2-1.5.4-2.4-2-1.6-2.4.4L14.5 5 12 4l-1.5 2L8 5.6l-2 1.6.4 2.4-2 1.5L4 12l2 1.5-.4 2.4 2 1.6 2.4-.4L11.5 19l1 1 1-1 1-1.4 2.4.4 2-1.6-.4-2.4 2-1.5Z' },
];

export function AdminSidebar({ active }: { active: string }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">SL</div>
        <div className="brand-name">
          <b>Sportlive</b>
          <span>Admin</span>
        </div>
      </div>
      <nav className="nav">
        {NAV.map((n, i) =>
          n.type === 'section' ? (
            <div key={`s-${i}`} className="nav-section">
              {n.label}
            </div>
          ) : (
            <Link
              key={n.href}
              href={n.href}
              className={`nav-item ${active === n.href || (n.href !== '/7071218admin' && active.startsWith(n.href)) ? 'active' : ''}`}
            >
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d={n.icon} />
              </svg>
              <span className="nav-label">{n.label}</span>
              {n.badge ? <span className="nav-badge">{n.badge}</span> : null}
            </Link>
          ),
        )}
      </nav>
      <div className="sidebar-foot">
        <span>
          <span className="dot-live" />v0.1
        </span>
      </div>
    </aside>
  );
}
