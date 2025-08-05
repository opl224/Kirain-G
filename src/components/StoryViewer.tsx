
'use client';

import { Story } from '@/lib/types';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Progress } from './ui/progress';
import { X, Volume2, VolumeX, Trash2, Loader } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { db, supabase } from '@/lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from './ui/button';
import { cn } from '@/lib/utils';

interface StoryViewerProps {
    stories: Story[];
    onClose: () => void;
    onStoryDelete?: (storyId: string, authorId: string) => void;
    onAllStoriesViewed: (authorId: string) => void;
}

const STORY_DURATION = 5000; // 5 seconds for images

export default function StoryViewer({ stories, onClose, onStoryDelete, onAllStoriesViewed }: StoryViewerProps) {
    const [storyIndex, setStoryIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const { user: authUser } = useAuth();
    const { toast } = useToast();
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const requestRef = useRef<number>();

    const currentStory = stories[storyIndex];
    const isAuthor = authUser?.uid === currentStory?.author.id;

    const goToNextStory = useCallback(() => {
        if (storyIndex < stories.length - 1) {
            setStoryIndex(prevIndex => prevIndex + 1);
        } else {
            onAllStoriesViewed(currentStory.author.id);
            onClose();
        }
    }, [storyIndex, stories, onClose, onAllStoriesViewed, currentStory]);

    const goToPrevStory = () => {
        setStoryIndex(prevIndex => Math.max(0, prevIndex - 1));
    };

    useEffect(() => {
        setProgress(0);
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
        }
    }, [storyIndex]);

    const startTimer = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (isPaused || !currentStory || isDeleting) return;

        if (currentStory.mediaType === 'video' && videoRef.current) {
            const video = videoRef.current;
            
            const onTimeUpdate = () => {
                 if (video.duration) {
                    setProgress((video.currentTime / video.duration) * 100);
                }
            };
            const onEnded = () => goToNextStory();

            video.addEventListener('timeupdate', onTimeUpdate);
            video.addEventListener('ended', onEnded);
            
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    if (error.name !== 'AbortError') {
                        console.error("Video play error:", error);
                    }
                });
            }

            return () => {
                video.removeEventListener('timeupdate', onTimeUpdate);
                video.removeEventListener('ended', onEnded);
            };

        } else {
            let start = Date.now() - (progress / 100) * STORY_DURATION;

            const tick = () => {
                if (isPaused || isDeleting) {
                    start = Date.now() - (progress / 100) * STORY_DURATION;
                    requestRef.current = requestAnimationFrame(tick);
                    return;
                }

                const elapsedTime = Date.now() - start;
                const newProgress = (elapsedTime / STORY_DURATION) * 100;

                if (newProgress >= 100) {
                    setProgress(100);
                    goToNextStory();
                } else {
                    setProgress(newProgress);
                    requestRef.current = requestAnimationFrame(tick);
                }
            };
            requestRef.current = requestAnimationFrame(tick);
        }
    }, [currentStory, isPaused, goToNextStory, progress, isDeleting]);


    useEffect(() => {
        const cleanup = startTimer();
        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
            if (cleanup) {
                cleanup();
            }
        };
    }, [storyIndex, isPaused, startTimer]);


    useEffect(() => {
        const video = videoRef.current;
        if (video) {
            if (isPaused || isDeleting) {
                video.pause();
            } else {
                 const playPromise = video.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        if (error.name !== 'AbortError') {
                            console.error("Video play error on resume:", error);
                        }
                    });
                }
            }
        }
    }, [isPaused, isDeleting]);

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMuted(!isMuted);
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
        }
    };
    
    const handleDeleteStory = async () => {
        if (!isAuthor || !currentStory) return;
        
        setIsDeleting(true);
        try {
            // Delete from Firestore
            const storyRef = doc(db, 'stories', currentStory.id);
            await deleteDoc(storyRef);
            
            // Delete from Supabase Storage
            const filePath = new URL(currentStory.mediaUrl).pathname.split('/stories/').pop();
            if (filePath) {
                 const { error: storageError } = await supabase.storage.from('stories').remove([filePath]);
                 if (storageError) throw new Error(`Gagal menghapus media: ${storageError.message}`);
            }

            toast({ title: "Cerita dihapus." });
            onStoryDelete?.(currentStory.id, currentStory.author.id);
            goToNextStory();

        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Gagal menghapus cerita', description: error.message });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleInteractionStart = () => setIsPaused(true);
    const handleInteractionEnd = () => {
        setTimeout(() => setIsPaused(false), 100);
    }
    
    const handleClickNavigation = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isPaused) return; 
        
        const clickX = e.nativeEvent.offsetX;
        const screenWidth = e.currentTarget.clientWidth;

        if (clickX < screenWidth / 3) {
            goToPrevStory();
        } else { 
            goToNextStory();
        }
    };
    
    if (!currentStory) {
        return null;
    }
    
    let timeAgo = 'baru saja';
    if (currentStory.createdAt) {
        let formattedTime = formatDistanceToNow(currentStory.createdAt.toDate(), { locale: id, addSuffix: false });
        timeAgo = formattedTime.replace("kurang dari ", "").replace("sekitar ", "");
    }
    const profileLink = `/user?id=${currentStory.author.id}`;


    return (
        <div 
            className="relative w-full h-full rounded-lg overflow-hidden flex flex-col bg-black select-none"
        >
            {/* Media content (Image or Video) */}
            {currentStory.mediaType === 'image' ? (
                <img src={currentStory.mediaUrl} className="w-full h-full object-contain" alt={`Story by ${currentStory.author.name}`} />
            ): (
                <video ref={videoRef} src={currentStory.mediaUrl} className="w-full h-full object-contain" autoPlay muted={isMuted} playsInline />
            )}
            
            <div 
                className="absolute inset-0 z-10"
                onMouseDown={handleInteractionStart}
                onMouseUp={handleInteractionEnd}
                onMouseLeave={handleInteractionEnd}
                onTouchStart={handleInteractionStart}
                onTouchEnd={handleInteractionEnd}
                onClick={handleClickNavigation}
            />

            <div className="absolute top-0 left-0 right-0 p-4 z-20" style={{background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 100%)'}}>
                <div className="flex items-center gap-1 w-full">
                    {stories.map((_, idx) => (
                        <div key={idx} className="relative w-full h-1 bg-white/30 rounded-full overflow-hidden">
                           {idx < storyIndex && <div className="absolute top-0 left-0 h-full w-full bg-white" />}
                           {idx === storyIndex && (
                                <Progress value={progress} className="w-full h-full bg-white !p-0 transition-all duration-100 linear" />
                           )}
                        </div>
                    ))}
                </div>
                <div className="flex items-center justify-between mt-2">
                    <Link href={profileLink} onClick={onClose} className="flex items-center gap-2">
                         <Avatar className="w-8 h-8">
                            <AvatarImage src={currentStory.author.avatarUrl} />
                            <AvatarFallback>{currentStory.author.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <p className="font-semibold text-white text-sm">{currentStory.author.handle}</p>
                        <p className="text-xs text-neutral-300">{timeAgo}</p>
                    </Link>
                     <div className="flex items-center gap-4 text-white">
                        {isAuthor && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <button disabled={isDeleting} className="z-30">
                                        {isDeleting ? <Loader className="w-6 h-6 animate-spin" /> : <Trash2 className="w-6 h-6" />}
                                    </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Tindakan ini tidak dapat dibatalkan. Ini akan menghapus cerita Anda secara permanen.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteStory} className={cn(buttonVariants({variant: "destructive"}))}>
                                        Hapus
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                        {currentStory.mediaType === 'video' && (
                            <button onClick={toggleMute} className="z-30">
                                {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                            </button>
                        )}
                        <button onClick={onClose} className="z-30">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
