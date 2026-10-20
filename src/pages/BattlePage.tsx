import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Copy, Trophy } from 'lucide-react';
import { battleWinner, getBattle, getCard, getUser, isBattleLive, siteUrl, useSnapGlow } from '../lib/store';
import { Seo } from '../components/Seo';
import { Countdown, CtaButton, ReportButton } from '../components/ui';
import { AdSlot } from '../components/AdSlot';
import { VersusBattle } from '../components/Versus';
import { useToast } from '../components/Toast';
import NotFound from './NotFound';

function VoteLinkBox({ label, url, name }: { label: string; url: string; name: string }) {
  const { toast } = useToast();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast(`${name}'s vote link copied — share it anywhere.`);
    } catch {
      toast('Copy failed — long-press the link to copy it.');
    }
  };
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="text-xs font-extrabold uppercase tracking-wider text-ink-mute">{label}</p>
      <p className="mt-1 truncate font-display text-base font-bold text-ink">{name}</p>
      <p className="mt-1 truncate text-xs font-semibold text-brand-violet">{url}</p>
      <button
        onClick={copy}
        className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-extrabold text-ink transition hover:border-brand-violet hover:text-brand-violet"
      >
        <Copy size={14} aria-hidden="true" /> Copy vote link
      </button>
    </div>
  );
}

export default function BattlePage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const sg = useSnapGlow();

  const battle = id ? getBattle(sg.state, id) : undefined;
  if (!battle) return <NotFound />;

  const voteParam = searchParams.get('vote');
  const highlightSide: 'a' | 'b' | undefined = voteParam === 'a' || voteParam === 'b' ? voteParam : undefined;

  const live = isBattleLive(battle);
  const winner = live ? null : battleWinner(sg.state, battle.id);
  const cardA = getCard(sg.state, battle.cardAId);
  const cardB = getCard(sg.state, battle.cardBId);
  const ownerA = cardA ? getUser(sg.state, cardA.ownerId) : undefined;
  const ownerB = cardB ? getUser(sg.state, cardB.ownerId) : undefined;
  const winnerOwner =
    winner === 'a' ? ownerA : winner === 'b' ? ownerB : undefined;

  const baseUrl = `${siteUrl()}/battles/${battle.id}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Seo
        title={`${battle.title} — Live Battle · Snap Glow`}
        description={`Vote in “${battle.title}” — a head-to-head battle between Snapchat users on Snap Glow.`}
        path={`/battles/${battle.id}`}
        noindex
      />

      <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink">{battle.title}</h1>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {live ? (
          <Countdown to={battle.endsAt} />
        ) : (
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-1.5 text-sm font-extrabold text-ink-mute">
              <span aria-hidden="true">🗳️</span> Voting ended
            </span>
            <Link to={`/battles/${battle.id}/results`} className="text-sm font-extrabold text-brand-violet hover:underline">
              See final results →
            </Link>
          </>
        )}
      </div>

      {!live && winner && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-card border border-line border-2 border-ink bg-mint p-5 shadow-soft">
          <p className="flex items-center gap-2 font-display text-xl font-extrabold text-ink">
            {winner === 'tie' ? (
              <>🤝 It&apos;s a tie — both creators share the crown.</>
            ) : (
              <>
                <Trophy size={22} className="text-amber-500" aria-hidden="true" />
                {winnerOwner ? `${winnerOwner.displayName} won this battle!` : 'We have a winner!'}
              </>
            )}
          </p>
          <CtaButton to={`/battles/${battle.id}/results`}>Full results</CtaButton>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="card-surface rounded-card p-5 sm:p-8">
          <VersusBattle battleId={battle.id} highlightSide={highlightSide} />
        </div>
        <aside className="space-y-4">
          <AdSlot slot="battle-side" />
          {ownerA && ownerB && (
            <div className="card-surface rounded-card p-5">
              <h2 className="font-display text-lg font-extrabold text-ink">Share vote links</h2>
              <p className="mt-1 text-sm font-semibold text-ink-soft">
                Each contestant gets their own link — share it and rally votes.
              </p>
              <div className="mt-4 space-y-3">
                <VoteLinkBox label="Contestant A" url={`${baseUrl}?vote=a`} name={ownerA.displayName} />
                <VoteLinkBox label="Contestant B" url={`${baseUrl}?vote=b`} name={ownerB.displayName} />
              </div>
            </div>
          )}
        </aside>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-extrabold uppercase tracking-wider text-ink-mute">Share this battle</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Post on X', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${battle.title} — vote now on Snap Glow`)}&url=${encodeURIComponent(baseUrl)}` },
              { label: 'Share on WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(`${battle.title} — vote now: ${baseUrl}`)}` },
              { label: 'Share on Telegram', href: `https://t.me/share/url?url=${encodeURIComponent(baseUrl)}&text=${encodeURIComponent(battle.title)}` },
            ].map((t) => (
              <a
                key={t.label}
                href={t.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-extrabold text-ink hover:border-brand-cyan"
              >
                {t.label}
              </a>
            ))}
          </div>
        </div>
        <ReportButton targetType="battle" targetId={battle.id} />
      </div>

      <div className="mt-8">
        <Link to="/battles" className="text-sm font-extrabold text-ink-mute hover:text-brand-violet">
          ← Back to all battles
        </Link>
      </div>
    </div>
  );
}
