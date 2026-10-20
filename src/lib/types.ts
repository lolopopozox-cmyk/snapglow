/**
 * Snap Glow domain types (v4 — real-feeling local accounts).
 *
 * Accounts live in this browser's localStorage only. There are no fake
 * users: every record belongs to someone who actually signed up here.
 * Empty states ("Be the first to post!") are used instead of sample data.
 */

export interface User {
  id: string; // 'u-…'
  username: string; // without @, lowercase
  displayName: string;
  bio: string;
  /** avatar gradient hue (0-360) */
  hue: number;
  /** SHA-256 hex digest — never a plaintext password */
  passwordHash: string;
  /** Glow Points earned through activity */
  points: number;
  /** earned badge ids (voter rewards, milestones) */
  badges: string[];
  /** YYYY-MM-DD of the last daily-login bonus */
  lastLoginDay: string;
  joinedAt: string; // ISO
}

export interface FlexCardData {
  id: string;
  ownerId: string;
  title: string;
  caption: string;
  template: string; // CardTemplate id
  imageKind: 'art' | 'upload';
  /** data URL of the user's own uploaded photo (this browser only) */
  imageDataUrl?: string;
  /** seed for generative placeholder art */
  artSeed: string;
  /** user-entered streak number — NOT verified by Snapchat */
  streak: number;
  /** user-entered streak label, e.g. "Streak with @alex" */
  streakLabel: string;
  badges: string[]; // badge ids
  likes: string[]; // user ids — one entry per user, no duplicates
  /** YYYY-MM-DD when created for that day's Daily Challenge */
  challengeDay?: string;
  createdAt: string;
  published: boolean;
}

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  text: string;
  createdAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  cardId?: string;
  caption: string;
  tags: string[];
  likes: string[]; // user ids — one entry per user, no duplicates
  comments: PostComment[];
  shares: number;
  createdAt: string;
}

export type BattleStatus = 'live' | 'ended';

export interface Battle {
  id: string;
  title: string;
  cardAId: string;
  cardBId: string;
  createdBy: string; // user id
  createdAt: string;
  endsAt: string; // ISO — default 12h after creation
}

export interface BattleTally {
  a: number;
  b: number;
  /** user ids that already voted — one vote per account */
  voters: string[];
}

export interface Report {
  id: string;
  targetType: 'post' | 'card' | 'user' | 'battle';
  targetId: string;
  reason: string;
  details: string;
  reporterId: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  /** recipient account id */
  userId: string;
  kind: 'welcome' | 'level-up' | 'battle-ending' | 'battle-ended' | 'challenge' | 'follower' | 'like-milestone';
  text: string;
  /** in-app link, e.g. "/battles/abc" */
  link?: string;
  createdAt: string;
  read: boolean;
  /** for computed notifications that can be dismissed */
  dismissKey?: string;
}

export interface Achievement {
  id: string;
  label: string;
  blurb: string;
  unlocked: boolean;
}

/** Glow level ladder shown on profiles and cards. */
export interface GlowLevel {
  name: string;
  minPoints: number;
}
