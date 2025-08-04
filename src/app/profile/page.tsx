import ProfileDisplay from '@/components/ProfileDisplay';
import { currentUser, posts } from '@/lib/data';

export default function ProfilePage() {
  const userPosts = posts.filter((post) => post.author.id === currentUser.id);

  return (
    <div>
      <ProfileDisplay user={currentUser} posts={userPosts} />
    </div>
  );
}
