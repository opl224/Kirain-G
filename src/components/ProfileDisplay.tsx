
'use client';

import type { User, Post } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PostCard } from './PostCard';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import EditProfileForm from './EditProfileForm';
import { useState } from 'react';
import TruncatedText from './TruncatedText';

function StatItem({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export default function ProfileDisplay({ user, posts }: { user: User, posts: Post[] }) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // This state will hold the potentially updated user data
  // It's initialized with the user prop and can be updated by EditProfileForm
  const [currentUser, setCurrentUser] = useState(user);

  const handleProfileUpdate = (updatedUser: Partial<User>) => {
    setCurrentUser(prevUser => ({...prevUser, ...updatedUser}));
    setIsEditDialogOpen(false); // Close dialog on successful update
  }

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="flex items-center gap-4 md:gap-8">
        <Avatar className="w-24 h-24 border-2">
          <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
          <AvatarFallback className="text-3xl">{currentUser.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 flex justify-around">
          <StatItem label="Posts" value={posts.length} />
          <StatItem label="Followers" value={currentUser.stats.followers} />
          <StatItem label="Following" value={currentUser.stats.following} />
        </div>
      </div>

      <div className="mt-6">
        <TruncatedText text={currentUser.name} lineClamp={2} className="text-xl font-bold" />
        <TruncatedText text={`@${currentUser.handle}`} lineClamp={2} className="text-muted-foreground" />
        {currentUser.bio && <TruncatedText text={currentUser.bio} lineClamp={2} className="mt-2 text-foreground/90" />}
      </div>
      
      <div className="mt-6">
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">Edit Profile</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            <EditProfileForm currentUser={currentUser} onProfileUpdate={handleProfileUpdate} />
          </DialogContent>
        </Dialog>
      </div>

      <Separator className="my-8"/>

      <div>
        <h2 className="text-xl font-bold font-headline mb-4 text-center">Notes</h2>
        <div className="space-y-6">
          {posts.length > 0 ? (
            posts.map(post => <PostCard key={post.id} post={post} />)
          ) : (
            <p className="text-center text-muted-foreground py-8">No notes yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
