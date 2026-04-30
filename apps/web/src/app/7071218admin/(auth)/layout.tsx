import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { AdminSidebar } from '../_components/sidebar';
import { AdminTopbar } from '../_components/topbar';

export default async function AdminAuthLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/7071218admin/login');

  return (
    <div className="app">
      <AdminSidebar />
      <div className="main">
        <AdminTopbar user={user} />
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
