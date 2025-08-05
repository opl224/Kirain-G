
'use client';

import { Story } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import StoryViewer from './StoryViewer';
import { cn } from '@/lib/utils';

interface StoryTrayProps {
  groupedStories: { [key: string]: Story[] };
  isLoading: boolean;
}

const StoryBubble = ({ story, onSelect, isViewed }: { story: Story; onSelect: (authorId: string) => void; isViewed: boolean; }) => (
  <button onClick={() => onSelect(story.author.id)} className="flex flex-col items-center gap-2 w-20 text-center">
    <div className={cn(
        "relative p-0.5 rounded-full",
        isViewed 
            ? "bg-muted-foreground" 
            : "bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500"
    )}>
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

export default function StoryTray({ groupedStories: initialGroupedStories, isLoading }: StoryTrayProps) {
  const [groupedStories, setGroupedStories] = useState(initialGroupedStories);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);
  const [viewedAuthors, setViewedAuthors] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') {
      return new Set();
    }
    const savedViewed = localStorage.getItem('viewedStoryAuthors');
    return savedViewed ? new Set(JSON.parse(savedViewed)) : new Set();
  });

  useEffect(() => {
    setGroupedStories(initialGroupedStories);
  }, [initialGroupedStories]);

  useEffect(() => {
    localStorage.setItem('viewedStoryAuthors', JSON.stringify(Array.from(viewedAuthors)));
  }, [viewedAuthors]);


  const handleSelectStory = (authorId: string) => {
    setSelectedAuthorId(authorId);
  };

  const closeViewer = () => {
    setSelectedAuthorId(null);
  };

  const handleAllStoriesViewed = (authorId: string) => {
    setViewedAuthors(prev => new Set(prev).add(authorId));
  }
  
  const handleStoryDelete = (storyId: string, authorId: string) => {
    setGroupedStories(prev => {
        const newStories = { ...prev };
        const authorStories = newStories[authorId]?.filter(s => s.id !== storyId);
        
        if (authorStories && authorStories.length > 0) {
            newStories[authorId] = authorStories;
        } else {
            delete newStories[authorId];
            closeViewer(); // Close viewer if no stories left
        }
        return newStories;
    });
  };
  
  const storiesForSelectedUser = selectedAuthorId ? groupedStories[selectedAuthorId] : [];
  const storyAuthors = Object.values(groupedStories).map(storyList => storyList[0]);

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <StoryBubbleSkeleton key={i} />)
        ) : (
          storyAuthors.map((story) => (
              <StoryBubble 
                key={story.author.id} 
                story={story} 
                onSelect={handleSelectStory} 
                isViewed={viewedAuthors.has(story.author.id)}
              />
            )
          )
        )}
      </div>
      
      <Dialog open={!!selectedAuthorId} onOpenChange={(open) => !open && closeViewer()}>
        <DialogContent 
            className="p-0 bg-black border-none overflow-hidden data-[state=open]:animate-none w-screen h-screen max-w-full max-h-full sm:rounded-lg sm:max-w-md sm:h-[90vh] sm:max-h-[90vh]"
            hideCloseButton={true}
        >
            <DialogTitle className="sr-only">Penampil Cerita</DialogTitle>
            {storiesForSelectedUser.length > 0 && 
                <StoryViewer 
                    stories={storiesForSelectedUser} 
                    onClose={closeViewer} 
                    onStoryDelete={handleStoryDelete}
                    onAllStoriesViewed={handleAllStoriesViewed}
                />
            }
        </DialogContent>
      </Dialog>
    </>
  );
}
