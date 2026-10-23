import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Crown, Flame, Heart, Medal, Sparkles, Swords, TrendingUp, Trophy, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  currentWinStreak,
  getCard,
  getUser,
  leaderboard,
  recentWinners,
  topVoters,
  useSnapGlow,
} from '../lib/store';
import type { BoardRow, StoreState } from '../lib/store';
import type { User } from '../lib/types';
import { levelForPoints, pointsToNextLevel } from '../lib/challenges';
import { Seo } from '../components/Seo';
import {
  Avatar,
  CtaButton,
  EmptyState,
  FollowButton,
  LevelBadge,
  PageHeader,
  PointsChip,
  Stat,
  Tabs,
} from '../components/ui';
import { AdSlot } from '../components/AdSlot';
import { formatCount, handle, timeAgo } from '../lib/format';

/* ── Board model ────────────────────────────────────────────────
   Two clearly separated families:

   GROUP A — Profile Rankings  (Glow Points, likes, momentum)
   GROUP B — Battle Rankings   (wins, streaks, votes, results)

   'daily' stays a VALID kind so the App-level redirect
   (/leaderboards → /leaderboards/daily) keeps working, but the store
   keeps a single weekly-points table (leaderboard('daily') and
   leaderboard('weekly') read the same numbers). Instead of inventing
   a fake "daily" score, the daily URL renders the honest Weekly
   Champions board. */

const PROFILE_KINDS = ['all-time', 'weekly', 'profile-likes', 'most-liked', 'rising'] as const;
const BATTLE_KINDS = ['most-wins', 'win-streaks', 'top-voters', 'recent-winners'] as const;
type ProfileKind = (typeof PROFILE_KINDS)[number];
type BattleKind = (typeof BATTLE_KINDS)[number];
type GroupKind = ProfileKind | BattleKind;

const VALID_KINDS: readonly string[] = ['daily', ...PROFILE_KINDS, ...BATTLE_KINDS];
type Kind = 'daily' | GroupKind;

function isProfileKind(k: GroupKind): k is ProfileKind {
  return (PROFILE_KINDS as readonly string[]).includes(k);
}

const PROFILE_TAB_LABELS: Record<ProfileKind, string> = {
  'all-time': 'All-Time',
  weekly: 'Weekly',
  'profile-likes': 'Profile Likes',
  'most-liked': 'Most Liked',
  rising: 'Rising',
};

const BATTLE_TAB_LABELS: Record<BattleKind, string> = {
  'most-wins': 'Most Wins',
  'win-streaks': 'Win Streaks',
  'top-voters': 'Top Voters',
  'recent-winners': 'Recent Winners',
};

const BOARD_META: Record<GroupKind, { title: string; rules: string }> = {
  'all-time': {
    title: 'All-Time Champions',
    rules:
      'Score = lifetime Glow Points — earned from creating cards, daily logins, comments, votes, follows and battle wins. They never reset.',
  },
  weekly: {
    title: 'Weekly Champions',
    rules:
      'Weekly champions = Glow Points earned Monday → now, from likes, comments, votes, follows and wins. The board resets every Monday.',
  },
  'profile-likes': {
    title: 'Most Profile Likes',
    rules:
      'Ranked by profile likes received. One like per account — and you can never like your own profile.',
  },
  'most-liked': {
    title: 'Most Content Likes',
    rules:
      'Ranked by likes received on published cards and posts — one like per account, no self-likes, no view counts.',
  },
  rising: {
    title: 'Rising Creators',
    rules:
      'Creators who joined in the last 60 days, ranked by momentum: (content likes + 20 × published cards) ÷ days on Snap Glow.',
  },
  'most-wins': {
    title: 'Most Battle Wins',
    rules:
      'Ranked by lifetime battle victories — ties count for neither side. Win rate = wins ÷ (wins + losses).',
  },
  'win-streaks': {
    title: 'Current Win Streaks 🔥',
    rules:
      'Wins in a row across your most recent decided battles. A loss resets the streak; ties are skipped. Ranked by streak length, then total wins.',
  },
  'top-voters': {
    title: 'Top Voters',
    rules:
      'Ranked purely by battle votes cast — one vote per battle per account. Every vote earns +2 Glow Points.',
  },
  'recent-winners': {
    title: 'Recent Winners',
    rules: 'Winners and ties from recently finished battles, newest first.',
  },
};

