'use client';

import Link from 'next/link';
import { Pin, Bell, Sparkles, History } from 'lucide-react';
import { RichEditor } from '../_components/rich-editor';
import { CoverUpload } from '../_components/cover-upload';
import { NewsAiPanel } from '../_components/news-form-side';
import { useAdminLang, ADMIN_T } from '../../_lang';

type FormPost = {
  id: number | null;
  locale: 'uz' | 'ru' | 'en';
  title: string;
  slug: string;
  summary: string | null;
  body: string;
  categoryId: number | null;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  coverImage: string | null;
  featured: boolean;
  tags: string;
  /** Names already in tags table for this locale; used as autocomplete datalist. */
  allTagNames: string[];
  /** ISO datetime-local string for status=scheduled. */
  publishedAt: string | null;
};

export function NewsForm({
  post,
  action,
  cats,
}: {
  post: FormPost;
  action: (formData: FormData) => Promise<void>;
  cats: Array<{ id: number; name: string; slug: string }>;
}) {
  const lang = useAdminLang();
  const t = ADMIN_T[lang];
  const editTitle =
    lang === 'uz' ? 'Maqolani tahrirlash' : lang === 'en' ? 'Edit article' : 'Редактирование статьи';
  const newTitle =
    lang === 'uz' ? 'Yangi maqola' : lang === 'en' ? 'New article' : 'Новая статья';
  const newSub =
    lang === 'uz' ? 'Yangi nashr yaratish' : lang === 'en' ? 'Creating a new publication' : 'Создание новой публикации';

  return (
    <form action={action}>
      <div className="page-h">
        <div>
          <h1>{post.id ? editTitle : newTitle}</h1>
          <div className="sub">
            {post.id ? `ID #${post.id}` : newSub} · {t.language}:{' '}
            <span className={`pill ${post.locale === 'uz' ? 'green' : post.locale === 'ru' ? 'red' : 'yellow'}`}>
              {post.locale}
            </span>
          </div>
        </div>
        <div className="actions">
          {post.id ? (
            <Link
              href={`/7071218admin/news/${post.id}/revisions`}
              className="btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <History size={14} strokeWidth={1.8} />
              {t.news_history_btn}
            </Link>
          ) : null}
          <Link href="/7071218admin/news" className="btn">
            {t.cancel}
          </Link>
          <button type="submit" className="btn primary">
            {post.id ? t.news_save_btn : t.news_create_btn}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--gap)' }}>
        <div className="card" style={{ padding: 22 }}>
          <div className="field">
            <label htmlFor="title">{t.news_title_label}</label>
            <input
              id="title"
              name="title"
              type="text"
              required
              defaultValue={post.title}
              className="input"
              maxLength={300}
            />
          </div>
          <div className="field">
            <label htmlFor="slug">{t.news_slug_label}</label>
            <input id="slug" name="slug" type="text" defaultValue={post.slug} className="input" maxLength={200} />
          </div>
          <div className="field">
            <label htmlFor="summary">{t.news_summary_label}</label>
            <textarea
              id="summary"
              name="summary"
              defaultValue={post.summary ?? ''}
              className="textarea"
              style={{ minHeight: 80 }}
            />
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
              {t.news_summary_hint}
            </div>
          </div>
          <div className="field">
            <label htmlFor="tags">{t.news_tags_label}</label>
            <input
              id="tags"
              name="tags"
              type="text"
              defaultValue={post.tags}
              placeholder="Real Madrid, Champions League, transfers"
              className="input"
              maxLength={500}
              list="tag-suggestions"
            />
            {post.allTagNames.length > 0 ? (
              <datalist id="tag-suggestions">
                {post.allTagNames.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            ) : null}
          </div>
          <div className="field">
            <label>{t.news_body_label}</label>
            <RichEditor name="body" defaultValue={post.body} placeholder="…" />
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
              💡 {t.news_shortcodes_hint}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
              ♿ {t.news_alt_hint}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
          <div className="card" style={{ padding: 16 }}>
            <div className="field">
              <label>{t.news_status_label}</label>
              <select name="status" defaultValue={post.status} className="select">
                <option value="draft">{t.status_draft}</option>
                <option value="scheduled">{t.status_scheduled}</option>
                <option value="published">{t.status_published}</option>
                <option value="archived">{t.status_archived}</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="publishedAt">{t.news_publishedAt_label}</label>
              <input
                id="publishedAt"
                name="publishedAt"
                type="datetime-local"
                defaultValue={post.publishedAt ?? ''}
                className="input"
              />
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                {t.news_publishedAt_hint}
              </div>
            </div>
            <div className="field">
              <label>{t.news_locale_label}</label>
              <select name="locale" defaultValue={post.locale} className="select" disabled={post.id != null}>
                <option value="uz">{lang === 'uz' ? 'O‘zbek' : lang === 'en' ? 'Uzbek' : 'Узбекский'}</option>
                <option value="ru">{lang === 'uz' ? 'Rus' : lang === 'en' ? 'Russian' : 'Русский'}</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="field">
              <label>{t.news_category_label}</label>
              <select name="categoryId" defaultValue={post.categoryId ?? ''} className="select">
                <option value="">— —</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>{t.news_cover_label}</label>
              <CoverUpload name="coverImage" defaultValue={post.coverImage} />
            </div>
            <div className="field">
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  marginTop: 4,
                }}
              >
                <input type="checkbox" name="featured" value="1" defaultChecked={post.featured} />
                <Pin size={14} strokeWidth={1.8} />
                <span>{t.news_featured_label}</span>
              </label>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, paddingLeft: 22 }}>
                {t.news_featured_hint}
              </div>
            </div>
            <div className="field">
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  marginTop: 4,
                }}
              >
                <input type="checkbox" name="sendPush" value="1" />
                <Bell size={14} strokeWidth={1.8} />
                <span>{t.news_sendpush_label}</span>
              </label>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, paddingLeft: 22 }}>
                {t.news_sendpush_hint}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <h3
              style={{
                margin: '0 0 10px',
                fontSize: 11.5,
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--text-3)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Sparkles size={13} strokeWidth={1.8} />
              AI-помощник
            </h3>
            <NewsAiPanel postId={post.id} locale={post.locale} />
          </div>
        </div>
      </div>
    </form>
  );
}
