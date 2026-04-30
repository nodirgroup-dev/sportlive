'use client';

import { useEffect } from 'react';

export function ArticleTracker({ postId }: { postId: number }) {
  useEffect(() => {
    // Don't double-count refreshes within 30 minutes.
    const key = `viewed:${postId}`;
    try {
      const last = sessionStorage.getItem(key);
      const now = Date.now();
      if (last && now - Number(last) < 30 * 60 * 1000) return;
      sessionStorage.setItem(key, String(now));
    } catch {
      /* ignore */
    }
    // Fire-and-forget; if it fails, no big deal.
    fetch(`/api/posts/${postId}/view`, { method: 'POST', cache: 'no-store' }).catch(() => {});
  }, [postId]);
  return null;
}
