import type { Notification } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Heart, UserPlus } from 'lucide-react';

export function NotificationCard({
  notification,
}: {
  notification: Notification;
}) {
  const getIcon = () => {
    switch (notification.type) {
      case 'like':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'follow':
        return <UserPlus className="h-5 w-5 text-primary" />;
      default:
        return null;
    }
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="relative">
           <Avatar>
            <AvatarImage src={notification.user.avatarUrl} alt={notification.user.name} />
            <AvatarFallback>{notification.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 bg-background p-0.5 rounded-full">
            {getIcon()}
          </div>
        </div>
        <div className="flex-grow">
          <p className="text-sm">
            <span className="font-semibold">{notification.user.name}</span>{' '}
            {notification.content}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {notification.timestamp}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
