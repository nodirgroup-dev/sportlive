import { redirect } from 'next/navigation';
import { signIn, getCurrentUser } from '@/lib/auth';
import { recordAudit } from '@/lib/audit';
import { LoginShell } from './_shell';

export const dynamic = 'force-dynamic';

async function loginAction(formData: FormData) {
  'use server';
  const email = (formData.get('email') as string | null)?.toString() ?? '';
  const password = (formData.get('password') as string | null)?.toString() ?? '';
  if (!email || !password) {
    redirect('/7071218admin/login?err=empty');
  }
  const user = await signIn(email, password);
  if (!user) {
    await recordAudit({
      action: 'user.signin.fail',
      summary: email.slice(0, 200),
    });
    redirect('/7071218admin/login?err=invalid');
  }
  await recordAudit({
    action: 'user.signin',
    entityType: 'user',
    entityId: user.id,
    summary: user.name || user.email,
    actor: { id: user.id, name: user.name, email: user.email },
  });
  redirect('/7071218admin');
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  const sp = await searchParams;
  const existing = await getCurrentUser();
  if (existing) redirect('/7071218admin');

  const err = sp.err;
  const errKind: 'invalid' | 'empty' | null =
    err === 'invalid' ? 'invalid' : err === 'empty' ? 'empty' : null;
  // Server-side fallback (in case JS is disabled): default to RU until the
  // client component hydrates with the editor's chosen language.
  const fallbackErr =
    errKind === 'invalid'
      ? 'Неверный email или пароль'
      : errKind === 'empty'
        ? 'Заполните все поля'
        : null;

  return <LoginShell errMsg={fallbackErr} action={loginAction} errKind={errKind} />;
}
