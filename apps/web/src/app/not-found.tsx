import Link from 'next/link';
import type { Route } from 'next';

export default function NotFound() {
  return (
    <html lang="uz">
      <body className="flex min-h-screen items-center justify-center px-4 text-center">
        <div>
          <h1 className="text-3xl font-bold">404</h1>
          <p className="mt-2 text-neutral-600">Sahifa topilmadi.</p>
          <Link
            href={'/' as Route}
            className="mt-4 inline-block text-blue-600 underline"
          >
            Bosh sahifaga qaytish
          </Link>
        </div>
      </body>
    </html>
  );
}
