import { db, users, posts } from '@sportlive/db';
import { asc, eq, sql, inArray, and, max } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const ROLE_PILL: Record<string, string> = { admin: 'green', editor: 'red', author: 'yellow' };
const ROLE_LABEL: Record<string, string> = { admin: 'Админ', editor: 'Редактор', author: 'Автор' };

async function getAuthors() {
  const list = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      bio: users.bio,
      avatar: users.avatar,
      legacyId: users.legacyId,
    })
    .from(users)
    .where(inArray(users.role, ['admin', 'editor', 'author']))
    .orderBy(asc(users.id));

  const stats = await db
    .select({
      id: posts.authorId,
      total: sql<number>`count(*)::int`,
      published: sql<number>`sum(case when ${posts.status} = 'published' then 1 else 0 end)::int`,
      drafts: sql<number>`sum(case when ${posts.status} = 'draft' then 1 else 0 end)::int`,
      lastPublishedAt: max(posts.publishedAt),
    })
    .from(posts)
    .groupBy(posts.authorId);
  const statMap = new Map<number, (typeof stats)[number]>();
  for (const r of stats) if (r.id) statMap.set(r.id, r);

  return list.map((u) => {
    const s = statMap.get(u.id);
    return {
      ...u,
      total: s?.total ?? 0,
      published: s?.published ?? 0,
      drafts: s?.drafts ?? 0,
      lastPublishedAt: s?.lastPublishedAt ?? null,
    };
  });
}

export default async function AuthorsPage() {
  const list = await getAuthors();

  return (
    <>
      <div className="page-h">
        <div>
          <h1>Авторы</h1>
          <div className="sub">{list.length} журналистов и редакторов</div>
        </div>
      </div>

      <div className="grid-3">
        {list.map((a) => (
          <div key={a.id} className="tile" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 700,
                fontSize: 16,
                flexShrink: 0,
              }}
            >
              {a.name.slice(0, 1).toUpperCase()}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <b style={{ fontSize: 14 }}>{a.name}</b>
                <span className={`pill ${ROLE_PILL[a.role] ?? 'gray'}`}>
                  {ROLE_LABEL[a.role] ?? a.role}
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 10, fontFamily: 'var(--font-mono)' }}>
                {a.email}
              </div>
              {a.bio ? (
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 10, lineHeight: 1.5 }}>{a.bio}</div>
              ) : null}
              <div style={{ display: 'flex', gap: 16, fontSize: 11.5 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
                    {a.published}
                  </div>
                  <div style={{ color: 'var(--text-3)' }}>опубл.</div>
                </div>
                {a.drafts > 0 ? (
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
                      {a.drafts}
                    </div>
                    <div style={{ color: 'var(--text-3)' }}>черн.</div>
                  </div>
                ) : null}
              </div>
              {a.lastPublishedAt ? (
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8 }}>
                  Последняя:{' '}
                  {new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' }).format(
                    new Date(a.lastPublishedAt),
                  )}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export const _used = and || eq;
