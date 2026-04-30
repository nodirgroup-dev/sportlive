import { db, categories } from '@sportlive/db';
import { eq } from 'drizzle-orm';
import { NewsForm } from '../_form';
import { createPost } from '../../_actions/posts';
import { getAllTagNames } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function NewPostPage() {
  const [allTagNames, cats] = await Promise.all([
    getAllTagNames('uz'),
    db
      .select({ id: categories.id, name: categories.name, slug: categories.slug })
      .from(categories)
      .where(eq(categories.locale, 'uz')),
  ]);
  return (
    <NewsForm
      post={{
        id: null,
        locale: 'uz',
        title: '',
        slug: '',
        summary: '',
        body: '',
        categoryId: null,
        status: 'draft',
        coverImage: '',
        featured: false,
        tags: '',
        allTagNames,
        publishedAt: null,
      }}
      action={createPost}
      cats={cats}
    />
  );
}
