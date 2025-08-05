
'use client';

import type { User, Post } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PostCard } from './PostCard';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import EditProfileForm from './EditProfileForm';
import { useRef, useState } from 'react';
import TruncatedText from './TruncatedText';
import { Camera, Loader, Menu, BadgeCheck, Lock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import Link from 'next/link';
import UserListDialog from './UserListDialog';


function StatItem({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

interface ProfileDisplayProps {
  user: User;
  posts: Post[];
  onPostDelete?: (postId: string) => void;
  hasMorePosts?: boolean;
  isFetchingMorePosts?: boolean;
  onLoadMorePosts?: () => void;
}


export default function ProfileDisplay({ 
  user, 
  posts, 
  onPostDelete,
  hasMorePosts = false,
  isFetchingMorePosts = false,
  onLoadMorePosts
 }: ProfileDisplayProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleProfileUpdate = (updatedUser: Partial<User>) => {
    setCurrentUser(prevUser => ({...prevUser, ...updatedUser}));
    setIsEditDialogOpen(false); 
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast({
        variant: 'destructive',
        title: 'File Terlalu Besar',
        description: 'Ukuran file tidak boleh melebihi 2MB.',
      });
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        
        // Update user document in Firestore with the Base64 Data URL
        const userDocRef = doc(db, 'users', currentUser.id);
        await updateDoc(userDocRef, {
          avatarUrl: base64data,
        });

        // Update local state
        handleProfileUpdate({ avatarUrl: base64data });

        toast({
          title: 'Avatar Diperbarui',
          description: 'Gambar profil Anda berhasil diubah.',
        });
      };
      reader.onerror = (error) => {
        console.error(error);
        throw new Error("Gagal membaca file.");
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Gagal Mengunggah',
        description: error.message,
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
       <div className="flex justify-between items-center mb-4 h-10">
        <div className="flex items-center gap-2">
            {currentUser.isPrivate && <Lock className="h-5 w-5 text-muted-foreground" />}
            <h2 className="text-xl font-bold">@{currentUser.handle}</h2>
            {currentUser.isVerified && <BadgeCheck className="h-5 w-5 text-primary" />}
        </div>
        <Link href="/profile/settings" passHref>
          <Button variant="ghost" size="icon" className="focus-visible:ring-0 focus-visible:ring-offset-0">
            <Menu className="h-6 w-6" />
          </Button>
        </Link>
      </div>


      <div className="flex items-center gap-4 md:gap-8">
        <div className="relative">
          <button onClick={handleAvatarClick} disabled={isUploading} className="relative rounded-full group">
            <Avatar className="w-24 h-24 border-2">
              <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
              <AvatarFallback className="text-3xl">{currentUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {isUploading ? 
                <Loader className="h-8 w-8 animate-spin text-white" /> :
                <Camera className="h-8 w-8 text-white" />
              }
            </div>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            accept="image/png, image/jpeg"
            className="hidden" 
          />
        </div>
        <div className="flex-1 flex justify-around">
          <StatItem label="Postingan" value={currentUser.stats.posts} />
          <UserListDialog userIds={currentUser.followers || []} title="Pengikut">
            <div className="text-center cursor-pointer">
                <p className="text-lg font-bold">{currentUser.stats.followers}</p>
                <p className="text-sm text-muted-foreground">Pengikut</p>
            </div>
          </UserListDialog>
          <UserListDialog userIds={currentUser.following || []} title="Mengikuti">
             <div className="text-center cursor-pointer">
                <p className="text-lg font-bold">{currentUser.stats.following}</p>
                <p className="text-sm text-muted-foreground">Mengikuti</p>
            </div>
          </UserListDialog>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xl font-bold">{currentUser.name}</p>
        {currentUser.bio && <TruncatedText text={currentUser.bio} lineClamp={2} className="mt-2 text-foreground/90" />}
      </div>
      
      <div className="mt-6">
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">Ubah Profil</Button>
          </DialogTrigger>
          <DialogContent className="p-0 flex flex-col">
            <DialogHeader className="p-4 border-b">
              <DialogTitle className="text-lg font-semibold text-center">Ubah Profil</DialogTitle>
              <DialogTitle className="sr-only">Ubah Profil</DialogTitle>
            </DialogHeader>
            <EditProfileForm currentUser={currentUser} onProfileUpdate={handleProfileUpdate} />
          </DialogContent>
        </Dialog>
      </div>

      <Separator className="my-8"/>

      <div>
        <h2 className="text-xl font-bold font-headline mb-4 text-center">Postingan</h2>
        <div className="space-y-6">
          {posts.length > 0 ? (
            posts.map(post => <PostCard key={post.id} post={post} onPostDelete={onPostDelete} />)
          ) : (
            <p className="text-center text-muted-foreground py-8">Belum ada postingan.</p>
          )}
        </div>

        {hasMorePosts && (
            <div className="mt-8 text-center">
              <Button onClick={onLoadMorePosts} disabled={isFetchingMorePosts}>
                {isFetchingMorePosts ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memuat...
                  </>
                ) : (
                  'Muat Lebih Banyak'
                )}
              </Button>
            </div>
          )}
      </div>
    </div>
  );
}
