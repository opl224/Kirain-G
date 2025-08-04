
'use client';

import { useAuth } from '@/hooks/useAuth';
import BottomNav from './BottomNav';
import { Loader } from 'lucide-react';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const showNav = !isLoading && user;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col min-h-full">
      <main className="flex-grow pb-16 md:pb-0">{children}</main>
      {showNav && <BottomNav />}
    </div>
  );
}
