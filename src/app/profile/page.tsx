
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import type { User, Post } from '@/lib/types';
import ProfileDisplay from '@/components/ProfileDisplay';
import PageLoader from '@/components/PageLoader';

export default function ProfilePage() {
  const { user: authUser, isLoading: authIsLoading } = useAuth();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authIsLoading) return;
    if (!authUser) {
      // useAuth hook will redirect to login, so we can just wait.
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch user profile
        const userDocRef = doc(db, 'users', authUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setUserProfile(userDocSnap.data() as User);
        } else {
          console.log("No such user!");
        }

        // Fetch user posts
        const postsCollection = collection(db, 'posts');
        const q = query(postsCollection, where('author.id', '==', authUser.uid), orderBy('createdAt', 'desc'));
        const postSnapshot = await getDocs(q);
        const postsData = postSnapshot.docs.map(doc => ({ ...doc.data() as Post, id: doc.id }));
        setUserPosts(postsData);

      } catch (error) {
        console.error("Error fetching profile data: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [authUser, authIsLoading]);

  const handlePostDelete = (postId: string) => {
    setUserPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
    // Also update profile post count
    setUserProfile(prevProfile => {
        if (!prevProfile) return null;
        return {
            ...prevProfile,
            stats: {
                ...prevProfile.stats,
                posts: prevProfile.stats.posts - 1,
            }
        }
    })
  };

  if (isLoading || authIsLoading || !userProfile) {
    return <PageLoader />;
  }

  return (
    <ProfileDisplay user={userProfile} posts={userPosts} onPostDelete={handlePostDelete} />
  );
}

    
