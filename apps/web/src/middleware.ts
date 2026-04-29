import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Match everything except: _next, api, static files, sitemap/robots, uploads
    '/((?!api|_next|_vercel|uploads|favicon|.*\\..*).*)',
  ],
};
