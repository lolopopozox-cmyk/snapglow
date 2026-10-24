/**
 * Snap Glow data layer (v5 — Supabase).
 * ─────────────────────────────────────────────────────────────
 * Shared accounts & content in Supabase (Postgres + Auth + Storage):
 *  - username/password auth via Supabase (deterministic internal emails,
 *    never shown to users; no forgot-password flow by design)
 *  - votes/likes/follows one-per-account, enforced by DB primary keys
 *    and RLS; battle voting goes through the cast_vote RPC which also
 *    rejects ended battles
 *  - points are awarded by server triggers only (guard trigger blocks
 *    clients from editing their own points)
 *
 * The `SnapGlowApi` surface stays backend-shaped: pages call the same
 * methods as the old localStorage build (see docs/BACKEND_SETUP.md).
 */
import { useSyncExternalStore } from 'react';
import type {
  Achievement,
  Battle,
  BattleComment,
  BattleTally,
  FlexCardData,
  Notification,
  Post,
  PostComment,
  Report,
  User,
} from './types';
import { POINTS, challengeForDay, levelForPoints } from './challenges';
import { uid } from './format';
import { supabase, requireSupabase, authEmailFor } from './supabase';

/* ── state shape ────────────────────────────────────────────── */

export interface StoreState {
  ready: boolean;
  users: User[];
  cards: FlexCardData[];
  posts: Post[];
  battles: Battle[];
  tallies: Record<string, BattleTally>;
  battleComments: BattleComment[];
  /** profileId -> user ids who liked the profile */
  profileLikes: Record<string, string[]>;
  /** weekly Glow Points per user (for the weekly board) */
  weekly: Record<string, number>;
  /** admin-featured creator ids (Discover) */
  featured: string[];
  /** followerId -> followeeIds */
  follows: Record<string, string[]>;
  reports: Report[];
  notifications: Notification[];
  dismissed: string[];
  sessionUserId: string | null;
  storageOk: boolean;
}

const USERNAME_RE = /^[a-z0-9_.]{3,20}$/;

function emptyState(): StoreState {
  return {
    ready: false,
    users: [],
    cards: [],
    posts: [],
    battles: [],
    tallies: {},
    battleComments: [],
    profileLikes: {},
    weekly: {},
    featured: [],
    follows: {},
    reports: [],
    notifications: [],
    dismissed: [],
    sessionUserId: null,
    storageOk: true,
  };
}

