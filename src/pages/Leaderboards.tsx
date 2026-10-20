import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Crown, Heart, Medal, Trophy, Users } from 'lucide-react';
import { getCard, getUser, leaderboard, recentWinners, topVoters, useSnapGlow } from '../lib/store';
import type { BoardKind } from '../lib/store';
import { levelForPoints, pointsToNextLevel } from '../lib/challenges';
import { Seo } from '../components/Seo';
import { Avatar, CtaButton, EmptyState, FlexCard, FollowButton, LevelBadge, PageHeader, Stat, Tabs } from '../components/ui';
import { AdSlot } from '../components/AdSlot';
import { formatCount, handle } from '../lib/format';

const KINDS = ['daily', 'weekly', 'most-liked', 'most-wins', 'rising', 'top-voters', 'recent-winners'] as const;
type Kind = (typeof KINDS)[number];

const LABELS: Record<Kind, string> = {
  daily: 'Daily Top Flexers',
  weekly: 'Weekly Champions',
  'most-liked': 'Most-Liked Cards',
  'most-wins': 'Most Wins',
  rising: 'Rising Creators',
  'top-voters': 'Top Voters',
  'recent-winners': 'Recent Winners',
};

const SUBS: Record<Kind, string> = {
  daily: "Today's most-loved creators, ranked by likes, wins and votes.",
  weekly: "This week's champions, ranked by likes, wins and votes.",
  'most-liked': 'The flex cards with the most love from the community.',
  'most-wins': 'Creators with the most battle victories of all time.',
  rising: 'New creators climbing fast, ranked by momentum.',
  'top-voters': 'The community members casting the most votes — the #1 voter earns the Top Voter crown.',
  'recent-winners': 'Winners and ties from recently finished battles.',
};

function RankMark({ rank }: { rank: number }) {
  if (rank === 1) return <Crown size={24} className="text-amber-500" aria-label="Rank 1" />;
  if (rank === 2) return <Medal size={24} className="text-slate-400" aria-label="Rank 2" />;
  if (rank === 3) return <Medal size={24} className="text-amber-700" aria-label="Rank 3" />;
  return <span className="font-display text-xl font-extrabold text-ink-mute">{rank}</span>;
}

