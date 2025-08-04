
'use client';

import { Bell } from 'lucide-react';
import { NotificationCard } from '@/components/NotificationCard';
import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import type { Notification } from '@/lib/types';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        setIsLoading(true);
        // This is a placeholder for fetching real notifications for the user
        // In a real app, you would have a 'notifications' collection
        // and query for notifications where `userId === user.uid`
        console.log("Fetching notifications for user:", user.uid);
        
        // Since we don't have a real notifications system, we'll show an empty state.
        setNotifications([]); 
        
        setIsLoading(false);
      };
      fetchNotifications();
    }
  }, [user]);

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <Bell className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">Notifications</h1>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground">Loading notifications...</p>
      ) : notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <NotificationCard key={notification.id} notification={notification} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-muted-foreground">You have no new notifications.</p>
        </div>
      )}
    </div>
  );
}
