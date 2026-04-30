import { db, comments, posts } from '@sportlive/db';
import { desc, eq, sql } from 'drizzle-orm';
import { setCommentStatus, deleteComment } from '../_actions/comments';

export const dynamic = 'force-dynamic';

const TABS = [
  { key: 'pending', label: 'На модерации', cls: 'yellow' },
  { key: 'approved', label: 'Одобрены', cls: 'green' },
  { key: 'spam', label: 'Спам', cls: 'red' },
  { key: 'rejected', label: 'Отклонены', cls: 'gray' },
] as const;

async function getCounts() {
  const r = await db
    .select({ status: comments.status, c: sql<number>`count(*)::int` })
    .from(comments)
    .groupBy(comments.status);
  const map: Record<string, number> = { pending: 0, approved: 0, spam: 0, rejected: 0 };
  for (const x of r) map[x.status as string] = x.c;
  return map;
}

async function getList(status: 'pending' | 'approved' | 'spam' | 'rejected') {
  return db
    .select({
      id: comments.id,
      postId: comments.postId,
      postTitle: posts.title,
      postSlug: posts.slug,
      authorName: comments.authorName,
      authorEmail: comments.authorEmail,
      body: comments.body,
      status: comments.status,
      createdAt: comments.createdAt,
    })
    .from(comments)
    .leftJoin(posts, eq(posts.id, comments.postId))
    .where(eq(comments.status, status))
    .orderBy(desc(comments.createdAt))
    .limit(100);
}

export default async function CommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  const tab = (TABS.find((t) => t.key === sp.tab)?.key ?? 'pending') as
    | 'pending'
    | 'approved'
    | 'spam'
    | 'rejected';

  const [counts, list] = await Promise.all([getCounts(), getList(tab)]);

  return (
    <>
      <div className="page-h">
        <div>
          <h1>Комментарии</h1>
          <div className="sub">Модерация пользовательских комментариев</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--line)', marginBottom: 16 }}>
        {TABS.map((t) => {
          const isActive = t.key === tab;
          return (
            <a
              key={t.key}
              href={`?tab=${t.key}`}
              style={{
                padding: '9px 14px',
                fontSize: 12.5,
                fontWeight: 500,
                color: isActive ? 'var(--text)' : 'var(--text-3)',
                borderBottom: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                marginBottom: -1,
                textDecoration: 'none',
              }}
            >
              {t.label}
              <span
                style={{
                  marginLeft: 6,
                  padding: '1px 6px',
                  background: 'var(--surface-3)',
                  borderRadius: 999,
                  fontSize: 10,
                }}
              >
                {counts[t.key] ?? 0}
              </span>
            </a>
          );
        })}
      </div>

      {list.length === 0 ? (
        <div className="stub" style={{ minHeight: 240 }}>
          <div>
            <b>Нет комментариев</b>
            В этой вкладке пока ничего нет
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map((c) => (
            <div key={c.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <b style={{ fontSize: 13 }}>{c.authorName ?? 'Аноним'}</b>
                    {c.authorEmail ? (
                      <span style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                        {c.authorEmail}
                      </span>
                    ) : null}
                    <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>·</span>
                    <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                      {new Intl.DateTimeFormat('ru-RU', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      }).format(new Date(c.createdAt))}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 8, color: 'var(--text)' }}>
                    {c.body}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                    К статье:{' '}
                    <a
                      href={`/7071218admin/news/${c.postId}/edit`}
                      style={{ color: 'var(--accent)' }}
                    >
                      {c.postTitle ?? `#${c.postId}`}
                    </a>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {tab !== 'approved' ? (
                    <form action={setCommentStatus.bind(null, c.id, 'approved')}>
                      <button className="btn primary" style={{ height: 28, fontSize: 11.5 }}>
                        Одобрить
                      </button>
                    </form>
                  ) : null}
                  {tab !== 'spam' ? (
                    <form action={setCommentStatus.bind(null, c.id, 'spam')}>
                      <button className="btn" style={{ height: 28, fontSize: 11.5 }}>
                        Спам
                      </button>
                    </form>
                  ) : null}
                  <form action={deleteComment.bind(null, c.id)}>
                    <button className="btn danger" style={{ height: 28, fontSize: 11.5 }}>
                      Удалить
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
