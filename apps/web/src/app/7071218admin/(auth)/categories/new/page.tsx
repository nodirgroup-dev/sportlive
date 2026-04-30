import { CategoryForm } from '../_form';
import { createCategory } from '../../_actions/categories';

export const dynamic = 'force-dynamic';

export default function NewCategoryPage() {
  return (
    <CategoryForm
      cat={{ id: null, locale: 'uz', slug: '', name: '', description: '', parentId: null, sortOrder: 0 }}
      action={createCategory}
    />
  );
}
