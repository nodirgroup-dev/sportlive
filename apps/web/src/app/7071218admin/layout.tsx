import type { ReactNode } from 'react';
import './admin.css';

// Admin shell — separate root with its own dark design system, isolated from the
// public Next.js app. Auth gating lives in (auth)/layout.tsx.
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" data-admin>
      <body>{children}</body>
    </html>
  );
}

export const metadata = {
  title: 'Sportlive Admin',
  robots: { index: false, follow: false },
};
