
'use client';

import { Story } from '@/lib/types';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Progress } from './ui/progress';
import { X, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface StoryViewerProps {
    stories: Story[];
    onClose: () => void;
}

const STORY_DURATION = 5000; // 5 seconds for images

export default function StoryViewer({ stories, onClose }: StoryViewerProps) {
    const [storyIndex, setStoryIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const requestRef = useRef<number>();


    const currentStory = stories[storyIndex];

    const goToNextStory = useCallback(() => {
        setStoryIndex(prevIndex => prevIndex + 1);
    }, []);

    const goToPrevStory = () => {
        setStoryIndex(prevIndex => Math.max(0, prevIndex - 1));
    };

    // Effect to handle closing the viewer when stories end
    useEffect(() => {
        if (storyIndex >= stories.length) {
            onClose();
        }
    }, [storyIndex, stories.length, onClose]);

    const startTimer = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (isPaused || !currentStory) return;

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
            const startTime = Date.now() - (progress / 100) * STORY_DURATION;

            const tick = () => {
                if (isPaused) return;
                const elapsedTime = Date.now() - startTime;
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
    }, [currentStory, isPaused, goToNextStory, progress]);


    useEffect(() => {
        setProgress(0);
    }, [storyIndex]);

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
            if (isPaused) {
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
    }, [isPaused]);

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMuted(!isMuted);
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
        }
    };

    const handleInteractionStart = () => setIsPaused(true);
    const handleInteractionEnd = () => {
        // Use a small timeout to distinguish between a tap and a hold
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
    
    const timeAgo = currentStory.createdAt ? formatDistanceToNow(currentStory.createdAt.toDate(), { locale: id }) : 'baru saja';
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
                     <div className="flex items-center gap-4">
                        {currentStory.mediaType === 'video' && (
                            <button onClick={toggleMute} className="text-white">
                                {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                            </button>
                        )}
                        <button onClick={onClose} className="text-white">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
