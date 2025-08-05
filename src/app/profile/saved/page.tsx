
'use client';

import { Bookmark, Loader, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, where, documentId } from 'firebase/firestore';
import type { Post } from '@/lib/types';
import { PostCard } from '@/components/PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function SavedPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (authIsLoading) return;
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchSavedPosts = async () => {
      setIsLoading(true);
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const savedPostIds: string[] = userData.savedPosts || [];
          
          if (savedPostIds.length > 0) {
            const postsCollection = collection(db, 'posts');
            // Firestore 'in' query is limited to 30 elements, chunk if needed.
             const chunks: string[][] = [];
              for (let i = 0; i < savedPostIds.length; i += 30) {
                  chunks.push(savedPostIds.slice(i, i + 30));
              }
              
              const postsData: Post[] = [];
              for (const chunk of chunks) {
                  if (chunk.length === 0) continue;
                  const q = query(postsCollection, where(documentId(), 'in', chunk));
                  const querySnapshot = await getDocs(q);
                  querySnapshot.forEach((doc) => {
                      postsData.push({ id: doc.id, ...doc.data() } as Post);
                  });
              }
            setSavedPosts(postsData);
          }
        }
      } catch (error) {
        console.error("Error fetching saved posts: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedPosts();
  }, [user, authIsLoading]);

  const handlePostDelete = (postId: string) => {
    setSavedPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
  };

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
          <Bookmark className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline">Postingan Tersimpan</h1>
        </div>
      </div>
      
      {isLoading ? (
        <div className="space-y-6">
            <PostSkeleton/>
            <PostSkeleton/>
        </div>
      ) : savedPosts.length > 0 ? (
        <div className="space-y-6">
          {savedPosts.map((post) => (
            <PostCard key={post.id} post={post} onPostDelete={handlePostDelete} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-muted-foreground">
            Anda belum menyimpan postingan apa pun.
          </p>
        </div>
      )}
    </div>
  );
}

    