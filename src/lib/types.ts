
import { Timestamp } from "firebase/firestore";

export interface User {
  id: string;
  name: string;
  email: string;
  handle: string;
  avatarUrl: string;
  bio: string;
  isPrivate?: boolean;
  isVerified?: boolean; // Added for verification status
  stats: {
    posts: number;
    followers: number;
    following: number;
  };
  followers?: string[]; // Array of user IDs
  following?: string[]; // Array of user IDs
  savedPosts?: string[]; // Array of post IDs
  followRequests?: string[]; // Array of user IDs who have requested to follow
  createdAt?: Timestamp;
}

export interface Post {
  id: string;
  author: {
    id: string;
    name: string;
    handle: string;
    avatarUrl: string;
    isVerified?: boolean;
  }
  content: string;
  tags?: string[];
  likes: number; // This will be the count of likedBy
  likedBy?: string[]; // Array of user IDs who liked the post
  comments: number;
  createdAt: Timestamp;
}

export interface Story {
  id: string;
  author: {
    id: string;
    name: string;
    handle: string;
    avatarUrl: string;
    isVerified?: boolean;
  }
  mediaUrl: string;
  mediaType: 'image' | 'video';
  createdAt: Timestamp;
  duration?: number;
}


export interface Notification {
  id: string;
  type: 'like' | 'follow' | 'verification_request' | 'follow_request';
  recipientId: string; // The user who should receive this notification
  sender: { // The user who triggered the notification
    id: string;
    name: string;
    handle: string;
    avatarUrl: string;
  };
  content: string;
  createdAt: Timestamp;
  read: boolean;
  relatedPostId?: string; // Optional: for 'like' notifications
}

    