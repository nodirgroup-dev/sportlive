'use client';

import { useAdminLang, ADMIN_T } from '../../_lang';

/**
 * Filter toolbar for the audit log. Lives in its own client island so the
 * placeholders and the "Apply" button label react to admin-language changes
 * without forcing the whole table render to be a client component.
 */
export function AuditFilters({
  defaultQ,
  defaultAction,
  defaultEntity,
}: {
  defaultQ: string;
  defaultAction: string;
  defaultEntity: string;
}) {
  const lang = useAdminLang();
  const t = ADMIN_T[lang];
  return (
    <form
      className="card"
      style={{
        padding: 12,
        display: 'flex',
        gap: 10,
        marginBottom: 14,
        alignItems: 'center',
      }}
    >
      <input
        name="q"
        defaultValue={defaultQ}
        placeholder={t.audit_search_placeholder}
        className="input"
        style={{ flex: 1, height: 32 }}
      />
      <input
        name="action"
        defaultValue={defaultAction}
        placeholder={t.audit_action_placeholder}
        className="input"
        style={{ width: 200, height: 32 }}
      />
      <input
        name="entity"
        defaultValue={defaultEntity}
        placeholder={t.audit_entity_placeholder}
        className="input"
        style={{ width: 180, height: 32 }}
      />
      <button type="submit" className="btn">
        {t.apply}
      </button>
    </form>
  );
}
