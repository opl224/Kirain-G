
'use client';

import type { Notification, User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, UserPlus, BadgeCheck, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, updateDoc, deleteDoc, arrayRemove, arrayUnion, increment, addDoc, collection, serverTimestamp, getDoc } from 'firebase/firestore';
import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';


interface NotificationCardProps {
  notification: Notification;
  onUpdate: (id: string, updates: Partial<Notification>) => void;
  onRemove: (id: string) => void;
  currentUserId?: string;
}


export function NotificationCard({ notification, onRemove, currentUserId }: NotificationCardProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout>();

  const superUserId = "GFQXQNBxx6QcYRjWPMFeT3CuBai1";
  const isSuperUser = currentUserId === superUserId;
  const isVerificationRequest = notification.type === 'verification_request';
  const isFollowRequest = notification.type === 'follow_request';

  const getIcon = () => {
    switch (notification.type) {
      case 'like':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'follow':
      case 'follow_request':
        return <UserPlus className="h-5 w-5 text-primary" />;
      case 'verification_request':
        return <BadgeCheck className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsProcessing(true);
    try {
        const notifRef = doc(db, 'notifications', notification.id);
        await deleteDoc(notifRef);
        toast({ title: "Notifikasi dihapus." });
        onRemove(notification.id);
    } catch (error: any) {
        toast({ variant: 'destructive', title: "Error", description: error.message });
        setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    setIsProcessing(true);
    try {
        if (isFollowRequest && currentUserId) {
            const currentUserRef = doc(db, 'users', currentUserId);
            await updateDoc(currentUserRef, { followRequests: arrayRemove(notification.sender.id) });
        }
        
        const notifRef = doc(db, 'notifications', notification.id);
        await deleteDoc(notifRef);
        
        toast({ title: isFollowRequest ? "Permintaan ditolak" : "Permintaan Ditolak" });
        onRemove(notification.id);
    } catch (error: any) {
        toast({ variant: 'destructive', title: "Error", description: error.message });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleApprove = async () => {
    if (!currentUserId) return;
    setIsProcessing(true);

    try {
        if (isVerificationRequest) {
            const userToVerifyRef = doc(db, 'users', notification.sender.id);
            await updateDoc(userToVerifyRef, { isVerified: true });
        } else if (isFollowRequest) {
            const currentUserRef = doc(db, 'users', currentUserId);
            const senderUserRef = doc(db, 'users', notification.sender.id);
            
            await updateDoc(currentUserRef, { 
                followers: arrayUnion(notification.sender.id),
                'stats.followers': increment(1),
                followRequests: arrayRemove(notification.sender.id) 
            });
            await updateDoc(senderUserRef, { 
                following: arrayUnion(currentUserId),
                'stats.following': increment(1),
            });
            
            const currentUserDoc = await getDoc(currentUserRef);
            const currentUserData = currentUserDoc.data() as User;

            await addDoc(collection(db, "notifications"), {
                recipientId: notification.sender.id,
                sender: { id: currentUserId, name: currentUserData.name, handle: currentUserData.handle, avatarUrl: currentUserData.avatarUrl },
                type: 'follow',
                content: `menerima permintaan pertemanan Anda.`,
                read: false,
                createdAt: serverTimestamp(),
            });
        }
      
      const notifRef = doc(db, 'notifications', notification.id);
      await deleteDoc(notifRef);

      toast({ 
          title: isVerificationRequest ? "Pengguna Diverifikasi" : "Permintaan disetujui", 
          description: isVerificationRequest ? `${notification.sender.handle} sekarang terverifikasi.` : `${notification.sender.handle} sekarang mengikuti Anda.` 
      });
      
      onRemove(notification.id);

    } catch (error: any) {
      toast({ variant: 'destructive', title: "Error", description: error.message });
    } finally {
        setIsProcessing(false);
    }
  };


  let timeAgo = 'baru saja';
  if (notification.createdAt) {
      let formattedTime = formatDistanceToNow(notification.createdAt.toDate(), { locale: id, addSuffix: false });
      timeAgo = formattedTime.replace("kurang dari ", "").replace("sekitar ", "");
  }

  const senderProfileLink = `/user?id=${notification.sender.id}`;
  
  const handlePointerDown = () => {
    longPressTimer.current = setTimeout(() => {
        setIsDeleteMode(true);
    }, 500); // 500ms for long press
  };

  const handlePointerUp = () => {
    clearTimeout(longPressTimer.current);
  };
  
  const handlePointerLeave = () => {
    clearTimeout(longPressTimer.current);
  };

  const exitDeleteMode = () => {
    setIsDeleteMode(false);
  }

  return (
    <Card 
        className={cn("overflow-hidden transition-all hover:shadow-md", isDeleteMode && "bg-destructive/10")}
        onMouseDown={handlePointerDown}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerLeave}
        onTouchStart={handlePointerDown}
        onTouchEnd={handlePointerUp}
        onClick={isDeleteMode ? exitDeleteMode : undefined}
    >
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-start gap-4 flex-grow">
            <Link href={senderProfileLink} onClick={(e) => e.stopPropagation()}>
                <Avatar>
                    <AvatarImage src={notification.sender.avatarUrl} alt={notification.sender.name} />
                    <AvatarFallback>{notification.sender.name.charAt(0)}</AvatarFallback>
                </Avatar>
            </Link>
            <div className="flex-grow">
                <p className="text-sm">
                    <Link href={senderProfileLink} onClick={(e) => e.stopPropagation()}>
                        <span className="font-semibold hover:underline">{notification.sender.name}</span>
                    </Link>
                    {' '}
                    {notification.content}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    {timeAgo}
                </p>
                 {((isSuperUser && isVerificationRequest) || isFollowRequest) && !isDeleteMode && (
                    <div className="flex justify-start gap-2 mt-3">
                        <Button size="sm" variant="outline" onClick={handleDecline} disabled={isProcessing}>
                            Tolak
                        </Button>
                        <Button size="sm" onClick={handleApprove} disabled={isProcessing}>
                            Setujui
                        </Button>
                    </div>
                )}
            </div>
        </div>
        <div className="flex-shrink-0">
            {isDeleteMode ? (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-full text-destructive hover:bg-destructive/20"
                    onClick={handleDelete}
                    disabled={isProcessing}
                >
                    <Trash2 className="h-5 w-5" />
                </Button>
            ) : (
                getIcon()
            )}
        </div>
      </CardContent>
    </Card>
  );
}
