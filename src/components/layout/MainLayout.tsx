
'use client';

import { useAuth } from '@/hooks/useAuth';
import BottomNav from './BottomNav';
import PageLoader from '../PageLoader';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const showNav = !isLoading && user;

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="relative flex flex-col min-h-full">
      <main className="flex-grow pb-16 md:pb-0">{children}</main>
      {showNav && <BottomNav />}
    </div>
  );
}
