import { getApprovedComments } from '@/lib/db';
import { CommentForm } from './comment-form';
import type { Locale } from '@/i18n/routing';

const LABELS: Record<Locale, { title: string; empty: string; recent: string }> = {
  uz: { title: 'Izohlar', empty: "Bu maqolaga hali izoh yo'q", recent: "So'nggi izohlar" },
  ru: { title: 'Комментарии', empty: 'Пока нет комментариев', recent: 'Последние комментарии' },
  en: { title: 'Comments', empty: 'No comments yet', recent: 'Recent comments' },
};

export async function CommentsSection({ postId, locale }: { postId: number; locale: Locale }) {
  const list = await getApprovedComments(postId);
  const t = LABELS[locale];

  return (
    <section className="mt-10 border-t border-neutral-200 pt-8 dark:border-neutral-800">
      <h2 className="mb-4 text-xl font-bold tracking-tight">
        {t.title} {list.length > 0 ? <span className="ml-1 text-neutral-500">{list.length}</span> : null}
      </h2>
      <CommentForm postId={postId} locale={locale} />

      {list.length > 0 ? (
        <div className="mt-8 space-y-6">
          {list.map((c) => (
            <article key={c.id} className="border-b border-neutral-100 pb-6 last:border-0 dark:border-neutral-800">
              <div className="mb-1 flex items-baseline gap-3">
                <b className="text-sm">{c.authorName ?? 'Аноним'}</b>
                <time className="text-xs text-neutral-500" dateTime={c.createdAt.toISOString()}>
                  {new Intl.DateTimeFormat(
                    locale === 'uz' ? 'uz-UZ' : locale === 'ru' ? 'ru-RU' : 'en-US',
                    { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' },
                  ).format(c.createdAt)}
                </time>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                {c.body}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-6 text-sm text-neutral-500">{t.empty}</p>
      )}
    </section>
  );
}
