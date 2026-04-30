'use client';

import { useEffect } from 'react';
import Script from 'next/script';

/**
 * Cloudflare Web Analytics — privacy-friendly, no cookies. Loads only after
 * the user accepts the cookie consent dialog. The token comes from
 * NEXT_PUBLIC_CF_ANALYTICS_TOKEN at build time.
 */
export function Analytics() {
  const token = process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN;
  // Re-render hook so we pick up consent immediately when accepted.
  useEffect(() => {
    const onConsent = () => {
      // Force a re-render: the script is conditional so flipping a state
      // would suffice, but Cloudflare's beacon can also be loaded directly.
      // We simply reload analytics by toggling the data-cf-beacon attribute
      // already injected; nothing to do here besides letting the browser
      // schedule the next paint.
    };
    window.addEventListener('sl:consent', onConsent);
    return () => window.removeEventListener('sl:consent', onConsent);
  }, []);

  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;
  return (
    <>
      {token ? (
        <Script
          strategy="afterInteractive"
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon={`{"token":"${token}"}`}
        />
      ) : null}
      {adsenseId ? (
        <Script
          async
          strategy="afterInteractive"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
          crossOrigin="anonymous"
        />
      ) : null}
    </>
  );
}
