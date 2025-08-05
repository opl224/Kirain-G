
'use client';

import { PostCard } from '@/components/PostCard';
import { db } from '@/lib/firebase';
import { Post, Story } from '@/lib/types';
import { collection, getDocs, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import StoryTray from '@/components/StoryTray';

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [groupedStories, setGroupedStories] = useState<{[key: string]: Story[]}>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllContent = async () => {
      setIsLoading(true);
      try {
        // Fetch Posts
        const postsCollection = collection(db, 'posts');
        const postsQuery = query(postsCollection, orderBy('createdAt', 'desc'));
        const postSnapshot = await getDocs(postsQuery);
        const postsData = await Promise.all(
          postSnapshot.docs.map(async (doc) => {
            const post = doc.data() as Post;
            return { ...post, id: doc.id };
          })
        );
        setPosts(postsData);

        // Fetch Stories (from the last 24 hours)
        const storiesCollection = collection(db, 'stories');
        const twentyFourHoursAgo = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);
        const storiesQuery = query(storiesCollection, where('createdAt', '>=', twentyFourHoursAgo), orderBy('createdAt', 'asc')); // Order ascending to play in order
        const storySnapshot = await getDocs(storiesQuery);
        const storiesData = storySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Story[];
        
        // Group stories by user, keeping up to 5 of the latest ones per user
        const userStories: { [key: string]: Story[] } = {};
        storiesData.forEach(story => {
            if (!userStories[story.author.id]) {
                userStories[story.author.id] = [];
            }
            if (userStories[story.author.id].length < 5) {
                userStories[story.author.id].push(story);
            }
        });
        
        setGroupedStories(userStories);

      } catch (error) {
        console.error("Error fetching content: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllContent();
  }, []);

  const storyAuthors = Object.values(groupedStories).map(storyList => storyList[0].author);

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
        {isLoading || storyAuthors.length > 0 ? (
          <div className="mb-8">
            <h2 className="text-xl font-bold font-headline mb-4">Cerita</h2>
            <StoryTray 
              groupedStories={groupedStories} 
              isLoading={isLoading} 
            />
          </div>
        ) : null}

        <h1 className="text-2xl font-bold font-headline mb-4">Umpan</h1>
      {isLoading ? (
         <p className="text-center text-muted-foreground">Memuat postingan...</p>
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
