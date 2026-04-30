import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { hasLocale, type Locale } from '@/i18n/routing';
import { db, newsletterSubscribers } from '@sportlive/db';
import { eq, isNull, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const COPY: Record<
  Locale,
  { title: string; success: string; missing: string; alreadyOff: string; bodyTemplate: (e: string) => string }
> = {
  uz: {
    title: 'Obunani bekor qilish',
    success: 'Tayyor — siz pochta ro‘yxatidan olib tashlandingiz',
    missing: 'Email manzili ko‘rsatilmagan',
    alreadyOff: 'Siz allaqachon obunadan chiqib ketgansiz',
    bodyTemplate: (e) => `${e} manziliga endi yuborilmaydi.`,
  },
  ru: {
    title: 'Отписка от рассылки',
    success: 'Готово — вы отписаны от рассылки',
    missing: 'Не указан email',
    alreadyOff: 'Вы уже отписаны',
    bodyTemplate: (e) => `На ${e} больше ничего отправляться не будет.`,
  },
  en: {
    title: 'Unsubscribe',
    success: 'Done — you are unsubscribed',
    missing: 'No email provided',
    alreadyOff: 'You were already unsubscribed',
    bodyTemplate: (e) => `Nothing else will go to ${e}.`,
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  return { title: COPY[locale].title, robots: { index: false, follow: false } };
}

export default async function UnsubscribePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ email?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  if (!hasLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = COPY[locale];

  const email = (sp.email ?? '').trim().toLowerCase();
  let state: 'missing' | 'success' | 'alreadyOff' = 'missing';

  if (email) {
    const existing = await db
      .select({ id: newsletterSubscribers.id, off: newsletterSubscribers.unsubscribedAt })
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, email))
      .limit(1);
    if (existing.length === 0 || (existing[0]!.off !== null)) {
      state = 'alreadyOff';
    } else {
      await db
        .update(newsletterSubscribers)
        .set({ unsubscribedAt: new Date() })
        .where(and(eq(newsletterSubscribers.email, email), isNull(newsletterSubscribers.unsubscribedAt)));
      state = 'success';
    }
  }

  return (
    <div className="container mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">{t.title}</h1>
      {state === 'missing' ? (
        <p className="text-sm text-neutral-500">{t.missing}</p>
      ) : state === 'alreadyOff' ? (
        <p className="text-sm text-neutral-500">{t.alreadyOff}</p>
      ) : (
        <>
          <p className="mb-2 text-base font-medium">✓ {t.success}</p>
          {email ? <p className="text-sm text-neutral-500">{t.bodyTemplate(email)}</p> : null}
        </>
      )}
    </div>
  );
}
