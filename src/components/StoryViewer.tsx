
'use client';

import { Story } from '@/lib/types';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Progress } from './ui/progress';
import { X, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface StoryViewerProps {
    story: Story;
    onClose: () => void;
}

export default function StoryViewer({ story, onClose }: StoryViewerProps) {
    const [progress, setProgress] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const imageTimerRef = useRef<NodeJS.Timeout | null>(null);
    const imageProgressIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const remainingTimeRef = useRef<number>(5000); // 5 seconds for images

    const timeAgo = story.createdAt ? formatDistanceToNow(story.createdAt.toDate(), { addSuffix: true }) : 'baru saja';
    const profileLink = `/user?id=${story.author.id}`;

    const startImageStory = useCallback(() => {
        const duration = remainingTimeRef.current;
        const startTime = Date.now();

        if (imageProgressIntervalRef.current) clearInterval(imageProgressIntervalRef.current);
        imageProgressIntervalRef.current = setInterval(() => {
            if (!isPaused) {
                const elapsedTime = Date.now() - startTime;
                const currentProgress = ((5000 - (duration - elapsedTime)) / 5000) * 100;
                setProgress(Math.min(currentProgress, 100));
            }
        }, 100);

        if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
        imageTimerRef.current = setTimeout(() => {
            onClose();
        }, duration);
    }, [isPaused, onClose]);

    const pauseImageStory = useCallback(() => {
        if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
        if (imageProgressIntervalRef.current) clearInterval(imageProgressIntervalRef.current);
        
        const initialDuration = 5000;
        const currentProgress = progress || 0;
        remainingTimeRef.current = initialDuration * (1 - (currentProgress / 100));
    }, [progress]);

    useEffect(() => {
        if (story.mediaType === 'image') {
            if (isPaused) {
                pauseImageStory();
            } else {
                startImageStory();
            }
        }
    }, [story.mediaType, isPaused, startImageStory, pauseImageStory]);

    useEffect(() => {
        const video = videoRef.current;
        if (story.mediaType === 'video' && video) {
            const updateProgress = () => {
                if (video.duration > 0 && !isPaused) {
                    setProgress((video.currentTime / video.duration) * 100);
                }
            };
            const handleVideoEnd = () => onClose();
            
            video.addEventListener('timeupdate', updateProgress);
            video.addEventListener('ended', handleVideoEnd);

            if (isPaused) {
                video.pause();
            } else {
                video.play().catch(console.error);
            }

            return () => {
                video.removeEventListener('timeupdate', updateProgress);
                video.removeEventListener('ended', handleVideoEnd);
            };
        }
    }, [story.mediaType, onClose, isPaused]);

    useEffect(() => {
        return () => {
            if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
            if (imageProgressIntervalRef.current) clearInterval(imageProgressIntervalRef.current);
        }
    }, []);

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMuted(!isMuted);
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
        }
    };

    const handleInteractionStart = () => setIsPaused(true);
    const handleInteractionEnd = () => setIsPaused(false);

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
                <div className="relative w-full h-1 bg-white/30 rounded-full overflow-hidden">
                    <div 
                        className="absolute top-0 left-0 h-full bg-white transition-all duration-100 linear"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex items-center justify-between mt-2">
                    <Link href={profileLink} onClick={onClose} className="flex items-center gap-2">
                         <Avatar className="w-8 h-8">
                            <AvatarImage src={story.author.avatarUrl} />
                            <AvatarFallback>{story.author.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <p className="font-semibold text-white text-sm">{story.author.handle}</p>
                        <p className="text-xs text-neutral-300">{timeAgo}</p>
                    </Link>
                     <div className="flex items-center gap-4">
                        {story.mediaType === 'video' && (
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

            {story.mediaType === 'image' ? (
                <img src={story.mediaUrl} className="w-full h-full object-contain" alt={`Story by ${story.author.name}`} />
            ): (
                <video ref={videoRef} src={story.mediaUrl} className="w-full h-full object-contain" autoPlay muted={isMuted} playsInline />
            )}
        </div>
    );
}
