
'use client';

import { Story } from '@/lib/types';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Progress } from './ui/progress';
import { X, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

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
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const currentStory = stories[storyIndex];
    const timeAgo = currentStory.createdAt ? formatDistanceToNow(currentStory.createdAt.toDate(), { addSuffix: true }) : 'baru saja';
    const profileLink = `/user?id=${currentStory.author.id}`;

    const goToNextStory = useCallback(() => {
        setStoryIndex(prevIndex => {
            if (prevIndex < stories.length - 1) {
                return prevIndex + 1;
            }
            onClose(); // Close viewer after the last story
            return prevIndex;
        });
    }, [stories.length, onClose]);

    const goToPrevStory = () => {
        setStoryIndex(prevIndex => Math.max(0, prevIndex - 1));
    };

    const startTimer = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        setProgress(0);

        const video = videoRef.current;
        const duration = currentStory.mediaType === 'video' && video?.duration ? video.duration * 1000 : STORY_DURATION;

        if (isPaused) return;

        progressIntervalRef.current = setInterval(() => {
             if (!isPaused) {
                setProgress(p => {
                    const newProgress = p + (100 / (duration / 100));
                    if (newProgress >= 100) {
                        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
                        return 100;
                    }
                    return newProgress;
                });
            }
        }, 100);

        timerRef.current = setTimeout(goToNextStory, duration);
    }, [currentStory.mediaType, goToNextStory, isPaused]);

    useEffect(() => {
      startTimer();
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      }
    }, [storyIndex, startTimer]);

    useEffect(() => {
        const video = videoRef.current;
        if (video) {
            video.pause();
            video.load();
            if (!isPaused) {
                video.play().catch(console.error);
            }
        }
    }, [storyIndex, isPaused]);

     useEffect(() => {
        const video = videoRef.current;
        if (isPaused) {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            video?.pause();
        } else {
            startTimer();
            video?.play().catch(console.error);
        }
    }, [isPaused, startTimer]);


    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMuted(!isMuted);
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
        }
    };

    const handleInteractionStart = () => setIsPaused(true);
    const handleInteractionEnd = () => setIsPaused(false);
    
    const handleClickNavigation = (e: React.MouseEvent<HTMLDivElement>) => {
        const clickX = e.clientX;
        const screenWidth = window.innerWidth;
        if (clickX < screenWidth / 3) {
            goToPrevStory();
        } else if (clickX > (screenWidth * 2) / 3) {
            goToNextStory();
        }
    };


    return (
        <div 
            className="relative w-full h-full rounded-lg overflow-hidden flex flex-col bg-black"
            onMouseDown={handleInteractionStart}
            onMouseUp={handleInteractionEnd}
            onMouseLeave={handleInteractionEnd}
            onTouchStart={handleInteractionStart}
            onTouchEnd={handleInteractionEnd}
        >
            <div className="absolute top-0 left-0 right-0 p-4 z-10">
                <div className="flex items-center gap-1 w-full">
                    {stories.map((_, idx) => (
                        <div key={idx} className="relative w-full h-1 bg-white/30 rounded-full overflow-hidden">
                           {idx < storyIndex && <div className="absolute top-0 left-0 h-full w-full bg-white" />}
                           {idx === storyIndex && (
                                <div 
                                    className="absolute top-0 left-0 h-full bg-white"
                                    style={{ width: `${progress}%` }}
                                />
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

            <div className="absolute inset-0 z-20 flex" onClick={handleClickNavigation}>
                <div className="flex-1" />
                <div className="flex-1" />
                <div className="flex-1" />
            </div>

            {currentStory.mediaType === 'image' ? (
                <img src={currentStory.mediaUrl} className="w-full h-full object-contain" alt={`Story by ${currentStory.author.name}`} />
            ): (
                <video ref={videoRef} src={currentStory.mediaUrl} className="w-full h-full object-contain" autoPlay muted={isMuted} playsInline />
            )}
        </div>
    );
}
