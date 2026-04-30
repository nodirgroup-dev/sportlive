import { BannerForm } from '../_form';
import { createBanner } from '../../_actions/banners';

export const dynamic = 'force-dynamic';

export default function NewBannerPage() {
  return (
    <BannerForm
      banner={{
        id: null,
        name: '',
        position: 'sidebar',
        imageUrl: '',
        linkUrl: '',
        altText: '',
        htmlSnippet: '',
        sortOrder: 0,
        active: true,
      }}
      action={createBanner}
    />
  );
}
