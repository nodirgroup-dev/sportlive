import 'server-only';
import { headers } from 'next/headers';
import { db, auditLog } from '@sportlive/db';
import { getCurrentUser } from './auth';

type AuditInput = {
  action: string;
  entityType?: string;
  entityId?: number | null;
  summary?: string;
  meta?: Record<string, unknown>;
  /** Override the actor lookup (useful for sign-in/sign-out, where the cookie isn't yet readable). */
  actor?: { id: number; name: string | null; email: string };
};

async function clientIp(): Promise<string | null> {
  try {
    const h = await headers();
    const cf = h.get('cf-connecting-ip');
    if (cf) return cf;
    const xff = h.get('x-forwarded-for');
    if (xff) return xff.split(',')[0]!.trim();
    return h.get('x-real-ip');
  } catch {
    return null;
  }
}

export async function recordAudit(input: AuditInput): Promise<void> {
  const actor = input.actor ?? (await getCurrentUser());
  const ip = await clientIp();
  try {
    await db.insert(auditLog).values({
      actorId: actor?.id ?? null,
      actorLabel: actor ? actor.name || actor.email : null,
      action: input.action,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      summary: input.summary ?? null,
      meta: input.meta ?? null,
      ip,
    });
  } catch (e) {
    // Audit failure must never break the user-facing action.
    console.error('[audit] insert failed:', e);
  }
}
