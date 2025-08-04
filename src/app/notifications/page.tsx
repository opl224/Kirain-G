import { Bell } from 'lucide-react';
import { notifications } from '@/lib/data';
import { NotificationCard } from '@/components/NotificationCard';

export default function NotificationsPage() {
  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <Bell className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">Notifications</h1>
      </div>

      <div className="space-y-4">
        {notifications.map((notification) => (
          <NotificationCard key={notification.id} notification={notification} />
        ))}
      </div>
    </div>
  );
}
