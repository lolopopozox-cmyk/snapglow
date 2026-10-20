import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Seo } from '../components/Seo';
import { useSnapGlow, trendingCards, leaderboard, getUser } from '../lib/store';
import {
  Avatar,
  FlexCard,
  PageHeader,
  FollowButton,
  Tabs,
  EmptyState,
  LevelBadge,
} from '../components/ui';
import { AdSlot } from '../components/AdSlot';
import { Search, TrendingUp, Sparkles } from 'lucide-react';
import { formatCount, handle } from '../lib/format';

type DiscoverTab = 'all' | 'trending' | 'new' | 'liked' | 'creators';

const TABS: Array<{ id: DiscoverTab; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'trending', label: 'Trending' },
  { id: 'new', label: 'New' },
  { id: 'liked', label: 'Most Liked' },
  { id: 'creators', label: 'Top Creators' },
];

function CreatorCard({ userId }: { userId: string }) {
  const sg = useSnapGlow();
  const user = getUser(sg.state, userId);
  if (!user) return null;
  const stats = leaderboard(sg.state, 'daily').find((r) => r.user.id === userId)?.stats;
  return (
    <div className="card-surface flex flex-col items-center rounded-card p-6 text-center">
      <Avatar name={user.displayName} hue={user.hue} size={72} />
      <p className="mt-3 flex flex-wrap items-center justify-center gap-2 font-display text-xl font-extrabold text-ink">
        <span>{user.displayName}</span>
        <LevelBadge points={user.points} size="sm" />
      </p>
      <p className="text-sm text-ink-mute">{handle(user.username)}</p>
      <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{user.bio}</p>
      <div className="mt-4 flex w-full justify-center gap-6">
        <div className="text-center">
          <p className="font-display text-lg font-extrabold text-ink">{formatCount(stats?.likesReceived ?? 0)}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-ink-mute">Likes</p>
        </div>
        <div className="text-center">
          <p className="font-display text-lg font-extrabold text-ink">{stats?.wins ?? 0}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-ink-mute">Wins</p>
        </div>
        <div className="text-center">
          <p className="font-display text-lg font-extrabold text-ink">{stats?.cards ?? 0}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-ink-mute">Cards</p>
        </div>
      </div>
      <div className="mt-4 flex w-full justify-center gap-2">
        <FollowButton userId={user.id} />
        <Link
          to={`/u/${user.username}`}
          className="rounded-full border border-line bg-white px-5 py-2 font-display text-base font-bold text-ink-soft transition hover:border-brand-violet hover:text-brand-violet"
        >
          View
        </Link>
      </div>
    </div>
  );
}

export default function Discover() {
  const sg = useSnapGlow();
  const navigate = useNavigate();
  const [tab, setTab] = useState<DiscoverTab>('all');
  const [q, setQ] = useState('');

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const featured = leaderboard(sg.state, 'daily').slice(0, 4);
  const newUsers = [...sg.state.users]
    .sort((a, b) => +new Date(b.joinedAt) - +new Date(a.joinedAt))
    .slice(0, 8);
  const cards = trendingCards(sg.state, 12);

  return (
    <>
      <Seo
        title="Discover Snapchatters · Snap Glow"
        description="Find Snapchat creators, explore trending flex and streak cards, and join the Snap Glow community."
        path="/discover"
        noindex={false}
      />
      <PageHeader
        eyebrow="Community"
        title="Discover Amazing Snapchatters"
        sub="Find Snapchat creators, explore trending flex and streak cards, and join the community."
      />

      {/* Search row */}
      <form onSubmit={submitSearch} className="mb-6 flex gap-3" role="search">
        <label htmlFor="discover-search" className="sr-only">
          Search Snap Glow
        </label>
        <input
          id="discover-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search creators, cards, posts…"
          className="w-full rounded-2xl border-2 border-line bg-white px-4 py-3 text-base font-semibold text-ink placeholder:text-ink-mute/70 focus:border-brand-cyan focus:outline-none"
        />
        <button type="submit" className="btn-cta inline-flex items-center gap-2 rounded-full px-6 py-3 font-display text-base font-bold">
          <Search size={18} aria-hidden="true" /> Search
        </button>
      </form>

      <div className="mb-6">
        <AdSlot slot="discover-hero-bottom" />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} ariaLabel="Discover filters" />

      {/* Featured creators — always visible */}
      <section className="mt-10">
        <h2 className="font-display mb-1 text-3xl font-extrabold tracking-tight text-ink">Featured Creators</h2>
  
        {featured.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-white/60 p-6 text-center text-sm font-semibold text-ink-mute">
            No creators yet — be the first to join and claim a featured spot.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((row) => (
              <CreatorCard key={row.user.id} userId={row.user.id} />
            ))}
          </div>
        )}
      </section>

      {/* Tab-controlled content */}
      <section className="mt-10">
        {tab === 'all' && (
          <>
            <h2 className="font-display mb-4 text-3xl font-extrabold tracking-tight text-ink">All Creators</h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {sg.state.users.slice(0, 8).map((u) => (
                <CreatorCard key={u.id} userId={u.id} />
              ))}
            </div>
          </>
        )}

        {tab === 'trending' && (
          <>
            <h2 className="font-display mb-1 text-3xl font-extrabold tracking-tight text-ink">Trending Now</h2>
                        <CardGrid cards={cards} />
          </>
        )}

        {tab === 'new' && (
          <>
            <h2 className="font-display mb-1 text-3xl font-extrabold tracking-tight text-ink">Fresh Faces</h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {newUsers.map((u) => (
                <CreatorCard key={u.id} userId={u.id} />
              ))}
            </div>
          </>
        )}

        {tab === 'liked' && (
          <>
            <h2 className="font-display mb-1 text-3xl font-extrabold tracking-tight text-ink">Most Liked Cards</h2>
                        <CardGrid cards={cards} />
          </>
        )}

        {tab === 'creators' && (
          <>
            <h2 className="font-display mb-1 text-3xl font-extrabold tracking-tight text-ink">Top Creators</h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((row) => (
                <CreatorCard key={row.user.id} userId={row.user.id} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Trending cards grid — always visible below */}
      <section className="mt-12">
        <h2 className="font-display mb-1 text-3xl font-extrabold tracking-tight text-ink">Trending Cards</h2>

        {cards.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No trending cards yet"
            body="Trending cards will appear here once the community starts sharing."
          />
        ) : (
          <CardGrid cards={cards.slice(0, 8)} />
        )}
        <p className="mt-6 flex items-center justify-center gap-2 text-sm text-ink-mute">
          <Sparkles size={16} aria-hidden="true" /> Looking for battles? Head to the{' '}
          <Link to="/battles" className="font-bold text-brand-violet underline">
            Vote Battles
          </Link>
          .
        </p>
      </section>
    </>
  );
}

function CardGrid({ cards }: { cards: ReturnType<typeof trendingCards> }) {
  const sg = useSnapGlow();
  if (cards.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Nothing here yet"
        body="Cards will show up once the community starts creating."
      />
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
      {cards.map((card) => {
        const owner = getUser(sg.state, card.ownerId);
        if (!owner) return null;
        return (
          <Link key={card.id} to={`/cards/${card.id}`} className="transition hover:-translate-y-1">
            <FlexCard card={card} owner={owner} className="shadow-soft hover:shadow-lift" />
          </Link>
        );
      })}
    </div>
  );
}
