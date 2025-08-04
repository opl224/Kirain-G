
'use client';

import { PostCard } from '@/components/PostCard';
import { db } from '@/lib/firebase';
import { Post } from '@/lib/types';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const postsCollection = collection(db, 'posts');
        const q = query(postsCollection, orderBy('createdAt', 'desc'));
        const postSnapshot = await getDocs(q);
        const postsData = await Promise.all(
          postSnapshot.docs.map(async (doc) => {
            const post = doc.data() as Post;
            // The author data is nested, so we don't need to fetch it separately
            // if it's stored correctly.
            return { ...post, id: doc.id };
          })
        );
        setPosts(postsData);
      } catch (error) {
        console.error("Error fetching posts: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);


  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <h1 className="text-4xl font-bold mb-8 text-center font-headline tracking-tight">
        NotaSphere
      </h1>
      {isLoading ? (
         <p className="text-center text-muted-foreground">Loading posts...</p>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
