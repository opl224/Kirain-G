
import { Timestamp } from "firebase/firestore";

export interface User {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  bio: string;
  isPrivate?: boolean;
  stats: {
    posts: number;
    followers: number;
    following: number;
  };
  // Add followers and following arrays to track relationships
  followers?: string[]; // Array of user IDs
  following?: string[]; // Array of user IDs
}

export interface Post {
  id: string;
  author: {
    id: string;
    name: string;
    handle: string;
    avatarUrl: string;
  }
  content: string;
  tags?: string[];
  likes: number;
  comments: number;
  createdAt: Timestamp;
}

export interface Notification {
  id: string;
  type: 'like' | 'follow';
  user: User; // The user who triggered the notification
  content: string;
  createdAt: Timestamp;
}

    
