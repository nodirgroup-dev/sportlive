'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV: Array<
  | { type: 'section'; label: string }
  | { type: 'item'; href: string; label: string; icon: string; badge?: string }
> = [
  { type: 'section', label: 'Главная' },
  { type: 'item', href: '/7071218admin', label: 'Дашборд', icon: 'M3 13h7V3H3v10zm0 8h7v-6H3v6zm11 0h7V11h-7v10zm0-18v6h7V3h-7z' },

  { type: 'section', label: 'Контент' },
  { type: 'item', href: '/7071218admin/news', label: 'Новости', icon: 'M4 5h13a2 2 0 0 1 2 2v10a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2V5zM7 9h7M7 13h7M7 17h4' },
  { type: 'item', href: '/7071218admin/calendar', label: 'Календарь', icon: 'M3 4h18v18H3V4zM3 10h18M8 2v4M16 2v4' },
  { type: 'item', href: '/7071218admin/categories', label: 'Категории', icon: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z' },
  { type: 'item', href: '/7071218admin/static', label: 'Статические страницы', icon: 'M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm2 4h10v2H7V8Zm0 4h10v2H7v-2Zm0 4h6v2H7v-2Z' },
  { type: 'item', href: '/7071218admin/media', label: 'Медиатека', icon: 'M3 6h18v12H3zM3 10h18M9 14h6' },

  { type: 'section', label: 'Спорт' },
  { type: 'item', href: '/7071218admin/matches', label: 'Матчи', icon: 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z' },
  { type: 'item', href: '/7071218admin/live', label: 'Live blog', icon: 'M13 2L3 14h7l-1 8 10-12h-7l1-8z', badge: 'LIVE' },
  { type: 'item', href: '/7071218admin/standings', label: 'Турнирные таблицы', icon: 'M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4z' },
  { type: 'item', href: '/7071218admin/teams', label: 'Команды', icon: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-1a6 6 0 0 1 12 0v1H4Z' },

  { type: 'section', label: 'Сообщество' },
  { type: 'item', href: '/7071218admin/comments', label: 'Комментарии', icon: 'M21 11.5a8.5 8.5 0 0 1-13 7.2L3 21l2.3-5A8.5 8.5 0 1 1 21 11.5z' },
  { type: 'item', href: '/7071218admin/users', label: 'Пользователи', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' },
  { type: 'item', href: '/7071218admin/authors', label: 'Авторы', icon: 'M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z' },

  { type: 'section', label: 'Маркетинг' },
  { type: 'item', href: '/7071218admin/push', label: 'Push-уведомления', icon: 'M18 16v-5a6 6 0 0 0-12 0v5l-2 3h16l-2-3zM10 21a2 2 0 0 0 4 0' },
  { type: 'item', href: '/7071218admin/newsletter', label: 'Email рассылка', icon: 'M4 4h16v16H4zM4 4l8 8 8-8' },
  { type: 'item', href: '/7071218admin/rss', label: 'RSS импорт', icon: 'M5 11a8 8 0 0 1 8 8M5 5a14 14 0 0 1 14 14M6 19a1 1 0 1 1 0-2 1 1 0 0 1 0 2z' },
  { type: 'item', href: '/7071218admin/banners', label: 'Баннеры', icon: 'M3 6h18v12H3zM3 10h18M9 14h6' },

  { type: 'section', label: 'Аналитика' },
  { type: 'item', href: '/7071218admin/analytics', label: 'Аналитика', icon: 'M3 21V3h2v16h16v2H3Zm5-3 4-6 4 4 4-8' },
  { type: 'item', href: '/7071218admin/seo', label: 'SEO', icon: 'M11 4a7 7 0 1 1-7 7 7 7 0 0 1 7-7Zm9 18-4-4' },

  { type: 'section', label: 'Система' },
  { type: 'item', href: '/7071218admin/audit', label: 'Журнал действий', icon: 'M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' },
  { type: 'item', href: '/7071218admin/backups', label: 'Бэкапы', icon: 'M21 8v13H3V8M1 3h22v5H1zM10 12h4' },
  { type: 'item', href: '/7071218admin/settings', label: 'Настройки', icon: 'M12 8a4 4 0 1 0 4 4 4 4 0 0 0-4-4Z' },
];

export function AdminSidebar() {
  const pathname = usePathname() ?? '/7071218admin';
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">SL</div>
        <div className="brand-name">
          <b>sportlive.uz</b>
          <span>Admin · v0.1</span>
        </div>
      </div>
      <nav className="nav">
        {NAV.map((n, i) => {
          if (n.type === 'section') {
            return (
              <div key={`s-${i}`} className="nav-section">
                {n.label}
              </div>
            );
          }
          const isActive =
            n.href === '/7071218admin'
              ? pathname === '/7071218admin' || pathname === '/7071218admin/'
              : pathname.startsWith(n.href);
          return (
            <Link key={n.href} href={n.href} className={`nav-item ${isActive ? 'active' : ''}`}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d={n.icon} />
              </svg>
              <span className="nav-label">{n.label}</span>
              {n.badge ? <span className="nav-badge">{n.badge}</span> : null}
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-foot">
        <span>
          <span className="dot-live" />
          Все системы в норме
        </span>
        <span>v0.1</span>
      </div>
    </aside>
  );
}
