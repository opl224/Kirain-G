
'use client';

import { Story } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { useState } from 'react';
import StoryViewer from './StoryViewer';

interface StoryTrayProps {
  stories: Story[];
  isLoading: boolean;
}

const StoryBubble = ({ story, onSelect }: { story: Story; onSelect: (story: Story) => void; }) => (
  <button onClick={() => onSelect(story)} className="flex flex-col items-center gap-2 w-20 text-center">
    <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500">
      <Avatar className="w-16 h-16 border-2 border-background">
        <AvatarImage src={story.author.avatarUrl} alt={story.author.name} />
        <AvatarFallback>{story.author.name.charAt(0)}</AvatarFallback>
      </Avatar>
    </div>
    <p className="text-xs font-medium truncate w-full">{story.author.handle}</p>
  </button>
);

const StoryBubbleSkeleton = () => (
  <div className="flex flex-col items-center gap-2 w-20">
    <Skeleton className="w-16 h-16 rounded-full" />
    <Skeleton className="h-3 w-12" />
  </div>
);

export default function StoryTray({ stories, isLoading }: StoryTrayProps) {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  const handleSelectStory = (story: Story) => {
    setSelectedStory(story);
  };

  const closeViewer = () => {
    setSelectedStory(null);
  };
  
  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <StoryBubbleSkeleton key={i} />)
        ) : (
          stories.map((story) => <StoryBubble key={story.id} story={story} onSelect={handleSelectStory} />)
        )}
      </div>
      
      <Dialog open={!!selectedStory} onOpenChange={(open) => !open && closeViewer()}>
        <DialogContent className="p-0 bg-black border-none overflow-hidden data-[state=open]:animate-none w-full h-full max-w-full max-h-full rounded-none sm:max-w-md sm:h-[90vh] sm:max-h-[90vh] sm:rounded-lg">
            <DialogTitle className="sr-only">Penampil Cerita</DialogTitle>
            {selectedStory && <StoryViewer story={selectedStory} onClose={closeViewer} />}
            <DialogClose className="hidden" />
        </DialogContent>
      </Dialog>
    </>
  );
}
