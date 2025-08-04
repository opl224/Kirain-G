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
      <p className="text-2xl font-bold font-headline">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export default function ProfileDisplay({ user, posts }: { user: User, posts: Post[] }) {
  return (
    <div className="bg-background min-h-full">
      <div className="relative overflow-hidden bg-primary/10 pb-16">
        <div className="absolute inset-0 [perspective:1000px]">
          <div className="absolute inset-0 bg-grid-pattern opacity-30 [transform:rotateX(75deg)]"></div>
        </div>
        <div className="container mx-auto px-4 pt-12 pb-8 text-center relative">
          <Avatar className="w-28 h-28 mx-auto border-4 border-background shadow-lg">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback className="text-4xl">{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <h1 className="mt-4 text-3xl font-bold font-headline">{user.name}</h1>
          <p className="text-muted-foreground">@{user.handle}</p>
          <p className="mt-4 max-w-xl mx-auto text-foreground/80">{user.bio}</p>
          <Button className="mt-6">Follow</Button>
        </div>
      </div>

      <div className="transform -translate-y-12">
        <div className="container mx-auto max-w-4xl px-4">
          <Card className="shadow-xl">
            <div className="flex justify-around p-4">
              <StatItem label="Notes" value={user.stats.posts} />
              <StatItem label="Followers" value={user.stats.followers} />
              <StatItem label="Following" value={user.stats.following} />
            </div>
          </Card>
        </div>
      </div>
      
      <div className="container mx-auto max-w-2xl px-4 pb-8 -mt-4">
        <h2 className="text-xl font-bold font-headline mb-4">Notes</h2>
        <Separator className="mb-6"/>
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

// Add this to globals.css if you need it, but tailwind magic should work
// @tailwind base;
// .bg-grid-pattern {
//   background-image: linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px);
//   background-size: 40px 40px;
// }

// For tailwind.config.ts, you can use backgroundImage extension:
// theme: {
//   extend: {
//     backgroundImage: {
//       'grid-pattern': 'linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)',
//     }
//   }
// }
