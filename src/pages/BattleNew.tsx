import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Swords, UserPlus, Zap } from 'lucide-react';
import { getUser, sessionUser, useSnapGlow } from '../lib/store';
import { Seo } from '../components/Seo';
import { EmptyState, CtaButton, Field, FlexCard, GatePrompt, PageHeader, SelectEl } from '../components/ui';
import { handle } from '../lib/format';
import { useToast } from '../components/Toast';

const DURATIONS = [6, 12, 24, 48];

type Mode = 'instant' | 'challenge';

export default function BattleNew() {
  const sg = useSnapGlow();
  const navigate = useNavigate();
  const { toast } = useToast();
  const me = sessionUser(sg.state);

  const [mode, setMode] = useState<Mode>('instant');
  const [title, setTitle] = useState('');
  const [cardA, setCardA] = useState('');
  const [cardB, setCardB] = useState('');
  const [myCard, setMyCard] = useState('');
  const [opponent, setOpponent] = useState('');
  const [hours, setHours] = useState('12');
  const [busy, setBusy] = useState(false);

  const myCards = sg.state.cards.filter((c) => c.published && c.ownerId === me?.id);
  const cards = sg.state.cards.filter((c) => c.published);
  const owners = sg.state.users.filter((u) => cards.some((c) => c.ownerId === u.id));
  const sameCard = cardA !== '' && cardA === cardB;
  const previewA = cardA ? cards.find((c) => c.id === cardA) : undefined;
  const previewB = cardB ? cards.find((c) => c.id === cardB) : undefined;
  const ownerA = previewA ? getUser(sg.state, previewA.ownerId) : undefined;
  const ownerB = previewB ? getUser(sg.state, previewB.ownerId) : undefined;
  const myPreview = myCard ? myCards.find((c) => c.id === myCard) : undefined;

  if (!me) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Seo title="Create a Battle · Snap Glow" description="Pick two cards and start a head-to-head vote battle." path="/battles/new" noindex />
        <PageHeader eyebrow="Vote battles" title="Create a Battle" />
        <GatePrompt feature="create vote battles" />
      </div>
    );
  }

  const submitInstant = async () => {
    if (sameCard || busy) return;
    setBusy(true);
    const res = await sg.createBattle(title, cardA, cardB, parseInt(hours, 10));
    toast(res.message);
    setBusy(false);
    if (res.ok && res.id) navigate(`/battles/${res.id}`);
  };

  const submitChallenge = async () => {
    if (busy) return;
    setBusy(true);
    const res = await sg.createChallenge(
      title,
      myCard,
      opponent.trim() ? opponent.trim().replace(/^@/, '') : null,
      parseInt(hours, 10),
    );
    toast(res.message);
    setBusy(false);
    if (res.ok && res.id) navigate(`/battles/${res.id}`);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Seo title="Create a Battle · Snap Glow" description="Pick two cards and start a head-to-head vote battle." path="/battles/new" noindex />

      <PageHeader
        eyebrow="Vote battles"
        title="Create a Battle"
        sub="Two ways to start a showdown — an instant vote-off, or challenge a creator and let them accept with their own card."
      />

      {cards.length < 2 ? (
        <EmptyState
          icon={Swords}
          title="Not enough cards yet"
          body="A battle needs published cards. Create yours first — then come back and start the showdown."
          action={<CtaButton to="/create">Create a card</CtaButton>}
        />
      ) : (
        <div className="card-surface rounded-card p-5 sm:p-8">
          {/* mode switch */}
          <div className="grid grid-cols-2 gap-3" role="tablist" aria-label="Battle mode">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'instant'}
              onClick={() => setMode('instant')}
              className={`flex min-h-[64px] flex-col items-start gap-1 rounded-2xl border-2 p-4 text-left transition ${
                mode === 'instant' ? 'border-brand-violet bg-lav/50 shadow-soft' : 'border-line bg-white hover:border-brand-cyan'
              }`}
            >
              <span className="inline-flex items-center gap-2 font-display font-extrabold text-ink">
                <Zap size={17} aria-hidden="true" className="text-brand-coral" /> Instant battle
              </span>
              <span className="text-xs font-semibold text-ink-soft">Pick two cards — voting starts right away.</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'challenge'}
              onClick={() => setMode('challenge')}
              className={`flex min-h-[64px] flex-col items-start gap-1 rounded-2xl border-2 p-4 text-left transition ${
                mode === 'challenge' ? 'border-brand-violet bg-lav/50 shadow-soft' : 'border-line bg-white hover:border-brand-cink'
              }`}
            >
              <span className="inline-flex items-center gap-2 font-display font-extrabold text-ink">
                <UserPlus size={17} aria-hidden="true" className="text-brand-violet" /> Challenge a creator
              </span>
              <span className="text-xs font-semibold text-ink-soft">They accept with their card — then voting goes live.</span>
            </button>
          </div>

          <div className="mt-6 space-y-5">
            <Field
              label="Battle title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={60}
              placeholder="e.g. Golden hour showdown"
              hint="4+ characters. Keep it friendly — the Community Guidelines apply."
            />

            {mode === 'instant' ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <SelectEl label="Contestant A" value={cardA} onChange={(e) => setCardA(e.target.value)}>
                  <option value="">Choose a card…</option>
                  {owners.map((o) => (
                    <optgroup key={o.id} label={`${o.displayName} (${handle(o.username)})`}>
                      {cards
                        .filter((c) => c.ownerId === o.id)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </SelectEl>

                <SelectEl label="Contestant B" value={cardB} onChange={(e) => setCardB(e.target.value)}>
                  <option value="">Choose a card…</option>
                  {owners.map((o) => (
                    <optgroup key={o.id} label={`${o.displayName} (${handle(o.username)})`}>
                      {cards
                        .filter((c) => c.ownerId === o.id)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </SelectEl>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                <SelectEl
                  label="Your card"
                  value={myCard}
                  onChange={(e) => setMyCard(e.target.value)}
                  hint="The card you'll flex in this battle."
                >
                  <option value="">Choose your card…</option>
                  {myCards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </SelectEl>
                <Field
                  label="Opponent's username (optional)"
                  value={opponent}
                  onChange={(e) => setOpponent(e.target.value)}
                  placeholder="e.g. sanaqueen — leave empty for an open challenge"
                  maxLength={20}
                  hint="Open challenges let anyone accept via your link."
                />
                {myCards.length === 0 && (
                  <p className="rounded-2xl bg-blush px-4 py-3 text-sm font-bold text-ink sm:col-span-2">
                    You need a published card first — <Link to="/create" className="underline">create one</Link>.
                  </p>
                )}
              </div>
            )}

            {mode === 'instant' && sameCard && (
              <p role="alert" className="rounded-2xl bg-blush px-4 py-3 text-sm font-bold text-brand-pink">
                Pick two different cards — a battle needs two contestants.
              </p>
            )}

            <SelectEl
              label="Voting duration"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              hint="Voting closes automatically when the countdown ends. The winner earns +25 Glow Points."
            >
              {DURATIONS.map((h) => (
                <option key={h} value={String(h)}>
                  {h} hours
                </option>
              ))}
            </SelectEl>
          </div>

          {mode === 'instant' && previewA && previewB && ownerA && ownerB && !sameCard && (
            <div className="mt-8 border-t border-line pt-6" aria-label="Battle preview">
              <p className="mb-4 text-center text-sm font-extrabold uppercase tracking-wider text-ink-mute">Matchup preview</p>
              <div className="grid grid-cols-2 items-start gap-3 sm:grid-cols-[1fr_auto_1fr] sm:gap-4">
                <div className="mx-auto w-full max-w-[220px]">
                  <FlexCard card={previewA} owner={ownerA} />
                </div>
                <div className="hidden justify-center pt-12 sm:flex" aria-hidden="true">
                  <span className="grid h-12 w-12 place-items-center rounded-full border-2 border-ink bg-sun font-display text-base font-extrabold text-ink shadow-pop">
                    VS
                  </span>
                </div>
                <div className="mx-auto w-full max-w-[220px]">
                  <FlexCard card={previewB} owner={ownerB} />
                </div>
              </div>
            </div>
          )}
          {mode === 'challenge' && myPreview && (
            <div className="mt-8 border-t border-line pt-6" aria-label="Your card">
              <p className="mb-4 text-center text-sm font-extrabold uppercase tracking-wider text-ink-mute">
                Your card enters the arena
              </p>
              <div className="mx-auto w-full max-w-[220px]">
                <FlexCard card={myPreview} owner={me} />
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-end">
            {mode === 'instant' ? (
              <button
                type="button"
                onClick={submitInstant}
                disabled={!title.trim() || !cardA || !cardB || sameCard || busy}
                className="btn-cta inline-flex min-h-[52px] items-center gap-2 rounded-full px-8 py-3 font-display text-lg font-bold disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Swords size={19} aria-hidden="true" /> {busy ? 'Starting…' : 'Start battle'}
              </button>
            ) : (
              <button
                type="button"
                onClick={submitChallenge}
                disabled={!title.trim() || !myCard || busy}
                className="btn-violet inline-flex min-h-[52px] items-center gap-2 rounded-full px-8 py-3 font-display text-lg font-bold disabled:cursor-not-allowed disabled:opacity-50"
              >
                <UserPlus size={19} aria-hidden="true" /> {busy ? 'Sending…' : 'Send challenge'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
