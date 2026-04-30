import { getApprovedComments, type CommentView } from '@/lib/db';
import { CommentsThread } from './comments-thread';
import type { Locale } from '@/i18n/routing';

const LABELS: Record<Locale, { title: string; empty: string }> = {
  uz: { title: 'Izohlar', empty: "Bu maqolaga hali izoh yo'q" },
  ru: { title: 'Комментарии', empty: 'Пока нет комментариев' },
  en: { title: 'Comments', empty: 'No comments yet' },
};

export type ThreadedComment = CommentView & { replies: ThreadedComment[] };

function buildTree(flat: CommentView[]): ThreadedComment[] {
  const byId = new Map<number, ThreadedComment>();
  const roots: ThreadedComment[] = [];
  for (const c of flat) byId.set(c.id, { ...c, replies: [] });
  for (const c of flat) {
    const node = byId.get(c.id)!;
    const parent = c.parentId ? byId.get(c.parentId) : null;
    if (parent) parent.replies.push(node);
    else roots.push(node);
  }
  return roots;
}

export async function CommentsSection({ postId, locale }: { postId: number; locale: Locale }) {
  const flat = await getApprovedComments(postId);
  const tree = buildTree(flat);
  const t = LABELS[locale];

  return (
    <section className="mt-10 border-t border-neutral-200 pt-8 dark:border-neutral-800">
      <h2 className="mb-4 text-xl font-bold tracking-tight">
        {t.title}
        {flat.length > 0 ? <span className="ml-1 text-neutral-500">{flat.length}</span> : null}
      </h2>
      <CommentsThread postId={postId} locale={locale} comments={tree} emptyLabel={t.empty} />
    </section>
  );
}
