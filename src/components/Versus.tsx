import { Link } from 'react-router-dom';
import { Check, Flame, Swords } from 'lucide-react';
import { getBattle, getCard, getUser, isBattleLive, sessionUser, useSnapGlow } from '../lib/store';
import type { BattleTally, FlexCardData, User } from '../lib/types';
import { handle } from '../lib/format';
import { Avatar, Countdown, FlexCard } from '../components/ui';
import { useToast } from '../components/Toast';

interface ContestantProps {
  battleId: string;
  side: 'a' | 'b';
  card: FlexCardData;
  owner: User;
  tally: BattleTally;
  voted: boolean;
  ended: boolean;
  compact: boolean;
  highlighted?: boolean;
}

function Contestant({ battleId, side, card, owner, tally, voted, ended, compact, highlighted }: ContestantProps) {
  const sg = useSnapGlow();
  const { toast } = useToast();
  const votes = side === 'a' ? tally.a : tally.b;
  const isA = side === 'a';
  const total = tally.a + tally.b;
  const pct = total > 0 ? Math.round((votes / total) * 100) : 0;

  const onVote = () => {
    if (!sessionUser(sg.state)) {
      toast('Create a free account to vote.');
      return;
    }
    void sg.vote(battleId, side).then((res) => toast(res.message));
  };

  return (
    <div className="flex w-full flex-col items-center">
      <div className="mb-2 flex items-center gap-2.5">
        <Link to={`/u/${owner.username}`} aria-label={`View ${owner.displayName}'s profile`}>
          <Avatar name={owner.displayName} hue={owner.hue} src={owner.avatar} emoji={owner.avatarEmoji} size={compact ? 36 : 44} />
        </Link>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-1.5">
            <Link
              to={`/u/${owner.username}`}
              className={`truncate font-display font-bold text-ink hover:text-brand-violet ${compact ? 'text-sm' : 'text-base'}`}
            >
              {owner.displayName}
            </Link>
          </p>
          <p className="truncate text-xs font-semibold text-ink-mute">{handle(owner.username)}</p>
        </div>
      </div>

      <Link to={`/cards/${card.id}`} aria-label={`Open card “${card.title}”`} className="w-full">
        <FlexCard
          card={card}
          owner={owner}
          className={highlighted ? 'ring-4 ring-brand-violet shadow-lift' : ''}
        />
      </Link>
      {highlighted && !ended && (
        <p className="mt-2 rounded-full border-2 border-ink bg-lav px-3 py-1 text-center text-xs font-extrabold text-brand-violet">
          Someone shared this side with you — tap Vote to back {owner.displayName.split(' ')[0]}
        </p>
      )}

      {/* live share of votes */}
      <div className="mt-3 w-full max-w-xs" aria-label={`${votes} votes (${pct}%)`}>
        <div className="flex items-center justify-between text-xs font-extrabold text-ink-soft">
          <span className="inline-flex items-center gap-1">
            <Flame size={13} aria-hidden="true" className="text-brand-coral" /> {votes} {votes === 1 ? 'vote' : 'votes'}
          </span>
          <span>{pct}%</span>
        </div>
        <div className="mt-1 h-2.5 overflow-hidden rounded-full border-2 border-ink bg-white">
          <div
            className={`h-full transition-all ${isA ? 'bg-sun' : 'bg-brand-violet'}`}
            style={{ width: `${total > 0 ? Math.max(4, pct) : 0}%` }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onVote}
        aria-pressed={voted}
        aria-label={ended ? `Voting ended for ${owner.displayName}` : `Vote for ${owner.displayName}`}
        disabled={ended}
        title={ended ? 'Voting has ended for this battle' : `Vote for ${owner.displayName}`}
        className={`mt-3 w-full max-w-xs rounded-full px-5 py-3 font-grotesk text-base font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
          isA ? 'btn-cta' : 'btn-violet'
        }`}
      >
        {ended ? 'Voting ended' : voted ? '✓ Vote counted' : `Vote ${owner.displayName.split(' ')[0]}`}
      </button>
    </div>
  );
}

/**
 * Head-to-head battle block. Stacks vertically on phones, three columns
 * from `sm` up. Title/status are rendered by the hosting page.
 */
export function VersusBattle({ battleId, compact = false, highlightSide }: { battleId: string; compact?: boolean; highlightSide?: 'a' | 'b' }) {
  const sg = useSnapGlow();
  const battle = getBattle(sg.state, battleId);
  const cardA = battle ? getCard(sg.state, battle.cardAId) : undefined;
  const cardB = battle?.cardBId ? getCard(sg.state, battle.cardBId) : undefined;
  const ownerA = cardA ? getUser(sg.state, cardA.ownerId) : undefined;
  const ownerB = cardB ? getUser(sg.state, cardB.ownerId) : undefined;
  const tally: BattleTally | undefined = sg.state.tallies[battleId];

  if (!battle || !cardA || !cardB || !ownerA || !ownerB || !tally) return null;

  const ended = !isBattleLive(battle);
  const voted = !!sessionUser(sg.state) && tally.voters.includes(sessionUser(sg.state)!.id);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        {ended ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-1.5 text-sm font-extrabold text-ink-mute">
            <span aria-hidden="true">🗳️</span> Voting ended
          </span>
        ) : (
          <Countdown to={battle.endsAt} />
        )}
        {voted && (
          <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-mint px-3 py-1.5 text-xs font-extrabold text-ink">
            <Check size={14} aria-hidden="true" /> You voted
          </span>
        )}
      </div>

      {/* mobile: stacked with VS ribbon · ≥sm: side-by-side */}
      <div className="grid items-start gap-6 sm:grid-cols-[1fr_auto_1fr] sm:gap-6">
        <div className="flex justify-center sm:justify-start">
          <Contestant battleId={battleId} side="a" card={cardA} owner={ownerA} tally={tally} voted={voted} ended={ended} compact={compact} highlighted={highlightSide === 'a'} />
        </div>
        <div className="flex items-center justify-center sm:block" aria-hidden="true">
          <span className="inline-grid h-16 w-16 place-items-center rounded-full border-2 border-ink bg-sun font-display text-base font-bold text-ink shadow-lift sm:mt-24 sm:h-20 sm:w-20 sm:text-lg">
            <Swords className="sm:hidden" size={26} aria-hidden="true" />
            <span className="hidden sm:inline">VS</span>
          </span>
        </div>
        <div className="flex justify-center sm:justify-end">
          <Contestant battleId={battleId} side="b" card={cardB} owner={ownerB} tally={tally} voted={voted} ended={ended} compact={compact} highlighted={highlightSide === 'b'} />
        </div>
      </div>

      <p className="mt-5 text-center text-xs font-semibold text-ink-mute">
        One vote per account, verified server-side. Share the vote links below to rally your supporters.
      </p>
    </div>
  );
}
