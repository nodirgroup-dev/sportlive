import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { changePassword } from '../_actions/account';
import { siteConfig } from '@/lib/site';
import { AdminPageHeader } from '../../_components/page-header';
import { SettingsShell } from './_shell';

export const dynamic = 'force-dynamic';

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string; saved?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect('/7071218admin/login');

  return (
    <>
      <AdminPageHeader pageId="settings" />
      <SettingsShell
        user={{ name: user.name, email: user.email, role: user.role }}
        sp={sp}
        changePasswordAction={changePassword}
        siteUrl={siteConfig.url}
        siteName={siteConfig.name}
      />
    </>
  );
}
