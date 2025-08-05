
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, query, where, documentId, getDocs } from 'firebase/firestore';
import type { User } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { BadgeCheck, ArrowLeft } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';

interface UserListDialogProps {
  userIds: string[];
  title: string;
  children: React.ReactNode; // The trigger
  disabled?: boolean;
}

function UserRow({ user, onDialogClose }: { user: User, onDialogClose: () => void }) {
    const { user: authUser } = useAuth();
    const profileLink = authUser && authUser.uid === user.id ? '/profile' : `/user?id=${user.id}`;
    
    return (
        <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors rounded-lg">
            <Link href={profileLink} className="flex items-center gap-4 w-full" onClick={onDialogClose}>
                <Avatar>
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <div className="flex items-center gap-1">
                        <p className="font-semibold">{user.name}</p>
                        {user.isVerified && <BadgeCheck className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="text-sm text-muted-foreground">@{user.handle}</p>
                </div>
            </Link>
        </div>
    )
}

function UserRowSkeleton() {
    return (
        <div className="flex items-center gap-4 p-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-3 w-[80px]" />
            </div>
        </div>
    )
}

export default function UserListDialog({ userIds, title, children, disabled = false }: UserListDialogProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const canOpen = userIds && userIds.length > 0 && !disabled;

  useEffect(() => {
    if (!isOpen || !canOpen) {
      setUsers([]);
      return;
    };

    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const usersCollection = collection(db, 'users');
        // Firestore 'in' query is limited to 30 elements.
        // We need to chunk the requests if there are more.
        const chunks: string[][] = [];
        for (let i = 0; i < userIds.length; i += 30) {
            chunks.push(userIds.slice(i, i + 30));
        }
        
        const usersData: User[] = [];
        for (const chunk of chunks) {
            if (chunk.length === 0) continue;
            const q = query(usersCollection, where(documentId(), 'in', chunk));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                usersData.push({ id: doc.id, ...doc.data() } as User);
            });
        }
        
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen, userIds, canOpen]);

  const handleDialogOpen = (e: React.MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (canOpen) {
        setIsOpen(true);
    }
  }

  const handleDialogClose = () => {
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild onClick={handleDialogOpen}>{children}</DialogTrigger>
      <DialogContent className="p-0">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <div className="flex items-center p-4 border-b">
            <DialogClose asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
            </DialogClose>
            <h2 className="text-lg font-semibold ml-4">{title}</h2>
        </div>
        <ScrollArea className="h-[80vh]">
            <div className="p-2">
                {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => <UserRowSkeleton key={i} />)
                ) : users.length > 0 ? (
                    users.map(user => <UserRow key={user.id} user={user} onDialogClose={handleDialogClose} />)
                ) : (
                    <p className="text-center text-muted-foreground py-10">Tidak ada pengguna untuk ditampilkan.</p>
                )}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
