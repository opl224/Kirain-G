
import type { Notification, User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Heart, UserPlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function NotificationCard({
  notification,
}: {
  notification: Notification;
}) {

  // A dummy user for display purposes until we have real users in notifications
  const dummyUser: User = {
    id: 'dummy-user',
    name: 'NotaSphere User',
    handle: 'dummynota',
    avatarUrl: 'https://placehold.co/100x100.png',
    bio: '',
    stats: { posts: 0, followers: 0, following: 0 }
  }
  const user = notification.user || dummyUser;

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

  const timeAgo = notification.createdAt ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true }) : 'just now';

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="relative">
           <Avatar>
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 bg-background p-0.5 rounded-full">
            {getIcon()}
          </div>
        </div>
        <div className="flex-grow">
          <p className="text-sm">
            <span className="font-semibold">{user.name}</span>{' '}
            {notification.content}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {timeAgo}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
