import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { AdminSidebar } from '../_components/sidebar';
import { AdminTopbar } from '../_components/topbar';

const CRUMB_BY_PATH: Array<[RegExp, string]> = [
  [/^\/7071218admin\/?$/, 'Дашборд'],
  [/^\/7071218admin\/news/, 'Новости'],
  [/^\/7071218admin\/categories/, 'Категории'],
  [/^\/7071218admin\/static/, 'Статические страницы'],
  [/^\/7071218admin\/media/, 'Медиатека'],
  [/^\/7071218admin\/matches/, 'Матчи'],
  [/^\/7071218admin\/standings/, 'Турнирные таблицы'],
  [/^\/7071218admin\/teams/, 'Команды'],
  [/^\/7071218admin\/comments/, 'Комментарии'],
  [/^\/7071218admin\/users/, 'Пользователи'],
  [/^\/7071218admin\/authors/, 'Авторы'],
  [/^\/7071218admin\/push/, 'Push-уведомления'],
  [/^\/7071218admin\/banners/, 'Баннеры'],
  [/^\/7071218admin\/analytics/, 'Аналитика'],
  [/^\/7071218admin\/seo/, 'SEO'],
  [/^\/7071218admin\/settings/, 'Настройки'],
];

export default async function AdminAuthLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/7071218admin/login');

  const h = await headers();
  const pathname = h.get('x-invoke-path') ?? h.get('next-url') ?? '/7071218admin';
  let crumb = 'Админка';
  for (const [re, label] of CRUMB_BY_PATH) {
    if (re.test(pathname)) {
      crumb = label;
      break;
    }
  }

  return (
    <div className="app">
      <AdminSidebar active={pathname} />
      <div className="main">
        <AdminTopbar crumb={crumb} user={user} />
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
