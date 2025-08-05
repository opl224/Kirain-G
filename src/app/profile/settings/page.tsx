
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { db, auth } from '@/lib/firebase';
import { doc, updateDoc, getDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import type { User } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ChevronRight, ArrowLeft, ShieldCheck, Moon } from 'lucide-react';
import Link from 'next/link';
import PageLoader from '@/components/PageLoader';
import { DarkModeSwitch } from '@/components/DarkModeSwitch';
import { PrivacyLock } from '@/components/PrivacyLock';

export default function SettingsPage() {
  const { user: authUser, isLoading: authIsLoading } = useAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const superUserId = "GFQXQNBxx6QcYRjWPMFeT3CuBai1";
  const isSuperUser = authUser?.uid === superUserId;

  useEffect(() => {
    if (authUser) {
      const userDocRef = doc(db, 'users', authUser.uid);
      getDoc(userDocRef).then(docSnap => {
        if (docSnap.exists()) {
          setCurrentUser({ id: docSnap.id, ...docSnap.data() } as User);
        }
        setIsLoading(false);
      });
    } else if (!authIsLoading) {
        setIsLoading(false);
    }
  }, [authUser, authIsLoading]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: 'Logout Berhasil',
        description: 'Anda telah keluar dari akun Anda.',
      });
      router.push('/login');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Logout Gagal',
        description: 'Terjadi kesalahan saat mencoba keluar.',
      });
    }
  };

  const handlePrivacyChange = async (isPrivate: boolean) => {
    if (!currentUser) return;
    try {
      const userDocRef = doc(db, 'users', currentUser.id);
      await updateDoc(userDocRef, { isPrivate });
      setCurrentUser(prev => prev ? { ...prev, isPrivate } : null);
      toast({
        title: 'Pengaturan Privasi Diperbarui',
        description: `Akun Anda sekarang ${isPrivate ? 'privat' : 'publik'}.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Gagal Memperbarui Privasi',
        description: error.message,
      });
    }
  };

  const handleVerificationRequest = async () => {
    if (!currentUser) return;
    try {
      // Fetch the full current user data if it's not complete
      const userDocRef = doc(db, 'users', currentUser.id);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) throw new Error("User data not found");
      const senderData = userDocSnap.data() as User;

      // Create a notification for the super user
      await addDoc(collection(db, "notifications"), {
        recipientId: superUserId,
        sender: {
          id: currentUser.id,
          name: senderData.name,
          handle: senderData.handle,
          avatarUrl: senderData.avatarUrl,
        },
        type: 'verification_request',
        content: `meminta verifikasi akun.`,
        read: false,
        createdAt: serverTimestamp(),
      });
      
      toast({
        title: 'Permintaan Terkirim',
        description: 'Permintaan verifikasi Anda telah dikirim ke super user.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Gagal Mengirim Permintaan',
        description: error.message,
      });
    }
  };


  if (isLoading || authIsLoading) {
    return <PageLoader />;
  }

  if (!currentUser) {
     return (
      <div className="flex items-center justify-center h-screen">
        <p>Pengguna tidak ditemukan. Silakan login kembali.</p>
      </div>
    );
  }
  
  const SettingItem = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-lg">
      {children}
    </div>
  );
  
  const NavLink = ({ href, children }: { href: string, children: React.ReactNode }) => (
     <Link href={href} passHref>
        <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-lg cursor-pointer">
            <div className="flex-grow">{children}</div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
     </Link>
  );


  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
       <div className="flex items-center gap-2 mb-8">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold font-headline">Pengaturan</h1>
      </div>
      
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Tampilan</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <SettingItem>
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-primary" />
                <Label htmlFor="dark-mode-switch" className="text-base">
                  Mode Gelap
                </Label>
              </div>
              <DarkModeSwitch />
            </SettingItem>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Konten</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <NavLink href="/profile/saved">Tersimpan</NavLink>
            <Separator />
            <NavLink href="/profile/likes">Suka</NavLink>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Akun</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             <SettingItem>
                <Label htmlFor="privacy-switch" className="flex-grow text-base">Akun Privat</Label>
                <PrivacyLock
                  checked={!!currentUser.isPrivate}
                  onCheckedChange={handlePrivacyChange}
                />
             </SettingItem>
             {!currentUser.isVerified && !isSuperUser && (
                <>
                    <Separator/>
                    <SettingItem>
                        <button onClick={handleVerificationRequest} className="text-base w-full text-left">Minta Verifikasi</button>
                    </SettingItem>
                </>
             )}
          </CardContent>
        </Card>

        {isSuperUser && (
          <Card>
            <CardHeader>
              <CardTitle>Admin</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <NavLink href="/profile/settings/verifications">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <span className="text-base">Kelola Verifikasi</span>
                </div>
              </NavLink>
            </CardContent>
          </Card>
        )}
        
        <Card>
            <CardContent className="p-0">
                <SettingItem>
                    <button onClick={handleLogout} className="text-base w-full text-left text-destructive">
                      Keluar
                    </button>
                </SettingItem>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
