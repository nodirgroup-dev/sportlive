'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Newspaper,
  Calendar,
  Folders,
  FileText,
  Image as ImageIcon,
  CircleDot,
  Zap,
  Trophy,
  Users,
  MessageSquare,
  UserCog,
  PenLine,
  BellRing,
  Mail,
  Rss,
  Megaphone,
  LineChart,
  Search,
  ScrollText,
  DatabaseBackup,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { ADMIN_T, useAdminLang } from '../_lang';

type SidebarSec = { type: 'section'; key: keyof (typeof ADMIN_T)['ru'] };
type SidebarItem = {
  type: 'item';
  href: string;
  key: keyof (typeof ADMIN_T)['ru'];
  Icon: LucideIcon;
  badge?: string;
};

const NAV: Array<SidebarSec | SidebarItem> = [
  { type: 'section', key: 'sec_main' },
  { type: 'item', href: '/7071218admin', key: 'nav_dashboard', Icon: LayoutDashboard },

  { type: 'section', key: 'sec_content' },
  { type: 'item', href: '/7071218admin/news', key: 'nav_news', Icon: Newspaper },
  { type: 'item', href: '/7071218admin/calendar', key: 'nav_calendar', Icon: Calendar },
  { type: 'item', href: '/7071218admin/categories', key: 'nav_categories', Icon: Folders },
  { type: 'item', href: '/7071218admin/static', key: 'nav_static', Icon: FileText },
  { type: 'item', href: '/7071218admin/media', key: 'nav_media', Icon: ImageIcon },

  { type: 'section', key: 'sec_sport' },
  { type: 'item', href: '/7071218admin/matches', key: 'nav_matches', Icon: CircleDot },
  { type: 'item', href: '/7071218admin/live', key: 'nav_live', Icon: Zap, badge: 'LIVE' },
  { type: 'item', href: '/7071218admin/standings', key: 'nav_standings', Icon: Trophy },
  { type: 'item', href: '/7071218admin/teams', key: 'nav_teams', Icon: Users },

  { type: 'section', key: 'sec_community' },
  { type: 'item', href: '/7071218admin/comments', key: 'nav_comments', Icon: MessageSquare },
  { type: 'item', href: '/7071218admin/users', key: 'nav_users', Icon: UserCog },
  { type: 'item', href: '/7071218admin/authors', key: 'nav_authors', Icon: PenLine },

  { type: 'section', key: 'sec_marketing' },
  { type: 'item', href: '/7071218admin/push', key: 'nav_push', Icon: BellRing },
  { type: 'item', href: '/7071218admin/newsletter', key: 'nav_newsletter', Icon: Mail },
  { type: 'item', href: '/7071218admin/rss', key: 'nav_rss', Icon: Rss },
  { type: 'item', href: '/7071218admin/banners', key: 'nav_banners', Icon: Megaphone },

  { type: 'section', key: 'sec_analytics' },
  { type: 'item', href: '/7071218admin/analytics', key: 'nav_analytics', Icon: LineChart },
  { type: 'item', href: '/7071218admin/seo', key: 'nav_seo', Icon: Search },

  { type: 'section', key: 'sec_system' },
  { type: 'item', href: '/7071218admin/audit', key: 'nav_audit', Icon: ScrollText },
  { type: 'item', href: '/7071218admin/backups', key: 'nav_backups', Icon: DatabaseBackup },
  { type: 'item', href: '/7071218admin/settings', key: 'nav_settings', Icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname() ?? '/7071218admin';
  const lang = useAdminLang();
  const t = ADMIN_T[lang];
  const okMsg =
    lang === 'uz' ? 'Tizimlar normal ishlayapti' : lang === 'en' ? 'All systems normal' : 'Все системы в норме';
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
                {t[n.key]}
              </div>
            );
          }
          const isActive =
            n.href === '/7071218admin'
              ? pathname === '/7071218admin' || pathname === '/7071218admin/'
              : pathname.startsWith(n.href);
          const Icon = n.Icon;
          return (
            <Link key={n.href} href={n.href} className={`nav-item ${isActive ? 'active' : ''}`}>
              <Icon className="nav-icon" size={18} strokeWidth={1.6} />
              <span className="nav-label">{t[n.key]}</span>
              {n.badge ? <span className="nav-badge">{n.badge}</span> : null}
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-foot">
        <span>
          <span className="dot-live" />
          {okMsg}
        </span>
        <span>v0.1</span>
      </div>
    </aside>
  );
}
