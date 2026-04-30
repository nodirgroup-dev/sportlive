import { db, auditLog } from '@sportlive/db';
import { desc, eq, sql } from 'drizzle-orm';
import { AdminPageHeader } from '../../_components/page-header';

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
    query = query.where(sql`(${auditLog.summary} ILIKE ${needle} OR ${auditLog.actorLabel} ILIKE ${needle})`);
  }

  const list = await query;

  return (
    <>
      <AdminPageHeader pageId="audit">{list.length} последних записей</AdminPageHeader>

      <form className="card" style={{ padding: 12, display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
        <input
          name="q"
          defaultValue={sp.q ?? ''}
          placeholder="Поиск по описанию или автору…"
          className="input"
          style={{ flex: 1, height: 32 }}
        />
        <input
          name="action"
          defaultValue={sp.action ?? ''}
          placeholder="action (post.publish)"
          className="input"
          style={{ width: 200, height: 32 }}
        />
        <input
          name="entity"
          defaultValue={sp.entity ?? ''}
          placeholder="entity (post, comment)"
          className="input"
          style={{ width: 180, height: 32 }}
        />
        <button type="submit" className="btn">Применить</button>
      </form>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 130 }}>Когда</th>
              <th style={{ width: 160 }}>Автор</th>
              <th style={{ width: 160 }}>Действие</th>
              <th>Описание</th>
              <th style={{ width: 110 }}>Объект</th>
              <th style={{ width: 130 }}>IP</th>
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
                <td style={{ color: 'var(--text-2)' }}>{r.summary ?? <span className="t-dim">—</span>}</td>
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
                  Записей нет
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
