import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db, posts, postRevisions } from '@sportlive/db';
import { desc, eq } from 'drizzle-orm';
import { ArrowLeft, Undo2 } from 'lucide-react';
import { restorePostRevision } from '../../../_actions/posts';
import { TH } from '../../../../_components/t';

export const dynamic = 'force-dynamic';

export default async function RevisionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (!Number.isFinite(id)) notFound();

  const post = await db
    .select({ id: posts.id, title: posts.title, locale: posts.locale })
    .from(posts)
    .where(eq(posts.id, id))
    .limit(1);
  if (post.length === 0) notFound();

  const revs = await db
    .select()
    .from(postRevisions)
    .where(eq(postRevisions.postId, id))
    .orderBy(desc(postRevisions.createdAt))
    .limit(50);

  return (
    <>
      <div className="page-h">
        <div>
          <h1>История изменений</h1>
          <div className="sub">
            #{post[0]!.id} · {post[0]!.title}
          </div>
        </div>
        <div className="actions">
          <Link
            href={`/7071218admin/news/${id}/edit`}
            className="btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <ArrowLeft size={14} strokeWidth={1.8} />
            К редактированию
          </Link>
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <TH tk="th_when" style={{ width: 160 }} />
              <TH tk="author" style={{ width: 200 }} />
              <TH tk="th_revision_title" />
              <TH tk="body" style={{ width: 80, textAlign: 'right' }} />
              <th style={{ width: 130 }} />
            </tr>
          </thead>
          <tbody>
            {revs.map((r) => (
              <tr key={r.id}>
                <td className="t-mono" style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-2)' }}>
                  {new Intl.DateTimeFormat('ru-RU', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(new Date(r.createdAt))}
                </td>
                <td style={{ fontSize: 12 }}>{r.savedByLabel ?? <span className="t-dim">—</span>}</td>
                <td style={{ fontWeight: 500 }}>{r.title}</td>
                <td className="num t-dim" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                  {Math.round(r.body.length / 1024)} KB
                </td>
                <td style={{ textAlign: 'right' }}>
                  <form action={restorePostRevision}>
                    <input type="hidden" name="revisionId" value={r.id} />
                    <button
                      type="submit"
                      className="btn"
                      style={{ height: 28, fontSize: 11.5, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Undo2 size={12} strokeWidth={1.8} />
                      Восстановить
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {revs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-3)' }}>
                  Снапшотов пока нет. Они создаются автоматически при каждом сохранении.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
