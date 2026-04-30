import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Process every path except framework internals, /uploads, and static assets.
    // .html IS processed (legacy DLE URLs end in .html and we 301 them in [...slug]).
    '/((?!api|admin|7071218admin|_next|_vercel|uploads|offline\\.html|sw\\.js|manifest\\.json|favicon\\.|sitemap\\.xml|robots\\.txt|google_news\\.xml|rss\\.xml|.*\\.(?:jpg|jpeg|png|gif|webp|avif|svg|ico|css|js|woff|woff2|ttf|otf|mp4|mp3|webm|m3u8|json|xml|txt|map)$).*)',
  ],
};
