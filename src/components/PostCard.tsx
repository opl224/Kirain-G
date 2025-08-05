
'use client';

import type { Post } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Bookmark, BadgeCheck, Loader } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, increment, addDoc, collection, serverTimestamp, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export function PostCard({ post }: { post: Post }) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      setIsLiked(post.likedBy?.includes(user.uid) || false);
      
      const userRef = doc(db, 'users', user.uid);
      getDoc(userRef).then(docSnap => {
        if(docSnap.exists()) {
            const userData = docSnap.data();
            setIsSaved(userData.savedPosts?.includes(post.id) || false);
        }
      })
    }
  }, [user, post]);

  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || isProcessing) return;

    setIsProcessing(true);
    const postRef = doc(db, 'posts', post.id);

    try {
      if (isLiked) {
        // Unlike
        await updateDoc(postRef, {
          likedBy: arrayRemove(user.uid),
          likes: increment(-1)
        });
        setLikeCount(prev => prev - 1);
        setIsLiked(false);
        // Remove notification if it exists
        const notifQuery = query(collection(db, "notifications"), 
                                where("type", "==", "like"),
                                where("relatedPostId", "==", post.id),
                                where("sender.id", "==", user.uid),
                                where("recipientId", "==", post.author.id));
        const notifSnapshot = await getDocs(notifQuery);
        notifSnapshot.forEach(async (doc) => {
            await deleteDoc(doc.ref);
        });
      } else {
        // Like
        await updateDoc(postRef, {
          likedBy: arrayUnion(user.uid),
          likes: increment(1)
        });
        setLikeCount(prev => prev + 1);
        setIsLiked(true);
        
        // Add notification, but not if you're liking your own post
        if (user.uid !== post.author.id) {
            const currentUserDoc = await getDoc(doc(db, 'users', user.uid));
            if(currentUserDoc.exists()) {
              const currentUserData = currentUserDoc.data();
              await addDoc(collection(db, "notifications"), {
                  recipientId: post.author.id,
                  sender: {
                      id: user.uid,
                      name: currentUserData.name,
                      handle: currentUserData.handle,
                      avatarUrl: currentUserData.avatarUrl,
                  },
                  type: 'like',
                  content: `menyukai postingan Anda.`,
                  relatedPostId: post.id,
                  read: false,
                  createdAt: serverTimestamp(),
              });
            }
        }
      }
    } catch (error) {
        console.error("Error toggling like: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Gagal memproses suka. Silakan coba lagi."
        })
    } finally {
        setIsProcessing(false);
    }
  };

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || isProcessing) return;

    setIsProcessing(true);
    const userRef = doc(db, 'users', user.uid);

    try {
        if (isSaved) {
            // Unsave
            await updateDoc(userRef, {
                savedPosts: arrayRemove(post.id)
            });
            setIsSaved(false);
            toast({ title: "Postingan dihapus dari simpanan." });
        } else {
            // Save
            await updateDoc(userRef, {
                savedPosts: arrayUnion(post.id)
            });
            setIsSaved(true);
            toast({ title: "Postingan disimpan!" });
        }
    } catch (error) {
         console.error("Error toggling save: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Gagal menyimpan postingan. Silakan coba lagi."
        })
    } finally {
        setIsProcessing(false);
    }
  }


  const profileLink = user && user.uid === post.author.id ? '/profile' : `/user?id=${post.author.id}`;
  const postDate = post.createdAt ? format(post.createdAt.toDate(), 'dd MMM yyyy', { locale: id }) : '';

  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center gap-3 p-4">
        <Link href={profileLink}>
          <Avatar>
            <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
            <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-grow">
          <div className="flex items-center gap-1">
            <Link href={profileLink}>
              <p className="font-semibold text-card-foreground hover:underline">{post.author.name}</p>
            </Link>
            {post.author.isVerified && (
              <BadgeCheck className="h-4 w-4 text-primary" />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link href={profileLink}>
              <span className="hover:underline">@{post.author.handle}</span>
            </Link>
            {postDate && (
              <>
                <span>·</span>
                <span>{postDate}</span>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <p className="text-base text-foreground whitespace-pre-wrap">
          {post.content}
        </p>
        {post.tags && post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-muted/50 p-2 flex justify-between">
        <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-2 text-muted-foreground hover:text-primary"
            onClick={handleLikeToggle}
            disabled={isProcessing}
        >
          {isProcessing ? <Loader className="h-4 w-4 animate-spin"/> : <Heart className={cn("h-4 w-4", isLiked && "fill-current text-red-500")} />}
          <span>{likeCount}</span>
        </Button>
        <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-2 text-muted-foreground hover:text-primary"
            onClick={handleSaveToggle}
            disabled={isProcessing}
        >
          {isProcessing ? <Loader className="h-4 w-4 animate-spin"/> : <Bookmark className={cn("h-4 w-4", isSaved && "fill-current text-primary")} />}
        </Button>
      </CardFooter>
    </Card>
  );
}
