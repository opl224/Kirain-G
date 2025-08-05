
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, updateDoc, query, orderBy } from 'firebase/firestore';
import type { User } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader, ArrowLeft, BadgeCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function VerificationsPage() {
  const { user: authUser, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});

  const superUserId = "GFQXQNBxx6QcYRjWPMFeT3CuBai1";
  const isSuperUser = authUser?.uid === superUserId;

  useEffect(() => {
    if (authIsLoading) return;
    if (!isSuperUser) {
      router.push('/profile/settings');
      return;
    }

    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const usersCollection = collection(db, 'users');
        const q = query(usersCollection, orderBy('name'));
        const querySnapshot = await getDocs(q);
        const usersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as User[];
        setUsers(usersData.filter(u => u.id !== superUserId)); // Exclude super user from list
      } catch (error) {
        console.error("Error fetching users: ", error);
        toast({
          variant: 'destructive',
          title: 'Gagal Memuat Pengguna',
          description: 'Terjadi kesalahan saat mengambil daftar pengguna.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [authUser, authIsLoading, isSuperUser, router, toast]);

  const handleVerificationToggle = async (userId: string, isVerified: boolean) => {
    setIsUpdating(prev => ({ ...prev, [userId]: true }));
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, { isVerified });

      setUsers(prevUsers =>
        prevUsers.map(u => (u.id === userId ? { ...u, isVerified } : u))
      );

      toast({
        title: 'Status Verifikasi Diperbarui',
        description: `Pengguna telah ${isVerified ? 'diverifikasi' : 'tidak diverifikasi'}.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Gagal Memperbarui',
        description: error.message,
      });
    } finally {
      setIsUpdating(prev => ({ ...prev, [userId]: false }));
    }
  };

  const UserRowSkeleton = () => (
    <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-3 w-[100px]" />
            </div>
        </div>
        <Skeleton className="h-6 w-11 rounded-full" />
    </div>
  )

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="flex items-center gap-2 mb-8">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold font-headline">Kelola Verifikasi</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {isLoading ? (
                <>
                    <UserRowSkeleton />
                    <UserRowSkeleton />
                    <UserRowSkeleton />
                </>
            ) : (
              users.map(user => (
                <div key={user.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
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
                  </div>
                  <Switch
                    checked={!!user.isVerified}
                    onCheckedChange={checked => handleVerificationToggle(user.id, checked)}
                    disabled={isUpdating[user.id]}
                  />
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
