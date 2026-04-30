import { notFound } from 'next/navigation';
import { db, posts } from '@sportlive/db';
import { eq } from 'drizzle-orm';
import { NewsForm } from '../../_form';
import { updatePost } from '../../../_actions/posts';
import { getTagsForPost } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (!Number.isFinite(id)) notFound();

  const rows = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (rows.length === 0) notFound();
  const p = rows[0]!;
  const tags = await getTagsForPost(p.id);

  const action = updatePost.bind(null, id);

  return (
    <NewsForm
      post={{
        id: p.id,
        locale: p.locale as 'uz' | 'ru' | 'en',
        title: p.title,
        slug: p.slug,
        summary: p.summary,
        body: p.body,
        categoryId: p.categoryId,
        status: p.status as 'draft' | 'published' | 'archived',
        coverImage: p.coverImage,
        featured: p.featuredAt !== null,
        tags: tags.map((t) => t.name).join(', '),
      }}
      action={action}
    />
  );
}
