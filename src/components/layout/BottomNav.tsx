'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusSquare, Bell, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { 
    href: '/', 
    label: 'Beranda',
    Icon: Home 
  },
  { 
    href: '/post', 
    label: 'Post',
    Icon: PlusSquare
  },
  { 
    href: '/notifications', 
    label: 'Notifikasi',
    Icon: Bell 
  },
  { 
    href: '/profile', 
    label: 'Profil',
    Icon: User
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t md:hidden">
      <nav className="h-full">
        <ul className="h-full grid grid-cols-4">
          {navItems.map((item) => {
            const isActive =
              item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            
            const IconComponent = item.Icon;

            return (
              <li key={item.href} className="h-full">
                <Link
                  href={item.href}
                  className={cn(
                    'h-full flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-primary',
                    isActive && 'text-primary'
                  )}
                >
                  <IconComponent
                    className="w-6 h-6"
                    fill={isActive ? 'currentColor' : 'none'}
                  />
                  <span className="text-xs">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </footer>
  );
}
