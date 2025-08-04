import type { User, Post, Notification } from './types';

export const currentUser: User = {
  id: 'user-1',
  name: 'You',
  handle: 'you',
  avatarUrl: 'https://placehold.co/100x100.png',
  bio: 'Just a user trying out NotaSphere. Sharing thoughts and exploring ideas. Let\'s connect and create something amazing together!',
  stats: {
    posts: 3,
    followers: 120,
    following: 75,
  },
};

export const users: User[] = [
  currentUser,
  {
    id: 'user-2',
    name: 'Alex Doe',
    handle: 'alexdoe',
    avatarUrl: 'https://placehold.co/100x100.png',
    bio: 'Designer & Dreamer. Crafting pixels and experiences.',
    stats: { posts: 15, followers: 2300, following: 150 },
  },
  {
    id: 'user-3',
    name: 'Jane Smith',
    handle: 'janesmith',
    avatarUrl: 'https://placehold.co/100x100.png',
    bio: 'Developer and tech enthusiast. Turning coffee into code.',
    stats: { posts: 42, followers: 5400, following: 80 },
  },
  {
    id: 'user-4',
    name: 'Sam Wilson',
    handle: 'samwilson',
    avatarUrl: 'https://placehold.co/100x100.png',
    bio: 'Photographer capturing moments. Seeing the world through a lens.',
    stats: { posts: 120, followers: 10200, following: 300 },
  },
];


export const posts: Post[] = [
  {
    id: 'post-1',
    author: users[1],
    content: 'The principles of good design are timeless. Simplicity, clarity, and honesty are key. Whether you\'re designing a poster or a complex web app, these fundamentals always apply. What are your core design principles?',
    tags: ['design', 'ui', 'ux', 'philosophy'],
    likes: 125,
    comments: 12,
  },
  {
    id: 'post-2',
    author: users[2],
    content: 'Just shipped a new feature using server components in Next.js. The performance gains are noticeable, especially on initial page load. It feels like magic to write what looks like React but runs on the server. Highly recommend exploring this if you haven\'t already.',
    tags: ['react', 'nextjs', 'webdev', 'performance'],
    likes: 340,
    comments: 45,
  },
  {
    id: 'post-3',
    author: users[3],
    content: 'Chasing the golden hour this evening. The light was absolutely perfect, casting long shadows and bathing everything in a warm glow. There\'s a certain peace that comes with watching the sun set. #photography #goldenhour',
    tags: ['photography', 'nature', 'sunset'],
    likes: 892,
    comments: 88,
  },
  {
    id: 'post-4',
    author: currentUser,
    content: 'First note on NotaSphere! Excited to see how this platform grows and to connect with other creative minds.',
    tags: ['introduction', 'newbeginnings'],
    likes: 12,
    comments: 2,
  },
];

export const notifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'like',
    user: users[1],
    content: 'liked your note: "First note on NotaSphere!"',
    timestamp: '2 hours ago',
  },
  {
    id: 'notif-2',
    type: 'follow',
    user: users[2],
    content: 'started following you.',
    timestamp: '5 hours ago',
  },
  {
    id: 'notif-3',
    type: 'like',
    user: users[3],
    content: 'liked your note: "First note on NotaSphere!"',
    timestamp: '1 day ago',
  },
  {
    id: 'notif-4',
    type: 'follow',
    user: users[1],
    content: 'started following you.',
    timestamp: '2 days ago',
  }
];