let state: StoreState = emptyState();
let version = 0;
let initStarted = false;
let refreshInFlight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function commit(next: Partial<StoreState>) {
  state = { ...state, ...next };
  version += 1;
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
function getVersion() {
  return version;
}

/* ── local (per-browser) notifications ─────────────────────── */

const notifKey = (userId: string) => `snapglow.notifs.${userId}`;
const dismissedKey = (userId: string) => `snapglow.dismissed.${userId}`;

function loadLocalNotifs(userId: string): { notifications: Notification[]; dismissed: string[] } {
  try {
    return {
      notifications: JSON.parse(localStorage.getItem(notifKey(userId)) ?? '[]') as Notification[],
      dismissed: JSON.parse(localStorage.getItem(dismissedKey(userId)) ?? '[]') as string[],
    };
  } catch {
    return { notifications: [], dismissed: [] };
  }
}

function saveLocalNotifs(userId: string) {
  try {
    localStorage.setItem(notifKey(userId), JSON.stringify(state.notifications.slice(0, 60)));
    localStorage.setItem(dismissedKey(userId), JSON.stringify(state.dismissed));
  } catch {
    /* ignore quota */
  }
}

function pushLocalNotification(n: Omit<Notification, 'id' | 'userId' | 'createdAt' | 'read'>) {
  const me = state.sessionUserId;
  if (!me) return;
  state.notifications.unshift({ ...n, id: uid('notif'), userId: me, createdAt: new Date().toISOString(), read: false });
  saveLocalNotifs(me);
}

/* ── hydration ──────────────────────────────────────────────── */

type DbCard = {
  id: string; owner_id: string; title: string; caption: string; template: string;
  image_kind: 'art' | 'upload'; image_path: string | null; art_seed: number;
  streak: number; streak_label: string; badges: string[]; challenge_day: string | null;
  published: boolean; created_at: string;
};
type DbUser = {
  id: string; username: string; display_name: string; bio: string; hue: number;
  avatar: string | null; avatar_emoji: string | null; theme: string;
  points: number; last_login_day: string | null; is_demo: boolean; is_suspended: boolean;
  created_at: string;
};

function mapUser(r: DbUser, badges: string[]): User {
  return {
    id: r.id,
    username: r.username,
    displayName: r.display_name,
    bio: r.bio ?? '',
    hue: r.hue ?? 0,
    avatar: r.avatar ?? undefined,
    avatarEmoji: r.avatar_emoji ?? undefined,
    theme: r.theme,
    points: r.points ?? 0,
    badges,
    lastLoginDay: r.last_login_day ?? '',
    joinedAt: r.created_at,
    isDemo: r.is_demo,
    isSuspended: r.is_suspended,
  };
}

function mapCard(r: DbCard, likes: string[]): FlexCardData {
  return {
    id: r.id,
    ownerId: r.owner_id,
    title: r.title,
    caption: r.caption ?? '',
    template: r.template,
    imageKind: r.image_kind,
    imagePath: r.image_path ?? undefined,
    artSeed: String(r.art_seed),
    streak: r.streak,
    streakLabel: r.streak_label ?? '',
    badges: r.badges ?? [],
    likes,
    challengeDay: r.challenge_day ?? undefined,
    createdAt: r.created_at,
    published: r.published,
  };
}

async function fetchAll(): Promise<void> {
  const sb = requireSupabase();
  // finalize any battles whose countdown passed (idempotent server fn)
  sb.rpc('finalize_battles').then(() => undefined, () => undefined);

  const me = (await sb.auth.getUser()).data.user ?? null;

  const [
    usersR,
    cardsR,
    cardLikesR,
    postsR,
    postLikesR,
    commentsR,
    followsR,
    battlesR,
    votesR,
    bCommentsR,
    bLikesR,
    profileLikesR,
    badgesR,
    weeklyR,
    featuredR,
    reportsR,
  ] = await Promise.all([
    sb.from('profiles').select('*').eq('is_suspended', false),
    sb.from('cards').select('*').or('published.eq.true,owner_id.eq.' + (me?.id ?? '00000000-0000-0000-0000-000000000000')),
    sb.from('card_likes').select('card_id,user_id'),
    sb.from('posts').select('*'),
    sb.from('post_likes').select('post_id,user_id'),
    sb.from('comments').select('*'),
    sb.from('follows').select('follower_id,followee_id,created_at'),
    sb.from('battles').select('*').order('created_at', { ascending: false }),
    sb.from('votes').select('battle_id,user_id,side'),
    sb.from('battle_comments').select('*').order('created_at', { ascending: true }),
    sb.from('battle_likes').select('battle_id,user_id'),
    sb.from('profile_likes').select('profile_id,user_id'),
    sb.from('earned_badges').select('user_id,badge_id'),
    sb.from('weekly_points').select('user_id,points'),
    sb.from('featured').select('user_id'),
    me ? sb.from('reports').select('*').order('created_at', { ascending: false }).limit(200) : Promise.resolve({ data: [] }),
  ]);

  const users = (usersR.data ?? []).map((r: DbUser) => mapUser(r, []));
  const badgesByUser = new Map<string, string[]>();
  for (const b of (badgesR.data ?? []) as Array<{ user_id: string; badge_id: string }>) {
    const arr = badgesByUser.get(b.user_id) ?? [];
    arr.push(b.badge_id);
    badgesByUser.set(b.user_id, arr);
  }
  for (const u of users) u.badges = badgesByUser.get(u.id) ?? [];

  const likesByCard = new Map<string, string[]>();
  for (const l of (cardLikesR.data ?? []) as Array<{ card_id: string; user_id: string }>) {
    const arr = likesByCard.get(l.card_id) ?? [];
    arr.push(l.user_id);
    likesByCard.set(l.card_id, arr);
  }
  const cards = (cardsR.data ?? []).map((r: DbCard) => mapCard(r, likesByCard.get(r.id) ?? []));

  const likesByPost = new Map<string, string[]>();
  for (const l of (postLikesR.data ?? []) as Array<{ post_id: string; user_id: string }>) {
    const arr = likesByPost.get(l.post_id) ?? [];
    arr.push(l.user_id);
    likesByPost.set(l.post_id, arr);
  }
  const commentsByPost = new Map<string, PostComment[]>();
  for (const c of (commentsR.data ?? []) as Array<{ id: string; post_id: string; author_id: string; text: string; created_at: string }>) {
    const arr = commentsByPost.get(c.post_id) ?? [];
    arr.push({ id: c.id, postId: c.post_id, authorId: c.author_id, text: c.text, createdAt: c.created_at });
    commentsByPost.set(c.post_id, arr);
  }
  const posts: Post[] = ((postsR.data ?? []) as Array<{
    id: string; author_id: string; card_id: string | null; caption: string;
    tags: string[]; shares: number; created_at: string;
  }>).map((r) => ({
    id: r.id,
    authorId: r.author_id,
    cardId: r.card_id ?? undefined,
    caption: r.caption,
    tags: r.tags ?? [],
    likes: likesByPost.get(r.id) ?? [],
    comments: commentsByPost.get(r.id) ?? [],
    shares: r.shares ?? 0,
    createdAt: r.created_at,
  }));

  const follows: Record<string, string[]> = {};
  for (const f of (followsR.data ?? []) as Array<{ follower_id: string; followee_id: string }>) {
    (follows[f.follower_id] ??= []).push(f.followee_id);
  }

  const battles: Battle[] = ((battlesR.data ?? []) as Array<{
    id: string; title: string; created_by: string; card_a_id: string; card_b_id: string | null;
    opponent_id: string | null; status: Battle['status']; winner: Battle['winner'];
    duration_hours: number; ends_at: string | null; created_at: string; accepted_at: string | null;
  }>).map((r) => ({
    id: r.id,
    title: r.title,
    cardAId: r.card_a_id,
    cardBId: r.card_b_id,
    createdBy: r.created_by,
    opponentId: r.opponent_id,
    status: r.status,
    winner: r.winner,
    durationHours: r.duration_hours,
    createdAt: r.created_at,
    endsAt: r.ends_at ?? '',
    acceptedAt: r.accepted_at,
  }));

  const tallies: Record<string, BattleTally> = {};
  for (const b of battles) tallies[b.id] = { a: 0, b: 0, voters: [] };
  for (const v of (votesR.data ?? []) as Array<{ battle_id: string; user_id: string; side: 'a' | 'b' }>) {
    const t = tallies[v.battle_id];
    if (!t) continue;
    t[v.side] += 1;
    t.voters.push(v.user_id);
  }

  const battleComments: BattleComment[] = ((bCommentsR.data ?? []) as Array<{
    id: string; battle_id: string; author_id: string; text: string; created_at: string;
  }>).map((r) => ({ id: r.id, battleId: r.battle_id, authorId: r.author_id, text: r.text, createdAt: r.created_at }));

  const profileLikes: Record<string, string[]> = {};
  for (const l of (profileLikesR.data ?? []) as Array<{ profile_id: string; user_id: string }>) {
    (profileLikes[l.profile_id] ??= []).push(l.user_id);
  }

  const weekly: Record<string, number> = {};
  for (const w of (weeklyR.data ?? []) as Array<{ user_id: string; points: number }>) {
    weekly[w.user_id] = Number(w.points) || 0;
  }

  const reports: Report[] = ((reportsR.data ?? []) as Array<{
    id: string; target_type: Report['targetType']; target_id: string; reason: string;
    details: string; reporter_id: string | null; created_at: string; status: Report['status'];
  }>).map((r) => ({
    id: r.id, targetType: r.target_type, targetId: r.target_id, reason: r.reason,
    details: r.details, reporterId: r.reporter_id, createdAt: r.created_at, status: r.status,
  }));

  // diff-based local notifications (level-up / new follower) for the session user
  const prevMe = state.sessionUserId ? state.users.find((u) => u.id === state.sessionUserId) : undefined;
  const nextMe = me ? users.find((u) => u.id === me.id) : undefined;

  commit({
    ready: true,
    users,
    cards,
    posts,
    battles,
    tallies,
    battleComments,
    profileLikes,
    weekly,
    featured: (featuredR.data ?? []).map((f: { user_id: string }) => f.user_id),
    follows,
    reports,
    sessionUserId: me?.id ?? null,
  });

  if (nextMe && prevMe) {
    const before = levelForPoints(prevMe.points);
    const after = levelForPoints(nextMe.points);
    if (after.name !== before.name) {
      pushLocalNotification({
        kind: 'level-up',
        text: `You reached ${after.name} level! ${after.blurb}.`,
        link: `/u/${nextMe.username}`,
      });
    }
    const prevFollowers = Object.values(state.follows).length; // recomputed below on next tick
    void prevFollowers;
  }
}

async function refresh(): Promise<void> {
  if (!supabase) {
    commit({ ready: true });
    return;
  }
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = fetchAll()
    .catch(() => undefined)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

/** Boot: restore session, hydrate data, claim daily-login points. */
async function init(): Promise<void> {
  if (!supabase) {
    commit({ ready: true });
    return;
  }
  const sb = requireSupabase();
  // Session restore can complete AFTER the first getSession (slow storage or
  // token refresh) — re-hydrate whenever the auth state actually changes.
  sb.auth.onAuthStateChange((event, session) => {
    const id = session?.user?.id ?? null;
    if (
      (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') &&
      id &&
      id !== state.sessionUserId
    ) {
      state.notifications = loadLocalNotifs(id).notifications;
      state.dismissed = loadLocalNotifs(id).dismissed;
      refresh().then(() => {
        sb.rpc('claim_daily_login').then(() => refresh(), () => undefined);
      });
    }
    if (event === 'SIGNED_OUT' && state.sessionUserId) {
      refresh();
    }
  });
  const { data } = await sb.auth.getSession();
  const userId = data.session?.user?.id ?? null;
  if (userId) {
    const local = loadLocalNotifs(userId);
    state.notifications = local.notifications;
    state.dismissed = local.dismissed;
  }
  await refresh();
  if (state.sessionUserId) {
    sb.rpc('claim_daily_login').then(() => refresh(), () => undefined);
  }
}

if (!initStarted) {
  initStarted = true;
  init();
}

/* ── badge sync (achievements computed client-side, stored server-side) ── */

async function syncMyBadges() {
  const me = state.sessionUserId ? getUser(state, state.sessionUserId) : undefined;
  if (!me || !supabase) return;
  const unlocked = computeAchievements(state, me.id).filter((a) => a.unlocked).map((a) => a.id);
  const missing = unlocked.filter((b) => !me.badges.includes(b));
  if (!missing.length) return;
  const rows = missing.map((badge_id) => ({ user_id: me.id, badge_id }));
  await supabase.from('earned_badges').upsert(rows, { onConflict: 'user_id,badge_id' });
  me.badges.push(...missing);
  version += 1;
  listeners.forEach((l) => l());
}

/* ── pure selectors ─────────────────────────────────────────── */

export function sessionUser(s: StoreState): User | undefined {
  return s.sessionUserId ? s.users.find((u) => u.id === s.sessionUserId) : undefined;
}
export function getUser(s: StoreState, id: string): User | undefined {
  return s.users.find((u) => u.id === id);
}
export function getUserByUsername(s: StoreState, username: string): User | undefined {
  const clean = username.trim().replace(/^@/, '').toLowerCase();
  return s.users.find((u) => u.username === clean);
}
export function getCard(s: StoreState, id: string): FlexCardData | undefined {
  return s.cards.find((c) => c.id === id);
}
export function getPost(s: StoreState, id: string): Post | undefined {
  return s.posts.find((p) => p.id === id);
}
export function getBattle(s: StoreState, id: string): Battle | undefined {
  return s.battles.find((b) => b.id === id);
}
export function getBattleComments(s: StoreState, battleId: string): BattleComment[] {
  return s.battleComments.filter((c) => c.battleId === battleId);
}
export function profileLikeCount(s: StoreState, userId: string): number {
  return (s.profileLikes[userId] ?? []).length;
}
export function hasLikedProfile(s: StoreState, userId: string): boolean {
  const me = sessionUser(s);
  return !!me && (s.profileLikes[userId] ?? []).includes(me.id);
}

export function isBattleLive(b: Battle, now = Date.now()): boolean {
  if (b.status === 'live' && b.endsAt) return new Date(b.endsAt).getTime() > now;
  return false;
}

/** 'a' | 'b' | 'tie' | null (null while undecided) — authoritative from DB. */
export function battleWinner(s: StoreState, battleId: string, _now = Date.now()): 'a' | 'b' | 'tie' | null {
  const b = getBattle(s, battleId);
  if (!b || b.status !== 'ended') return null;
  return b.winner;
}

export interface UserStats {
  cards: number;
  posts: number;
  likesReceived: number;
  wins: number;
  losses: number;
  followers: number;
  following: number;
  votesCast: number;
  profileLikes: number;
}

export function votesCastBy(s: StoreState, userId: string): number {
  let n = 0;
  for (const t of Object.values(s.tallies)) {
    if (t.voters.includes(userId)) n += 1;
  }
  return n;
}

export function userStats(s: StoreState, userId: string, now = Date.now()): UserStats {
  const cards = s.cards.filter((c) => c.ownerId === userId && c.published);
  const posts = s.posts.filter((p) => p.authorId === userId);
  const likesReceived =
    cards.reduce((n, c) => n + c.likes.length, 0) + posts.reduce((n, p) => n + p.likes.length, 0);
  let wins = 0;
  let losses = 0;
  for (const b of s.battles) {
    if (b.status !== 'ended' || !b.cardBId) continue;
    const w = b.winner;
    if (!w || w === 'tie') continue;
    const winCard = getCard(s, w === 'a' ? b.cardAId : b.cardBId);
    const loseCard = getCard(s, w === 'a' ? b.cardBId : b.cardAId);
    if (winCard?.ownerId === userId) wins += 1;
    else if (loseCard?.ownerId === userId) losses += 1;
  }
  const followers = Object.values(s.follows).filter((arr) => arr.includes(userId)).length;
  const following = (s.follows[userId] ?? []).length;
  return {
    cards: cards.length,
    posts: posts.length,
    likesReceived,
    wins,
    losses,
    followers,
    following,
    votesCast: votesCastBy(s, userId),
    profileLikes: (s.profileLikes[userId] ?? []).length,
  };
}

/** Consecutive battle wins (most recent first). 0 after any loss/tie-free gap. */
export function currentWinStreak(s: StoreState, userId: string, now = Date.now()): number {
  const ended = s.battles
    .filter((b) => b.status === 'ended' && b.winner && b.winner !== 'tie' && b.cardBId)
    .filter((b) => {
      const a = getCard(s, b.cardAId);
      const c = getCard(s, b.cardBId!);
      return a?.ownerId === userId || c?.ownerId === userId;
    })
    .sort((x, y) => +new Date(y.endsAt) - +new Date(x.endsAt));
  void now;
  let streak = 0;
  for (const b of ended) {
    const winCard = getCard(s, b.winner === 'a' ? b.cardAId : b.cardBId!);
    if (winCard?.ownerId === userId) streak += 1;
    else break;
  }
  return streak;
}

export function computeAchievements(s: StoreState, userId: string, now = Date.now()): Achievement[] {
  const stats = userStats(s, userId, now);
  const defs: Array<[string, string, string, boolean]> = [
    ['first-card', 'First Glow', 'Publish your first flex card', stats.cards >= 1],
    ['crowd', 'Crowd Favorite', 'Collect 25 likes across cards & posts', stats.likesReceived >= 25],
    ['duelist', 'Duelist', 'Enter a vote battle', s.battles.some((b) => {
      const a = getCard(s, b.cardAId); const c = b.cardBId ? getCard(s, b.cardBId) : undefined;
      return a?.ownerId === userId || c?.ownerId === userId;
    })],
    ['champion', 'Battle Champion', 'Win a vote battle', stats.wins >= 1],
    ['social', 'Social Star', 'Gain 3 followers', stats.followers >= 3],
    ['creator5', 'Card Machine', 'Publish 5 flex cards', stats.cards >= 5],
    ['voter10', 'Super Voter', 'Cast 10 battle votes', stats.votesCast >= 10],
    ['streaker', 'Streak Keeper', 'Publish a streak card', s.cards.some((c) => c.ownerId === userId && c.published && c.streak > 0)],
    ['win-streak-2', 'On a Roll', 'Win 2 battles in a row', currentWinStreak(s, userId) >= 2],
    ['win-streak-3', 'Unstoppable', 'Win 3 battles in a row', currentWinStreak(s, userId) >= 3],
  ];
  return defs.map(([id, label, blurb, unlocked]) => ({ id, label, blurb, unlocked }));
}

export type FeedFilter = 'foryou' | 'newest' | 'trending' | 'popular';

export function feedPosts(s: StoreState, filter: FeedFilter): Post[] {
  const list = [...s.posts];
  const now = Date.now();
  if (filter === 'newest' || filter === 'foryou') return list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  if (filter === 'popular') return list.sort((a, b) => b.likes.length - a.likes.length);
  const score = (p: Post) => {
    const ageH = Math.max(1, (now - +new Date(p.createdAt)) / 3600000);
    return (p.likes.length * 2 + p.comments.length * 3 + p.shares) / Math.pow(ageH, 1.15);
  };
  return list.sort((a, b) => score(b) - score(a));
}

/* ── For You: a simple, transparent ranked mix ──────────────────
   One feed blending posts, cards and live battles. Scoring:
     engagement = likes×3 + comments×2 (+ votes×2 for battles)
     freshness  = engagement / ageHours^0.6  (+2 brand-new bonus)
     follows    = ×1.25 when you follow the creator
   Explained inline so the ranking never feels arbitrary.          */

export type ForYouItem =
  | { kind: 'post'; id: string; score: number }
  | { kind: 'card'; id: string; score: number }
  | { kind: 'battle'; id: string; score: number };

export function forYouFeed(s: StoreState, limit = 30): ForYouItem[] {
  const now = Date.now();
  const me = sessionUser(s);
  const following = me ? (s.follows[me.id] ?? []) : [];
  const items: ForYouItem[] = [];

  for (const p of s.posts) {
    const ageH = Math.max(1, (now - +new Date(p.createdAt)) / 3600000);
    let score = (p.likes.length * 3 + p.comments.length * 2 + 2) / Math.pow(ageH, 0.6);
    if (following.includes(p.authorId)) score *= 1.25;
    items.push({ kind: 'post', id: p.id, score });
  }
  for (const c of s.cards) {
    if (!c.published) continue;
    const ageH = Math.max(1, (now - +new Date(c.createdAt)) / 3600000);
    let score = (c.likes.length * 3 + 2) / Math.pow(ageH, 0.6);
    if (following.includes(c.ownerId)) score *= 1.25;
    items.push({ kind: 'card', id: c.id, score });
  }
  for (const b of s.battles) {
    if (b.status !== 'live' || !b.cardBId) continue;
    const t = s.tallies[b.id];
    const votes = t ? t.a + t.b : 0;
    const bComments = s.battleComments.filter((x) => x.battleId === b.id).length;
    const ageH = Math.max(1, (now - +new Date(b.createdAt)) / 3600000);
    const score = ((votes * 2 + bComments * 2 + 6) / Math.pow(ageH, 0.6)) * 1.2; // battles are hot content
    items.push({ kind: 'battle', id: b.id, score });
  }

  // keep the mix diverse: no more than 2 of the same kind in a row
  const sorted = items.sort((a, b) => b.score - a.score);
  const out: ForYouItem[] = [];
  let streak = 0;
  let lastKind: ForYouItem['kind'] | null = null;
  for (const it of sorted) {
    if (out.length >= limit) break;
    if (it.kind === lastKind && streak >= 2) continue;
    if (it.kind === lastKind) streak += 1;
    else {
      lastKind = it.kind;
      streak = 1;
    }
    out.push(it);
  }
  return out;
}

export function trendingCards(s: StoreState, limit = 8): FlexCardData[] {
  return [...s.cards]
    .filter((c) => c.published)
    .sort((a, b) => b.likes.length - a.likes.length)
    .slice(0, limit);
}

export type BoardKind =
  | 'daily' | 'weekly' | 'most-liked' | 'most-wins' | 'rising'
  | 'recent-winners' | 'top-voters' | 'profile-likes' | 'win-streaks' | 'all-time';

export interface BoardRow {
  user: User;
  stats: UserStats;
  score: number;
}

export function leaderboard(s: StoreState, kind: BoardKind, now = Date.now()): BoardRow[] {
  const rows: BoardRow[] = s.users.map((user) => {
    const stats = userStats(s, user.id, now);
    const days = Math.max(1, (now - +new Date(user.joinedAt)) / 86400000);
    let score = 0;
    switch (kind) {
      case 'daily':
      case 'weekly':
        score = s.weekly[user.id] ?? 0;
        break;
      case 'all-time':
        score = user.points;
        break;
      case 'profile-likes':
      case 'most-liked':
        score = stats.likesReceived + stats.profileLikes * 2;
        break;
      case 'most-wins':
        score = stats.wins * 1000 + stats.likesReceived;
        break;
      case 'win-streaks':
        score = currentWinStreak(s, user.id, now) * 100 + stats.wins;
        break;
      case 'rising':
        score = days <= 60 ? (stats.likesReceived + stats.cards * 20) / days : -1;
        break;
      case 'recent-winners':
        score = stats.wins;
        break;
      case 'top-voters':
        score = stats.votesCast;
        break;
    }
    return { user, stats, score };
  });
  const filtered = rows.filter((r) => {
    if (kind === 'rising') return r.score >= 0;
    if (kind === 'top-voters' || kind === 'recent-winners') return r.score > 0;
    return true;
  });
  return filtered.sort((a, b) => b.score - a.score);
}

export interface TopVoterRow {
  user: User;
  votes: number;
  points: number;
}

export function topVoters(s: StoreState, limit = 20): TopVoterRow[] {
  return s.users
    .map((user) => ({ user, votes: votesCastBy(s, user.id), points: user.points }))
    .filter((r) => r.votes > 0)
    .sort((a, b) => b.votes - a.votes || b.points - a.points)
    .slice(0, limit);
}

export function recentWinners(s: StoreState, now = Date.now()) {
  return [...s.battles]
    .filter((b) => b.status === 'ended')
    .sort((a, b) => +new Date(b.endsAt) - +new Date(a.endsAt))
    .map((b) => ({ battle: b, winner: b.winner }));
}

/** Battles ending within the next `hours` hours, soonest first. */
export function endingSoon(s: StoreState, hours = 2, now = Date.now()): Battle[] {
  return s.battles
    .filter((b) => b.status === 'live' && b.endsAt)
    .filter((b) => {
      const ms = new Date(b.endsAt).getTime() - now;
      return ms > 0 && ms <= hours * 3600 * 1000;
    })
    .sort((a, b) => +new Date(a.endsAt) - +new Date(b.endsAt));
}

export function searchAll(s: StoreState, q: string) {
  const needle = q.trim().toLowerCase();
  if (!needle) return { users: [] as User[], cards: [] as FlexCardData[], posts: [] as Post[] };
  const users = s.users.filter(
    (u) =>
      u.displayName.toLowerCase().includes(needle) ||
      u.username.toLowerCase().includes(needle) ||
      u.bio.toLowerCase().includes(needle),
  );
  const cards = s.cards.filter(
    (c) =>
      c.published &&
      (c.title.toLowerCase().includes(needle) || c.caption.toLowerCase().includes(needle)),
  );
  const posts = s.posts.filter(
    (p) =>
      p.caption.toLowerCase().includes(needle) ||
      p.tags.some((t) => t.toLowerCase().includes(needle.replace(/^#/, ''))),
  );
  return { users, cards, posts };
}

export interface UiNotification {
  id: string;
  text: string;
  link?: string;
  meta: string;
  read: boolean;
  dismissKey?: string;
}

/** Real notifications: stored one-time events + computed time-based alerts. */
export function getNotifications(s: StoreState, userId: string, now = Date.now()): { list: UiNotification[]; unread: number } {
  const list: UiNotification[] = [];
  for (const n of s.notifications) {
    if (n.userId !== userId) continue;
    list.push({
      id: n.id,
      text: n.text,
      link: n.link,
      meta: timeAgoSafe(n.createdAt, now),
      read: n.read,
    });
  }
  const push = (dismissKey: string, text: string, link: string | undefined, meta: string) => {
    if (s.dismissed.includes(dismissKey)) return;
    list.push({ id: dismissKey, text, link, meta, read: false, dismissKey });
  };
  // pending challenges addressed to me
  for (const b of s.battles) {
    if (b.status === 'pending' && b.opponentId === userId) {
      push(`challenge-${b.id}`, `You've been challenged: “${b.title}” — accept or reject it.`, `/battles/${b.id}`, 'new challenge');
    }
  }
  // battles ending soon involving this user
  for (const b of s.battles) {
    if (!b.endsAt) continue;
    const involved = battleInvolves(s, b.id, userId);
    if (b.status === 'live') {
      const ms = new Date(b.endsAt).getTime() - now;
      if (ms > 0 && ms <= 2 * 3600 * 1000 && involved) {
        push(`ending-${b.id}`, `Your battle “${b.title}” ends in ${formatMins(ms)} — share your vote link!`, `/battles/${b.id}`, 'ending soon');
      }
    } else if (b.status === 'ended' && involved) {
      const ms = now - new Date(b.endsAt).getTime();
      if (ms <= 48 * 3600 * 1000) {
        push(
          `ended-${b.id}`,
          b.winner === 'tie' ? `“${b.title}” ended in a tie — see the final tally.` : `“${b.title}” has ended — see who won.`,
          `/battles/${b.id}/results`,
          'just ended',
        );
      }
    }
  }
  // daily challenge
  const ch = challengeForDay(new Date(now));
  push(
    `challenge-${ch.dayKey}`,
    `Today's challenge: ${ch.name} — create a card for +${POINTS.challengeBonus} bonus points.`,
    '/create',
    'daily challenge',
  );
  const unread = list.filter((n) => !n.read).length;
  return { list, unread };
}

function battleInvolves(s: StoreState, battleId: string, userId: string): boolean {
  const b = getBattle(s, battleId);
  if (!b) return false;
  if (b.createdBy === userId || b.opponentId === userId) return true;
  const a = getCard(s, b.cardAId);
  const c = b.cardBId ? getCard(s, b.cardBId) : undefined;
  if (a?.ownerId === userId || c?.ownerId === userId) return true;
  const t = s.tallies[battleId];
  return !!t?.voters.includes(userId);
}

function formatMins(ms: number): string {
  const m = Math.max(1, Math.round(ms / 60000));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function timeAgoSafe(iso: string, now: number): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/* ── actions ────────────────────────────────────────────────── */

export interface ActionResult {
  ok: boolean;
  message: string;
  id?: string;
}

export interface PublishInput {
  title: string;
  caption: string;
  template: string;
  streak: number;
  streakLabel: string;
  badges: string[];
  imageKind: 'art' | 'upload';
  imageDataUrl?: string;
  /** YYYY-MM-DD when this card answers the Daily Challenge */
  challengeDay?: string;
}

function friendlyAuthError(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return 'Wrong username or password — try again.';
  if (/email not confirmed/i.test(msg)) return 'Login is not activated yet (admin needs to disable email confirmation in Supabase).';
  if (/already registered/i.test(msg)) return 'That email is already in use.';
  if (/rate limit/i.test(msg)) return 'Too many attempts — wait a moment and try again.';
  return msg;
}

export const api = {
  get state() {
    return state;
  },

  /** Re-hydrate all shared data from Supabase. */
  async refresh(): Promise<void> {
    return refresh();
  },

  /* ── auth ── */

  async signUp(
    displayName: string,
    username: string,
    password: string,
    opts?: { hue?: number; avatarEmoji?: string },
  ): Promise<ActionResult> {
    const sb = requireSupabase();
    const name = displayName.trim();
    const handle = username.trim().replace(/^@/, '').toLowerCase();
    if (name.length < 2) return { ok: false, message: 'Please enter a display name (2+ characters).' };
    if (!USERNAME_RE.test(handle))
      return { ok: false, message: 'Usernames need 3–20 characters: lowercase letters, numbers, dots or underscores.' };
    if (password.length < 6) return { ok: false, message: 'Choose a password with at least 6 characters.' };
    if (getUserByUsername(state, handle))
      return { ok: false, message: 'That username is taken — try another one.' };
    const { data, error } = await sb.auth.signUp({
      email: authEmailFor(handle),
      password,
      options: {
        data: {
          username: handle,
          displayName: name,
          hue: String(opts?.hue ?? Math.floor(Math.random() * 360)),
          avatarEmoji: opts?.avatarEmoji ?? null,
        },
      },
    });
    if (error) {
      if (/duplicate key|unique constraint|already registered/i.test(error.message))
        return { ok: false, message: 'That username is taken — try another one.' };
      if (/email_address_invalid|invalid format/i.test(error.message))
        return { ok: false, message: 'Signup is not activated yet (admin needs to disable email confirmation in Supabase).' };
      return { ok: false, message: friendlyAuthError(error.message) };
    }
    if (!data.session) {
      return {
        ok: false,
        message: 'Signup is not activated yet (admin needs to disable email confirmation in Supabase).',
      };
    }
    await refresh();
    pushLocalNotification({
      kind: 'welcome',
      text: `Welcome to Snap Glow, ${name}! Create your first flex card to earn your first ${POINTS.createCard} Glow Points.`,
      link: '/create',
    });
    return { ok: true, message: 'Account created — welcome to Snap Glow!', id: data.user?.id };
  },

  async login(username: string, password: string): Promise<ActionResult> {
    const sb = requireSupabase();
    const handle = username.trim().replace(/^@/, '').toLowerCase();
    if (!handle || !password) return { ok: false, message: 'Enter your username and password.' };
    const { data, error } = await sb.auth.signInWithPassword({
      email: authEmailFor(handle),
      password,
    });
    if (error) return { ok: false, message: friendlyAuthError(error.message) };
    const userId = data.user?.id;
    if (!userId) return { ok: false, message: 'Login failed — try again.' };
    state.notifications = loadLocalNotifs(userId).notifications;
    state.dismissed = loadLocalNotifs(userId).dismissed;
    await refresh();
    const me = getUser(state, userId);
    if (me?.isSuspended) {
      await sb.auth.signOut();
      await refresh();
      return { ok: false, message: 'This account has been suspended by moderation.' };
    }
    sb.rpc('claim_daily_login').then(() => refresh(), () => undefined);
    return { ok: true, message: `Welcome back, ${me?.displayName ?? 'creator'}!`, id: userId };
  },

  async logout() {
    const sb = requireSupabase();
    await sb.auth.signOut();
    await refresh();
  },

  async updateProfile(patch: {
    displayName?: string;
    bio?: string;
    hue?: number;
    avatar?: string | null;
    avatarEmoji?: string | null;
    theme?: string;
  }): Promise<ActionResult> {
    const sb = requireSupabase();
    const me = sessionUser(state);
    if (!me) return { ok: false, message: 'Please sign in first.' };
    if (patch.displayName !== undefined && patch.displayName.trim().length < 2)
      return { ok: false, message: 'Display name needs 2+ characters.' };
    const update: Record<string, unknown> = {};
    if (patch.displayName?.trim()) update.display_name = patch.displayName.trim();
    if (patch.bio !== undefined) update.bio = patch.bio.slice(0, 160);
    if (patch.hue !== undefined) update.hue = Math.max(0, Math.min(359, Math.round(patch.hue)));
    if (patch.avatar !== undefined) update.avatar = patch.avatar; // null clears
    if (patch.avatarEmoji !== undefined) update.avatar_emoji = patch.avatarEmoji;
    if (patch.theme !== undefined) update.theme = patch.theme;
    if (!Object.keys(update).length) return { ok: true, message: 'Nothing to update.' };
    const { error } = await sb.from('profiles').update(update).eq('id', me.id);
    if (error) return { ok: false, message: error.message };
    await refresh();
    return { ok: true, message: 'Profile updated.' };
  },

  /* ── social ── */

  async toggleProfileLike(userId: string): Promise<ActionResult & { liked?: boolean }> {
    const sb = requireSupabase();
    const me = sessionUser(state);
    if (!me) return { ok: false, message: 'Create a free account to like profiles.' };
    if (userId === me.id) return { ok: false, message: "You can't like your own profile." };
    const liked = (state.profileLikes[userId] ?? []).includes(me.id);
    if (liked) {
      await sb.from('profile_likes').delete().eq('profile_id', userId).eq('user_id', me.id);
    } else {
      const { error } = await sb.from('profile_likes').insert({ profile_id: userId, user_id: me.id });
      if (error) return { ok: false, message: error.message.includes('duplicate') ? 'Already liked.' : error.message };
    }
    await refresh();
    return { ok: true, message: liked ? 'Like removed.' : 'Profile liked!', liked: !liked };
  },

  async toggleLikePost(postId: string): Promise<ActionResult & { liked?: boolean }> {
    const sb = requireSupabase();
    const me = sessionUser(state);
    if (!me) return { ok: false, message: 'Create a free account to like posts.' };
    const post = getPost(state, postId);
    if (!post) return { ok: false, message: 'Post not found.' };
    const liked = post.likes.includes(me.id);
    if (liked) {
      await sb.from('post_likes').delete().eq('post_id', postId).eq('user_id', me.id);
    } else {
      const { error } = await sb.from('post_likes').insert({ post_id: postId, user_id: me.id });
      if (error) return { ok: false, message: error.message };
    }
    await refresh();
    return { ok: true, message: liked ? 'Like removed.' : 'Liked.', liked: !liked };
  },

  async toggleLikeCard(cardId: string): Promise<ActionResult & { liked?: boolean }> {
    const sb = requireSupabase();
    const me = sessionUser(state);
    if (!me) return { ok: false, message: 'Create a free account to like cards.' };
    const card = getCard(state, cardId);
    if (!card) return { ok: false, message: 'Card not found.' };
    if (card.ownerId === me.id) return { ok: false, message: 'Liking your own card does nothing — share it instead!' };
    const liked = card.likes.includes(me.id);
    if (liked) {
      await sb.from('card_likes').delete().eq('card_id', cardId).eq('user_id', me.id);
    } else {
      const { error } = await sb.from('card_likes').insert({ card_id: cardId, user_id: me.id });
      if (error) {
        if (/duplicate/i.test(error.message)) return { ok: true, message: 'Already liked.', liked: true };
        return { ok: false, message: error.message };
      }
    }
    await refresh();
    return { ok: true, message: liked ? 'Like removed.' : 'Liked.', liked: !liked };
  },

  async addComment(postId: string, text: string): Promise<ActionResult> {
    const sb = requireSupabase();
    const me = sessionUser(state);
    if (!me) return { ok: false, message: 'Create a free account to comment.' };
    const clean = text.trim();
    if (!clean) return { ok: false, message: 'Write something first.' };
    if (clean.length > 500) return { ok: false, message: 'Comments are limited to 500 characters.' };
    const id = uid('cm');
    const { error } = await sb.from('comments').insert({ id, post_id: postId, author_id: me.id, text: clean });
    if (error) return { ok: false, message: error.message };
    await refresh();
    return { ok: true, message: 'Comment posted.', id };
  },

  async deleteComment(postId: string, commentId: string): Promise<ActionResult> {
    const sb = requireSupabase();
    void postId;
    const me = sessionUser(state);
    if (!me) return { ok: false, message: 'Please sign in first.' };
    const { error } = await sb.from('comments').delete().eq('id', commentId).eq('author_id', me.id);
    if (error) return { ok: false, message: error.message };
    await refresh();
    return { ok: true, message: 'Comment deleted.' };
  },

  async toggleFollow(userId: string): Promise<ActionResult & { following?: boolean }> {
    const sb = requireSupabase();
    const me = sessionUser(state);
    if (!me) return { ok: false, message: 'Create a free account to follow creators.' };
    if (userId === me.id) return { ok: false, message: "You can't follow yourself." };
    if (!getUser(state, userId)) return { ok: false, message: 'User not found.' };
    const following = (state.follows[me.id] ?? []).includes(userId);
    if (following) {
      await sb.from('follows').delete().eq('follower_id', me.id).eq('followee_id', userId);
    } else {
      const { error } = await sb.from('follows').insert({ follower_id: me.id, followee_id: userId });
      if (error) return { ok: false, message: error.message };
    }
    await refresh();
    return { ok: true, message: following ? 'Unfollowed.' : 'Following.', following: !following };
  },

  /* ── battles & voting ── */

  async vote(battleId: string, side: 'a' | 'b'): Promise<ActionResult> {
    const sb = requireSupabase();
    const me = sessionUser(state);
    if (!me) return { ok: false, message: 'Create a free account to vote.' };
    const b = getBattle(state, battleId);
    if (!b) return { ok: false, message: 'Battle not found.' };
    if (b.status !== 'live') return { ok: false, message: 'Voting has ended for this battle.' };
    const { error } = await sb.rpc('cast_vote', { p_battle: battleId, p_side: side });
    if (error) return { ok: false, message: error.message };
    await refresh();
    void syncMyBadges();
    return { ok: true, message: 'Vote counted!' };
  },

  async addBattleComment(battleId: string, text: string): Promise<ActionResult> {
    const sb = requireSupabase();
    const me = sessionUser(state);
    if (!me) return { ok: false, message: 'Create a free account to comment.' };
    const clean = text.trim();
    if (!clean) return { ok: false, message: 'Write something first.' };
    if (clean.length > 500) return { ok: false, message: 'Comments are limited to 500 characters.' };
    const id = uid('bcm');
    const { error } = await sb.from('battle_comments').insert({ id, battle_id: battleId, author_id: me.id, text: clean });
    if (error) return { ok: false, message: error.message };
    await refresh();
    return { ok: true, message: 'Comment posted.', id };
  },

  async deleteBattleComment(battleId: string, commentId: string): Promise<ActionResult> {
    const sb = requireSupabase();
    void battleId;
    const me = sessionUser(state);
    if (!me) return { ok: false, message: 'Please sign in first.' };
    const { error } = await sb.from('battle_comments').delete().eq('id', commentId).eq('author_id', me.id);
    if (error) return { ok: false, message: error.message };
    await refresh();
    return { ok: true, message: 'Comment deleted.' };
  },

  async toggleBattleLike(battleId: string): Promise<ActionResult & { liked?: boolean }> {
    const sb = requireSupabase();
    const me = sessionUser(state);
    if (!me) return { ok: false, message: 'Create a free account to like battles.' };
    const { data } = await sb.from('battle_likes').select('user_id').eq('battle_id', battleId).eq('user_id', me.id);
    const liked = (data ?? []).length > 0;
    if (liked) {
      await sb.from('battle_likes').delete().eq('battle_id', battleId).eq('user_id', me.id);
    } else {
      const { error } = await sb.from('battle_likes').insert({ battle_id: battleId, user_id: me.id });
      if (error) return { ok: false, message: error.message };
    }
    await refresh();
    return { ok: true, message: liked ? 'Like removed.' : 'Liked.', liked: !liked };
  },

  /** Instant battle: both cards known, goes live immediately. */
  async createBattle(title: string, cardAId: string, cardBId: string, hours = 12): Promise<ActionResult> {
    const sb = requireSupabase();
    const me = sessionUser(state);
    if (!me) return { ok: false, message: 'Create a free account to create battles.' };
    const clean = title.trim();
    if (clean.length < 4) return { ok: false, message: 'Give the battle a title (4+ characters).' };
    if (cardAId === cardBId) return { ok: false, message: 'Pick two different cards.' };
    const a = getCard(state, cardAId);
    const c = getCard(state, cardBId);
    if (!a || !c || !a.published || !c.published)
      return { ok: false, message: 'Both contestants must be published cards.' };
    const dur = Math.min(72, Math.max(1, Math.round(hours) || 12));
    const id = uid('battle');
    const { error } = await sb.from('battles').insert({
      id,
      title: clean.slice(0, 60),
      created_by: me.id,
      card_a_id: cardAId,
      card_b_id: cardBId,
      status: 'live',
      duration_hours: dur,
      ends_at: new Date(Date.now() + dur * 3600 * 1000).toISOString(),
    });
    if (error) return { ok: false, message: error.message };
    await refresh();
    return { ok: true, message: `Battle created — voting runs ${dur}h. Share the vote links!`, id };
  },

  /** Challenge: my card vs an invited (or open) opponent. Stays pending until accepted. */
  async createChallenge(
    title: string,
    myCardId: string,
    opponentUsername: string | null,
    hours = 12,
  ): Promise<ActionResult> {
    const sb = requireSupabase();
    const me = sessionUser(state);
    if (!me) return { ok: false, message: 'Create a free account to challenge creators.' };
    const clean = title.trim();
    if (clean.length < 4) return { ok: false, message: 'Give the challenge a title (4+ characters).' };
    const card = getCard(state, myCardId);
    if (!card || card.ownerId !== me.id || !card.published)
      return { ok: false, message: 'Pick one of your own published cards.' };
    let opponentId: string | null = null;
    if (opponentUsername) {
      const opponent = getUserByUsername(state, opponentUsername);
      if (!opponent) return { ok: false, message: 'No creator with that username — check the spelling.' };
      if (opponent.id === me.id) return { ok: false, message: "You can't challenge yourself." };
      opponentId = opponent.id;
    }
    const dur = Math.min(72, Math.max(1, Math.round(hours) || 12));
    const id = uid('battle');
    const { error } = await sb.from('battles').insert({
      id,
      title: clean.slice(0, 60),
      created_by: me.id,
      card_a_id: myCardId,
      card_b_id: null,
      opponent_id: opponentId,
      status: 'pending',
      duration_hours: dur,
      ends_at: null,
    });
    if (error) return { ok: false, message: error.message };
    await refresh();
    return {
      ok: true,
      message: opponentId
        ? 'Challenge sent! Share the link so your opponent accepts.'
        : 'Open challenge created — share the link, anyone can accept!',
      id,
    };
  },

  async acceptChallenge(battleId: string, myCardId: string): Promise<ActionResult> {
    const sb = requireSupabase();
    const me = sessionUser(state);
    if (!me) return { ok: false, message: 'Create a free account to accept challenges.' };
    const card = getCard(state, myCardId);
    if (!card || card.ownerId !== me.id || !card.published)
      return { ok: false, message: 'Pick one of your own published cards.' };
    const { error } = await sb.rpc('accept_challenge', { p_battle: battleId, p_card: myCardId });
    if (error) return { ok: false, message: error.message };
    await refresh();
    return { ok: true, message: 'Challenge accepted — the battle is LIVE! Share your vote link.' };
  },

  async rejectChallenge(battleId: string): Promise<ActionResult> {
    const sb = requireSupabase();
    const me = sessionUser(state);
    if (!me) return { ok: false, message: 'Please sign in first.' };
    const { error } = await sb.rpc('reject_challenge', { p_battle: battleId });
    if (error) return { ok: false, message: error.message };
    await refresh();
    return { ok: true, message: 'Challenge rejected.' };
  },

  async cancelBattle(battleId: string): Promise<ActionResult> {
    const sb = requireSupabase();
    const me = sessionUser(state);
    if (!me) return { ok: false, message: 'Please sign in first.' };
    const { error } = await sb.rpc('cancel_battle', { p_battle: battleId });
    if (error) return { ok: false, message: error.message };
    await refresh();
    return { ok: true, message: 'Challenge cancelled.' };
  },

  /* ── creation ── */

  async publishCard(input: PublishInput): Promise<ActionResult> {
    const sb = requireSupabase();
    const me = sessionUser(state);
    if (!me) return { ok: false, message: 'Create a free account to publish cards.' };
    const title = input.title.trim();
    if (title.length < 2) return { ok: false, message: 'Give your card a title (2+ characters).' };
    if (title.length > 40) return { ok: false, message: 'Keep the title under 40 characters.' };
    const streak = Math.max(0, Math.min(99999, Math.floor(input.streak) || 0));
    const today = new Date().toISOString().slice(0, 10);
    const challengeDay = input.challengeDay === today ? input.challengeDay : null;
    const cardId = uid('card');

    // upload the photo to storage when present
    let imagePath: string | null = null;
    if (input.imageKind === 'upload' && input.imageDataUrl) {
      const blob = dataUrlToBlob(input.imageDataUrl);
      const path = `${me.id}/${cardId}.jpg`;
      const { error: upErr } = await sb.storage
        .from('card-images')
        .upload(path, blob, { contentType: 'image/jpeg', upsert: true });
      if (upErr) return { ok: false, message: `Photo upload failed: ${upErr.message}` };
      imagePath = path;
    }

    const { error } = await sb.from('cards').insert({
      id: cardId,
      owner_id: me.id,
      title,
      caption: input.caption.trim().slice(0, 140),
      template: input.template,
      image_kind: input.imageKind,
      image_path: imagePath,
      art_seed: Math.floor(Math.random() * 1e9),
      streak,
      streak_label: input.streakLabel.trim().slice(0, 60),
      badges: input.badges.slice(0, 6),
      challenge_day: challengeDay,
      published: true,
    });
    if (error) return { ok: false, message: error.message };

    const postId = uid('post');
    await sb.from('posts').insert({
      id: postId,
      author_id: me.id,
      card_id: cardId,
      caption: input.caption.trim().slice(0, 280) || `Just dropped “${title}” — made for my Snapchat Story.`,
      tags: [],
    });
    await refresh();
    void syncMyBadges();
    return { ok: true, message: 'Card published!', id: cardId };
  },

  async createPost(caption: string, cardId?: string): Promise<ActionResult> {
    const sb = requireSupabase();
    const me = sessionUser(state);
    if (!me) return { ok: false, message: 'Create a free account to post.' };
    const clean = caption.trim();
    if (!clean) return { ok: false, message: 'Write a caption first.' };
    if (clean.length > 280) return { ok: false, message: 'Keep captions under 280 characters.' };
    const id = uid('post');
    const { error } = await sb.from('posts').insert({
      id,
      author_id: me.id,
      card_id: cardId ?? null,
      caption: clean,
      tags: Array.from(clean.matchAll(/#(\w+)/g)).map((m) => m[1].toLowerCase()),
    });
    if (error) return { ok: false, message: error.message };
    await refresh();
    return { ok: true, message: 'Posted!', id };
  },

  /* ── reports / sharing / notifications ── */

  async reportContent(
    targetType: Report['targetType'],
    targetId: string,
    reason: string,
    details: string,
  ): Promise<ActionResult> {
    const sb = requireSupabase();
    const me = sessionUser(state);
    if (!me) return { ok: false, message: 'Create a free account to report content.' };
    const clean = details.trim();
    if (!reason) return { ok: false, message: 'Choose a reason.' };
    if (clean.length > 500) return { ok: false, message: 'Keep details under 500 characters.' };
    const { error } = await sb.from('reports').insert({
      id: uid('report'),
      target_type: targetType,
      target_id: targetId,
      reason,
      details: clean,
      reporter_id: me.id,
    });
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: 'Report sent — moderators will review it. Thank you!' };
  },

  sharePost(postId: string): string {
    return `${siteUrl()}/posts/${postId}`;
  },

  markAllNotificationsRead() {
    const me = state.sessionUserId;
    if (!me) return;
    for (const n of state.notifications) n.read = true;
    const { list } = getNotifications(state, me);
    for (const n of list) {
      if (n.dismissKey && !state.dismissed.includes(n.dismissKey)) state.dismissed.push(n.dismissKey);
    }
    saveLocalNotifs(me);
    version += 1;
    listeners.forEach((l) => l());
  },

  resetAll() {
    const me = state.sessionUserId;
    if (me) {
      localStorage.removeItem(notifKey(me));
      localStorage.removeItem(dismissedKey(me));
      state.notifications = [];
      state.dismissed = [];
    }
    refresh();
  },

  /* ── admin (RLS-enforced server-side) ── */

  async adminListReports(): Promise<Report[]> {
    const sb = requireSupabase();
    const { data } = await sb.from('reports').select('*').order('created_at', { ascending: false }).limit(200);
    return (data ?? []).map((r: {
      id: string; target_type: Report['targetType']; target_id: string; reason: string;
      details: string; reporter_id: string | null; created_at: string; status: Report['status'];
    }) => ({
      id: r.id,
      targetType: r.target_type,
      targetId: r.target_id,
      reason: r.reason,
      details: r.details,
      reporterId: r.reporter_id,
      createdAt: r.created_at,
      status: r.status,
    }));
  },

  async adminSetReportStatus(reportId: string, status: Report['status']): Promise<ActionResult> {
    const sb = requireSupabase();
    const me = sessionUser(state);
    const { error } = await sb.from('reports').update({ status, actioned_by: me?.id ?? null }).eq('id', reportId);
    if (error) return { ok: false, message: error.message };
    await refresh();
    return { ok: true, message: `Report ${status}.` };
  },

  async adminSetSuspended(userId: string, suspended: boolean): Promise<ActionResult> {
    const sb = requireSupabase();
    const { error } = await sb.from('profiles').update({ is_suspended: suspended }).eq('id', userId);
    if (error) return { ok: false, message: error.message };
    await refresh();
    return { ok: true, message: suspended ? 'Account suspended.' : 'Account restored.' };
  },

  async adminSetDemo(userId: string, isDemo: boolean): Promise<ActionResult> {
    const sb = requireSupabase();
    const { error } = await sb.from('profiles').update({ is_demo: isDemo }).eq('id', userId);
    if (error) return { ok: false, message: error.message };
    await refresh();
    return { ok: true, message: isDemo ? 'Marked as demo data.' : 'Demo flag removed.' };
  },

  async adminDeleteCard(cardId: string): Promise<ActionResult> {
    const sb = requireSupabase();
    const { error } = await sb.from('cards').delete().eq('id', cardId);
    if (error) return { ok: false, message: error.message };
    await refresh();
    return { ok: true, message: 'Card deleted.' };
  },

  async adminDeletePost(postId: string): Promise<ActionResult> {
    const sb = requireSupabase();
    const { error } = await sb.from('posts').delete().eq('id', postId);
    if (error) return { ok: false, message: error.message };
    await refresh();
    return { ok: true, message: 'Post deleted.' };
  },

  async adminDeleteBattle(battleId: string): Promise<ActionResult> {
    const sb = requireSupabase();
    const { error } = await sb.from('battles').delete().eq('id', battleId);
    if (error) return { ok: false, message: error.message };
    await refresh();
    return { ok: true, message: 'Battle deleted.' };
  },

  async adminFeature(userId: string, note = ''): Promise<ActionResult> {
    const sb = requireSupabase();
    const { error } = await sb.from('featured').upsert({ user_id: userId, note }, { onConflict: 'user_id' });
    if (error) return { ok: false, message: error.message };
    await refresh();
    return { ok: true, message: 'Creator featured.' };
  },

  async adminUnfeature(userId: string): Promise<ActionResult> {
    const sb = requireSupabase();
    const { error } = await sb.from('featured').delete().eq('user_id', userId);
    if (error) return { ok: false, message: error.message };
    await refresh();
    return { ok: true, message: 'Removed from featured.' };
  },

  async adminSetConfig(key: string, value: unknown): Promise<ActionResult> {
    const sb = requireSupabase();
    const me = sessionUser(state);
    const { error } = await sb.from('app_config').upsert(
      { key, value, updated_at: new Date().toISOString(), updated_by: me?.id ?? null },
      { onConflict: 'key' },
    );
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: 'Configuration saved.' };
  },

  async adminAudit(action: string, target: string, details?: unknown): Promise<void> {
    const sb = requireSupabase();
    const me = sessionUser(state);
    await sb.from('audit_log').insert({
      actor: me?.id ?? null,
      action,
      target,
      details: (details ?? null) as never,
    });
  },
};

function dataUrlToBlob(dataUrl: string): Blob {
  const [head, body] = dataUrl.split(',');
  const mime = /:(.*?);/.exec(head)?.[1] ?? 'image/jpeg';
  const bin = atob(body);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export function siteUrl(): string {
  const env = (import.meta as unknown as { env?: Record<string, string> }).env;
  const raw = env?.VITE_SITE_URL || 'https://www.your-domain.com';
  return raw.replace(/\/$/, '');
}

export type SnapGlowApi = typeof api;

/** React binding — re-renders on every store mutation. */
export function useSnapGlow(): SnapGlowApi {
  useSyncExternalStore(subscribe, getVersion, getVersion);
  return api;
}
