import { StaticPageForm } from '../_form';
import { createStaticPage } from '../../_actions/static';

export const dynamic = 'force-dynamic';

export default function NewStaticPage() {
  return (
    <StaticPageForm
      page={{
        id: null,
        locale: 'uz',
        slug: '',
        title: '',
        description: '',
        body: '',
        metaTitle: '',
        metaDescription: '',
        sortOrder: 0,
        showInFooter: 1,
      }}
      action={createStaticPage}
    />
  );
}
