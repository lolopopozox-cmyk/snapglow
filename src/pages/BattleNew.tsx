import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords } from 'lucide-react';
import { getUser, sessionUser, useSnapGlow } from '../lib/store';
import { Seo } from '../components/Seo';
import { CtaButton, EmptyState, Field, FlexCard, GatePrompt, PageHeader, SelectEl } from '../components/ui';
import { handle } from '../lib/format';
import { useToast } from '../components/Toast';

const DURATIONS = [6, 12, 24, 48];

export default function BattleNew() {
  const sg = useSnapGlow();
  const navigate = useNavigate();
  const { toast } = useToast();
  const me = sessionUser(sg.state);

  const [title, setTitle] = useState('');
  const [cardA, setCardA] = useState('');
  const [cardB, setCardB] = useState('');
  const [hours, setHours] = useState('12');

  const cards = sg.state.cards.filter((c) => c.published);
  const owners = sg.state.users.filter((u) => cards.some((c) => c.ownerId === u.id));
  const sameCard = cardA !== '' && cardA === cardB;
  const previewA = cardA ? cards.find((c) => c.id === cardA) : undefined;
  const previewB = cardB ? cards.find((c) => c.id === cardB) : undefined;
  const ownerA = previewA ? getUser(sg.state, previewA.ownerId) : undefined;
  const ownerB = previewB ? getUser(sg.state, previewB.ownerId) : undefined;

  if (!me) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Seo title="Create a Battle · Snap Glow" description="Pick two cards and start a head-to-head vote battle." path="/battles/new" noindex />
        <PageHeader eyebrow="Vote battles" title="Create a Battle" />
        <GatePrompt feature="create vote battles" />
      </div>
    );
  }

  const submit = () => {
    if (sameCard) return;
    const res = sg.createBattle(title, cardA, cardB, parseInt(hours, 10));
    toast(res.message);
    if (res.ok && res.id) navigate(`/battles/${res.id}`);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Seo title="Create a Battle · Snap Glow" description="Pick two cards and start a head-to-head vote battle." path="/battles/new" noindex />

      <PageHeader
        eyebrow="Vote battles"
        title="Create a Battle"
        sub="Pick two cards and start a head-to-head vote-off. Each contestant gets a shareable vote link to rally their supporters."
      />

      {cards.length < 2 ? (
        <EmptyState
          icon={Swords}
          title="Not enough cards yet"
          body="A battle needs two published cards. Create yours first — then come back and start the showdown."
          action={<CtaButton to="/create">Create a card</CtaButton>}
        />
      ) : (
        <div className="card-surface rounded-card p-5 sm:p-8">
          <div className="space-y-5">
            <Field
              label="Battle title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={60}
              placeholder="e.g. Golden hour showdown"
              hint="4+ characters. Keep it friendly — the Community Guidelines apply."
            />

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

            {sameCard && (
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

          {previewA && previewB && ownerA && ownerB && !sameCard && (
            <div className="mt-8 border-t border-line pt-6" aria-label="Battle preview">
              <p className="mb-4 text-center text-sm font-extrabold uppercase tracking-wider text-ink-mute">Matchup preview</p>
              <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2 sm:gap-4">
                <div className="mx-auto w-full max-w-[220px]">
                  <FlexCard card={previewA} owner={ownerA} />
                </div>
                <div className="flex justify-center pt-12 sm:pt-20" aria-hidden="true">
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

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={submit}
              disabled={!title.trim() || !cardA || !cardB || sameCard}
              className="btn-cta inline-flex items-center gap-2 rounded-full px-8 py-3 font-display text-lg font-bold disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Swords size={19} aria-hidden="true" /> Start battle
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
