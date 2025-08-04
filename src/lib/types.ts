export interface User {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  bio: string;
  stats: {
    posts: number;
    followers: number;
    following: number;
  };
}

export interface Post {
  id: string;
  author: User;
  content: string;
  tags?: string[];
  likes: number;
  comments: number;
}

export interface Notification {
  id: string;
  type: 'like' | 'follow';
  user: User;
  content: string;
  timestamp: string;
}
