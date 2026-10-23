import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDays, Copy, Heart, Image as ImageIcon, Newspaper, Sparkles, Swords, Trophy } from 'lucide-react';
import {
  computeAchievements,
  getUserByUsername,
  hasLikedProfile,
  profileLikeCount,
  sessionUser,
  siteUrl,
  userStats,
  useSnapGlow,
} from '../lib/store';
import { levelForPoints, pointsToNextLevel, LEVELS } from '../lib/challenges';
import { CARD_THEMES, themeUnlocked } from '../lib/cardThemes';
import { Seo } from '../components/Seo';
import { useToast } from '../components/Toast';
import {
  Avatar,
  CtaButton,
  EmptyState,
  FlexCard,
  FollowButton,
  GhostButton,
  LevelBadge,
  PointsChip,
  PostCard,
  Stat,
  Tabs,
} from '../components/ui';
import { formatCount, handle } from '../lib/format';
import NotFound from './NotFound';

type ProfileTab = 'cards' | 'posts' | 'battles' | 'achievements';

const TABS: Array<{ id: ProfileTab; label: string }> = [
  { id: 'cards', label: 'Cards' },
  { id: 'posts', label: 'Posts' },
  { id: 'battles', label: 'Battles' },
  { id: 'achievements', label: 'Achievements' },
];

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const sg = useSnapGlow();
  const { toast } = useToast();
  const [tab, setTab] = useState<ProfileTab>('cards');
  const [likeBusy, setLikeBusy] = useState(false);

  const user = username ? getUserByUsername(sg.state, username) : undefined;
  if (!user) return <NotFound />;

  const me = sessionUser(sg.state);
  const isMe = !!me && me.id === user.id;
  const stats = userStats(sg.state, user.id);
  const achievements = computeAchievements(sg.state, user.id);
  const level = levelForPoints(user.points);
  const nextLevel = LEVELS.find((l) => l.minPoints > user.points);
  const progress = nextLevel
    ? Math.min(100, Math.round(((user.points - level.minPoints) / (nextLevel.minPoints - level.minPoints)) * 100))
    : 100;
  const nextTheme = CARD_THEMES.find((t) => !themeUnlocked(t, user.points));
  const cards = sg.state.cards.filter((c) => c.ownerId === user.id && c.published);
  const posts = sg.state.posts
    .filter((p) => p.authorId === user.id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const myBattles = sg.state.battles
    .filter((b) => {
      const a = sg.state.cards.find((c) => c.id === b.cardAId);
      const c = b.cardBId ? sg.state.cards.find((x) => x.id === b.cardBId) : undefined;
      return a?.ownerId === user.id || c?.ownerId === user.id;
    })
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const joinedLabel = new Date(user.joinedAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const profileUrl = `${siteUrl()}/u/${user.username}`;
  const liked = hasLikedProfile(sg.state, user.id);
  const profileLikes = profileLikeCount(sg.state, user.id);

  const copyProfile = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast('Profile link copied — share it with friends!');
    } catch {
      toast('Copy failed — long-press the address bar to copy.');
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Seo
        title={`${user.displayName} (${handle(user.username)}) · Snap Glow`}
        description={`Flex cards, streak cards, posts and achievements from ${user.displayName} — a Snapchat user on Snap Glow.`}
        path={`/u/${user.username}`}
        noindex
      />

      {/* hue-themed cover */}
      <div
        className="h-40 rounded-card border-2 border-ink"
        aria-hidden="true"
        style={{
          background: `linear-gradient(120deg, hsl(${user.hue}, 85%, 55%), hsl(${(user.hue + 60) % 360}, 80%, 60%), hsl(${(user.hue + 140) % 360}, 75%, 45%))`,
        }}
      />

      <div className="px-2 sm:px-6">
        <div className="-mt-12">
          <Avatar name={user.displayName} hue={user.hue} src={user.avatar} emoji={user.avatarEmoji} size={96} ring />
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4 pt-4">
          <div className="min-w-0">
            <h1 className="flex flex-wrap items-center gap-2 font-display text-3xl font-extrabold text-ink sm:text-4xl">
              {user.displayName}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 font-bold text-ink-mute">
              {handle(user.username)} <LevelBadge points={user.points} size="sm" /> <PointsChip points={user.points} />
            </p>
            {user.bio && <p className="mt-2 max-w-xl font-semibold leading-relaxed text-ink-soft">{user.bio}</p>}
            <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-ink-mute">
              <CalendarDays size={15} aria-hidden="true" /> Joined {joinedLabel} · {level.blurb}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={copyProfile}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border-2 border-ink bg-white px-4 py-2 font-grotesk font-bold text-ink transition hover:border-brand-cyan"
              aria-label="Copy profile link"
            >
              <Copy size={15} aria-hidden="true" /> Share
            </button>
            {isMe ? (
              <GhostButton to="/dashboard">Edit profile</GhostButton>
            ) : (
              <>
                <button
                  type="button"
                  aria-pressed={liked}
                  disabled={likeBusy}
                  onClick={async () => {
                    if (!me) {
                      toast('Create a free account to like profiles.');
                      return;
                    }
                    setLikeBusy(true);
                    const res = await sg.toggleProfileLike(user.id);
                    toast(res.message);
                    setLikeBusy(false);
                  }}
                  className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full border-2 border-ink px-4 py-2 font-grotesk font-bold transition ${
                    liked ? 'bg-blush text-brand-pink' : 'bg-white text-ink hover:border-brand-pink'
                  }`}
                >
                  <Heart size={15} aria-hidden="true" className={liked ? 'fill-brand-pink' : ''} />
                  {formatCount(profileLikes)}
                </button>
                <FollowButton userId={user.id} />
              </>
            )}
          </div>
        </div>

        <div className="card-surface mt-6 grid grid-cols-3 gap-4 rounded-card px-4 py-5 sm:grid-cols-6">
          <Stat label="Cards" value={stats.cards} />
          <Stat label="Likes" value={formatCount(stats.likesReceived)} />
          <Stat label="Wins" value={stats.wins} />
          <Stat label="Losses" value={stats.losses} />
          <Stat label="Votes cast" value={stats.votesCast} />
          <Stat label="Followers" value={formatCount(stats.followers)} />
        </div>

        {/* ── progression ── */}
        <div className="card-surface mt-4 rounded-card p-5" aria-label="Level progression">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="inline-flex items-center gap-2 font-display text-lg font-extrabold text-ink">
              <Sparkles size={18} aria-hidden="true" className="text-brand-violet" /> {level.name}
              <span className="rounded-full bg-lav px-2.5 py-0.5 text-xs font-extrabold text-brand-violet">
                {user.points} Glow Points
              </span>
            </p>
            <p className="text-xs font-bold text-ink-mute">
              {nextLevel ? `${pointsToNextLevel(user.points)} points to ${nextLevel.name}` : 'Top level — Legend!'}
            </p>
          </div>
          <div className="mt-3 h-4 overflow-hidden rounded-full border-2 border-ink bg-white">
            <div className="h-full bg-sun transition-all" style={{ width: `${Math.max(4, progress)}%` }} />
          </div>
          {nextTheme && (
            <p className="mt-2 text-xs font-semibold text-ink-soft">
              Next unlock: <span className="font-extrabold text-ink">{nextTheme.name}</span> card theme at{' '}
              {nextLevel?.name ?? 'the next level'}.
            </p>
          )}
        </div>

        <div className="mt-8">
          <Tabs tabs={TABS} active={tab} onChange={setTab} ariaLabel={`${user.displayName}'s content`} />
        </div>

        <div className="mt-6">
          {tab === 'cards' &&
            (cards.length === 0 ? (
              <EmptyState
                icon={ImageIcon}
                title="No cards yet"
                body={isMe ? 'Create your first flex or streak card and show the world your vibe.' : `${user.displayName} hasn't published any cards yet.`}
                action={isMe ? <CtaButton to="/create">Create a card</CtaButton> : undefined}
              />
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {cards.map((card) => (
                  <Link key={card.id} to={`/cards/${card.id}`} aria-label={`Open card “${card.title}”`}>
                    <FlexCard card={card} owner={user} className="transition hover:opacity-95" />
                  </Link>
                ))}
              </div>
            ))}

          {tab === 'posts' &&
            (posts.length === 0 ? (
              <EmptyState
                icon={Newspaper}
                title="No posts yet"
                body={isMe ? 'Share your first update with the community.' : `${user.displayName} hasn't posted anything yet.`}
                action={isMe ? <CtaButton to="/feed">Go to feed</CtaButton> : undefined}
              />
            ) : (
              <div className="space-y-5">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ))}

          {tab === 'battles' &&
            (myBattles.length === 0 ? (
              <EmptyState
                icon={Swords}
                title="No battles yet"
                body={isMe ? 'Jump into a vote battle — challenge a friend or start an open one.' : `${user.displayName} hasn't battled yet.`}
                action={isMe ? <CtaButton to="/battles/new">Create a battle</CtaButton> : undefined}
              />
            ) : (
              <ul className="space-y-3">
                {myBattles.map((b) => {
                  const tally = sg.state.tallies[b.id];
                  const won =
                    b.status === 'ended' && b.winner && b.winner !== 'tie'
                      ? sg.state.cards.find((c) => c.id === (b.winner === 'a' ? b.cardAId : b.cardBId))?.ownerId === user.id
                      : false;
                  const status =
                    b.status === 'pending' ? 'Pending' : b.status === 'live' ? 'Live' : b.status === 'ended' ? (b.winner === 'tie' ? 'Tie' : won ? 'Won' : 'Lost') : b.status;
                  return (
                    <li key={b.id}>
                      <Link
                        to={`/battles/${b.id}`}
                        className="card-surface flex flex-wrap items-center justify-between gap-3 rounded-card p-4 transition hover:-translate-y-0.5"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-display text-base font-extrabold text-ink">{b.title}</span>
                          <span className="block text-xs font-semibold text-ink-mute">
                            {tally ? `${tally.a + tally.b} votes` : 'no votes yet'} ·{' '}
                            {new Date(b.createdAt).toLocaleDateString()}
                          </span>
                        </span>
                        <span
                          className={`rounded-full border-2 border-ink px-3 py-1 text-xs font-extrabold ${
                            status === 'Won' ? 'bg-mint text-ink' : status === 'Live' ? 'bg-sun text-ink' : status === 'Lost' ? 'bg-blush text-brand-pink' : 'bg-white text-ink-mute'
                          }`}
                        >
                          {status}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ))}

          {tab === 'achievements' && (
            <div>
              <div className="grid gap-4 sm:grid-cols-2">
                {achievements.map((a) => (
                  <div
                    key={a.id}
                    className={`rounded-card border p-5 ${
                      a.unlocked ? 'border-2 border-ink bg-mint shadow-pop' : 'border-line bg-white opacity-75'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl" aria-hidden="true">{a.unlocked ? '🏆' : '🔒'}</span>
                      <div>
                        <h2 className="font-display text-lg font-extrabold text-ink">{a.label}</h2>
                        <p className="text-sm font-semibold text-ink-soft">{a.blurb}</p>
                        <p className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider ${a.unlocked ? 'bg-mint text-ink' : 'bg-lav text-ink-mute'}`}>
                          {a.unlocked ? 'Unlocked' : 'Locked'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-ink-mute">
                <Trophy size={15} aria-hidden="true" /> Achievements are earned through real activity on Snap Glow.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
