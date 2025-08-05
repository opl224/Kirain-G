
'use client';

import type { User, Post } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PostCard } from './PostCard';
import { Separator } from './ui/separator';

function StatItem({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export default function ProfileDisplay({ user, posts }: { user: User, posts: Post[] }) {
  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="flex items-center gap-4 md:gap-8">
        <Avatar className="w-24 h-24 border-2">
          <AvatarImage src={user.avatarUrl} alt={user.name} />
          <AvatarFallback className="text-3xl">{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 flex justify-around">
          <StatItem label="Posts" value={posts.length} />
          <StatItem label="Followers" value={user.stats.followers} />
          <StatItem label="Following" value={user.stats.following} />
        </div>
      </div>

      <div className="mt-6">
        <h1 className="text-xl font-bold">{user.name}</h1>
        <p className="text-muted-foreground">@{user.handle}</p>
        {user.bio && <p className="mt-2 text-foreground/90">{user.bio}</p>}
      </div>
      
      <div className="mt-6">
        <Button className="w-full">Edit Profile</Button>
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