const EMPTIES: Record<
  GroupKind,
  { icon: LucideIcon; title: string; body: string; ctaTo: string; ctaLabel: string }
> = {
  'all-time': {
    icon: Sparkles,
    title: 'No points on the board yet',
    body: 'Nobody has earned Glow Points so far. Create a card, comment or vote — every point here comes from real activity.',
    ctaTo: '/create',
    ctaLabel: 'Create a card',
  },
  weekly: {
    icon: Flame,
    title: 'No points this week yet',
    body: 'The weekly counter starts at zero every Monday. Earn the first Glow Points of the week and rank #1 until it resets.',
    ctaTo: '/create',
    ctaLabel: 'Create a card',
  },
  'profile-likes': {
    icon: Heart,
    title: 'No profile likes yet',
    body: 'No profile has been liked yet. Profiles earn likes when your cards and posts impress people — keep creating.',
    ctaTo: '/create',
    ctaLabel: 'Create a card',
  },
  'most-liked': {
    icon: Heart,
    title: 'No content likes yet',
    body: 'Nothing has been liked yet. Publish a card and collect the first heart.',
    ctaTo: '/create',
    ctaLabel: 'Create a card',
  },
  rising: {
    icon: TrendingUp,
    title: 'No rising creators yet',
    body: 'No account from the last 60 days has published yet. New creators appear here as soon as they post.',
    ctaTo: '/create',
    ctaLabel: 'Create a card',
  },
  'most-wins': {
    icon: Swords,
    title: 'No battle wins yet',
    body: 'No battle has been won yet. Enter the arena, rally votes and claim the first victory.',
    ctaTo: '/battles',
    ctaLabel: 'Browse battles',
  },
  'win-streaks': {
    icon: Flame,
    title: 'No active streaks',
    body: 'Nobody is on a win streak right now. One battle win starts a streak — two in a row earns the On a Roll badge.',
    ctaTo: '/battles',
    ctaLabel: 'Browse battles',
  },
  'top-voters': {
    icon: Heart,
    title: 'No votes yet',
    body: 'Nobody has voted in a battle yet. Cast the first vote and take the crown.',
    ctaTo: '/battles',
    ctaLabel: 'Browse battles',
  },
  'recent-winners': {
    icon: Trophy,
    title: 'No winners yet',
    body: 'No battles have finished yet. Start one and make some history.',
    ctaTo: '/battles/new',
    ctaLabel: 'Create Battle',
  },
};

/* ── Row primitives ───────────────────────────────────────────── */

function RankMark({ rank }: { rank: number }) {
  if (rank === 1) return <Crown size={24} className="text-amber-500" aria-label="Rank 1" />;
  if (rank === 2) return <Medal size={24} className="text-slate-400" aria-label="Rank 2" />;
  if (rank === 3) return <Medal size={24} className="text-amber-700" aria-label="Rank 3" />;
  return <span className="font-display text-xl font-extrabold text-ink-mute">{rank}</span>;
}

