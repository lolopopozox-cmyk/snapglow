import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Flame, Search as SearchIcon, Sparkles, Swords, TrendingUp } from 'lucide-react';
import {
  getUser,
  leaderboard,
  sessionUser,
  trendingCards,
  useSnapGlow,
  userStats,
} from '../lib/store';
import { Seo } from '../components/Seo';
import {
  Avatar,
  CtaButton,
  EmptyState,
  FlexCard,
  FollowButton,
  LevelBadge,
  PageHeader,
  SectionTitle,
  Tabs,
} from '../components/ui';
import { AdSlot } from '../components/AdSlot';
import { useToast } from '../components/Toast';
import { formatCount, handle } from '../lib/format';
import type { User } from '../lib/types';

type DiscoverTab = 'all' | 'trending' | 'new' | 'liked' | 'creators';

const TABS: Array<{ id: DiscoverTab; label: string }> = [
  { id: 'all', label: 'All creators' },
  { id: 'trending', label: 'Trending' },
  { id: 'new', label: 'Fresh faces' },
  { id: 'liked', label: 'Most liked' },
  { id: 'creators', label: 'Top creators' },
];

function CreatorCard({ user, challengeable }: { user: User; challengeable: boolean }) {
  const sg = useSnapGlow();
  const { toast } = useToast();
  const me = sessionUser(sg.state);
  const stats = userStats(sg.state, user.id);
  const myCard = sg.state.cards.find((c) => c.published && c.ownerId === me?.id);

  const challenge = async () => {
    if (!me || !myCard) return;
    const res = await sg.createChallenge(
      `${me.displayName} vs ${user.displayName}`.slice(0, 60),
      myCard.id,
      user.username,
      12,
    );
    toast(res.message);
  };

  return (
    <article className="card-surface overflow-hidden rounded-card">
      {/* hue cover */}
      <div
        className="h-16 border-b-2 border-ink"
        aria-hidden="true"
        style={{
          background: `linear-gradient(120deg, hsl(${user.hue}, 85%, 55%), hsl(${(user.hue + 60) % 360}, 80%, 60%))`,
        }}
      />
      <div className="p-5">
        <div className="-mt-12 flex items-end justify-between gap-3">
          <Link to={`/u/${user.username}`} aria-label={`View ${user.displayName}'s profile`}>
            <Avatar name={user.displayName} hue={user.hue} src={user.avatar} emoji={user.avatarEmoji} size={72} ring />
          </Link>
          <LevelBadge points={user.points} size="sm" />
        </div>
        <Link to={`/u/${user.username}`} className="mt-3 block">
          <h3 className="truncate font-display text-xl font-extrabold text-ink hover:text-brand-violet">
            {user.displayName}
          </h3>
          <p className="text-sm font-bold text-ink-mute">{handle(user.username)}</p>
        </Link>
        {user.bio && <p className="mt-2 text-sm font-semibold text-ink-soft">{user.bio}</p>}

        <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl border-2 border-ink bg-white px-2 py-2">
            <dt className="text-[10px] font-extrabold uppercase tracking-wider text-ink-mute">Cards</dt>
            <dd className="font-display text-lg font-extrabold text-ink">{stats.cards}</dd>
          </div>
          <div className="rounded-2xl border-2 border-ink bg-white px-2 py-2">
            <dt className="text-[10px] font-extrabold uppercase tracking-wider text-ink-mute">Wins</dt>
            <dd className="font-display text-lg font-extrabold text-ink">{stats.wins}</dd>
          </div>
          <div className="rounded-2xl border-2 border-ink bg-white px-2 py-2">
            <dt className="text-[10px] font-extrabold uppercase tracking-wider text-ink-mute">Likes</dt>
            <dd className="font-display text-lg font-extrabold text-ink">{formatCount(stats.likesReceived)}</dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to={`/u/${user.username}`}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-full border-2 border-ink bg-white px-4 py-2 font-grotesk text-sm font-bold text-ink transition hover:border-brand-cyan"
          >
            View Profile
          </Link>
          {challengeable ? (
            myCard ? (
              <button
                type="button"
                onClick={challenge}
                className="btn-violet inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2 font-grotesk text-sm font-bold"
              >
                <Swords size={15} aria-hidden="true" /> Challenge
              </button>
            ) : (
              <Link
                to="/create"
                title="Create a card first"
                className="btn-violet inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2 font-grotesk text-sm font-bold"
              >
                <Swords size={15} aria-hidden="true" /> Challenge
              </Link>
            )
          ) : (
            !me && (
              <Link
                to="/signin"
                className="btn-violet inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2 font-grotesk text-sm font-bold"
              >
                <Swords size={15} aria-hidden="true" /> Challenge
              </Link>
            )
          )}
        </div>
        <div className="mt-3">
          <FollowButton userId={user.id} />
        </div>
      </div>
    </article>
  );
}

