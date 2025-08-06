
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  addDoc,
  serverTimestamp,
  deleteDoc,
  limit, 
  startAfter,
  type QueryDocumentSnapshot,
  documentId
} from 'firebase/firestore';
import type { User, Post, PostData, Author } from '@/lib/types';
import { ArrowLeft, Loader, BadgeCheck, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { PostCard } from '@/components/PostCard';
import { Separator } from '@/components/ui/separator';
import TruncatedText from '@/components/TruncatedText';
import UserListDialog from '@/components/UserListDialog';
import { cn } from '@/lib/utils';
import PageLoader from '@/components/PageLoader';

const POSTS_PER_PAGE = 10;

function StatItem({ label, value, isDisabled = false }: { label: string; value: number | string, isDisabled?: boolean }) {
  return (
    <div className={cn("text-center", isDisabled && "cursor-not-allowed opacity-50")}>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export default function UserProfilePage() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('id');
  const router = useRouter();

  const { user: authUser, isLoading: authIsLoading } = useAuth();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [followIsLoading, setFollowIsLoading] = useState(false);
  const [postsLastVisible, setPostsLastVisible] = useState<QueryDocumentSnapshot | null>(null);
  const [postsHaveMore, setPostsHaveMore] = useState(true);
  const [isFetchingMorePosts, setIsFetchingMorePosts] = useState(false);


  const { toast } = useToast();
  
  const canViewProfile = userProfile && (!userProfile.isPrivate || isFollowing);

  const fetchUserPosts = async (initialLoad = false) => {
    if (!userId) return;
     if (userProfile && !(!userProfile.isPrivate || isFollowing) && !initialLoad) return;


    if (initialLoad) {
        // Full page loader is active
    } else {
        setIsFetchingMorePosts(true);
    }

    try {
        const postsCollection = collection(db, 'posts');
        let q = query(
            postsCollection, 
            where('authorId', '==', userId), 
            orderBy('createdAt', 'desc'),
            limit(POSTS_PER_PAGE)
        );

        if (!initialLoad && postsLastVisible) {
            q = query(q, startAfter(postsLastVisible));
        }
        
        const postSnapshot = await getDocs(q);
        const newPostsData = postSnapshot.docs.map(doc => ({ ...doc.data() as PostData, id: doc.id }));
        const newPosts = newPostsData.map(p => ({...p, author: userProfile as Author})) as Post[];
        
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
    if (!userId) {
      router.push('/');
      return;
    }
    // Redirect to own profile if viewing self
    if (authUser && authUser.uid === userId) {
      router.push('/profile');
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch user profile
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const profileData = { id: userDocSnap.id, ...userDocSnap.data() } as User;
          setUserProfile(profileData);
          
          const localIsFollowing = authUser ? profileData.followers?.includes(authUser.uid) : false;
          const localHasRequested = authUser ? profileData.followRequests?.includes(authUser.uid) : false;
          setIsFollowing(!!localIsFollowing);
          setHasRequested(!!localHasRequested);

          // Fetch user posts only if profile is not private or user is a follower
          if (!profileData.isPrivate || localIsFollowing) {
            // We need to pass profileData to fetchUserPosts to ensure it has the author info
            await fetchPostsWithAuthor(profileData, true);
          }
        } else {
          console.log('Pengguna tidak ditemukan!');
          router.push('/'); // Or a 404 page
        }
      } catch (error) {
        console.error('Error fetching profile data: ', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    const fetchPostsWithAuthor = async (profile: User, initialLoad = false) => {
      if (!userId) return;
      if (!(!profile.isPrivate || isFollowing) && !initialLoad) return;

      if (!initialLoad) setIsFetchingMorePosts(true);

      try {
        const postsCollection = collection(db, 'posts');
        let q = query(
          postsCollection, 
          where('authorId', '==', userId), 
          orderBy('createdAt', 'desc'),
          limit(POSTS_PER_PAGE)
        );

        if (!initialLoad && postsLastVisible) {
          q = query(q, startAfter(postsLastVisible));
        }

        const postSnapshot = await getDocs(q);
        const newPostsData = postSnapshot.docs.map(doc => ({ ...doc.data() as PostData, id: doc.id }));
        
        // Use the passed profile as the author for all posts
        const newPosts = newPostsData.map(p => ({ ...p, author: profile as Author })) as Post[];

        setPostsLastVisible(postSnapshot.docs[postSnapshot.docs.length - 1] || null);
        setPostsHaveMore(postSnapshot.docs.length === POSTS_PER_PAGE);
        setUserPosts(prev => initialLoad ? newPosts : [...prev, ...newPosts]);
      } catch (error) {
        console.error("Error fetching user posts:", error);
      } finally {
        if (!initialLoad) setIsFetchingMorePosts(false);
      }
    };


    fetchData();
  }, [userId, authIsLoading, authUser, router]);
  
  const findNotification = async (type: string) => {
      if (!authUser || !userProfile) return null;
      const notifQuery = query(collection(db, "notifications"),
          where("type", "==", type),
          where("sender.id", "==", authUser.uid),
          where("recipientId", "==", userProfile.id));
      const notifSnapshot = await getDocs(notifQuery);
      if (!notifSnapshot.empty) {
          return notifSnapshot.docs[0].ref;
      }
      return null;
  };


  const handleFollowToggle = async () => {
    if (!authUser) {
      toast({
        variant: 'destructive',
        title: 'Belum Masuk',
        description: 'Anda harus masuk untuk mengikuti pengguna.',
      });
      return;
    }
    if (!userProfile) return;

    setFollowIsLoading(true);
    const currentUserRef = doc(db, 'users', authUser.uid);
    const targetUserRef = doc(db, 'users', userProfile.id);

    try {
      if (isFollowing) {
        // --- UNFOLLOW LOGIC ---
        await updateDoc(currentUserRef, { following: arrayRemove(userProfile.id) });
        await updateDoc(targetUserRef, { followers: arrayRemove(authUser.uid), 'stats.followers': increment(-1) });
        await updateDoc(currentUserRef, { 'stats.following': increment(-1) });
        
        setUserProfile(p => p ? {...p, stats: {...p.stats, followers: p.stats.followers - 1}, followers: p.followers?.filter(id => id !== authUser.uid)} : null);
        setIsFollowing(false);
        toast({ title: `Anda berhenti mengikuti @${userProfile.handle}` });
      
      } else if (hasRequested) {
        // --- CANCEL FOLLOW REQUEST LOGIC ---
        await updateDoc(targetUserRef, { followRequests: arrayRemove(authUser.uid) });
        const notifRef = await findNotification('follow_request');
        if (notifRef) await deleteDoc(notifRef);

        setHasRequested(false);
        toast({ title: "Permintaan pertemanan dibatalkan." });
      
      } else if (userProfile.isPrivate) {
        // --- SEND FOLLOW REQUEST LOGIC ---
        await updateDoc(targetUserRef, { followRequests: arrayUnion(authUser.uid) });

        const authUserDoc = await getDoc(currentUserRef);
        const authUserData = authUserDoc.data() as User;
        
        await addDoc(collection(db, "notifications"), {
            recipientId: userProfile.id,
            sender: { id: authUser.uid, name: authUserData.name, handle: authUserData.handle, avatarUrl: authUserData.avatarUrl },
            type: 'follow_request',
            content: `ingin mengikuti Anda.`,
            read: false,
            createdAt: serverTimestamp(),
        });
        
        setHasRequested(true);
        toast({ title: "Permintaan pertemanan terkirim." });

      } else {
        // --- FOLLOW PUBLIC ACCOUNT LOGIC ---
        await updateDoc(currentUserRef, { following: arrayUnion(userProfile.id) });
        await updateDoc(targetUserRef, { followers: arrayUnion(authUser.uid), 'stats.followers': increment(1) });
        await updateDoc(currentUserRef, { 'stats.following': increment(1) });
        
        const authUserDoc = await getDoc(currentUserRef);
        const authUserData = authUserDoc.data() as User;
        
        await addDoc(collection(db, "notifications"), {
            recipientId: userProfile.id,
            sender: { id: authUser.uid, name: authUserData.name, handle: authUserData.handle, avatarUrl: authUserData.avatarUrl },
            type: 'follow',
            content: `mulai mengikuti Anda.`,
            read: false,
            createdAt: serverTimestamp(),
        });

        setUserProfile(p => p ? {...p, stats: {...p.stats, followers: p.stats.followers + 1}, followers: [...(p.followers || []), authUser.uid]} : null);
        setIsFollowing(true);
        // If we are now following, fetch their posts
        fetchUserPosts(true);
        toast({ title: `Anda sekarang mengikuti @${userProfile.handle}` });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Tidak dapat memperbarui status mengikuti. Silakan coba lagi.',
      });
      console.error(error);
    } finally {
      setFollowIsLoading(false);
    }
  };
  
  const getButtonState = () => {
      if (isFollowing) return { text: "Mengikuti", variant: "outline" as const };
      if (hasRequested) return { text: "Diminta", variant: "outline" as const };
      return { text: "Ikuti", variant: "default" as const };
  }

  const handlePostDelete = (postId: string) => {
    setUserPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
     setUserProfile(p => p ? {...p, stats: {...p.stats, posts: p.stats.posts - 1}} : null);
  };

  if (isLoading || authIsLoading || !userProfile) {
    return <PageLoader />;
  }
  
  const { text: buttonText, variant: buttonVariant } = getButtonState();

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="flex items-center gap-2 mb-4 h-10">
         <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div className="flex items-center gap-2">
            {userProfile.isPrivate && <Lock className="h-5 w-5 text-muted-foreground" />}
            <h2 className="text-xl font-bold">@{userProfile.handle}</h2>
            {userProfile.isVerified && <BadgeCheck className="h-5 w-5 text-primary" />}
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-8">
        <Avatar className="w-24 h-24 border-2">
          <AvatarImage src={userProfile.avatarUrl} alt={userProfile.name} />
          <AvatarFallback className="text-3xl">
            {userProfile.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 flex justify-around">
          <StatItem label="Postingan" value={userProfile.stats.posts} />
          <UserListDialog userIds={userProfile.followers || []} title="Pengikut" disabled={!canViewProfile}>
            <StatItem label="Pengikut" value={userProfile.stats.followers} isDisabled={!canViewProfile} />
          </UserListDialog>
          <UserListDialog userIds={userProfile.following || []} title="Mengikuti" disabled={!canViewProfile}>
             <StatItem label="Mengikuti" value={userProfile.stats.following} isDisabled={!canViewProfile} />
          </UserListDialog>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xl font-bold">{userProfile.name}</p>
        {userProfile.bio && (
          <TruncatedText text={userProfile.bio} lineClamp={2} className="mt-2 text-foreground/90" />
        )}
      </div>

      <div className="mt-6">
        <Button
          className="w-full"
          onClick={handleFollowToggle}
          disabled={followIsLoading}
          variant={buttonVariant}
        >
          {followIsLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
          {buttonText}
        </Button>
      </div>

      <Separator className="my-8" />

      <div>
        <h2 className="text-xl font-bold font-headline mb-4 text-center">
          Postingan
        </h2>
        {canViewProfile ? (
          <>
            <div className="space-y-6">
              {userPosts.length > 0 ? (
                  userPosts.map((post) => <PostCard key={post.id} postData={post} author={post.author} onPostDelete={handlePostDelete} />)
              ) : (
                  <p className="text-center text-muted-foreground py-8">
                  Belum ada postingan.
                  </p>
              )}
            </div>
            {postsHaveMore && (
              <div className="mt-8 text-center">
                <Button onClick={() => fetchUserPosts(false)} disabled={isFetchingMorePosts}>
                  {isFetchingMorePosts ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memuat...
                    </>
                  ) : (
                    'Muat Lebih Banyak'
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
            <div className="text-center py-10 border rounded-lg bg-muted/50">
                <Lock className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Akun ini Privat</h3>
                <p className="mt-1 text-muted-foreground">Ikuti untuk melihat postingan mereka.</p>
            </div>
        )}
      </div>
    </div>
  );
}
