
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useTheme } from 'next-themes';
import Image from 'next/image';

const navItems = [
  { href: '/', label: 'Beranda', icon: 'home' },
  { href: '/search', label: 'Cari', icon: 'search' },
  { href: '/post', label: 'Post', icon: 'post' },
  { href: '/notifications', label: 'Notifikasi', icon: 'bell' },
  { href: '/profile', label: 'Profil', icon: 'user' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarInitial, setAvatarInitial] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      const fetchAvatar = async () => {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setAvatarUrl(userData.avatarUrl);
          setAvatarInitial(userData.name?.charAt(0) || '');
        }
      };
      fetchAvatar();
    }
  }, [user]);

  const iconDir = theme === 'dark' ? 'white' : 'dark';

  if (!isMounted) {
    // Render a placeholder or null to avoid hydration mismatch
    return <footer className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t md:hidden z-50"></footer>;
  }

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t md:hidden z-50">
      <nav className="h-full">
        <ul className="h-full grid grid-cols-5">
          {navItems.map((item) => {
            const isActive =
              (item.href === '/' && pathname === '/') ||
              (item.href !== '/' && pathname.startsWith(item.href));

            const iconSrc = `/icons-${iconDir}/${item.icon}${isActive ? '-fill' : ''}.svg`;

            return (
              <li key={item.href} className="h-full">
                <Link
                  href={item.href}
                  className={cn(
                    'h-full flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-primary',
                    isActive && 'text-primary'
                  )}
                >
                  <div className="relative w-7 h-7 flex items-center justify-center">
                    {item.href === '/profile' && user ? (
                      <Avatar className={cn('w-7 h-7', isActive && 'ring-2 ring-primary')}>
                        <AvatarImage src={avatarUrl ?? undefined} alt="User Avatar" />
                        <AvatarFallback>{avatarInitial}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <Image
                        src={iconSrc}
                        alt={item.label}
                        width={26}
                        height={26}
                        className="transition-transform duration-200"
                        unoptimized
                      />
                    )}
                  </div>
                   <span className="text-[10px] sr-only">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </footer>
  );
}
