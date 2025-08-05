
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
import { Heart, MessageCircle, Share2, BadgeCheck } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export function PostCard({ post }: { post: Post }) {
  const { user } = useAuth();
  const profileLink = user && user.uid === post.author.id ? '/profile' : `/user?id=${post.author.id}`;

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
          <Link href={profileLink}>
            <p className="text-xs text-muted-foreground hover:underline">@{post.author.handle}</p>
          </Link>
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
      <CardFooter className="bg-muted/50 p-2 flex justify-around">
        <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
          <Heart className="h-4 w-4" />
          <span>{post.likes}</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
          <MessageCircle className="h-4 w-4" />
          <span>{post.comments}</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
          <Share2 className="h-4 w-4" />
          <span>Share</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
