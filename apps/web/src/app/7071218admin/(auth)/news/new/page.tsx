import { NewsForm } from '../_form';
import { createPost } from '../../_actions/posts';

export const dynamic = 'force-dynamic';

export default function NewPostPage() {
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
      }}
      action={createPost}
    />
  );
}
