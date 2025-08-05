
'use client';

import { Bell, Loader2 } from 'lucide-react';
import { NotificationCard } from '@/components/NotificationCard';
import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs, writeBatch, limit, startAfter, type QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import type { Notification } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const NOTIFICATIONS_PER_PAGE = 10;

export default function NotificationsPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);


  // Clear notification indicator on page visit
  useEffect(() => {
    if (user) {
        localStorage.setItem('hasUnreadNotifications', 'false');
        window.dispatchEvent(new Event('storageUpdated'));
    }
  }, [user]);

  const fetchNotifications = async (initialLoad = false) => {
      if (!user) return;
      
      if (initialLoad) {
          setIsLoading(true);
      } else {
          setIsFetchingMore(true);
      }

      try {
          const notificationsCollection = collection(db, 'notifications');
          let q = query(
              notificationsCollection,
              where('recipientId', '==', user.uid),
              orderBy('createdAt', 'desc'),
              limit(NOTIFICATIONS_PER_PAGE)
          );
          
          if (!initialLoad && lastVisible) {
              q = query(q, startAfter(lastVisible));
          }

          const querySnapshot = await getDocs(q);
          const newNotifications: Notification[] = [];
          const batch = writeBatch(db);
          
          querySnapshot.forEach(doc => {
              const notification = { id: doc.id, ...doc.data() } as Notification;
              newNotifications.push(notification);
              // Mark unread notifications as read
              if (initialLoad && !notification.read) {
                  const notifRef = doc.ref;
                  batch.update(notifRef, { read: true });
              }
          });
          
          setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1] || null);
          setHasMore(querySnapshot.docs.length === NOTIFICATIONS_PER_PAGE);

          if (initialLoad) {
              setNotifications(newNotifications);
              // After clearing, make sure the indicator is off
              localStorage.setItem('hasUnreadNotifications', 'false');
              window.dispatchEvent(new Event('storageUpdated'));
              if (!querySnapshot.empty) {
                  await batch.commit();
              }
          } else {
              setNotifications(prev => [...prev, ...newNotifications]);
          }

      } catch (error) {
          console.error("Error fetching notifications: ", error);
      } finally {
          setIsLoading(false);
          setIsFetchingMore(false);
      }
  };


  useEffect(() => {
    if (user) {
      fetchNotifications(true);
    } else if (!authIsLoading) {
      setIsLoading(false);
    }
  }, [user, authIsLoading]);
  
  const onNotificationUpdate = (notificationId: string, updates: Partial<Notification>) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, ...updates } : n));
  };
  
  const onNotificationRemove = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-3xl font-bold font-headline">Notifikasi</h1>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : notifications.length > 0 ? (
        <>
          <div className="space-y-4">
            {notifications.map((notification) => (
              <NotificationCard 
                key={notification.id} 
                notification={notification}
                onUpdate={onNotificationUpdate}
                onRemove={onNotificationRemove}
                currentUserId={user?.uid}
              />
            ))}
          </div>
          {hasMore && (
            <div className="mt-8 text-center">
              <Button onClick={() => fetchNotifications(false)} disabled={isFetchingMore}>
                {isFetchingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memuat...
                  </>
                ) : (
                  'Muat Lebih Banyak'
                )}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-10">
          <p className="text-muted-foreground">Anda tidak memiliki notifikasi baru.</p>
        </div>
      )}
    </div>
  );
}
