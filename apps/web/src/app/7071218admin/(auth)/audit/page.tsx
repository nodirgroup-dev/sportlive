import { db, auditLog } from '@sportlive/db';
import { desc, eq, sql } from 'drizzle-orm';
import { AdminPageHeader } from '../../_components/page-header';
import { TH, T } from '../../_components/t';
import { AuditFilters } from './_filters';

export const dynamic = 'force-dynamic';

const ACTION_TINT: Record<string, string> = {
  publish: 'green',
  create: 'green',
  approved: 'green',
  signin: 'green',
  update: 'gray',
  pending: 'gray',
  unpublish: 'yellow',
  archive: 'yellow',
  signout: 'gray',
  delete: 'red',
  rejected: 'red',
  spam: 'red',
  fail: 'red',
};

function tintFor(action: string): string {
  for (const k of Object.keys(ACTION_TINT)) {
    if (action.includes(k)) return ACTION_TINT[k]!;
  }
  return 'gray';
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; entity?: string; q?: string }>;
}) {
  const sp = await searchParams;

  let query = db
    .select({
      id: auditLog.id,
      actorLabel: auditLog.actorLabel,
      action: auditLog.action,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      summary: auditLog.summary,
      ip: auditLog.ip,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .orderBy(desc(auditLog.createdAt))
    .limit(200)
    .$dynamic();

  if (sp.action) query = query.where(eq(auditLog.action, sp.action));
  if (sp.entity) query = query.where(eq(auditLog.entityType, sp.entity));
  if (sp.q) {
    const needle = `%${sp.q}%`;
    query = query.where(
      sql`(${auditLog.summary} ILIKE ${needle} OR ${auditLog.actorLabel} ILIKE ${needle})`,
    );
  }

  const list = await query;

  return (
    <>
      <AdminPageHeader pageId="audit">
        {list.length} <T tk="audit_count_suffix" />
      </AdminPageHeader>

      <AuditFilters defaultQ={sp.q ?? ''} defaultAction={sp.action ?? ''} defaultEntity={sp.entity ?? ''} />

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <TH tk="th_when" style={{ width: 130 }} />
              <TH tk="th_actor" style={{ width: 160 }} />
              <TH tk="th_action" style={{ width: 160 }} />
              <TH tk="th_description" />
              <TH tk="th_object" style={{ width: 110 }} />
              <TH tk="th_ip" style={{ width: 130 }} />
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id}>
                <td className="t-mono" style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>
                  {new Intl.DateTimeFormat('ru-RU', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(new Date(r.createdAt))}
                </td>
                <td>{r.actorLabel ?? <span className="t-dim">—</span>}</td>
                <td>
                  <span className={`pill ${tintFor(r.action)}`}>{r.action}</span>
                </td>
                <td style={{ color: 'var(--text-2)' }}>
                  {r.summary ?? <span className="t-dim">—</span>}
                </td>
                <td>
                  {r.entityType ? (
                    <span className="t-dim" style={{ fontSize: 11.5 }}>
                      {r.entityType}
                      {r.entityId ? ` #${r.entityId}` : ''}
                    </span>
                  ) : (
                    <span className="t-dim">—</span>
                  )}
                </td>
                <td className="t-dim" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                  {r.ip ?? '—'}
                </td>
              </tr>
            ))}
            {list.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-3)' }}>
                  <T tk="empty_no_records" />
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
