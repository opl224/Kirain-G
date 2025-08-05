
'use client';

import type { Notification } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, UserPlus, BadgeCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useState } from 'react';
import Link from 'next/link';


interface NotificationCardProps {
  notification: Notification;
  onUpdate: (id: string, updates: Partial<Notification>) => void;
  onRemove: (id: string) => void;
  currentUserId?: string;
}


export function NotificationCard({ notification, onRemove, currentUserId }: NotificationCardProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const superUserId = "GFQXQNBxx6QcYRjWPMFeT3CuBai1";
  const isSuperUser = currentUserId === superUserId;
  const isVerificationRequest = notification.type === 'verification_request';

  const getIcon = () => {
    switch (notification.type) {
      case 'like':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'follow':
        return <UserPlus className="h-5 w-5 text-primary" />;
      case 'verification_request':
        return <BadgeCheck className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      // Update the user's document to set isVerified to true
      const userToVerifyRef = doc(db, 'users', notification.sender.id);
      await updateDoc(userToVerifyRef, { isVerified: true });
      
      // Delete the notification after it has been handled
      const notifRef = doc(db, 'notifications', notification.id);
      await deleteDoc(notifRef);

      toast({ title: "Pengguna Diverifikasi", description: `${notification.sender.handle} sekarang terverifikasi.` });
      
      onRemove(notification.id);

    } catch (error: any) {
      toast({ variant: 'destructive', title: "Error", description: error.message });
      setIsProcessing(false);
    }
  };
  
  const handleDecline = async () => {
    setIsProcessing(true);
    try {
        const notifRef = doc(db, 'notifications', notification.id);
        await deleteDoc(notifRef);
        toast({ title: "Permintaan Ditolak" });
        onRemove(notification.id);
    } catch (error: any) {
        toast({ variant: 'destructive', title: "Error", description: error.message });
        setIsProcessing(false);
    }
  };


  const timeAgo = notification.createdAt ? formatDistanceToNow(notification.createdAt.toDate(), { locale: id }) : 'baru saja';

  const senderProfileLink = `/user?id=${notification.sender.id}`;

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-4 flex flex-col gap-4">
        <div className="flex items-center gap-4">
            <Link href={senderProfileLink}>
                <div className="relative">
                    <Avatar>
                        <AvatarImage src={notification.sender.avatarUrl} alt={notification.sender.name} />
                        <AvatarFallback>{notification.sender.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-background p-0.5 rounded-full">
                        {getIcon()}
                    </div>
                </div>
            </Link>
            <div className="flex-grow">
                <p className="text-sm">
                    <Link href={senderProfileLink}>
                        <span className="font-semibold hover:underline">{notification.sender.name}</span>
                    </Link>
                    {' '}
                    {notification.content}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    {timeAgo}
                </p>
            </div>
        </div>
        {isSuperUser && isVerificationRequest && (
            <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={handleDecline} disabled={isProcessing}>
                    Tolak
                </Button>
                <Button size="sm" onClick={handleApprove} disabled={isProcessing}>
                    Setujui
                </Button>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
