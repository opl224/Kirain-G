'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

const navItems = [
  {
    href: '/',
    label: 'Beranda',
    icon: 'home',
    storageKey: 'hasNewPosts',
  },
  {
    href: '/post',
    label: 'Post',
    icon: 'plus-square',
  },
  {
    href: '/notifications',
    label: 'Notifikasi',
    icon: 'bell',
    storageKey: 'hasUnreadNotifications',
  },
  {
    href: '/profile',
    label: 'Profil',
    icon: 'user',
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [indicators, setIndicators] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Function to check storage and update indicators
    const checkStorage = () => {
        const newIndicators: Record<string, boolean> = {};
        navItems.forEach(item => {
            if (item.storageKey) {
                const hasNew = localStorage.getItem(item.storageKey) === 'true';
                newIndicators[item.storageKey] = hasNew;
            }
        });
        setIndicators(newIndicators);
    };

    // Initial check
    checkStorage();

    // Listen for custom events that signal a change in indicators
    window.addEventListener('storageUpdated', checkStorage);

    // Also use the browser's native storage event for cross-tab sync
    window.addEventListener('storage', checkStorage);

    return () => {
      window.removeEventListener('storageUpdated', checkStorage);
      window.removeEventListener('storage', checkStorage);
    };
  }, []);

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t md:hidden z-50">
      <nav className="h-full">
        <ul className="h-full grid grid-cols-4">
          {navItems.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            const iconSrc = `/icons/${item.icon}${isActive ? '-active' : ''}.svg`;
            const showIndicator = item.storageKey ? indicators[item.storageKey] : false;

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
                    {showIndicator && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 h-2.5 w-2.5 p-0 border-2 border-card" />
                    )}
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
