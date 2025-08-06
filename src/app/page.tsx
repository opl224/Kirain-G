
'use client';

import { PostCard } from '@/components/PostCard';
import { db } from '@/lib/firebase';
import { Post, Story, PostData, Author } from '@/lib/types';
import { collection, getDocs, orderBy, query, Timestamp, where, documentId } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import StoryTray from '@/components/StoryTray';

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [groupedStories, setGroupedStories] = useState<{[key: string]: Story[]}>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Clear the new posts indicator when visiting the home page
    localStorage.setItem('hasNewPosts', 'false');
    window.dispatchEvent(new Event('storageUpdated'));
  }, []);
  
  // Save latest seen post timestamp
  useEffect(() => {
      if (posts.length > 0) {
        const lastSeenPostTimestamp = localStorage.getItem('lastSeenPostTimestamp');
        const latestPostTimestamp = posts[0].createdAt.toMillis();
        if (!lastSeenPostTimestamp || latestPostTimestamp > Number(lastSeenPostTimestamp)) {
            localStorage.setItem('lastSeenPostTimestamp', latestPostTimestamp.toString());
        }
    }
  }, [posts]);

  useEffect(() => {
    const fetchAllContent = async () => {
      setIsLoading(true);
      try {
        // Fetch Posts
        const postsCollection = collection(db, 'posts');
        const postsQuery = query(postsCollection, orderBy('createdAt', 'desc'));
        const postSnapshot = await getDocs(postsQuery);
        const postsData = postSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PostData));

        // Get unique author IDs from posts, filtering out any invalid IDs
        const authorIds = [...new Set(postsData.map(p => p.authorId).filter(id => !!id))];

        // Fetch authors' data
        const authors: { [id: string]: Author } = {};
        if (authorIds.length > 0) {
          const usersCollection = collection(db, 'users');
          // Firestore 'in' query is limited to 30 elements. Chunk if needed.
          const chunks: string[][] = [];
          for (let i = 0; i < authorIds.length; i += 30) {
              chunks.push(authorIds.slice(i, i + 30));
          }
          
          for (const chunk of chunks) {
              if (chunk.length === 0) continue;
              const authorsQuery = query(usersCollection, where(documentId(), 'in', chunk));
              const authorsSnapshot = await getDocs(authorsQuery);
              authorsSnapshot.forEach(doc => {
                  authors[doc.id] = { id: doc.id, ...doc.data() } as Author;
              });
          }
        }
        
        // Combine posts with their author data
        const combinedPosts = postsData.map(post => ({
          ...post,
          author: authors[post.authorId]
        })).filter(p => p.author); // Filter out posts where author might not be found
        setPosts(combinedPosts as Post[]);

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

  const handlePostDelete = (postId: string) => {
    setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
  };

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

        <h1 className="text-2xl font-bold font-headline mb-4">Postingan</h1>
      {isLoading ? (
         <p className="text-center text-muted-foreground">Memuat postingan...</p>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} postData={post} author={post.author} onPostDelete={handlePostDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
