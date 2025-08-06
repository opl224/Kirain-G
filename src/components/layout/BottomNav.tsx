
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Home, PlusSquare, Bell, User as UserIcon, Search } from 'lucide-react';

const navItems = [
  {
    href: '/',
    label: 'Beranda',
    Icon: Home,
    storageKey: 'hasNewPosts',
  },
  {
    href: '/search',
    label: 'Cari',
    Icon: Search,
  },
  {
    href: '/post',
    label: 'Post',
    Icon: PlusSquare,
  },
  {
    href: '/notifications',
    label: 'Notifikasi',
    Icon: Bell,
    storageKey: 'hasUnreadNotifications',
  },
  {
    href: '/profile',
    label: 'Profil',
    Icon: UserIcon,
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [indicators, setIndicators] = useState<Record<string, boolean>>({});
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarInitial, setAvatarInitial] = useState('');

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

  useEffect(() => {
    const checkStorage = () => {
      const newIndicators: Record<string, boolean> = {};
      navItems.forEach((item) => {
        if (item.storageKey) {
          const hasNew = localStorage.getItem(item.storageKey) === 'true';
          newIndicators[item.storageKey] = hasNew;
        }
      });
      setIndicators(newIndicators);
    };

    checkStorage();
    window.addEventListener('storageUpdated', checkStorage);
    window.addEventListener('storage', checkStorage);

    return () => {
      window.removeEventListener('storageUpdated', checkStorage);
      window.removeEventListener('storage', checkStorage);
    };
  }, []);

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t md:hidden z-50">
      <nav className="h-full">
        <ul className="h-full grid grid-cols-5">
          {navItems.map((item) => {
            const isActive =
              (item.href === '/' && pathname === '/') ||
              (item.href !== '/' && pathname.startsWith(item.href));
              
            const showIndicator = item.storageKey
              ? indicators[item.storageKey]
              : false;

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
                      <Avatar
                        className={cn(
                          'w-7 h-7',
                          isActive && 'ring-2 ring-primary'
                        )}
                      >
                        <AvatarImage src={avatarUrl ?? undefined} alt="User Avatar" />
                        <AvatarFallback>{avatarInitial}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <item.Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
                    )}
                    {showIndicator && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-2.5 w-2.5 p-0 border-2 border-card"
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
