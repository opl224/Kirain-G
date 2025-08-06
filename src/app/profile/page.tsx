
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit, startAfter, type QueryDocumentSnapshot } from 'firebase/firestore';
import type { User, Post, PostData, Author } from '@/lib/types';
import ProfileDisplay from '@/components/ProfileDisplay';
import PageLoader from '@/components/PageLoader';

const POSTS_PER_PAGE = 10;

export default function ProfilePage() {
  const { user: authUser, isLoading: authIsLoading } = useAuth();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [postsLastVisible, setPostsLastVisible] = useState<QueryDocumentSnapshot | null>(null);
  const [postsHaveMore, setPostsHaveMore] = useState(true);
  const [isFetchingMorePosts, setIsFetchingMorePosts] = useState(false);


  const fetchUserPosts = async (initialLoad = false) => {
      if (!authUser) return;

      if (initialLoad) {
          // Full page loader is already active
      } else {
          setIsFetchingMorePosts(true);
      }

      try {
          const postsCollection = collection(db, 'posts');
          let q = query(
              postsCollection, 
              where('authorId', '==', authUser.uid), 
              orderBy('createdAt', 'desc'),
              limit(POSTS_PER_PAGE)
          );

          if (!initialLoad && postsLastVisible) {
              q = query(q, startAfter(postsLastVisible));
          }
          
          const postSnapshot = await getDocs(q);
          const newPostsData = postSnapshot.docs.map(doc => ({ ...doc.data() as PostData, id: doc.id }));

           const newPosts = newPostsData.map(post => ({
                ...post,
                author: userProfile as Author,
            })) as Post[];
          
          setPostsLastVisible(postSnapshot.docs[postSnapshot.docs.length - 1] || null);
          setPostsHaveMore(postSnapshot.docs.length === POSTS_PER_PAGE);
          
          setUserPosts(prev => initialLoad ? newPosts : [...prev, ...newPosts]);

      } catch (error) {
          console.error("Error fetching user posts: ", error);
      } finally {
           if (!initialLoad) {
              setIsFetchingMorePosts(false);
           }
      }
  };


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
          const profileData = userDocSnap.data() as User;
          setUserProfile(profileData);
           // Fetch initial posts (pass profile data to avoid race condition)
            await fetchUserPostsWithProfile(profileData, true);

        } else {
          console.log("No such user!");
        }
      } catch (error) {
        console.error("Error fetching profile data: ", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    const fetchUserPostsWithProfile = async (profile: User, initialLoad = false) => {
        if (!authUser) return;

        if (!initialLoad) {
            setIsFetchingMorePosts(true);
        }

        try {
            const postsCollection = collection(db, 'posts');
            let q = query(
                postsCollection, 
                where('authorId', '==', authUser.uid), 
                orderBy('createdAt', 'desc'),
                limit(POSTS_PER_PAGE)
            );

            if (!initialLoad && postsLastVisible) {
                q = query(q, startAfter(postsLastVisible));
            }
            
            const postSnapshot = await getDocs(q);
            const newPostsData = postSnapshot.docs.map(doc => ({ ...doc.data() as PostData, id: doc.id }));
            
            const newPosts = newPostsData.map(post => ({
                ...post,
                author: profile as Author,
            })) as Post[];
            
            setPostsLastVisible(postSnapshot.docs[postSnapshot.docs.length - 1] || null);
            setPostsHaveMore(postSnapshot.docs.length === POSTS_PER_PAGE);
            
            setUserPosts(prev => initialLoad ? newPosts : [...prev, ...newPosts]);

        } catch (error) {
            console.error("Error fetching user posts: ", error);
        } finally {
            if (!initialLoad) {
                setIsFetchingMorePosts(false);
            }
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
    <ProfileDisplay 
      user={userProfile} 
      posts={userPosts} 
      onPostDelete={handlePostDelete}
      hasMorePosts={postsHaveMore}
      isFetchingMorePosts={isFetchingMorePosts}
      onLoadMorePosts={() => fetchUserPosts(false)}
    />
  );
}
