'use client';

import Link from 'next/link';
import { Pin, PinOff, Eye, EyeOff, Copy, Pencil } from 'lucide-react';
import { useAdminLang, ADMIN_T } from '../../_lang';
import { togglePostFeature, togglePostStatus, duplicatePost } from '../_actions/posts';

/**
 * Tiny pin badge shown next to titles for pinned (featured) posts. Pulled out
 * into its own component so the tooltip translates with the editor language.
 */
export function PinnedMark() {
  const lang = useAdminLang();
  const t = ADMIN_T[lang];
  return (
    <span
      title={t.news_pinned_homepage_title}
      style={{
        marginRight: 6,
        color: 'var(--accent)',
        verticalAlign: '-2px',
        display: 'inline-flex',
      }}
    >
      <Pin size={13} strokeWidth={2} />
    </span>
  );
}

/**
 * Per-row action cluster for the news list. Issues form-bound submits against
 * the post-bulk server actions; only the labels need a client boundary.
 */
export function NewsRowActions({
  id,
  status,
  featured,
}: {
  id: number;
  status: string;
  featured: boolean;
}) {
  const lang = useAdminLang();
  const t = ADMIN_T[lang];
  const isPublished = status === 'published';

  return (
    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
      <button
        type="submit"
        formAction={togglePostStatus}
        name="id"
        value={id}
        title={isPublished ? t.news_unpublish_action : t.news_publish_action}
        className="btn"
        style={{
          height: 28,
          width: 28,
          padding: 0,
          marginRight: 4,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isPublished ? 1 : 0.5,
        }}
      >
        {isPublished ? <Eye size={14} strokeWidth={1.8} /> : <EyeOff size={14} strokeWidth={1.8} />}
      </button>
      <button
        type="submit"
        formAction={togglePostFeature}
        name="id"
        value={id}
        title={featured ? t.news_unpin_homepage : t.news_pin_homepage}
        className="btn"
        style={{
          height: 28,
          width: 28,
          padding: 0,
          marginRight: 6,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: featured ? 1 : 0.5,
        }}
      >
        {featured ? <Pin size={14} strokeWidth={1.8} /> : <PinOff size={14} strokeWidth={1.8} />}
      </button>
      <button
        type="submit"
        formAction={duplicatePost}
        name="id"
        value={id}
        title={t.news_duplicate}
        className="btn"
        style={{
          height: 28,
          width: 28,
          padding: 0,
          marginRight: 4,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Copy size={14} strokeWidth={1.8} />
      </button>
      <Link
        href={`/7071218admin/news/${id}/edit`}
        className="btn"
        style={{ height: 28, fontSize: 11.5, display: 'inline-flex', alignItems: 'center', gap: 6 }}
      >
        <Pencil size={12} strokeWidth={1.8} />
        {t.edit}
      </Link>
    </td>
  );
}
