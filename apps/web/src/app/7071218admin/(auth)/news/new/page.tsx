import { NewsForm } from '../_form';
import { createPost } from '../../_actions/posts';
import { getAllTagNames } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function NewPostPage() {
  const allTagNames = await getAllTagNames('uz');
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
    />
  );
}