/** Compact, always-visible score chip (survives mobile when stats hide). */
function ScoreChip({
  icon,
  value,
  label,
  bg = 'bg-white',
  title,
}: {
  icon?: ReactNode;
  value: ReactNode;
  label: string;
  bg?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-3 py-1 font-grotesk text-sm font-extrabold text-ink ${bg}`}
    >
      {icon}
      {value} <span className="font-bold text-ink-mute">{label}</span>
    </span>
  );
}

/**
 * One ranked user row. Top-3 podium treatment: #1 gets the bigger
 * bg-sun card (larger avatar + ring), #2/#3 get tinted cards.
 */
function BoardRowItem({
  rank,
  user,
  meta,
  stats,
  scoreChip,
  badge,
}: {
  rank: number;
  user: User;
  meta: string;
  stats: ReactNode;
  scoreChip: ReactNode;
  badge?: ReactNode;
}) {
  const surface =
    rank === 1
      ? 'border-2 border-ink bg-sun p-4 shadow-lift sm:p-5'
      : rank === 2
        ? 'border-2 border-ink bg-lav p-4 shadow-soft'
        : rank === 3
          ? 'border-2 border-ink bg-mint p-4 shadow-soft'
          : 'card-surface p-4';
  return (
    <li className={`rounded-card ${surface}`}>
      <div className="flex min-h-[44px] flex-wrap items-center gap-x-3 gap-y-2">
        <div className="grid w-9 shrink-0 place-items-center" aria-hidden={rank > 3}>
          <RankMark rank={rank} />
        </div>
        <Link
          to={`/u/${user.username}`}
          aria-label={`View ${user.displayName}'s profile`}
          className="shrink-0"
        >
          <Avatar
            name={user.displayName}
            hue={user.hue}
            src={user.avatar}
            emoji={user.avatarEmoji}
            size={rank === 1 ? 56 : 46}
            ring={rank === 1}
          />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-1.5">
            <Link
              to={`/u/${user.username}`}
              className={`truncate font-display font-bold text-ink hover:text-brand-violet ${
                rank === 1 ? 'text-xl' : 'text-lg'
              }`}
            >
              {user.displayName}
            </Link>
            <LevelBadge points={user.points} size="sm" />
            {badge}
          </p>
          <p className="truncate text-sm font-semibold text-ink-mute">{meta}</p>
        </div>
        {/* detailed stats hide gracefully on tiny screens; the score chip stays */}
        <div className="hidden items-center gap-6 sm:flex">{stats}</div>
        <span className="shrink-0">{scoreChip}</span>
        <FollowButton userId={user.id} />
      </div>
    </li>
  );
}

/* ── Row builders per board ───────────────────────────────────── */

function defaultMeta(user: User): string {
  const level = levelForPoints(user.points);
  const toNext = pointsToNextLevel(user.points);
  return `${handle(user.username)} · ${level.name}${
    toNext > 0 ? ` · ${toNext} pts to next level` : ' · max level'
  }`;
}

function winRate(wins: number, losses: number): string {
  const total = wins + losses;
  return total > 0 ? `${Math.round((wins / total) * 100)}%` : '—';
}

function ProfileBoardRow({ kind, row, rank }: { kind: ProfileKind; row: BoardRow; rank: number }) {
  const { user, stats, score } = row;
  let meta = defaultMeta(user);
  let statsBlock: ReactNode = null;
  let chip: ReactNode = null;

  if (kind === 'all-time') {
    chip = <PointsChip points={user.points} />;
    statsBlock = (
      <>
        <Stat label="Cards" value={stats.cards} />
        <Stat label="Likes" value={formatCount(stats.likesReceived)} />
        <Stat label="Wins" value={stats.wins} />
      </>
    );
  } else if (kind === 'weekly') {
    chip = (
      <ScoreChip
        icon={<Flame size={14} aria-hidden="true" className="text-brand-violet" />}
        value={formatCount(score)}
        label="this week"
        title="Glow Points earned this week — resets every Monday"
      />
    );
    statsBlock = (
      <>
        <Stat label="Cards" value={stats.cards} />
        <Stat label="Likes" value={formatCount(stats.likesReceived)} />
        <Stat label="Wins" value={stats.wins} />
      </>
    );
  } else if (kind === 'profile-likes') {
    chip = (
      <ScoreChip
        icon={<Heart size={14} aria-hidden="true" className="text-brand-pink" />}
        value={formatCount(stats.profileLikes)}
        label="profile likes"
        bg="bg-blush"
      />
    );
    statsBlock = (
      <>
        <Stat label="Profile likes" value={formatCount(stats.profileLikes)} />
        <Stat label="Followers" value={formatCount(stats.followers)} />
      </>
    );
  } else if (kind === 'most-liked') {
    chip = (
      <ScoreChip
        icon={<Heart size={14} aria-hidden="true" className="text-brand-pink" />}
        value={formatCount(stats.likesReceived)}
        label="likes"
        bg="bg-blush"
      />
    );
    statsBlock = (
      <>
        <Stat label="Content likes" value={formatCount(stats.likesReceived)} />
        <Stat label="Cards" value={stats.cards} />
      </>
    );
  } else {
    // rising
    const days = Math.max(1, Math.round((Date.now() - new Date(user.joinedAt).getTime()) / 86400000));
    meta = `${handle(user.username)} · joined ${timeAgo(user.joinedAt)}`;
    chip = (
      <ScoreChip
        icon={<TrendingUp size={14} aria-hidden="true" className="text-brand-violet" />}
        value={score >= 10 ? Math.round(score) : score.toFixed(1)}
        label="momentum"
        bg="bg-lav"
        title="(content likes + 20 × cards) ÷ days on Snap Glow"
      />
    );
    statsBlock = (
      <>
        <Stat label="Cards" value={stats.cards} />
        <Stat label="Likes" value={formatCount(stats.likesReceived)} />
        <Stat label="Days" value={days} />
      </>
    );
  }

  return <BoardRowItem rank={rank} user={user} meta={meta} stats={statsBlock} scoreChip={chip} />;
}

