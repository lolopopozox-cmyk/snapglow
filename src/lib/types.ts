/**
 * Snap Glow domain types (v5 — Supabase-backed shared accounts).
 *
 * Accounts and all public content live in Supabase (Postgres + Auth +
 * Storage). Passwords are handled by Supabase Auth — never stored in
 * app code. There are no fake users: every record belongs to a real
 * signed-up account. Empty states are used instead of sample data.
 */

export interface User {
  id: string; // Supabase auth uuid
  username: string; // without @, lowercase
  displayName: string;
  bio: string;
  /** avatar gradient hue (0-360) */
  hue: number;
  /** uploaded avatar photo (data URL, downscaled) */
  avatar?: string;
  /** emoji persona avatar (optional) */
  avatarEmoji?: string;
  /** profile theme id (level-gated) */
  theme?: string;
  /** Glow Points earned through activity (server-maintained) */
  points: number;
  /** earned badge ids */
  badges: string[];
  /** YYYY-MM-DD of the last daily-login bonus */
  lastLoginDay: string;
  joinedAt: string; // ISO
  /** admin flag (from admins table, session user only) */
  isAdmin?: boolean;
  /** demo/test account marker (admin-managed) */
  isDemo?: boolean;
  isSuspended?: boolean;
}

export interface FlexCardData {
  id: string;
  ownerId: string;
  title: string;
  caption: string;
  template: string; // CardTemplate id
  imageKind: 'art' | 'upload';
  /** public storage URL of the user's uploaded photo */
  imagePath?: string;
  /** data URL of the user's own uploaded photo (creator's browser only) */
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

export interface BattleComment {
  id: string;
  battleId: string;
  authorId: string;
  text: string;
  createdAt: string;
}

export type BattleStatus = 'pending' | 'live' | 'declined' | 'ended' | 'cancelled';

export interface Battle {
  id: string;
  title: string;
  cardAId: string;
  /** null until a challenge is accepted */
  cardBId: string | null;
  createdBy: string; // user id (challenger)
  /** invited opponent (null = open challenge anyone can accept) */
  opponentId: string | null;
  status: BattleStatus;
  /** 'a' | 'b' | 'tie' | null — authoritative once ended */
  winner: 'a' | 'b' | 'tie' | null;
  durationHours: number;
  createdAt: string;
  /** ISO — empty string while pending */
  endsAt: string;
  acceptedAt?: string | null;
}

export interface BattleTally {
  a: number;
  b: number;
  /** user ids that already voted — one vote per account */
  voters: string[];
}

export interface Report {
  id: string;
  targetType: 'post' | 'card' | 'user' | 'battle' | 'comment';
  targetId: string;
  reason: string;
  details: string;
  reporterId: string | null;
  createdAt: string;
  status?: 'open' | 'reviewed' | 'actioned' | 'dismissed';
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
