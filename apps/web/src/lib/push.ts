import 'server-only';
import webpush from 'web-push';
import { db, pushSubscriptions } from '@sportlive/db';
import { and, eq, isNull } from 'drizzle-orm';
import type { Locale } from '@/i18n/routing';

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@sportlive.uz';

let configured = false;
function configure(): boolean {
  if (configured) return true;
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return false;
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  configured = true;
  return true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  image?: string;
  icon?: string;
  tag?: string;
};

export type PushSendStats = {
  sent: number;
  invalidated: number;
  errors: number;
  total: number;
};

/**
 * Broadcast a push notification to every active subscriber. If `locale` is
 * given, only subscribers with that locale receive it; null-locale subscribers
 * always receive. If `categoryId` is given, subscribers with category_filters
 * set will only receive when their list contains the category.
 */
export async function broadcastPush(
  payload: PushPayload,
  locale: Locale | null = null,
  categoryId: number | null = null,
): Promise<PushSendStats> {
  if (!configure()) {
    throw new Error('VAPID keys are not configured (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY)');
  }

  const conds = [isNull(pushSubscriptions.invalidatedAt)];
  if (locale) conds.push(eq(pushSubscriptions.locale, locale));
  const subsAll = await db
    .select({
      id: pushSubscriptions.id,
      endpoint: pushSubscriptions.endpoint,
      p256dh: pushSubscriptions.p256dh,
      auth: pushSubscriptions.auth,
      categoryFilters: pushSubscriptions.categoryFilters,
    })
    .from(pushSubscriptions)
    .where(and(...conds));

  // Apply category filter in JS — the array is small and Postgres ANY on jsonb
  // is awkward. Subscribers with category_filters=NULL receive all broadcasts.
  const subs = categoryId
    ? subsAll.filter((s) => {
        if (!s.categoryFilters) return true;
        const arr = Array.isArray(s.categoryFilters) ? (s.categoryFilters as number[]) : [];
        return arr.length === 0 || arr.includes(categoryId);
      })
    : subsAll;

  const json = JSON.stringify(payload);
  let sent = 0;
  let invalidated = 0;
  let errors = 0;

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          json,
          { TTL: 24 * 60 * 60 },
        );
        sent++;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await db
            .update(pushSubscriptions)
            .set({ invalidatedAt: new Date() })
            .where(eq(pushSubscriptions.id, s.id));
          invalidated++;
        } else {
          errors++;
        }
      }
    }),
  );

  return { sent, invalidated, errors, total: subs.length };
}
