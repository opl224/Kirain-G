
'use client';

import { Story } from '@/lib/types';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Progress } from './ui/progress';
import { X, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface StoryViewerProps {
    story: Story;
    onClose: () => void;
}

export default function StoryViewer({ story, onClose }: StoryViewerProps) {
    const [progress, setProgress] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Effect for image-based stories
    useEffect(() => {
        if (story.mediaType === 'image') {
            const duration = 5000; // 5 seconds for images
            setProgress(0);
            const interval = setInterval(() => {
                setProgress(p => p + (100 / (duration / 100)));
            }, 100);
            
            const timer = setTimeout(() => {
                onClose();
            }, duration);

            return () => {
                clearInterval(interval);
                clearTimeout(timer);
            };
        }
    }, [story, onClose]);

    // Effect for video progress tracking
    useEffect(() => {
        const video = videoRef.current;
        if (story.mediaType === 'video' && video) {
            const updateProgress = () => {
                if (video.duration > 0) {
                    setProgress((video.currentTime / video.duration) * 100);
                }
            };
            
            const handleVideoEnd = () => {
                onClose();
            };

            video.addEventListener('timeupdate', updateProgress);
            video.addEventListener('ended', handleVideoEnd);
            
            // Start playback
            video.play().catch(console.error);

            return () => {
                video.removeEventListener('timeupdate', updateProgress);
                video.removeEventListener('ended', handleVideoEnd);
            };
        }
    }, [story.mediaType, onClose]);
    
    const timeAgo = story.createdAt ? formatDistanceToNow(story.createdAt.toDate(), { addSuffix: true }) : 'baru saja';
    const profileLink = `/user?id=${story.author.id}`;

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMuted(!isMuted);
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
        }
    };

    return (
        <div className="relative w-full h-full rounded-lg overflow-hidden flex flex-col bg-black">
            <div className="absolute top-0 left-0 right-0 p-4 z-10">
                <Progress value={progress} className="h-1 bg-white/30" />
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
