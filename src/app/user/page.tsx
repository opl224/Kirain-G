
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
} from 'firebase/firestore';
import type { User, Post } from '@/lib/types';
import { ArrowLeft, Loader, BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { PostCard } from '@/components/PostCard';
import { Separator } from '@/components/ui/separator';
import TruncatedText from '@/components/TruncatedText';
import UserListDialog from '@/components/UserListDialog';

function StatItem({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="text-center">
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
  const [followIsLoading, setFollowIsLoading] = useState(false);

  const { toast } = useToast();

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
          if (authUser && profileData.followers?.includes(authUser.uid)) {
            setIsFollowing(true);
          }
        } else {
          console.log('No such user!');
          router.push('/'); // Or a 404 page
        }

        // Fetch user posts
        const postsCollection = collection(db, 'posts');
        const q = query(
          postsCollection,
          where('author.id', '==', userId),
          orderBy('createdAt', 'desc')
        );
        const postSnapshot = await getDocs(q);
        const postsData = postSnapshot.docs.map((doc) => ({
          ...(doc.data() as Post),
          id: doc.id,
        }));
        setUserPosts(postsData);
      } catch (error) {
        console.error('Error fetching profile data: ', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId, authIsLoading, authUser, router]);

  const handleFollowToggle = async () => {
    if (!authUser) {
      toast({
        variant: 'destructive',
        title: 'Not Logged In',
        description: 'You must be logged in to follow users.',
      });
      return;
    }
    if (!userProfile) return;

    setFollowIsLoading(true);
    const currentUserRef = doc(db, 'users', authUser.uid);
    const targetUserRef = doc(db, 'users', userProfile.id);

    try {
      if (isFollowing) {
        // Unfollow
        await updateDoc(currentUserRef, {
          following: arrayRemove(userProfile.id),
        });
        await updateDoc(targetUserRef, {
          followers: arrayRemove(authUser.uid),
          'stats.followers': increment(-1),
        });
         await updateDoc(currentUserRef, {
          'stats.following': increment(-1),
        });
        setUserProfile(p => p ? {...p, stats: {...p.stats, followers: p.stats.followers - 1}, followers: p.followers?.filter(id => id !== authUser.uid)} : null);
        toast({ title: `You unfollowed @${userProfile.handle}` });
      } else {
        // Follow
        await updateDoc(currentUserRef, {
          following: arrayUnion(userProfile.id),
        });
        await updateDoc(targetUserRef, {
          followers: arrayUnion(authUser.uid),
          'stats.followers': increment(1),
        });
        await updateDoc(currentUserRef, {
          'stats.following': increment(1),
        });
        
         // Create a notification for the followed user
        const authUserDoc = await getDoc(currentUserRef);
        const authUserData = authUserDoc.data() as User;
        
        await addDoc(collection(db, "notifications"), {
            recipientId: userProfile.id,
            sender: {
                id: authUser.uid,
                name: authUserData.name,
                handle: authUserData.handle,
                avatarUrl: authUserData.avatarUrl,
            },
            type: 'follow',
            content: `started following you.`,
            read: false,
            createdAt: serverTimestamp(),
        });


        setUserProfile(p => p ? {...p, stats: {...p.stats, followers: p.stats.followers + 1}, followers: [...(p.followers || []), authUser.uid]} : null);
        toast({ title: `You are now following @${userProfile.handle}` });
      }
      setIsFollowing(!isFollowing);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not update follow status. Please try again.',
      });
      console.error(error);
    } finally {
      setFollowIsLoading(false);
    }
  };

  if (isLoading || authIsLoading || !userProfile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="flex items-center gap-2 mb-4 h-10">
         <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div className="flex items-center gap-2">
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
          <StatItem label="Posts" value={userPosts.length} />
          <UserListDialog userIds={userProfile.followers || []} title="Followers">
            <div className="text-center cursor-pointer">
                <p className="text-lg font-bold">{userProfile.stats.followers}</p>
                <p className="text-sm text-muted-foreground">Followers</p>
            </div>
          </UserListDialog>
          <UserListDialog userIds={userProfile.following || []} title="Following">
             <div className="text-center cursor-pointer">
                <p className="text-lg font-bold">{userProfile.stats.following}</p>
                <p className="text-sm text-muted-foreground">Following</p>
            </div>
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
          variant={isFollowing ? 'outline' : 'default'}
        >
          {followIsLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isFollowing ? 'Following' : 'Follow'}
        </Button>
      </div>

      <Separator className="my-8" />

      <div>
        <h2 className="text-xl font-bold font-headline mb-4 text-center">
          Notes
        </h2>
        <div className="space-y-6">
          {userPosts.length > 0 ? (
            userPosts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No notes yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
