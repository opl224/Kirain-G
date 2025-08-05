
'use client';

import { Story } from '@/lib/types';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Progress } from './ui/progress';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface StoryViewerProps {
    story: Story;
    onClose: () => void;
}

export default function StoryViewer({ story, onClose }: StoryViewerProps) {
    const [progress, setProgress] = useState(0);
    const duration = story.mediaType === 'video' ? (story.duration || 15) * 1000 : 5000; // 5s for images

    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        const interval = setInterval(() => {
            setProgress(p => p + (100 / (duration / 100)));
        }, 100);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, [story, duration, onClose]);
    
    const timeAgo = story.createdAt ? formatDistanceToNow(story.createdAt.toDate(), { addSuffix: true }) : 'baru saja';
    const profileLink = `/user?id=${story.author.id}`;

    return (
        <div className="relative w-full h-full rounded-lg overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 right-0 p-4 z-10">
                <Progress value={progress} className="h-1" />
                <div className="flex items-center justify-between mt-2">
                    <Link href={profileLink} onClick={onClose} className="flex items-center gap-2">
                         <Avatar className="w-8 h-8">
                            <AvatarImage src={story.author.avatarUrl} />
                            <AvatarFallback>{story.author.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <p className="font-semibold text-white text-sm">{story.author.handle}</p>
                        <p className="text-xs text-neutral-300">{timeAgo}</p>
                    </Link>
                    <button onClick={onClose} className="text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {story.mediaType === 'image' ? (
                <img src={story.mediaUrl} className="w-full h-full object-contain" alt={`Story by ${story.author.name}`} />
            ): (
                <video src={story.mediaUrl} className="w-full h-full object-contain" autoPlay onEnded={onClose} />
            )}
        </div>
    );
}
