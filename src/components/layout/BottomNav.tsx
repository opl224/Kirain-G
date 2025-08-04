'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, PlusSquare, Bell, User } from 'lucide-react';

const navItems = [
  {
    href: '/',
    label: 'Beranda',
    icon: Home,
  },
  {
    href: '/post',
    label: 'Post',
    icon: PlusSquare,
  },
  {
    href: '/notifications',
    label: 'Notifikasi',
    icon: Bell,
  },
  {
    href: '/profile',
    label: 'Profil',
    icon: User,
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t md:hidden z-50">
      <nav className="h-full">
        <ul className="h-full grid grid-cols-4">
          {navItems.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            const Icon = item.icon;

            return (
              <li key={item.href} className="h-full">
                <Link
                  href={item.href}
                  className={cn(
                    'h-full flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-primary',
                    isActive && 'text-primary'
                  )}
                  aria-label={item.label}
                >
                  <Icon
                    className="h-6 w-6"
                    fill={isActive ? 'currentColor' : 'none'}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </footer>
  );
}
