'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  {
    href: '/',
    label: 'プロジェクト',
    icon: '📋',
    match: (p: string) => p === '/' || p.startsWith('/board') || p.startsWith('/settings'),
  },
  {
    href: '/minutes',
    label: '議事録',
    icon: '📝',
    match: (p: string) => p.startsWith('/minutes'),
  },
  {
    href: '/schedule',
    label: '年間予定',
    icon: '📅',
    match: (p: string) => p.startsWith('/schedule'),
  },
];

export default function PageNav() {
  const pathname = usePathname();
  if (pathname === '/admin') return null;

  return (
    <nav className="bg-white border-b border-gray-200 flex shrink-0 sticky top-0 z-30">
      {ITEMS.map(item => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
              active
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
