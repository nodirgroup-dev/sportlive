import Image from 'next/image';
import { getActiveBanners } from '@/lib/db';

type Position = 'header' | 'sidebar' | 'in_article_top' | 'in_article_bottom' | 'footer';

export async function BannerSlot({ position }: { position: Position }) {
  const list = await getActiveBanners(position).catch(() => []);
  if (list.length === 0) return null;

  return (
    <div className="banner-slot" data-position={position} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {list.map((b) => {
        if (b.htmlSnippet) {
          return (
            <div
              key={b.id}
              className="banner banner--html"
              dangerouslySetInnerHTML={{ __html: b.htmlSnippet }}
            />
          );
        }
        const img = (
          <Image
            src={b.imageUrl}
            alt={b.altText ?? ''}
            width={position === 'sidebar' ? 300 : 728}
            height={position === 'sidebar' ? 250 : 90}
            className="rounded-md object-cover"
            unoptimized
            sizes={position === 'sidebar' ? '300px' : '(max-width: 768px) 100vw, 728px'}
          />
        );
        return b.linkUrl ? (
          <a
            key={b.id}
            href={b.linkUrl}
            target="_blank"
            rel="noopener sponsored noreferrer"
            className="block"
            aria-label={b.altText ?? 'Реклама'}
          >
            {img}
          </a>
        ) : (
          <div key={b.id}>{img}</div>
        );
      })}
    </div>
  );
}
