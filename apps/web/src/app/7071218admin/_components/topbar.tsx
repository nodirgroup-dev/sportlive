import { signOut } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { AdminUser } from '@/lib/auth';

async function logoutAction() {
  'use server';
  await signOut();
  redirect('/7071218admin/login');
}

export function AdminTopbar({ crumb, user }: { crumb: string; user: AdminUser }) {
  return (
    <header className="topbar">
      <div className="crumbs">
        <span>SportLive Admin</span>
        <span className="t-dim">·</span>
        <b>{crumb}</b>
      </div>
      <div className="topbar-spacer" />
      <div className="profile">
        <div className="avatar">{user.name.slice(0, 1).toUpperCase()}</div>
        <div className="who">
          <b>{user.name}</b>
          <span>{user.role}</span>
        </div>
      </div>
      <form action={logoutAction}>
        <button type="submit" className="iconbtn" aria-label="Выход">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" style={{ width: 18, height: 18 }}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
        </button>
      </form>
    </header>
  );
}
