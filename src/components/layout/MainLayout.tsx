
'use client';

import { useAuth } from '@/hooks/useAuth';
import BottomNav from './BottomNav';
import PageLoader from '../PageLoader';
import { useEffect } from 'react';
import { collection, onSnapshot, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const showNav = !isLoading && user;

  // Global listeners for new content indicators
  useEffect(() => {
    if (!user) return;

    // --- Listener for new notifications ---
    // This listener just checks for any unread notifications and sets a flag.
    // The logic to show the indicator is handled in the BottomNav component.
    const notifsQuery = query(
      collection(db, 'notifications'),
      where('recipientId', '==', user.uid),
      where('read', '==', false)
    );

    const unsubscribeNotifs = onSnapshot(notifsQuery, (snapshot) => {
        if (!snapshot.empty) {
            localStorage.setItem('hasUnreadNotifications', 'true');
            window.dispatchEvent(new Event('storageUpdated'));
        } else {
            // If there are no unread notifications, ensure the flag is false
            const wasSet = localStorage.getItem('hasUnreadNotifications') === 'true';
            if (wasSet) {
                 localStorage.setItem('hasUnreadNotifications', 'false');
                 window.dispatchEvent(new Event('storageUpdated'));
            }
        }
    });

    // --- Listener for new posts ---
    const lastSeenTimestamp = Number(localStorage.getItem('lastSeenPostTimestamp') || '0');
    // Only query for posts newer than what the user has seen
    const postsQuery = query(
        collection(db, "posts"), 
        orderBy("createdAt", "desc"),
        where("createdAt", ">", Timestamp.fromMillis(lastSeenTimestamp))
    );

    const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
        if (!snapshot.empty) {
            // Check if the newest post is actually newer, to avoid race conditions
            const newestPostTimestamp = snapshot.docs[0].data().createdAt.toMillis();
            if (newestPostTimestamp > lastSeenTimestamp) {
                localStorage.setItem('hasNewPosts', 'true');
                window.dispatchEvent(new Event('storageUpdated'));
            }
        }
    });

    return () => {
      unsubscribeNotifs();
      unsubscribePosts();
    };
  }, [user]);

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
