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
  replies: ThreadedComment[];
};

const REPLY_LABEL: Record<Locale, string> = {
  uz: 'Javob berish',
  ru: 'Ответить',
  en: 'Reply',
};

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
      <button
        type="button"
        onClick={() => setReplyOpenId(open ? null : c.id)}
        className="mt-2 text-xs font-medium text-brand-700 hover:underline"
      >
        ↳ {REPLY_LABEL[locale]}
      </button>
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
