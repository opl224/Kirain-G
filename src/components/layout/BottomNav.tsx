'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Home, PlusSquare, Bell, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { 
    href: '/', 
    label: 'Beranda',
    activeIcon: () => <Image src="/icons/house.png" alt="Beranda" width={24} height={24} />,
    inactiveIcon: Home 
  },
  { 
    href: '/post', 
    label: 'Post',
    activeIcon: () => <Image src="/icons/add.png" alt="Post" width={24} height={24} />,
    inactiveIcon: PlusSquare
  },
  { 
    href: '/notifications', 
    label: 'Notifikasi',
    activeIcon: Bell,
    inactiveIcon: Bell 
  },
  { 
    href: '/profile', 
    label: 'Profil',
    activeIcon: User,
    inactiveIcon: User
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
            
            const IconComponent = isActive ? item.activeIcon : item.inactiveIcon;

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
                    fill={isActive && (item.href === '/notifications' || item.href === '/profile') ? 'currentColor' : 'none'}
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
