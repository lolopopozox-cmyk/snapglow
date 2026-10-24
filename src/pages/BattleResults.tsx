import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Download, Handshake, Timer, Trophy } from 'lucide-react';
import { battleWinner, getBattle, getCard, getUser, isBattleLive, useSnapGlow } from '../lib/store';
import { Seo } from '../components/Seo';
import { Avatar, Countdown, CtaButton, EmptyState, PageHeader } from '../components/ui';
import { handle } from '../lib/format';
import { downloadCardPng } from '../lib/renderCard';
import { useToast } from '../components/Toast';
import NotFound from './NotFound';

function VoteBar({
  name,
  username,
  hue,
  votes,
  pct,
  gradient,
}: {
  name: string;
  username: string;
  hue: number;
  votes: number;
  pct: number;
  gradient: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2.5">
        <Avatar name={name} hue={hue} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-bold text-ink">{name}</p>
          <p className="text-xs font-semibold text-ink-mute">{handle(username)}</p>
        </div>
        <p className="flex items-center gap-1.5 font-display text-xl font-extrabold text-ink">
          {votes} <span className="text-sm font-bold text-ink-mute">{votes === 1 ? 'vote' : 'votes'}</span>
        </p>
      </div>
      <div
        className="h-4 w-full overflow-hidden rounded-full bg-lav"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${name}: ${votes} votes (${pct}%)`}
      >
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-[width] duration-700 ease-out ${gradient}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function BattleResults() {
  const { id } = useParams<{ id: string }>();
  const sg = useSnapGlow();
  const { toast } = useToast();
  const [savingCard, setSavingCard] = useState(false);

  const battle = id ? getBattle(sg.state, id) : undefined;
  if (!battle) return <NotFound />;

  const live = isBattleLive(battle);

  if (live) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Seo
          title={`${battle.title} — Results · Snap Glow`}
          description={`Final results for “${battle.title}” on Snap Glow.`}
          path={`/battles/${battle.id}/results`}
          noindex
        />
        <PageHeader eyebrow="Battle results" title={battle.title} sub="This battle hasn't finished yet." />
        <EmptyState
          icon={Timer}
          title="Voting is still live"
          body="Results are published once the countdown ends and the stored votes are tallied."
          action={
            <div className="flex flex-col items-center gap-4">
              <Countdown to={battle.endsAt} />
              <CtaButton to={`/battles/${battle.id}`}>Vote now</CtaButton>
            </div>
          }
        />
      </div>
    );
  }

  const cardA = getCard(sg.state, battle.cardAId);
  const cardB = battle.cardBId ? getCard(sg.state, battle.cardBId) : undefined;
  const ownerA = cardA ? getUser(sg.state, cardA.ownerId) : undefined;
  const ownerB = cardB ? getUser(sg.state, cardB.ownerId) : undefined;
  if (!cardA || !cardB || !ownerA || !ownerB) return <NotFound />;

  const tally = sg.state.tallies[battle.id] ?? { a: 0, b: 0, voters: [] as string[] };
  const total = tally.a + tally.b;
  const pctA = total > 0 ? Math.round((tally.a / total) * 100) : 0;
  const pctB = total > 0 ? Math.round((tally.b / total) * 100) : 0;
  const winner = battleWinner(sg.state, battle.id);
  const finalizedAt = new Date(battle.endsAt).toLocaleString();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Seo
        title={`${battle.title} — Results · Snap Glow`}
        description={`Final results for “${battle.title}” on Snap Glow.`}
        path={`/battles/${battle.id}/results`}
        noindex
      />

      <PageHeader eyebrow="Battle results" title={battle.title} sub="Final tally from the stored votes." />

      <div className="rounded-card border border-line border-2 border-ink bg-sun-tint p-8 text-center shadow-soft">
        {winner === 'tie' ? (
          <>
            <Handshake size={44} className="mx-auto mb-3 text-brand-violet" aria-hidden="true" />
            <h2 className="font-display text-3xl font-extrabold text-ink">It&apos;s a tie!</h2>
            <p className="mt-2 text-lg font-semibold text-ink-soft">
              Both creators share the crown — {tally.a} : {tally.b}
            </p>
          </>
        ) : winner ? (
          <>
            <Trophy size={44} className="mx-auto mb-3 text-amber-500" aria-hidden="true" />
            <h2 className="font-display text-3xl font-extrabold text-ink">
              {(winner === 'a' ? ownerA : ownerB).displayName} wins!
            </h2>
            <p className="mt-2 text-lg font-semibold text-ink-soft">
              {Math.max(tally.a, tally.b)} votes to {Math.min(tally.a, tally.b)} — the crowd has spoken.
            </p>
            <button
              type="button"
              disabled={savingCard}
              onClick={async () => {
                const champ = winner === 'a' ? ownerA : ownerB;
                setSavingCard(true);
                try {
                  await downloadCardPng(
                    {
                      id: `victory-${battle.id}`,
                      ownerId: champ.id,
                      title: champ.displayName,
                      caption: `🏆 Won “${battle.title}” ${Math.max(tally.a, tally.b)}–${Math.min(tally.a, tally.b)}`,
                      template: 'champion-edition',
                      imageKind: 'art',
                      artSeed: battle.id,
                      streak: 0,
                      streakLabel: '',
                      badges: ['crown', 'star'],
                      likes: [],
                      createdAt: new Date().toISOString(),
                      published: false,
                    },
                    champ,
                    'feed',
                  );
                  toast('Victory card downloaded — share it everywhere! 🏆');
                } catch {
                  toast('Could not render the victory card.');
                } finally {
                  setSavingCard(false);
                }
              }}
              className="btn-violet mt-4 inline-flex min-h-[48px] items-center gap-2 rounded-full px-6 py-3 font-display text-base font-bold disabled:cursor-wait disabled:opacity-60"
            >
              <Download size={17} aria-hidden="true" /> {savingCard ? 'Rendering…' : 'Download victory card'}
            </button>
          </>
        ) : (
          <>
            <Trophy size={44} className="mx-auto mb-3 text-amber-500" aria-hidden="true" />
            <h2 className="font-display text-3xl font-extrabold text-ink">Battle complete</h2>
            <p className="mt-2 text-lg font-semibold text-ink-soft">
              The votes are in — {total} {total === 1 ? 'vote' : 'votes'} counted.
            </p>
          </>
        )}
        <p className="mt-3 inline-flex items-center gap-2">
        </p>
      </div>

      <div className="card-surface mt-6 space-y-6 rounded-card p-5 sm:p-8">
        <VoteBar name={ownerA.displayName} username={ownerA.username} hue={ownerA.hue} votes={tally.a} pct={pctA} gradient="from-brand-sky to-brand-sky" />
        <VoteBar name={ownerB.displayName} username={ownerB.username} hue={ownerB.hue} votes={tally.b} pct={pctB} gradient="from-brand-pink to-brand-pink" />
      </div>

      <p className="mt-4 text-center text-sm font-semibold text-ink-mute">
        Finalized from stored votes at {finalizedAt}.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <CtaButton to="/battles/new">Start a rematch</CtaButton>
        <Link to="/battles" className="inline-flex items-center gap-1.5 font-extrabold text-ink-mute hover:text-brand-violet">
          <ArrowLeft size={16} aria-hidden="true" /> Back to battles
        </Link>
      </div>
    </div>
  );
}
