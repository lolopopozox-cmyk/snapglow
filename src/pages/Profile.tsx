import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDays, Image as ImageIcon, Newspaper, Trophy } from 'lucide-react';
import { computeAchievements, getUserByUsername, sessionUser, userStats, useSnapGlow } from '../lib/store';
import { levelForPoints } from '../lib/challenges';
import { Seo } from '../components/Seo';
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

type ProfileTab = 'cards' | 'posts' | 'achievements';

const TABS: Array<{ id: ProfileTab; label: string }> = [
  { id: 'cards', label: 'Cards' },
  { id: 'posts', label: 'Posts' },
  { id: 'achievements', label: 'Achievements' },
];

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const sg = useSnapGlow();
  const [tab, setTab] = useState<ProfileTab>('cards');

  const user = username ? getUserByUsername(sg.state, username) : undefined;
  if (!user) return <NotFound />;

  const me = sessionUser(sg.state);
  const isMe = !!me && me.id === user.id;
  const stats = userStats(sg.state, user.id);
  const achievements = computeAchievements(sg.state, user.id);
  const level = levelForPoints(user.points);
  const cards = sg.state.cards.filter((c) => c.ownerId === user.id && c.published);
  const posts = sg.state.posts
    .filter((p) => p.authorId === user.id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const joinedLabel = new Date(user.joinedAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Seo
        title={`${user.displayName} (${handle(user.username)}) · Snap Glow`}
        description={`Flex cards, streak cards, posts and achievements from ${user.displayName} — a Snapchat user on Snap Glow.`}
        path={`/u/${user.username}`}
        noindex
      />

      <div className="h-40 rounded-card border-2 border-ink bg-sun" aria-hidden="true" />

      <div className="px-2 sm:px-6">
        <div className="-mt-12">
          <Avatar name={user.displayName} hue={user.hue} size={96} ring />
        </div>
        <div className="-mt-0 flex flex-wrap items-start justify-between gap-4 pt-4">
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
          {isMe ? (
            <GhostButton to="/dashboard">Edit profile</GhostButton>
          ) : (
            <FollowButton userId={user.id} />
          )}
        </div>

        <div className="card-surface mt-6 grid grid-cols-2 gap-4 rounded-card px-4 py-5 sm:grid-cols-5">
          <Stat label="Cards" value={stats.cards} />
          <Stat label="Likes received" value={formatCount(stats.likesReceived)} />
          <Stat label="Battle wins" value={stats.wins} />
          <Stat label="Votes cast" value={stats.votesCast} />
          <Stat label="Followers" value={formatCount(stats.followers)} />
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

          {tab === 'achievements' && (
            <div>
              <div className="grid gap-4 sm:grid-cols-2">
                {achievements.map((a) => (
                  <div
                    key={a.id}
                    className={`rounded-card border p-5 ${
                      a.unlocked ? 'border-ink border-2 bg-mint shadow-pop' : 'border-line bg-white opacity-75'
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
