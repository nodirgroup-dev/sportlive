import { notFound } from 'next/navigation';
import { db, posts, categories } from '@sportlive/db';
import { eq } from 'drizzle-orm';
import { CheckCircle2 } from 'lucide-react';
import { NewsForm } from '../../_form';
import { updatePost } from '../../../_actions/posts';
import { getTagsForPost, getAllTagNames } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function EditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; push?: string }>;
}) {
  const { id: idStr } = await params;
  const sp = await searchParams;
  const id = parseInt(idStr, 10);
  if (!Number.isFinite(id)) notFound();

  const rows = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (rows.length === 0) notFound();
  const p = rows[0]!;
  const [tags, allTagNames, cats] = await Promise.all([
    getTagsForPost(p.id),
    getAllTagNames(p.locale as 'uz' | 'ru' | 'en'),
    db
      .select({ id: categories.id, name: categories.name, slug: categories.slug })
      .from(categories)
      .where(eq(categories.locale, p.locale as 'uz' | 'ru' | 'en')),
  ]);

  const action = updatePost.bind(null, id);

  return (
    <>
      {sp.saved ? (
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.3)',
            color: '#86efac',
            marginBottom: 14,
            fontSize: 12.5,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <CheckCircle2 size={14} strokeWidth={1.8} />
          <span>
            Сохранено
            {sp.push ? (
              <>
                {' '}
                · push отправлено <b>{sp.push}</b>
              </>
            ) : null}
          </span>
        </div>
      ) : null}
      <NewsForm
        post={{
          id: p.id,
          locale: p.locale as 'uz' | 'ru' | 'en',
          title: p.title,
          slug: p.slug,
          summary: p.summary,
          body: p.body,
          categoryId: p.categoryId,
          status: p.status as 'draft' | 'scheduled' | 'published' | 'archived',
          coverImage: p.coverImage,
          featured: p.featuredAt !== null,
          tags: tags.map((t) => t.name).join(', '),
          allTagNames,
          publishedAt: p.publishedAt ? p.publishedAt.toISOString().slice(0, 16) : null,
        }}
        action={action}
        cats={cats}
      />
    </>
  );
}
