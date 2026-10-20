import { Link } from 'react-router-dom';
import { History, Swords, Trophy, Zap } from 'lucide-react';
import { battleWinner, endingSoon, getCard, getUser, isBattleLive, recentWinners, useSnapGlow } from '../lib/store';
import { Seo } from '../components/Seo';
import { CtaButton, EmptyState, GhostButton, PageHeader, SectionTitle } from '../components/ui';
import { AdSlot } from '../components/AdSlot';
import { VersusBattle } from '../components/Versus';

export default function Battles() {
  const sg = useSnapGlow();
  const live = sg.state.battles.filter((b) => isBattleLive(b));
  const soon = endingSoon(sg.state, 2);
  const ended = recentWinners(sg.state);

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

      {soon.length > 0 && (
        <section className="mb-10">
          <SectionTitle title="Ending soon" sub="Last chance to vote — these wrap up within 2 hours." />
          <div className="grid gap-4 sm:grid-cols-2">
            {soon.map((b) => (
              <Link
                key={b.id}
                to={`/battles/${b.id}`}
                className="card-surface flex items-center gap-3 rounded-card p-4 transition hover:-translate-y-0.5 hover:shadow-lift"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blush text-brand-pink" aria-hidden="true">
                  <Zap size={20} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-display text-lg font-extrabold text-ink">{b.title}</span>
                  <span className="block text-sm font-semibold text-ink-mute">Voting closes soon — make it count</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <SectionTitle title="Live battles" sub="Voting is open — pick a side before the clock runs out." />

      {live.length === 0 ? (
        <div className="mb-10">
          <EmptyState
            icon={Swords}
            title="No live battles"
            body="No battles are running right now. Start one and let the community decide."
            action={<CtaButton to="/battles/new">Create Battle</CtaButton>}
          />
        </div>
      ) : (
        <div className="mb-10 space-y-6">
          {live.map((b) => (
            <article key={b.id} className="card-surface rounded-card p-5 sm:p-6" aria-label={`Live battle: ${b.title}`}>
              <h3 className="mb-4 font-display text-2xl font-extrabold text-ink">
                <Link to={`/battles/${b.id}`} className="hover:text-brand-violet">
                  {b.title}
                </Link>
              </h3>
              <VersusBattle battleId={b.id} compact={false} />
              <div className="mt-5 flex justify-center">
                <GhostButton to={`/battles/${b.id}`}>Open battle</GhostButton>
              </div>
            </article>
          ))}
        </div>
      )}

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
            const cardB = getCard(sg.state, b.cardBId);
            const ownerA = cardA ? getUser(sg.state, cardA.ownerId) : undefined;
            const ownerB = cardB ? getUser(sg.state, cardB.ownerId) : undefined;
            if (!ownerA || !ownerB) return null;
            const w = winner ?? battleWinner(sg.state, b.id);
            const tally = sg.state.tallies[b.id];
            const total = tally ? tally.a + tally.b : 0;
            const winnerName = w === 'a' ? ownerA.displayName : w === 'b' ? ownerB.displayName : null;
            return (
              <li key={b.id} className="card-surface rounded-card p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-lg font-extrabold text-ink">
                      <Link to={`/battles/${b.id}/results`} className="hover:text-brand-violet">
                        {b.title}
                      </Link>
                    </h3>
                    <p className="mt-0.5 text-sm font-semibold text-ink-mute">
                      {ownerA.displayName} vs {ownerB.displayName} · 🗳️ {total} {total === 1 ? 'vote' : 'votes'}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-extrabold ${
                      w === 'tie' ? 'bg-cyantint text-ink' : 'bg-mint text-ink'
                    }`}
                  >
                    {w === 'tie' ? (
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
      )}
    </div>
  );
}
