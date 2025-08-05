
'use client';

import { Bell } from 'lucide-react';
import { NotificationCard } from '@/components/NotificationCard';
import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs, writeBatch, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import type { Notification } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function NotificationsPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Clear notification indicator on page visit
  useEffect(() => {
    localStorage.setItem('hasUnreadNotifications', 'false');
    window.dispatchEvent(new Event('storageUpdated'));
  }, []);

  useEffect(() => {
    if (user) {
      // Set up a real-time listener for new notifications
      const notificationsCollection = collection(db, 'notifications');
      const q = query(
        notificationsCollection,
        where('recipientId', '==', user.uid)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const hasUnread = snapshot.docs.some(doc => !doc.data().read);
        if (hasUnread) {
          localStorage.setItem('hasUnreadNotifications', 'true');
          window.dispatchEvent(new Event('storageUpdated'));
        }
      });

      return () => unsubscribe();
    }
  }, [user]);


  useEffect(() => {
    if (user) {
      const fetchAndClearNotifications = async () => {
        setIsLoading(true);
        try {
          const notificationsCollection = collection(db, 'notifications');
          const q = query(
            notificationsCollection,
            where('recipientId', '==', user.uid),
            orderBy('createdAt', 'desc')
          );
          const querySnapshot = await getDocs(q);
          const notificationsData: Notification[] = [];
          const batch = writeBatch(db);
          
          querySnapshot.forEach(doc => {
              const notification = { id: doc.id, ...doc.data() } as Notification;
              notificationsData.push(notification);
              // Mark unread notifications as read
              if (!notification.read) {
                  const notifRef = doc.ref;
                  batch.update(notifRef, { read: true });
              }
          });

          setNotifications(notificationsData);

          // Commit the batch update
          await batch.commit();
          // After clearing, make sure the indicator is off
          localStorage.setItem('hasUnreadNotifications', 'false');
          window.dispatchEvent(new Event('storageUpdated'));

        } catch (error) {
            console.error("Error fetching notifications: ", error);
        } finally {
            setIsLoading(false);
        }
      };
      fetchAndClearNotifications();
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
        <Bell className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">Notifikasi</h1>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : notifications.length > 0 ? (
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
      ) : (
        <div className="text-center py-10">
          <p className="text-muted-foreground">Anda tidak memiliki notifikasi baru.</p>
        </div>
      )}
    </div>
  );
}
