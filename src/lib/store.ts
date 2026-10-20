/**
 * Snap Glow data layer (v4).
 * ─────────────────────────────────────────────────────────────
 * Site-local accounts stored in this browser's localStorage.
 * Passwords are stored as SHA-256 digests only (see lib/auth.ts).
 *
 * Honest limits, enforced everywhere in the UI:
 *  - data lives in THIS browser only (no cross-device sync without a backend)
 *  - there are NO fake users: every record belongs to someone who signed up
 *  - empty states ("Be the first to post!") instead of sample content
 *  - votes/likes/follows are one-per-account, enforced in this store
 *  - battles settle by comparing endsAt with the clock (a production
 *    backend would settle via scheduled server logic — see BACKEND_SETUP.md)
 *
 * The `SnapGlowApi` surface is backend-shaped on purpose: a future
 * Supabase backend implements the same methods (see docs/BACKEND_SETUP.md).
 */
import { useSyncExternalStore } from 'react';
import type {
  Achievement,
  Battle,
  BattleTally,
  FlexCardData,
  Notification,
  Post,
  Report,
  User,
} from './types';
import { hashPassword, verifyPassword } from './auth';
import { POINTS, challengeForDay, levelForPoints } from './challenges';
import { uid } from './format';

const STORAGE_KEY = 'snapglow.v4';

export interface StoreState {
  users: User[];
  cards: FlexCardData[];
  posts: Post[];
  battles: Battle[];
  tallies: Record<string, BattleTally>;
  /** followerId -> followeeIds */
  follows: Record<string, string[]>;
  reports: Report[];
  notifications: Notification[];
  /** dismissKeys of computed notifications the user cleared */
  dismissed: string[];
  /** battle ids whose win points were already awarded */
  winAwarded: string[];
  sessionUserId: string | null;
  /** false when localStorage quota blocked a save (data kept in memory) */
  storageOk: boolean;
}

const USERNAME_RE = /^[a-z0-9_.]{3,20}$/;

function emptyState(): StoreState {
  return {
    users: [],
    cards: [],
    posts: [],
    battles: [],
    tallies: {},
    follows: {},
    reports: [],
    notifications: [],
    dismissed: [],
    winAwarded: [],
    sessionUserId: null,
    storageOk: true,
  };
}

function load(): StoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoreState;
      if (parsed && Array.isArray(parsed.users)) {
        const s: StoreState = {
          ...emptyState(),
          ...parsed,
          follows: parsed.follows ?? {},
          notifications: parsed.notifications ?? [],
          dismissed: parsed.dismissed ?? [],
          winAwarded: parsed.winAwarded ?? [],
          storageOk: true,
        };
        applyDailyLogin(s);
        settleBattles(s);
        return s;
      }
    }
  } catch {
    /* corrupted or unavailable storage -> start empty */
  }
  const s = emptyState();
  applyDailyLogin(s);
  return s;
}

let state: StoreState = load();
let version = 0;
const listeners = new Set<() => void>();

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    state.storageOk = true;
  } catch {
    // Quota exceeded (e.g. large uploaded photos): keep working in memory,
    // surface the limitation instead of silently failing.
    state.storageOk = false;
  }
}

