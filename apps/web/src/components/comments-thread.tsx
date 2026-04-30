'use client';

import { useState } from 'react';
import type { Locale } from '@/i18n/routing';
import { CommentForm } from './comment-form';

type ThreadedComment = {
  id: number;
  authorName: string | null;
  body: string;
  createdAt: Date | string;
  parentId: number | null;
  likeCount: number;
  replies: ThreadedComment[];
};

const REPLY_LABEL: Record<Locale, string> = {
  uz: 'Javob berish',
  ru: 'Ответить',
  en: 'Reply',
};

const LIKE_LABEL: Record<Locale, string> = { uz: 'Yoqdi', ru: 'Лайк', en: 'Like' };

const localeFmt: Record<Locale, string> = { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-US' };

function CommentNode({
  c,
  postId,
  locale,
  depth,
  replyOpenId,
  setReplyOpenId,
}: {
  c: ThreadedComment;
  postId: number;
  locale: Locale;
  depth: number;
  replyOpenId: number | null;
  setReplyOpenId: (id: number | null) => void;
}) {
  const date = new Intl.DateTimeFormat(localeFmt[locale], {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(typeof c.createdAt === 'string' ? new Date(c.createdAt) : c.createdAt);
  const open = replyOpenId === c.id;
  const [likes, setLikes] = useState(c.likeCount);
  const [liked, setLiked] = useState(false);

  async function toggleLike() {
    if (liked) return;
    setLiked(true);
    setLikes((n) => n + 1);
    try {
      const res = await fetch(`/api/comments/${c.id}/like`, { method: 'POST' });
      const j = (await res.json().catch(() => ({}))) as { likeCount?: number; throttled?: boolean };
      if (typeof j.likeCount === 'number') setLikes(j.likeCount);
      if (j.throttled) {
        // Already liked from this IP — keep optimistic UI but revert count to server.
      }
    } catch {
      // ignore
    }
  }

  return (
    <article
      className="border-b border-neutral-100 pb-6 last:border-0 dark:border-neutral-800"
      style={depth > 0 ? { marginLeft: Math.min(depth, 3) * 20, paddingLeft: 14, borderLeft: '2px solid rgba(127,127,127,0.18)' } : undefined}
    >
      <div className="mb-1 flex items-baseline gap-3">
        <b className="text-sm">{c.authorName ?? 'Аноним'}</b>
        <time className="text-xs text-neutral-500" dateTime={(typeof c.createdAt === 'string' ? new Date(c.createdAt) : c.createdAt).toISOString()}>
          {date}
        </time>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
        {c.body}
      </p>
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setReplyOpenId(open ? null : c.id)}
          className="text-xs font-medium text-brand-700 hover:underline"
        >
          ↳ {REPLY_LABEL[locale]}
        </button>
        <button
          type="button"
          onClick={toggleLike}
          disabled={liked}
          aria-label={LIKE_LABEL[locale]}
          className={`text-xs font-medium ${liked ? 'text-brand-700' : 'text-neutral-500 hover:text-brand-700'}`}
        >
          {liked ? '♥' : '♡'} {likes > 0 ? likes : ''}
        </button>
      </div>
      {open ? (
        <div className="mt-3">
          <CommentForm
            postId={postId}
            locale={locale}
            parentId={c.id}
            parentAuthor={c.authorName}
            onCancel={() => setReplyOpenId(null)}
            compact
          />
        </div>
      ) : null}
      {c.replies.length > 0 ? (
        <div className="mt-4 space-y-4">
          {c.replies.map((r) => (
            <CommentNode
              key={r.id}
              c={r}
              postId={postId}
              locale={locale}
              depth={depth + 1}
              replyOpenId={replyOpenId}
              setReplyOpenId={setReplyOpenId}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function CommentsThread({
  postId,
  locale,
  comments,
  emptyLabel,
}: {
  postId: number;
  locale: Locale;
  comments: ThreadedComment[];
  emptyLabel: string;
}) {
  const [replyOpenId, setReplyOpenId] = useState<number | null>(null);

  return (
    <>
      <CommentForm postId={postId} locale={locale} />
      {comments.length > 0 ? (
        <div className="mt-8 space-y-6">
          {comments.map((c) => (
            <CommentNode
              key={c.id}
              c={c}
              postId={postId}
              locale={locale}
              depth={0}
              replyOpenId={replyOpenId}
              setReplyOpenId={setReplyOpenId}
            />
          ))}
        </div>
      ) : (
        <p className="mt-6 text-sm text-neutral-500">{emptyLabel}</p>
      )}
    </>
  );
}