function BattleBoardRow({
  s,
  kind,
  row,
  rank,
}: {
  s: StoreState;
  kind: 'most-wins' | 'win-streaks';
  row: BoardRow;
  rank: number;
}) {
  const { user, stats } = row;
  const meta = defaultMeta(user);

  if (kind === 'win-streaks') {
    const streak = currentWinStreak(s, user.id);
    return (
      <BoardRowItem
        rank={rank}
        user={user}
        meta={meta}
        scoreChip={
          <ScoreChip
            icon={<Flame size={14} aria-hidden="true" className="text-brand-coral" />}
            value={streak}
            label="streak"
            bg="bg-sun"
            title="Current win streak — a loss resets it"
          />
        }
        stats={
          <>
            <Stat
              label="Streak"
              value={
                <span className="inline-flex items-center gap-1">
                  <Flame size={18} aria-hidden="true" className="text-brand-coral" />
                  {streak}
                </span>
              }
            />
            <Stat label="Wins" value={stats.wins} />
            <Stat label="Losses" value={stats.losses} />
          </>
        }
      />
    );
  }

  return (
    <BoardRowItem
      rank={rank}
      user={user}
      meta={meta}
      scoreChip={
        <ScoreChip
          icon={<Trophy size={14} aria-hidden="true" className="text-amber-500" />}
          value={stats.wins}
          label="wins"
          bg="bg-mint"
        />
      }
      stats={
        <>
          <Stat label="Wins" value={stats.wins} />
          <Stat label="Win rate" value={winRate(stats.wins, stats.losses)} />
          <Stat label="Losses" value={stats.losses} />
        </>
      }
    />
  );
}

function VoterRow({ user, votes, rank }: { user: User; votes: number; rank: number }) {
  return (
    <BoardRowItem
      rank={rank}
      user={user}
      meta={handle(user.username)}
      badge={
        user.badges.includes('top-voter') ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[0.7rem] font-extrabold uppercase tracking-wider text-amber-700">
            <Crown size={11} aria-hidden="true" /> Top Voter
          </span>
        ) : undefined
      }
      scoreChip={<ScoreChip value={votes} label="votes" bg="bg-cyantint" />}
      stats={
        <>
          <Stat label="Votes cast" value={votes} />
          <Stat label="Points" value={formatCount(user.points)} />
        </>
      }
    />
  );
}

/* ── Board heading: title + transparent scoring rule ──────────── */

function BoardHeading({ title, rules, note }: { title: string; rules: string; note?: string }) {
  return (
    <div className="mb-4">
      <h3 className="flex flex-wrap items-center gap-2 font-display text-2xl font-extrabold tracking-tight text-ink">
        {title}
        {note && (
          <span className="rounded-full border-2 border-ink bg-cyantint px-3 py-0.5 font-grotesk text-xs font-extrabold uppercase tracking-wider text-ink">
            {note}
          </span>
        )}
      </h3>
      <p className="mt-1 max-w-2xl text-sm font-semibold leading-relaxed text-ink-soft">{rules}</p>
    </div>
  );
}

function BoardEmpty({ kind }: { kind: GroupKind }) {
  const e = EMPTIES[kind];
  return (
    <EmptyState
      icon={e.icon}
      title={e.title}
      body={e.body}
      action={<CtaButton to={e.ctaTo}>{e.ctaLabel}</CtaButton>}
    />
  );
}

/* ── Board data (page-level re-ranking for honesty) ─────────────
   The store's 'profile-likes' / 'most-liked' selectors share one
   mixed score (content likes + 2 × profile likes), so each board
   re-sorts by the exact metric its title promises. Zero-activity
   rows are dropped so empty states stay honest. */

