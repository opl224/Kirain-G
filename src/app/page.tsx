import { PostCard } from '@/components/PostCard';
import { posts } from '@/lib/data';

export default function HomePage() {
  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <h1 className="text-4xl font-bold mb-8 text-center font-headline tracking-tight">
        NotaSphere
      </h1>
      <div className="space-y-6">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
