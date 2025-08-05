
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const navItems = [
  {
    href: '/',
    icon: 'home',
    label: 'Home',
  },
  {
    href: '/post',
    icon: 'add',
    label: 'Post',
  },
  {
    href: '/notifications',
    icon: 'bell',
    label: 'Notifications',
  },
  {
    href: '/profile',
    icon: 'profile',
    label: 'Profile',
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

            const iconSrc = `/icons/${item.icon}${isActive ? '-fill' : ''}.svg`;

            return (
              <li key={item.href} className="h-full">
                <Link
                  href={item.href}
                  className={cn(
                    'h-full flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-primary',
                    isActive && 'text-primary'
                  )}
                >
                  <div className="relative w-6 h-6">
                    <Image
                      src={iconSrc}
                      alt={item.label}
                      fill
                      className="transition-transform duration-200"
                    />
                  </div>
                  {/* The text label is hidden for a cleaner look, but can be re-enabled by removing sr-only */}
                  <span className="text-xs sr-only">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </footer>
  );
}
