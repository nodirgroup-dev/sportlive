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
    ],
    formats: ['image/avif', 'image/webp'],
  },
  typedRoutes: true,
  async headers() {
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
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
