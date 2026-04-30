import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'standalone',
  outputFileTracingRoot: __dirname + '/../../',
  transpilePackages: ['@sportlive/ui', '@sportlive/db'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'sportlive.uz' },
      { protocol: 'https', hostname: 'staging.sportlive.uz' },
      { protocol: 'https', hostname: 'media.api-sports.io' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  // typedRoutes disabled — many dynamic admin paths and i18n-aware Link use a
  // wider URL surface than the static type-checker allows.
  // typedRoutes: true,
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com https://www.googletagmanager.com https://pagead2.googlesyndication.com https://*.adtrafficquality.google",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://cloudflareinsights.com https://*.sentry.io",
      "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://platform.twitter.com https://googleads.g.doubleclick.net",
      "media-src 'self' https:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      'upgrade-insecure-requests',
    ].join('; ');
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
