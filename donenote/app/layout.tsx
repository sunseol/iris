import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';

export const metadata: Metadata = {
  title: 'DoneNote',
  description: 'Turn messy notes into action items.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-zinc-950 text-zinc-100">
          <header className="border-b border-zinc-800">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <Link href="/" className="text-lg font-semibold">DoneNote</Link>
              <nav className="flex gap-4 text-sm text-zinc-300">
                <Link href="/dashboard">Dashboard</Link>
                <Link href="/new">New Analysis</Link>
              </nav>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