export default function Discover() {
  const sg = useSnapGlow();
  const navigate = useNavigate();
  const [tab, setTab] = useState<DiscoverTab>('all');
  const [q, setQ] = useState('');
  const me = sessionUser(sg.state);

  const featuredRows = leaderboard(sg.state, 'daily').slice(0, 4);
  const featured = [
    ...sg.state.featured
      .map((id) => sg.state.users.find((u) => u.id === id))
      .filter((u): u is User => !!u),
    ...featuredRows.map((r) => r.user),
  ].filter((u, i, arr) => arr.findIndex((x) => x.id === u.id) === i);

  const allUsers = [...sg.state.users].sort((a, b) => b.points - a.points);
  const newUsers = [...sg.state.users].sort((a, b) => +new Date(b.joinedAt) - +new Date(a.joinedAt));
  const mostLiked = leaderboard(sg.state, 'most-liked');
  const topCreators = leaderboard(sg.state, 'weekly');
  const cards = trendingCards(sg.state, 12);

  const list =
    tab === 'new'
      ? newUsers
      : tab === 'liked'
        ? mostLiked.map((r) => r.user)
        : tab === 'creators'
          ? topCreators.map((r) => r.user)
          : allUsers;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Seo
        title="Discover Snapchat Creators · Snap Glow"
        description="Browse and discover Snap Glow creators — flex cards, streak cards, vote battles and leaderboards for the Snapchat community."
        path="/discover"
      />

      <PageHeader
        eyebrow="Discover"
        title="Find your people"
        sub="Every public creator on Snap Glow — follow them, like their profiles, challenge them to battles."
      />

      <form
        className="mt-6 flex gap-2"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          navigate(`/search?q=${encodeURIComponent(q)}`);
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search creators, cards, posts…"
          aria-label="Search creators"
          className="min-h-[48px] w-full rounded-full border-2 border-ink bg-white px-5 font-grotesk font-bold text-ink placeholder:text-ink-mute"
        />
        <button type="submit" className="btn-cta inline-flex min-h-[48px] items-center gap-2 rounded-full px-6 font-display font-bold">
          <SearchIcon size={17} aria-hidden="true" /> Search
        </button>
      </form>

      <div className="my-8">
        <AdSlot slot="discover-hero-bottom" />
      </div>

      <section className="mb-10">
        <SectionTitle title="Featured creators" sub="Spotlight picks and today's hottest accounts." />
        {featured.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No featured creators yet"
            body="Featured spots fill as the community grows — earn Glow Points to claim one."
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.slice(0, 4).map((u) => (
              <CreatorCard key={u.id} user={u} challengeable={!!me && me.id !== u.id} />
            ))}
          </div>
        )}
      </section>

      <Tabs tabs={TABS} active={tab} onChange={setTab} ariaLabel="Discover filters" />

      <section className="mt-6">
        {list.length === 0 ? (
          <EmptyState
            icon={Compass}
            title="No creators yet"
            body="Be the first! Create an account and claim your featured spot."
            action={<CtaButton to="/signin">Join free</CtaButton>}
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.slice(0, 24).map((u) => (
              <CreatorCard key={u.id} user={u} challengeable={!!me && me.id !== u.id} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <SectionTitle title="Trending cards" sub="The most-loved flex cards right now." />
        {cards.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No trending cards yet"
            body="Published cards land here as they collect likes."
            action={<CtaButton to="/create">Create the first card</CtaButton>}
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {cards.slice(0, 8).map((card) => {
              const owner = getUser(sg.state, card.ownerId);
              if (!owner) return null;
              return (
                <Link key={card.id} to={`/cards/${card.id}`} aria-label={`Open card “${card.title}”`}>
                  <FlexCard card={card} owner={owner} className="transition hover:opacity-95" />
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-12 rounded-card border-2 border-ink bg-sun p-6 text-center shadow-lift">
        <p className="font-display text-2xl font-extrabold text-ink">
          <Flame className="mr-2 inline" size={24} aria-hidden="true" /> Think you can climb higher?
        </p>
        <p className="mt-2 text-sm font-bold text-ink-soft">
          Create cards, win battles, collect likes — the weekly board resets, so anyone can rise.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <CtaButton to="/create">Create a card</CtaButton>
          <Link
            to="/leaderboards"
            className="inline-flex min-h-[44px] items-center rounded-full border-2 border-ink bg-white px-5 py-2 font-grotesk font-bold text-ink"
          >
            View leaderboards
          </Link>
        </div>
      </section>
    </div>
  );
}
