
'use client';

import { Heart, Loader, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import type { Post } from '@/lib/types';
import { PostCard } from '@/components/PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';


export default function LikesPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (authIsLoading) return;
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchLikedPosts = async () => {
      setIsLoading(true);
      try {
        const postsCollection = collection(db, 'posts');
        const q = query(
          postsCollection, 
          where('likedBy', 'array-contains', user.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const postsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Post[];
        setLikedPosts(postsData);
      } catch (error) {
        console.error("Error fetching liked posts: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLikedPosts();
  }, [user, authIsLoading]);

  const PostSkeleton = () => (
     <div className="space-y-3">
        <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-3 w-[150px]" />
            </div>
        </div>
        <Skeleton className="h-24 w-full" />
        <div className="flex justify-between">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
        </div>
    </div>
  )

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="flex items-center gap-2 mb-8">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div className="flex items-center gap-3">
          <Heart className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline">Postingan yang Disukai</h1>
        </div>
      </div>
      
       {isLoading ? (
        <div className="space-y-6">
            <PostSkeleton/>
            <PostSkeleton/>
        </div>
      ) : likedPosts.length > 0 ? (
        <div className="space-y-6">
          {likedPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-muted-foreground">
            Anda belum menyukai postingan apa pun.
          </p>
        </div>
      )}
    </div>
  );
}
