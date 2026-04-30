import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing, hasLocale } from '@/i18n/routing';
import { siteConfig, absoluteUrl, localePath } from '@/lib/site';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import '../globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'site' });

  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, absoluteUrl(localePath(l, '/'))]),
  );

  return {
    metadataBase: new URL(siteConfig.url),
    title: { default: `${t('name')} — ${t('tagline')}`, template: `%s — ${t('name')}` },
    description: t('description'),
    manifest: '/manifest.json',
    alternates: {
      canonical: absoluteUrl(localePath(locale, '/')),
      languages,
      types: {
        'application/rss+xml': '/rss.xml',
      },
    },
    icons: {
      icon: [
        { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
        { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      ],
      apple: '/apple-touch-icon.png',
    },
    appleWebApp: {
      capable: true,
      title: t('name'),
      statusBarStyle: 'black-translucent',
    },
    openGraph: {
      type: 'website',
      locale,
      siteName: t('name'),
      title: `${t('name')} — ${t('tagline')}`,
      description: t('description'),
      url: absoluteUrl(localePath(locale, '/')),
    },
    twitter: {
      card: 'summary_large_image',
      title: t('name'),
      description: t('description'),
    },
    robots: { index: true, follow: true, 'max-image-preview': 'large' },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">
        <NextIntlClientProvider messages={messages}>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