export default function Leaderboards() {
  const { kind: rawKind } = useParams<{ kind: string }>();
  const navigate = useNavigate();
  const sg = useSnapGlow();

  if (!rawKind || !(KINDS as readonly string[]).includes(rawKind)) {
    return <Navigate to="/leaderboards/daily" replace />;
  }
  const kind = rawKind as Kind;
  const label = LABELS[kind];

  const userKinds: Kind[] = ['daily', 'weekly', 'most-wins', 'rising'];
  const rows = userKinds.includes(kind) ? leaderboard(sg.state, kind as BoardKind).slice(0, 10) : [];
  const voters = kind === 'top-voters' ? topVoters(sg.state, 20) : [];
  const topCards =
    kind === 'most-liked'
      ? [...sg.state.cards]
          .filter((c) => c.published)
          .sort((a, b) => b.likes.length - a.likes.length)
          .slice(0, 8)
      : [];
  const winners = kind === 'recent-winners' ? recentWinners(sg.state) : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Seo
        title={`${label} · Snap Glow`}
        description={`See who's leading on Snap Glow — ${label.toLowerCase()}.`}
        path={`/leaderboards/${kind}`}
      />

      <PageHeader eyebrow="Rankings" title={label} sub={SUBS[kind]} />

      <div className="mb-8">
        <Tabs
          tabs={KINDS.map((k) => ({ id: k, label: LABELS[k] }))}
          active={kind}
          onChange={(k) => navigate(`/leaderboards/${k}`)}
          ariaLabel="Leaderboard kinds"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          {userKinds.includes(kind) &&
            (rows.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No rankings yet"
                body="Nobody has earned a spot yet — create the first card and claim rank #1."
                action={<CtaButton to="/create">Create a card</CtaButton>}
              />
            ) : (
              <ul className="space-y-3">
                {rows.map(({ user, stats }, i) => {
                  const level = levelForPoints(user.points);
                  const toNext = pointsToNextLevel(user.points);
                  return (
                    <li key={user.id} className="card-surface rounded-card p-4">
                      <div className="flex items-center gap-3">
                        <div className="grid w-9 shrink-0 place-items-center" aria-hidden={i > 2}>
                          <RankMark rank={i + 1} />
                        </div>
                        <Link to={`/u/${user.username}`} aria-label={`View ${user.displayName}'s profile`}>
                          <Avatar name={user.displayName} hue={user.hue} size={46} />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-1.5">
                            <Link to={`/u/${user.username}`} className="truncate font-display text-lg font-bold text-ink hover:text-brand-violet">
                              {user.displayName}
                            </Link>
                            <LevelBadge points={user.points} size="sm" />
                          </p>
                          <p className="truncate text-sm font-semibold text-ink-mute">
                            {handle(user.username)} · {level.name}
                            {toNext > 0 ? ` · ${toNext} pts to next level` : ' · max level'}
                          </p>
                        </div>
                        <div className="hidden items-center gap-6 sm:flex">
                          <Stat label="Cards" value={stats.cards} />
                          <Stat label="Likes" value={formatCount(stats.likesReceived)} />
                          <Stat label="Wins" value={stats.wins} />
                        </div>
                        <FollowButton userId={user.id} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ))}

          {kind === 'top-voters' &&
            (voters.length === 0 ? (
              <EmptyState
                icon={Heart}
                title="No votes yet"
                body="Nobody has voted in a battle yet. Cast the first vote and take the crown."
                action={<CtaButton to="/battles">Browse battles</CtaButton>}
              />
            ) : (
              <>
                <div className="mb-4 rounded-2xl border border-line bg-sun-tint p-4">
                  <p className="flex items-start gap-2 text-sm font-semibold text-ink-soft">
                    <Crown size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-amber-500" />
                    Every vote earns +2 Glow Points. The #1 voter earns the permanent Top Voter crown
                    badge — on-platform bragging rights, not money.
                  </p>
                </div>
                <ul className="space-y-3">
                  {voters.map(({ user, votes }, i) => (
                    <li key={user.id} className="card-surface rounded-card p-4">
                      <div className="flex items-center gap-3">
                        <div className="grid w-9 shrink-0 place-items-center" aria-hidden={i > 2}>
                          <RankMark rank={i + 1} />
                        </div>
                        <Link to={`/u/${user.username}`} aria-label={`View ${user.displayName}'s profile`}>
                          <Avatar name={user.displayName} hue={user.hue} size={46} />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-1.5">
                            <Link to={`/u/${user.username}`} className="truncate font-display text-lg font-bold text-ink hover:text-brand-violet">
                              {user.displayName}
                            </Link>
                            {user.badges.includes('top-voter') && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[0.7rem] font-extrabold uppercase tracking-wider text-amber-700">
                                <Crown size={11} aria-hidden="true" /> Top Voter
                              </span>
                            )}
                          </p>
                          <p className="truncate text-sm font-semibold text-ink-mute">{handle(user.username)}</p>
                        </div>
                        <div className="hidden items-center gap-6 sm:flex">
                          <Stat label="Votes cast" value={votes} />
                          <Stat label="Points" value={formatCount(user.points)} />
                        </div>
                        <FollowButton userId={user.id} />
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            ))}

          {kind === 'most-liked' &&
            (topCards.length === 0 ? (
              <EmptyState
                icon={Heart}
                title="No cards yet"
                body="Be the first to publish a card and take the most-liked crown."
                action={<CtaButton to="/create">Create a card</CtaButton>}
              />
            ) : (
              <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                {topCards.map((card, i) => {
                  const owner = getUser(sg.state, card.ownerId);
                  if (!owner) return null;
                  return (
                    <div key={card.id} className="relative">
                      <span className="absolute left-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/95 shadow-soft">
                        <RankMark rank={i + 1} />
                      </span>
                      <Link to={`/cards/${card.id}`} aria-label={`Open card “${card.title}”`}>
                        <FlexCard card={card} owner={owner} className="transition hover:opacity-95" />
                      </Link>
                      <p className="mt-2 flex items-center justify-center gap-1.5 text-sm font-extrabold text-ink">
                        <Heart size={14} className="text-brand-pink" aria-hidden="true" />
                        {formatCount(card.likes.length)} likes
                      </p>
                    </div>
                  );
                })}
              </div>
            ))}

          {kind === 'recent-winners' &&
            (winners.length === 0 ? (
              <EmptyState
                icon={Trophy}
                title="No winners yet"
                body="No battles have finished yet. Start one and make some history."
                action={<CtaButton to="/battles/new">Create Battle</CtaButton>}
              />
            ) : (
              <ul className="space-y-3">
                {winners.map(({ battle: b, winner }) => {
                  const cardA = getCard(sg.state, b.cardAId);
                  const cardB = getCard(sg.state, b.cardBId);
                  const ownerA = cardA ? getUser(sg.state, cardA.ownerId) : undefined;
                  const ownerB = cardB ? getUser(sg.state, cardB.ownerId) : undefined;
                  if (!ownerA || !ownerB) return null;
                  const winnerName = winner === 'a' ? ownerA.displayName : winner === 'b' ? ownerB.displayName : null;
                  return (
                    <li key={b.id} className="card-surface rounded-card p-4">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <div className="min-w-0 flex-1">
                          <h2 className="font-display text-lg font-extrabold text-ink">
                            <Link to={`/battles/${b.id}/results`} className="hover:text-brand-violet">
                              {b.title}
                            </Link>
                          </h2>
                          <p className="mt-0.5 text-sm font-semibold text-ink-mute">
                            {ownerA.displayName} vs {ownerB.displayName}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-extrabold ${
                            winner === 'tie' ? 'bg-cyantint text-ink' : 'bg-mint text-ink'
                          }`}
                        >
                          {winner === 'tie' ? (
                            <>🤝 Tie</>
                          ) : winnerName ? (
                            <>
                              <Trophy size={15} className="text-amber-500" aria-hidden="true" /> {winnerName}
                            </>
                          ) : (
                            '—'
                          )}
                        </span>
                        <Link
                          to={`/battles/${b.id}/results`}
                          className="rounded-full border border-line bg-white px-4 py-2 text-sm font-extrabold text-ink hover:border-brand-violet hover:text-brand-violet"
                        >
                          View results
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ))}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
          <div className="hidden lg:block">
            <AdSlot slot="leaderboard-sidebar" />
          </div>
          <div className="rounded-card border border-line border-2 border-ink bg-mint p-6 shadow-soft">
            <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-soft" aria-hidden="true">
              <Crown size={28} className="text-amber-500" />
            </span>
            <h2 className="font-display text-2xl font-extrabold text-ink">Become a Top Creator</h2>
            <p className="mt-2 font-semibold leading-relaxed text-ink-soft">
              Create cards, win battles, vote daily — earn Glow Points and climb from Rising Star to
              Legend.
            </p>
            <div className="mt-5">
              <CtaButton to="/create">Get Started</CtaButton>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