function mutate(fn: (s: StoreState) => void) {
  settleBattles(state);
  fn(state);
  save();
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

function todayKey(now = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}

/** +5 Glow Points once per calendar day for signed-in users. */
function applyDailyLogin(s: StoreState, now = Date.now()) {
  const me = s.sessionUserId ? s.users.find((u) => u.id === s.sessionUserId) : undefined;
  if (!me) return;
  const day = todayKey(now);
  if (me.lastLoginDay === day) return;
  me.lastLoginDay = day;
  addPoints(s, me.id, POINTS.dailyLogin, `Daily login bonus · +${POINTS.dailyLogin} Glow Points`, undefined, true);
}

/** Award battle-win points once per ended battle. Idempotent. */
function settleBattles(s: StoreState, now = Date.now()) {
  for (const b of s.battles) {
    if (s.winAwarded.includes(b.id)) continue;
    if (new Date(b.endsAt).getTime() > now) continue;
    s.winAwarded.push(b.id);
    const w = battleWinner(s, b.id, now);
    if (!w || w === 'tie') continue;
    const winningCard = getCard(s, w === 'a' ? b.cardAId : b.cardBId);
    if (winningCard) {
      addPoints(s, winningCard.ownerId, POINTS.battleWin, `Battle won: “${b.title}” · +${POINTS.battleWin} Glow Points`, `/battles/${b.id}/results`, true);
    }
  }
}

function addPoints(
  s: StoreState,
  userId: string,
  amount: number,
  note: string,
  link?: string,
  silent = false,
): void {
  const u = s.users.find((x) => x.id === userId);
  if (!u) return;
  const before = levelForPoints(u.points);
  u.points = Math.max(0, u.points + amount);
  const after = levelForPoints(u.points);
  if (!silent) {
    s.notifications.unshift({
      id: uid('notif'),
      userId,
      kind: 'welcome',
      text: note,
      link,
      createdAt: new Date().toISOString(),
      read: false,
    });
  }
  if (after.name !== before.name) {
    s.notifications.unshift({
      id: uid('notif'),
      userId,
      kind: 'level-up',
      text: `You reached ${after.name} level! ${after.blurb}.`,
      link: `/u/${u.username}`,
      createdAt: new Date().toISOString(),
      read: false,
    });
  }
}

function pushNotification(s: StoreState, userId: string, n: Omit<Notification, 'id' | 'userId' | 'createdAt' | 'read'>): void {
  s.notifications.unshift({ ...n, userId, id: uid('notif'), createdAt: new Date().toISOString(), read: false });
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

export function isBattleLive(b: Battle, now = Date.now()): boolean {
  return new Date(b.endsAt).getTime() > now;
}

/** 'a' | 'b' | 'tie' | null (null while live) — from STORED votes only. */
export function battleWinner(s: StoreState, battleId: string, now = Date.now()): 'a' | 'b' | 'tie' | null {
  const b = getBattle(s, battleId);
  if (!b || isBattleLive(b, now)) return null;
  const t = s.tallies[battleId];
  if (!t) return null;
  if (t.a === t.b) return 'tie';
  return t.a > t.b ? 'a' : 'b';
}

export interface UserStats {
  cards: number;
  posts: number;
  likesReceived: number;
  wins: number;
  followers: number;
  following: number;
  votesCast: number;
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
  for (const b of s.battles) {
    const w = battleWinner(s, b.id, now);
    if (!w || w === 'tie') continue;
    const winningCard = getCard(s, w === 'a' ? b.cardAId : b.cardBId);
    if (winningCard?.ownerId === userId) wins += 1;
  }
  const followers = Object.values(s.follows).filter((arr) => arr.includes(userId)).length;
  const following = (s.follows[userId] ?? []).length;
  return { cards: cards.length, posts: posts.length, likesReceived, wins, followers, following, votesCast: votesCastBy(s, userId) };
}

export function computeAchievements(s: StoreState, userId: string, now = Date.now()): Achievement[] {
  const stats = userStats(s, userId, now);
  const defs: Array<[string, string, string, boolean]> = [
    ['first-card', 'First Glow', 'Publish your first flex card', stats.cards >= 1],
    ['crowd', 'Crowd Favorite', 'Collect 25 likes across cards & posts', stats.likesReceived >= 25],
    ['duelist', 'Duelist', 'Enter a vote battle', s.battles.some((b) => {
      const a = getCard(s, b.cardAId); const c = getCard(s, b.cardBId);
      return a?.ownerId === userId || c?.ownerId === userId;
    })],
    ['champion', 'Battle Champion', 'Win a vote battle', stats.wins >= 1],
    ['social', 'Social Star', 'Gain 3 followers', stats.followers >= 3],
    ['creator5', 'Card Machine', 'Publish 5 flex cards', stats.cards >= 5],
    ['voter10', 'Super Voter', 'Cast 10 battle votes', stats.votesCast >= 10],
    ['streaker', 'Streak Keeper', 'Publish a streak card', s.cards.some((c) => c.ownerId === userId && c.published && c.streak > 0)],
  ];
  return defs.map(([id, label, blurb, unlocked]) => ({ id, label, blurb, unlocked }));
}

export type FeedFilter = 'newest' | 'trending' | 'popular';

export function feedPosts(s: StoreState, filter: FeedFilter): Post[] {
  const list = [...s.posts];
  const now = Date.now();
  if (filter === 'newest') return list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  if (filter === 'popular') return list.sort((a, b) => b.likes.length - a.likes.length);
  const score = (p: Post) => {
    const ageH = Math.max(1, (now - +new Date(p.createdAt)) / 3600000);
    return (p.likes.length * 2 + p.comments.length * 3 + p.shares) / Math.pow(ageH, 1.15);
  };
  return list.sort((a, b) => score(b) - score(a));
}

export function trendingCards(s: StoreState, limit = 8): FlexCardData[] {
  return [...s.cards]
    .filter((c) => c.published)
    .sort((a, b) => b.likes.length - a.likes.length)
    .slice(0, limit);
}

export type BoardKind = 'daily' | 'weekly' | 'most-liked' | 'most-wins' | 'rising' | 'recent-winners' | 'top-voters';

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
        score = stats.likesReceived + stats.wins * 500 + stats.votesCast * 10;
        break;
      case 'most-liked':
        score = stats.likesReceived;
        break;
      case 'most-wins':
        score = stats.wins * 1000 + stats.likesReceived;
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
    if (kind === 'top-voters') return r.score > 0;
    if (kind === 'recent-winners') return r.score > 0;
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
    .filter((b) => !isBattleLive(b, now))
    .sort((a, b) => +new Date(b.endsAt) - +new Date(a.endsAt))
    .map((b) => ({ battle: b, winner: battleWinner(s, b.id, now) }));
}

/** Battles ending within the next `hours` hours, soonest first. */
export function endingSoon(s: StoreState, hours = 2, now = Date.now()): Battle[] {
  return s.battles
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
  // battles ending soon involving this user
  for (const b of s.battles) {
    const ms = new Date(b.endsAt).getTime() - now;
    const involved = battleInvolves(s, b.id, userId);
    if (ms > 0 && ms <= 2 * 3600 * 1000 && involved) {
      push(`ending-${b.id}`, `Your battle “${b.title}” ends in ${formatMins(ms)} — share your vote link!`, `/battles/${b.id}`, 'ending soon');
    } else if (ms <= 0 && ms >= -48 * 3600 * 1000 && involved) {
      const w = battleWinner(s, b.id, now);
      push(
        `ended-${b.id}`,
        w === 'tie' ? `“${b.title}” ended in a tie — see the final tally.` : `“${b.title}” has ended — see who won.`,
        `/battles/${b.id}/results`,
        'just ended',
      );
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
  const a = getCard(s, b.cardAId);
  const c = getCard(s, b.cardBId);
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

export const api = {
  get state() {
    return state;
  },

  /* ── auth ── */

  async signUp(displayName: string, username: string, password: string): Promise<ActionResult> {
    const name = displayName.trim();
    const handle = username.trim().replace(/^@/, '').toLowerCase();
    if (name.length < 2) return { ok: false, message: 'Please enter a display name (2+ characters).' };
    if (!USERNAME_RE.test(handle))
      return { ok: false, message: 'Usernames need 3–20 characters: lowercase letters, numbers, dots or underscores.' };
    if (password.length < 6) return { ok: false, message: 'Choose a password with at least 6 characters.' };
    if (getUserByUsername(state, handle))
      return { ok: false, message: 'That username is taken — try another one.' };
    const passwordHash = await hashPassword(password);
    const id = uid('u');
    const nowIso = new Date().toISOString();
    mutate((s) => {
      s.users.push({
        id,
        username: handle,
        displayName: name,
        bio: '',
        hue: Math.floor(Math.random() * 360),
        passwordHash,
        points: 0,
        badges: [],
        lastLoginDay: todayKey(),
        joinedAt: nowIso,
      });
      s.sessionUserId = id;
      pushNotification(s, id, {
        kind: 'welcome',
        text: `Welcome to Snap Glow, ${name}! Create your first flex card to earn your first ${POINTS.createCard} Glow Points.`,
        link: '/create',
      });
    });
    return { ok: true, message: 'Account created — welcome to Snap Glow!', id };
  },

  async login(username: string, password: string): Promise<ActionResult> {
    const user = getUserByUsername(state, username);
    if (!user) return { ok: false, message: 'No account found with that username.' };
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return { ok: false, message: 'Wrong password — try again.' };
    mutate((s) => {
      s.sessionUserId = user.id;
      const u = getUser(s, user.id);
      if (u && u.lastLoginDay !== todayKey()) {
        u.lastLoginDay = todayKey();
        addPoints(s, u.id, POINTS.dailyLogin, `Daily login bonus · +${POINTS.dailyLogin} Glow Points`, undefined, true);
        pushNotification(s, user.id, {
          kind: 'welcome',
          text: `Welcome back! Daily login bonus: +${POINTS.dailyLogin} Glow Points.`,
          link: `/u/${u.username}`,
        });
      }
    });
    return { ok: true, message: `Welcome back, ${user.displayName}!`, id: user.id };
  },

  logout() {
    mutate((s) => {
      s.sessionUserId = null;
    });
  },

  updateProfile(patch: { displayName?: string; bio?: string }): ActionResult {
    const me = sessionUser(state);
    if (!me) return { ok: false, message: 'Please sign in first.' };
    if (patch.displayName !== undefined && patch.displayName.trim().length < 2)
      return { ok: false, message: 'Display name needs 2+ characters.' };
    mutate((s) => {
      const u = getUser(s, me.id);
      if (!u) return;
      if (patch.displayName?.trim()) u.displayName = patch.displayName.trim();
      if (patch.bio !== undefined) u.bio = patch.bio.slice(0, 160);
    });
    return { ok: true, message: 'Profile updated.' };
  },

  /* ── social ── */

  toggleLikePost(postId: string): ActionResult & { liked?: boolean } {
    const me = sessionUser(state);
    if (!me) return { ok: false, message: 'Create a free account to like posts.' };
    let liked = false;
    let ownerId = '';
    mutate((s) => {
      const p = getPost(s, postId);
      if (!p) return;
      ownerId = p.authorId;
      const i = p.likes.indexOf(me.id);
      if (i >= 0) p.likes.splice(i, 1);
      else {
        p.likes.push(me.id);
        liked = true;
      }
      if (liked && ownerId !== me.id) {
        const total = p.likes.length;
        if ([10, 25, 50, 100].includes(total)) {
          pushNotification(s, ownerId, {
            kind: 'like-milestone',
            text: `Your post hit ${total} likes! Keep the streak going.`,
            link: `/posts/${postId}`,
          });
        }
      }
    });
    return { ok: true, message: liked ? 'Liked.' : 'Like removed.', liked };
  },

  toggleLikeCard(cardId: string): ActionResult & { liked?: boolean } {
    const me = sessionUser(state);
    if (!me) return { ok: false, message: 'Create a free account to like cards.' };
    let liked = false;
    mutate((s) => {
      const c = getCard(s, cardId);
      if (!c) return;
      const i = c.likes.indexOf(me.id);
      if (i >= 0) c.likes.splice(i, 1);
      else {
        c.likes.push(me.id);
        liked = true;
        if (c.ownerId !== me.id && [10, 25, 50, 100].includes(c.likes.length)) {
          pushNotification(s, c.ownerId, {
            kind: 'like-milestone',
            text: `Your card “${c.title}” hit ${c.likes.length} likes!`,
            link: `/cards/${cardId}`,
          });
        }
      }
    });
    return { ok: true, message: liked ? 'Liked.' : 'Like removed.', liked };
  },

  addComment(postId: string, text: string): ActionResult {
    const me = sessionUser(state);
    if (!me) return { ok: false, message: 'Create a free account to comment.' };
    const clean = text.trim();
    if (!clean) return { ok: false, message: 'Write something first.' };
    if (clean.length > 500) return { ok: false, message: 'Comments are limited to 500 characters.' };
    let id = '';
    mutate((s) => {
      const p = getPost(s, postId);
      if (!p) return;
      id = uid('cm');
      p.comments.push({ id, postId, authorId: me.id, text: clean, createdAt: new Date().toISOString() });
      addPoints(s, me.id, POINTS.comment, `Comment posted · +${POINTS.comment} Glow Points`, `/posts/${postId}`, true);
    });
    if (!id) return { ok: false, message: 'Post not found.' };
    return { ok: true, message: 'Comment posted.', id };
  },

  deleteComment(postId: string, commentId: string): ActionResult {
    const me = sessionUser(state);
    if (!me) return { ok: false, message: 'Please sign in first.' };
    let removed = false;
    mutate((s) => {
      const p = getPost(s, postId);
      if (!p) return;
      const i = p.comments.findIndex((c) => c.id === commentId && c.authorId === me.id);
      if (i >= 0) {
        p.comments.splice(i, 1);
        removed = true;
      }
    });
    return removed
      ? { ok: true, message: 'Comment deleted.' }
      : { ok: false, message: 'You can only delete your own comments.' };
  },

  toggleFollow(userId: string): ActionResult & { following?: boolean } {
    const me = sessionUser(state);
    if (!me) return { ok: false, message: 'Create a free account to follow creators.' };
    if (userId === me.id) return { ok: false, message: "You can't follow yourself." };
    if (!getUser(state, userId)) return { ok: false, message: 'User not found.' };
    let following = false;
    mutate((s) => {
      const arr = (s.follows[me.id] = s.follows[me.id] ?? []);
      const i = arr.indexOf(userId);
      if (i >= 0) arr.splice(i, 1);
      else {
        arr.push(userId);
        following = true;
        addPoints(s, me.id, POINTS.follow, `Following ${getUser(s, userId)?.displayName ?? 'a creator'} · +${POINTS.follow} Glow Point`, undefined, true);
        pushNotification(s, userId, {
          kind: 'follower',
          text: `${me.displayName} (@${me.username}) started following you.`,
          link: `/u/${me.username}`,
        });
      }
    });
    return { ok: true, message: following ? 'Following.' : 'Unfollowed.', following };
  },

  /* ── battles & voting ── */

  vote(battleId: string, side: 'a' | 'b'): ActionResult {
    const me = sessionUser(state);
    if (!me) return { ok: false, message: 'Create a free account to vote.' };
    const b = getBattle(state, battleId);
    if (!b) return { ok: false, message: 'Battle not found.' };
    if (!isBattleLive(b)) return { ok: false, message: 'Voting has ended for this battle.' };
    const tally = state.tallies[battleId];
    if (!tally) return { ok: false, message: 'Vote storage missing for this battle.' };
    if (tally.voters.includes(me.id))
      return { ok: false, message: 'You already voted in this battle — one vote per account.' };
    mutate((s) => {
      const t = s.tallies[battleId];
      if (!t || t.voters.includes(me.id)) return;
      if (side === 'a') t.a += 1;
      else t.b += 1;
      t.voters.push(me.id);
      addPoints(s, me.id, POINTS.vote, `Vote counted · +${POINTS.vote} Glow Points`, `/battles/${battleId}`, true);
      // Top-voter crown: whoever holds #1 earns the badge
      const ranked = topVoters(s, 1);
      if (ranked.length > 0 && ranked[0].user.id === me.id) {
        const u = getUser(s, me.id);
        if (u && !u.badges.includes('top-voter')) {
          u.badges.push('top-voter');
          pushNotification(s, me.id, {
            kind: 'level-up',
            text: 'You are the #1 voter on Snap Glow! The Top Voter crown is yours.',
            link: '/leaderboards/top-voters',
          });
        }
      }
    });
    return { ok: true, message: 'Vote counted!' };
  },

  /* ── creation ── */

  publishCard(input: PublishInput): ActionResult {
    const me = sessionUser(state);
    if (!me) return { ok: false, message: 'Create a free account to publish cards.' };
    const title = input.title.trim();
    if (title.length < 2) return { ok: false, message: 'Give your card a title (2+ characters).' };
    if (title.length > 40) return { ok: false, message: 'Keep the title under 40 characters.' };
    const streak = Math.max(0, Math.min(99999, Math.floor(input.streak) || 0));
    const challengeDay = input.challengeDay && input.challengeDay === todayKey() ? input.challengeDay : undefined;
    let cardId = '';
    mutate((s) => {
      cardId = uid('card');
      const card: FlexCardData = {
        id: cardId,
        ownerId: me.id,
        title,
        caption: input.caption.trim().slice(0, 140),
        template: input.template,
        imageKind: input.imageKind,
        imageDataUrl: input.imageDataUrl,
        artSeed: `${cardId}-seed`,
        streak,
        streakLabel: input.streakLabel.trim().slice(0, 60),
        badges: input.badges.slice(0, 6),
        likes: [],
        challengeDay,
        createdAt: new Date().toISOString(),
        published: true,
      };
      s.cards.unshift(card);
      s.posts.unshift({
        id: uid('post'),
        authorId: me.id,
        cardId,
        caption: input.caption.trim().slice(0, 280) || `Just dropped “${title}” — made for my Snapchat Story.`,
        tags: [],
        likes: [],
        comments: [],
        shares: 0,
        createdAt: new Date().toISOString(),
      });
      const bonus = challengeDay ? POINTS.challengeBonus : 0;
      addPoints(
        s,
        me.id,
        POINTS.createCard + bonus,
        challengeDay
          ? `Card published + Daily Challenge bonus · +${POINTS.createCard + bonus} Glow Points`
          : `Card published · +${POINTS.createCard} Glow Points`,
        `/cards/${cardId}`,
        true,
      );
    });
    if (!state.storageOk)
      return { ok: true, message: 'Published for this session — browser storage is full, so it may not survive a reload.', id: cardId };
    return { ok: true, message: 'Card published!', id: cardId };
  },

  createPost(caption: string, cardId?: string): ActionResult {
    const me = sessionUser(state);
    if (!me) return { ok: false, message: 'Create a free account to post.' };
    const clean = caption.trim();
    if (!clean) return { ok: false, message: 'Write a caption first.' };
    if (clean.length > 280) return { ok: false, message: 'Keep captions under 280 characters.' };
    let id = '';
    mutate((s) => {
      id = uid('post');
      s.posts.unshift({
        id,
        authorId: me.id,
        cardId,
        caption: clean,
        tags: Array.from(clean.matchAll(/#(\w+)/g)).map((m) => m[1].toLowerCase()),
        likes: [],
        comments: [],
        shares: 0,
        createdAt: new Date().toISOString(),
      });
      addPoints(s, me.id, POINTS.createPost, `Post published · +${POINTS.createPost} Glow Points`, `/posts/${id}`, true);
    });
    return { ok: true, message: 'Posted!', id };
  },

  createBattle(title: string, cardAId: string, cardBId: string, hours = 12): ActionResult {
    const me = sessionUser(state);
    if (!me) return { ok: false, message: 'Create a free account to create battles.' };
    const clean = title.trim();
    if (clean.length < 4) return { ok: false, message: 'Give the battle a title (4+ characters).' };
    if (cardAId === cardBId) return { ok: false, message: 'Pick two different cards.' };
    const a = getCard(state, cardAId);
    const c = getCard(state, cardBId);
    if (!a || !c || !a.published || !c.published)
      return { ok: false, message: 'Both contestants must be published cards.' };
    const dur = Math.min(72, Math.max(1, hours || 12));
    const nowT = Date.now();
    let id = '';
    mutate((s) => {
      id = uid('battle');
      s.battles.unshift({
        id,
        title: clean.slice(0, 60),
        cardAId,
        cardBId,
        createdBy: me.id,
        createdAt: new Date(nowT).toISOString(),
        endsAt: new Date(nowT + dur * 3600 * 1000).toISOString(),
      });
      s.tallies[id] = { a: 0, b: 0, voters: [] };
      addPoints(s, me.id, POINTS.battleCreate, `Battle created · +${POINTS.battleCreate} Glow Points`, `/battles/${id}`, true);
    });
    return { ok: true, message: `Battle created — voting runs ${dur}h. Share the vote links!`, id };
  },

  /* ── reports / sharing / notifications ── */

  reportContent(targetType: Report['targetType'], targetId: string, reason: string, details: string): ActionResult {
    const me = sessionUser(state);
    const clean = details.trim();
    if (!reason) return { ok: false, message: 'Choose a reason.' };
    if (clean.length > 500) return { ok: false, message: 'Keep details under 500 characters.' };
    mutate((s) => {
      s.reports.push({
        id: uid('report'),
        targetType,
        targetId,
        reason,
        details: clean,
        reporterId: me ? me.id : null,
        createdAt: new Date().toISOString(),
      });
    });
    return { ok: true, message: 'Report saved. Our moderation queue reviews reports before the public launch.' };
  },

  sharePost(postId: string): string {
    mutate((s) => {
      const p = getPost(s, postId);
      if (p) p.shares += 1;
    });
    return `${siteUrl()}/posts/${postId}`;
  },

  markAllNotificationsRead() {
    mutate((s) => {
      for (const n of s.notifications) n.read = true;
      const me = s.sessionUserId;
      if (!me) return;
      const { list } = getNotifications(s, me);
      for (const n of list) {
        if (n.dismissKey && !s.dismissed.includes(n.dismissKey)) s.dismissed.push(n.dismissKey);
      }
    });
  },

  resetAll() {
    const s = emptyState();
    mutate((st) => {
      st.users = s.users;
      st.cards = s.cards;
      st.posts = s.posts;
      st.battles = s.battles;
      st.tallies = s.tallies;
      st.follows = s.follows;
      st.reports = s.reports;
      st.notifications = s.notifications;
      st.dismissed = s.dismissed;
      st.winAwarded = s.winAwarded;
      st.sessionUserId = s.sessionUserId;
      st.storageOk = true;
    });
  },
};

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
