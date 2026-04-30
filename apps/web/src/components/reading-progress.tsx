'use client';

import { useEffect, useState } from 'react';

export function ReadingProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;
      if (total <= 0) {
        setPct(0);
        return;
      }
      const value = Math.min(100, Math.max(0, (window.scrollY / total) * 100));
      setPct(value);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', update);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="fixed left-0 right-0 top-0 z-40 h-0.5 origin-left bg-brand-700 transition-transform"
      style={{ transform: `scaleX(${pct / 100})` }}
    />
  );
}
