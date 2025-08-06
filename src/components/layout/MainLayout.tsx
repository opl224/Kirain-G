
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
    const notifsQuery = query(
      collection(db, 'notifications'),
      where('recipientId', '==', user.uid),
      where('read', '==', false)
    );

    const unsubscribeNotifs = onSnapshot(notifsQuery, (snapshot) => {
        if (!snapshot.empty) {
            localStorage.setItem('hasUnreadNotifications', 'true');
            window.dispatchEvent(new Event('storageUpdated'));
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
        // We only care if there are new documents. We don't want to trigger on our own new posts
        // immediately after posting, so we check against last seen timestamp.
        if (!snapshot.empty && snapshot.docs[0].data().createdAt.toMillis() > lastSeenTimestamp) {
            // No need to check for authorId, any new post should trigger the indicator
            localStorage.setItem('hasNewPosts', 'true');
            window.dispatchEvent(new Event('storageUpdated'));
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