function profileRowsFor(s: StoreState, kind: ProfileKind): BoardRow[] {
  const raw = leaderboard(s, kind);
  if (kind === 'profile-likes') {
    return raw
      .filter((r) => r.stats.profileLikes > 0)
      .sort((a, b) => b.stats.profileLikes - a.stats.profileLikes || b.user.points - a.user.points)
      .slice(0, 10);
  }
  if (kind === 'most-liked') {
    return raw
      .filter((r) => r.stats.likesReceived > 0)
      .sort((a, b) => b.stats.likesReceived - a.stats.likesReceived || b.stats.cards - a.stats.cards)
      .slice(0, 10);
  }
  return raw.filter((r) => r.score > 0).slice(0, 10);
}

function battleRowsFor(s: StoreState, kind: 'most-wins' | 'win-streaks'): BoardRow[] {
  const raw = leaderboard(s, kind);
  if (kind === 'win-streaks') {
    return raw.filter((r) => currentWinStreak(s, r.user.id) >= 1).slice(0, 10);
  }
  return raw.filter((r) => r.stats.wins > 0).slice(0, 10);
}

/* ── Page ─────────────────────────────────────────────────────── */

export default function Leaderboards() {
  const { kind: rawKind } = useParams<{ kind: string }>();
  const navigate = useNavigate();
  const sg = useSnapGlow();

  if (!rawKind || !VALID_KINDS.includes(rawKind)) {
    return <Navigate to="/leaderboards/daily" replace />;
  }
  const kind = rawKind as Kind;
  // Legacy 'daily' URL → the store's single weekly-points table → Weekly board.
  const activeKind: GroupKind = kind === 'daily' ? 'weekly' : kind;
  const meta = BOARD_META[activeKind];

  const profileRows = isProfileKind(activeKind) ? profileRowsFor(sg.state, activeKind) : [];
  const winRows =
    activeKind === 'most-wins' || activeKind === 'win-streaks'
      ? battleRowsFor(sg.state, activeKind)
      : [];
  const voters = activeKind === 'top-voters' ? topVoters(sg.state, 20) : [];
  const winners = activeKind === 'recent-winners' ? recentWinners(sg.state) : [];

  const goKind = (id: string) => navigate(`/leaderboards/${id}`);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Seo
        title={`${meta.title} · Snap Glow`}
        description={`See who's leading on Snap Glow — ${meta.title.replace(' 🔥', '').toLowerCase()} and every other board, with transparent scoring rules.`}
        path={`/leaderboards/${kind}`}
      />

      <PageHeader
        eyebrow="Rankings"
        title="Leaderboards"
        sub="Two families of boards — Profile Rankings for Glow Points, likes and momentum, Battle Rankings for wins, streaks and votes. Every board prints its exact scoring rule underneath its title."
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-12">
          {/* ── GROUP A — Profile Rankings ─────────────────────── */}
          <section aria-labelledby="profile-rankings-heading">
            <div className="mb-5 flex items-center gap-3">
              <span
                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-ink bg-lav shadow-pop"
                aria-hidden="true"
              >
                <Sparkles size={24} className="text-brand-violet" />
              </span>
              <div>
                <h2
                  id="profile-rankings-heading"
                  className="font-display text-2xl font-extrabold tracking-tight text-ink"
                >
                  Profile Rankings
                </h2>
                <p className="text-sm font-bold text-ink-mute">
                  Glow Points, likes and momentum — the creator ladder
                </p>
              </div>
            </div>

            <Tabs
              tabs={PROFILE_KINDS.map((id) => ({ id: id as string, label: PROFILE_TAB_LABELS[id] }))}
              active={isProfileKind(activeKind) ? activeKind : ''}
              onChange={goKind}
              ariaLabel="Profile rankings boards"
            />

            {isProfileKind(activeKind) && (
              <div className="mt-6">
                <BoardHeading
                  title={meta.title}
                  rules={meta.rules}
                  note={activeKind === 'weekly' ? 'Resets every Monday' : undefined}
                />
                {profileRows.length === 0 ? (
                  <BoardEmpty kind={activeKind} />
                ) : (
                  <ul className="space-y-3">
                    {profileRows.map((row, i) => (
                      <ProfileBoardRow key={row.user.id} kind={activeKind} row={row} rank={i + 1} />
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>

          {/* ── GROUP B — Battle Rankings ──────────────────────── */}
          <section aria-labelledby="battle-rankings-heading">
            <div className="mb-5 flex items-center gap-3">
              <span
                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-ink bg-blush shadow-pop"
                aria-hidden="true"
              >
                <Swords size={24} className="text-brand-pink" />
              </span>
              <div>
                <h2
                  id="battle-rankings-heading"
                  className="font-display text-2xl font-extrabold tracking-tight text-ink"
                >
                  Battle Rankings
                </h2>
                <p className="text-sm font-bold text-ink-mute">
                  Wins, streaks, votes and results — straight from the arena
                </p>
              </div>
            </div>

            <Tabs
              tabs={BATTLE_KINDS.map((id) => ({ id: id as string, label: BATTLE_TAB_LABELS[id] }))}
              active={isProfileKind(activeKind) ? '' : activeKind}
              onChange={goKind}
              ariaLabel="Battle rankings boards"
            />

            {!isProfileKind(activeKind) && (
              <div className="mt-6">
                <BoardHeading
                  title={meta.title}
                  rules={meta.rules}
                  note={activeKind === 'win-streaks' ? 'A loss resets your streak' : undefined}
                />

                {(activeKind === 'most-wins' || activeKind === 'win-streaks') &&
                  (winRows.length === 0 ? (
                    <BoardEmpty kind={activeKind} />
                  ) : (
                    <ul className="space-y-3">
                      {winRows.map((row, i) => (
                        <BattleBoardRow
                          key={row.user.id}
                          s={sg.state}
                          kind={activeKind}
                          row={row}
                          rank={i + 1}
                        />
                      ))}
                    </ul>
                  ))}

                {activeKind === 'top-voters' &&
                  (voters.length === 0 ? (
                    <BoardEmpty kind={activeKind} />
                  ) : (
                    <>
                      <div className="mb-4 rounded-2xl border border-line bg-sky p-4">
                        <p className="flex items-start gap-2 text-sm font-semibold text-ink-soft">
                          <Crown
                            size={16}
                            aria-hidden="true"
                            className="mt-0.5 shrink-0 text-amber-500"
                          />
                          Every vote earns +2 Glow Points. The #1 voter earns the permanent Top
                          Voter crown badge — on-platform bragging rights, not money.
                        </p>
                      </div>
                      <ul className="space-y-3">
                        {voters.map(({ user, votes }, i) => (
                          <VoterRow key={user.id} user={user} votes={votes} rank={i + 1} />
                        ))}
                      </ul>
                    </>
                  ))}

                {activeKind === 'recent-winners' &&
                  (winners.length === 0 ? (
                    <BoardEmpty kind={activeKind} />
                  ) : (
                    <ul className="space-y-3">
                      {winners.map(({ battle: b, winner }) => {
                        const cardA = getCard(sg.state, b.cardAId);
                        const cardB = b.cardBId ? getCard(sg.state, b.cardBId) : undefined;
                        const ownerA = cardA ? getUser(sg.state, cardA.ownerId) : undefined;
                        const ownerB = cardB ? getUser(sg.state, cardB.ownerId) : undefined;
                        if (!ownerA || !ownerB) return null;
                        const winnerName =
                          winner === 'a'
                            ? ownerA.displayName
                            : winner === 'b'
                              ? ownerB.displayName
                              : null;
                        return (
                          <li key={b.id} className="card-surface rounded-card p-4">
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                              <div className="min-w-0 flex-1">
                                <h3 className="font-display text-lg font-extrabold text-ink">
                                  <Link
                                    to={`/battles/${b.id}/results`}
                                    className="hover:text-brand-violet"
                                  >
                                    {b.title}
                                  </Link>
                                </h3>
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
                                    <Trophy
                                      size={15}
                                      className="text-amber-500"
                                      aria-hidden="true"
                                    />{' '}
                                    {winnerName}
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
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
          <div className="hidden lg:block">
            <AdSlot slot="leaderboard-sidebar" />
          </div>
          <div className="rounded-card border border-line border-2 border-ink bg-mint p-6 shadow-soft">
            <span
              className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-soft"
              aria-hidden="true"
            >
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
