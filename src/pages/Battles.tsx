import { Link } from 'react-router-dom';
import { Clock, History, Swords, Trophy, Zap } from 'lucide-react';
import { endingSoon, getCard, getUser, isBattleLive, recentWinners, sessionUser, useSnapGlow } from '../lib/store';
import { Seo } from '../components/Seo';
import { Avatar, CtaButton, EmptyState, PageHeader, SectionTitle } from '../components/ui';
import { AdSlot } from '../components/AdSlot';
import { VersusBattle } from '../components/Versus';
import { handle, timeAgo } from '../lib/format';

export default function Battles() {
  const sg = useSnapGlow();
  const me = sessionUser(sg.state);
  const pending = sg.state.battles.filter((b) => b.status === 'pending');
  const myPending = pending.filter((b) => b.opponentId === me?.id);
  const openPending = pending.filter((b) => b.opponentId === null && b.createdBy !== me?.id);
  const live = sg.state.battles.filter((b) => isBattleLive(b));
  const soon = endingSoon(sg.state, 2);
  const ended = recentWinners(sg.state);

  const pendingRow = (battleId: string, label: string) => {
    const b = sg.state.battles.find((x) => x.id === battleId);
    if (!b) return null;
    const challenger = getUser(sg.state, b.createdBy);
    const cardA = getCard(sg.state, b.cardAId);
    return (
      <li key={b.id}>
        <Link
          to={`/battles/${b.id}`}
          className="card-surface flex flex-wrap items-center gap-3 rounded-card p-4 transition hover:-translate-y-0.5"
        >
          {challenger && (
            <Avatar name={challenger.displayName} hue={challenger.hue} src={challenger.avatar} emoji={challenger.avatarEmoji} size={40} />
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate font-display text-base font-extrabold text-ink">{b.title}</span>
            <span className="block truncate text-xs font-semibold text-ink-mute">
              {challenger ? `${challenger.displayName} (${handle(challenger.username)})` : 'A creator'}
              {cardA ? ` flexes “${cardA.title}”` : ''} · {timeAgo(b.createdAt)}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-lav px-3 py-1 text-xs font-extrabold text-brand-violet">
            <Clock size={12} aria-hidden="true" /> {label}
          </span>
          <span className="text-sm font-extrabold text-brand-violet">Open →</span>
        </Link>
      </li>
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Seo
        title="Vote Battles · Snap Glow"
        description="Head-to-head battles between Snapchat users. Vote for your favorite, share vote links and climb the Top Voters board."
        path="/battles"
      />

      <PageHeader
        eyebrow="Head-to-head"
        title="Vote Battles"
        sub="Two Snapchatters enter, one wins. Vote for your favorite, share their vote link, and earn your way up the Top Voters board."
      >
        <CtaButton to="/battles/new">
          <Swords size={19} aria-hidden="true" /> Create Battle
        </CtaButton>
      </PageHeader>

      <div className="mb-8">
        <AdSlot slot="battles-hero-bottom" />
      </div>

      {myPending.length > 0 && (
        <section className="mb-10">
          <SectionTitle title="Your pending challenges" sub="Accept with your card — voting goes live instantly." />
          <ul className="space-y-3">{myPending.map((b) => pendingRow(b.id, 'Waiting for you'))}</ul>
        </section>
      )}

      {openPending.length > 0 && (
        <section className="mb-10">
          <SectionTitle title="Open challenges" sub="Anyone can accept — bring your best card." />
          <ul className="space-y-3">{openPending.map((b) => pendingRow(b.id, 'Open challenge'))}</ul>
        </section>
      )}

      {soon.length > 0 && (
        <section className="mb-10">
          <SectionTitle title="Ending soon" sub="Last chance to vote — these wrap up within 2 hours." />
          <div className="grid gap-4 sm:grid-cols-2">
            {soon.map((b) => (
              <div key={b.id} className="card-surface rounded-card p-4">
                <VersusBattle battleId={b.id} compact />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mb-10">
        <SectionTitle title="Live battles" sub="Vote now — one vote per account, counted server-side." />
        {live.length === 0 ? (
          <EmptyState
            icon={Zap}
            title="No live battles right now"
            body="Be the spark — create a battle or challenge a creator and get the votes rolling."
            action={<CtaButton to="/battles/new">Create Battle</CtaButton>}
          />
        ) : (
          <ul className="space-y-6">
            {live.map((b) => (
              <li key={b.id} className="card-surface rounded-card p-5 sm:p-6">
                <VersusBattle battleId={b.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <SectionTitle title="Recently ended" sub="Final tallies from battles that finished." />
        {ended.length === 0 ? (
          <EmptyState
            icon={History}
            title="No results yet"
            body="No battles have finished yet. Check back once the live ones wrap up."
          />
        ) : (
          <ul className="space-y-4">
            {ended.map(({ battle: b, winner }) => {
              const cardA = getCard(sg.state, b.cardAId);
              const cardB = b.cardBId ? getCard(sg.state, b.cardBId) : undefined;
              const ownerA = cardA ? getUser(sg.state, cardA.ownerId) : undefined;
              const ownerB = cardB ? getUser(sg.state, cardB.ownerId) : undefined;
              if (!ownerA || !ownerB) return null;
              const tally = sg.state.tallies[b.id];
              const total = tally ? tally.a + tally.b : 0;
              const winnerName =
                winner === 'a' ? ownerA.displayName : winner === 'b' ? ownerB.displayName : null;
              return (
                <li key={b.id} className="card-surface rounded-card p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-lg font-extrabold text-ink">
                        <Link to={`/battles/${b.id}/results`} className="hover:text-brand-violet">
                          {b.title}
                        </Link>
                      </h3>
                      <p className="text-sm font-semibold text-ink-mute">
                        {ownerA.displayName} vs {ownerB.displayName} · {total} {total === 1 ? 'vote' : 'votes'}
                      </p>
                    </div>
                    {winnerName ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-sun px-3 py-1.5 text-xs font-extrabold text-ink">
                        <Trophy size={13} aria-hidden="true" /> {winnerName}
                      </span>
                    ) : (
                      <span className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-extrabold text-ink-mute">
                        🤝 Tie
                      </span>
                    )}
                    <Link to={`/battles/${b.id}/results`} className="text-sm font-extrabold text-brand-violet hover:underline">
                      Results →
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
