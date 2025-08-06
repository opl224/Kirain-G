
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

    // --- Listener for new notifications (likes, follows, etc.) ---
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
    const postsQuery = query(
        collection(db, "posts"), 
        where("createdAt", ">", Timestamp.fromMillis(lastSeenTimestamp))
    );

    const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
        // We only care about newly added documents, not modifications (like likes)
        const newPosts = snapshot.docChanges()
            .filter(change => change.type === 'added')
            .map(change => change.doc.data());

        if (newPosts.length > 0) {
            // Check if any of the new posts are not from the current user
            const hasNewPostsFromOthers = newPosts.some(post => post.authorId !== user.uid);
            if (hasNewPostsFromOthers) {
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
