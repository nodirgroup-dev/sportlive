import 'server-only';
import { db, newsletterSubscribers, newsletterSends } from '@sportlive/db';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { sendEmail, smtpConfigured } from './email';
import { getLatestPosts } from './db';
import { siteConfig, absoluteUrl, localePath } from './site';
import type { Locale } from '@/i18n/routing';

const SUBJECT: Record<Locale, (n: number) => string> = {
  uz: (n) => `Sportlive: haftalik dayjest — ${n} ta yangi yangilik`,
  ru: (n) => `Sportlive: дайджест недели — ${n} новостей`,
  en: (n) => `Sportlive weekly digest — ${n} new stories`,
};

const HEADER: Record<Locale, { intro: string; cta: string; unsubscribe: string }> = {
  uz: {
    intro: "So'nggi 7 kunda nashr etilgan eng muhim yangiliklar:",
    cta: "Maqolani o'qish",
    unsubscribe: "Obunani bekor qilish",
  },
  ru: {
    intro: 'Самые важные материалы за последние 7 дней:',
    cta: 'Читать статью',
    unsubscribe: 'Отписаться',
  },
  en: {
    intro: 'Top stories from the past 7 days:',
    cta: 'Read article',
    unsubscribe: 'Unsubscribe',
  },
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function articleUrl(p: { legacyId: number | null; slug: string; category: { path: string } | null }, locale: Locale): string {
  const cat = p.category?.path ?? '';
  return absoluteUrl(localePath(locale, `/${cat}/${p.legacyId}-${p.slug}`));
}

export function renderDigestHtml(
  posts: Awaited<ReturnType<typeof getLatestPosts>>,
  locale: Locale,
  recipientEmail: string,
): { html: string; text: string } {
  const t = HEADER[locale];
  const unsubUrl = `${siteConfig.url}/api/newsletter?email=${encodeURIComponent(recipientEmail)}`;

  const items = posts
    .map((p) => {
      const url = articleUrl(p, locale);
      const summary = (p.summary ?? '').replace(/<[^>]*>/g, '').slice(0, 200);
      const cover = p.coverImage ? absoluteUrl(p.coverImage) : null;
      return `
        <tr>
          <td style="padding: 18px 0; border-bottom: 1px solid #e5e5e5;">
            ${cover ? `<a href="${url}" style="text-decoration:none;"><img src="${cover}" alt="" width="540" style="display:block; max-width:100%; border-radius:8px;"/></a>` : ''}
            <h2 style="margin:14px 0 6px; font-family: -apple-system, system-ui, sans-serif; font-size:18px; line-height:1.3; color:#0a0a0a;">
              <a href="${url}" style="color:#0a0a0a; text-decoration:none;">${escapeHtml(p.title)}</a>
            </h2>
            ${summary ? `<p style="margin:0 0 10px; font-family: -apple-system, system-ui, sans-serif; font-size:14px; line-height:1.5; color:#525252;">${escapeHtml(summary)}</p>` : ''}
            <a href="${url}" style="display:inline-block; font-family: -apple-system, system-ui, sans-serif; font-size:13px; font-weight:600; color:#dc2626; text-decoration:none;">${t.cta} →</a>
          </td>
        </tr>`;
    })
    .join('');

  const html = `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(SUBJECT[locale](posts.length))}</title>
</head>
<body style="margin:0; padding:0; background:#fafafa; font-family: -apple-system, system-ui, sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fafafa; padding:24px 0;">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; background:#fff; border-radius:12px; padding:32px 28px;">
        <tr>
          <td style="padding-bottom:18px; border-bottom:2px solid #dc2626;">
            <a href="${siteConfig.url}" style="font-family: -apple-system, system-ui, sans-serif; font-size:24px; font-weight:800; color:#0a0a0a; text-decoration:none;">
              Sport<span style="color:#dc2626;">live</span>
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 0 8px; font-family: -apple-system, system-ui, sans-serif; font-size:14px; color:#525252;">
            ${t.intro}
          </td>
        </tr>
        ${items}
        <tr>
          <td style="padding-top:24px; font-family: -apple-system, system-ui, sans-serif; font-size:11px; color:#a3a3a3; text-align:center;">
            <a href="${unsubUrl}" style="color:#a3a3a3;">${t.unsubscribe}</a>
            &nbsp;·&nbsp; ${siteConfig.publisher.name}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  const text =
    `${t.intro}\n\n` +
    posts
      .map((p) => {
        const url = articleUrl(p, locale);
        const summary = (p.summary ?? '').replace(/<[^>]*>/g, '').slice(0, 200);
        return `${p.title}\n${summary}\n${url}`;
      })
      .join('\n\n') +
    `\n\n--\n${t.unsubscribe}: ${unsubUrl}`;

  return { html, text };
}

export type DigestStats = {
  recipients: number;
  sent: number;
  failed: number;
  posts: number;
};

/**
 * Build and send a weekly digest to all active subscribers of a locale.
 * Posts: latest 5 from the past 7 days. Skips silently if there are no
 * eligible posts or no subscribers.
 */
export async function sendWeeklyDigest(locale: Locale): Promise<DigestStats> {
  if (!smtpConfigured()) {
    throw new Error('SMTP not configured');
  }

  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  // We use getLatestPosts and then filter to >= cutoff in JS (small dataset).
  const recent = (await getLatestPosts(locale, 5)).filter(
    (p) => p.publishedAt && p.publishedAt >= cutoff,
  );

  const subs = await db
    .select({ email: newsletterSubscribers.email })
    .from(newsletterSubscribers)
    .where(
      and(
        isNull(newsletterSubscribers.unsubscribedAt),
        // null-locale subscribers receive every locale's digest? Keep them
        // locale-scoped: only matching locale or null gets the locale digest.
        eq(newsletterSubscribers.locale, locale),
      ),
    );

  const subject = SUBJECT[locale](recent.length);
  const stats: DigestStats = { recipients: subs.length, sent: 0, failed: 0, posts: recent.length };

  if (recent.length === 0 || subs.length === 0) {
    await db.insert(newsletterSends).values({
      locale,
      subject,
      sinceCutoff: cutoff,
      recipientCount: stats.recipients,
      sentCount: 0,
      failedCount: 0,
      error: recent.length === 0 ? 'no_recent_posts' : 'no_subscribers',
    });
    return stats;
  }

  for (const s of subs) {
    const { html, text } = renderDigestHtml(recent, locale, s.email);
    const ok = await sendEmail({ to: s.email, subject, html, text });
    if (ok) stats.sent++;
    else stats.failed++;
  }

  await db.insert(newsletterSends).values({
    locale,
    subject,
    sinceCutoff: cutoff,
    recipientCount: stats.recipients,
    sentCount: stats.sent,
    failedCount: stats.failed,
  });

  return stats;
}

export async function lastSends(limit = 20) {
  return db
    .select()
    .from(newsletterSends)
    .orderBy(desc(newsletterSends.createdAt))
    .limit(limit);
}

