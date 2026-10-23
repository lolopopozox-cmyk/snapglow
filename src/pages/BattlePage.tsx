import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Copy, Heart, MessageCircle, Swords, Trash2, Trophy } from 'lucide-react';
import {
  getBattle,
  getBattleComments,
  getCard,
  getUser,
  isBattleLive,
  sessionUser,
  siteUrl,
  useSnapGlow,
} from '../lib/store';
import { Seo } from '../components/Seo';
import { Avatar, Countdown, CtaButton, EmptyState, FlexCard, ReportButton } from '../components/ui';
import { AdSlot } from '../components/AdSlot';
import { VersusBattle } from '../components/Versus';
import { useToast } from '../components/Toast';
import { handle, timeAgo } from '../lib/format';
import NotFound from './NotFound';

function VoteLinkBox({ label, url, name }: { label: string; url: string; name: string }) {
  const { toast } = useToast();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast(`${name}'s link copied — share it anywhere.`);
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
        className="mt-2.5 inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-extrabold text-ink transition hover:border-brand-violet hover:text-brand-violet"
      >
        <Copy size={14} aria-hidden="true" /> Copy link
      </button>
    </div>
  );
}

export default function BattlePage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const sg = useSnapGlow();
  const me = sessionUser(sg.state);

  const battle = id ? getBattle(sg.state, id) : undefined;
  if (!battle) return <NotFound />;

  const voteParam = searchParams.get('vote');
  const highlightSide: 'a' | 'b' | undefined =
    voteParam === 'a' || voteParam === 'b' ? voteParam : undefined;

  const live = isBattleLive(battle);
  const winner = battle.status === 'ended' ? battle.winner : null;
  const cardA = getCard(sg.state, battle.cardAId);
  const cardB = battle.cardBId ? getCard(sg.state, battle.cardBId) : undefined;
  const ownerA = cardA ? getUser(sg.state, cardA.ownerId) : undefined;
  const ownerB = cardB ? getUser(sg.state, cardB.ownerId) : undefined;
  const winnerOwner = winner === 'a' ? ownerA : winner === 'b' ? ownerB : undefined;
  const challenger = getUser(sg.state, battle.createdBy);
  const opponentUser = battle.opponentId ? getUser(sg.state, battle.opponentId) : undefined;
  const baseUrl = `${siteUrl()}/battles/${battle.id}`;

  /* ── pending challenge ── */
  if (battle.status === 'pending') {
    return (
      <PendingChallenge
        battleId={battle.id}
        baseUrl={baseUrl}
      />
    );
  }

  if (battle.status === 'declined' || battle.status === 'cancelled') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Seo title={`${battle.title} · Snap Glow`} description="This challenge is no longer active." path={`/battles/${battle.id}`} noindex />
        <EmptyState
          icon={Swords}
          title={battle.status === 'declined' ? 'Challenge rejected' : 'Challenge cancelled'}
          body={
            battle.status === 'declined'
              ? 'The challenged creator decided not to battle this time. Start another one!'
              : 'The challenger cancelled this battle before it started.'
          }
          action={<CtaButton to="/battles/new">Start a new battle</CtaButton>}
        />
      </div>
    );
  }

  void challenger;
  void opponentUser;

  /* ── live / ended battle ── */
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Seo
        title={`${battle.title} — Live Battle · Snap Glow`}
        description={`Vote in “${battle.title}” — a head-to-head battle between Snapchat users on Snap Glow.`}
        path={`/battles/${battle.id}`}
        noindex
      />

      <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{battle.title}</h1>

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
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-card border-2 border-ink bg-mint p-5 shadow-soft">
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
        <div className="space-y-6">
          <div className="card-surface rounded-card p-5 sm:p-8">
            <VersusBattle battleId={battle.id} highlightSide={highlightSide} />
          </div>
          <BattleDiscussion battleId={battle.id} />
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
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-extrabold text-ink hover:border-brand-cyan"
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

/* ── pending challenge view ── */
function PendingChallenge({ battleId, baseUrl }: { battleId: string; baseUrl: string }) {
  const sg = useSnapGlow();
  const { toast } = useToast();
  const me = sessionUser(sg.state);
  const [acceptCard, setAcceptCard] = useState('');
  const [picked, setPicked] = useState(false);

  const battle = getBattle(sg.state, battleId);
  if (!battle) return <NotFound />;
  const challenger = getUser(sg.state, battle.createdBy);
  const cardA = getCard(sg.state, battle.cardAId);
  const ownerA = cardA ? getUser(sg.state, cardA.ownerId) : undefined;
  const opponentUser = battle.opponentId ? getUser(sg.state, battle.opponentId) : undefined;
  const isOpen = battle.opponentId === null;
  const isInvitedMe = !!me && battle.opponentId === me.id;
  const isChallenger = !!me && battle.createdBy === me.id;
  const canAccept = !!me && !isChallenger && (isInvitedMe || isOpen);
  const myCards = sg.state.cards.filter((c) => c.published && c.ownerId === me?.id);
  const chosen = acceptCard || myCards[0]?.id || '';

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Seo title={`${battle.title} — Pending Challenge · Snap Glow`} description="A Snap Glow battle waiting for its challenger." path={`/battles/${battleId}`} noindex />
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{battle.title}</h1>

      <div className="card-surface mt-6 rounded-card p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-lav px-4 py-1.5 text-sm font-extrabold text-brand-violet">
            <Swords size={15} aria-hidden="true" /> Challenge pending
          </span>
          {challenger && (
            <p className="text-sm font-semibold text-ink-soft">
              {challenger.displayName} ({handle(challenger.username)}) is waiting
              {opponentUser ? ` for ${opponentUser.displayName}` : ' for a challenger'}.
            </p>
          )}
        </div>

        {cardA && ownerA && (
          <div className="mx-auto mt-6 w-full max-w-[240px]">
            <p className="mb-2 text-center text-xs font-extrabold uppercase tracking-wider text-ink-mute">Challenger&apos;s card</p>
            <FlexCard card={cardA} owner={ownerA} />
          </div>
        )}

        {canAccept &&
          (myCards.length > 0 ? (
            <div className="mt-6 rounded-2xl border-2 border-ink bg-lav/40 p-5">
              <p className="font-display text-lg font-extrabold text-ink">Accept this challenge 🏁</p>
              <p className="mt-1 text-sm font-semibold text-ink-soft">
                Pick the card you&apos;ll battle with — voting goes live the moment you accept.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                <select
                  value={chosen}
                  onChange={(e) => {
                    setAcceptCard(e.target.value);
                    setPicked(true);
                  }}
                  aria-label="Pick your card"
                  className="min-h-[48px] w-full rounded-2xl border-2 border-ink bg-white px-4 font-grotesk font-bold text-ink"
                >
                  {myCards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!chosen || picked}
                  onClick={() => {
                    setPicked(true);
                    void sg.acceptChallenge(battleId, chosen).then((r) => {
                      toast(r.message);
                      setPicked(false);
                    });
                  }}
                  className="btn-cta inline-flex min-h-[48px] items-center gap-2 rounded-full px-6 py-3 font-display text-lg font-bold disabled:cursor-wait disabled:opacity-50"
                >
                  <Swords size={18} aria-hidden="true" /> {picked ? 'Accepting…' : 'Accept & go live'}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <EmptyState
                icon={Swords}
                title="Accept with your card"
                body="Publish a flex card first — then come back and accept this challenge."
                action={<CtaButton to="/create">Create a card</CtaButton>}
              />
            </div>
          ))}

        {isInvitedMe && (
          <button
            type="button"
            onClick={() => void sg.rejectChallenge(battleId).then((r) => toast(r.message))}
            className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-full border-2 border-ink bg-white px-6 py-3 font-display font-bold text-ink-soft transition hover:border-brand-pink hover:text-brand-pink sm:w-auto"
          >
            Reject challenge
          </button>
        )}

        {isChallenger && (
          <div className="mt-6 space-y-4">
            <p className="text-sm font-semibold text-ink-soft">
              Share this link — your opponent opens it and accepts with their card:
            </p>
            <VoteLinkBox label="Challenge link" url={baseUrl} name={battle.title} />
            <button
              type="button"
              onClick={() => void sg.cancelBattle(battleId).then((r) => toast(r.message))}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-extrabold text-ink-mute hover:border-brand-pink hover:text-brand-pink"
            >
              <Trash2 size={15} aria-hidden="true" /> Cancel challenge
            </button>
          </div>
        )}

        {!me && (
          <p className="mt-6 rounded-2xl bg-lav px-4 py-3 text-sm font-bold text-ink">
            <Link to="/signin" className="underline">Create a free account</Link> to accept this challenge with your card.
          </p>
        )}
      </div>

      <div className="mt-6">
        <Link to="/battles" className="text-sm font-extrabold text-ink-mute hover:text-brand-violet">
          ← Back to all battles
        </Link>
      </div>
    </div>
  );
}

/* ── battle comments + likes ── */
function BattleDiscussion({ battleId }: { battleId: string }) {
  const sg = useSnapGlow();
  const { toast } = useToast();
  const me = sessionUser(sg.state);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const comments = getBattleComments(sg.state, battleId);
  const liked = false; // refreshed below
  const [likeState, setLikeState] = useState<{ liked: boolean; busy?: boolean }>({ liked });

  const submit = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const res = await sg.addBattleComment(battleId, text);
    toast(res.message);
    if (res.ok) setText('');
    setSending(false);
  };

  return (
    <div className="card-surface rounded-card p-5 sm:p-8" aria-label="Battle discussion">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-extrabold text-ink">Battle talk</h2>
        <button
          type="button"
          aria-pressed={likeState.liked}
          disabled={likeState.busy}
          onClick={async () => {
            if (!me) {
              toast('Create a free account to like battles.');
              return;
            }
            setLikeState((s) => ({ ...s, busy: true }));
            const res = await sg.toggleBattleLike(battleId);
            setLikeState({ liked: !!res.liked });
            toast(res.message);
          }}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border-2 border-ink bg-white px-4 py-2 text-sm font-extrabold text-ink transition hover:border-brand-pink hover:text-brand-pink"
        >
          <Heart size={16} aria-hidden="true" className={likeState.liked ? 'fill-brand-pink text-brand-pink' : ''} />
          {likeState.liked ? 'Liked' : 'Like battle'}
        </button>
      </div>

      {me ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 500))}
            placeholder="Hype your favorite, keep it friendly…"
            aria-label="Write a comment"
            maxLength={500}
            className="min-h-[88px] flex-1 rounded-2xl border-2 border-ink bg-white px-4 py-3 text-sm font-semibold text-ink placeholder:text-ink-mute"
          />
          <button
            type="button"
            disabled={!text.trim() || sending}
            onClick={submit}
            className="btn-violet inline-flex min-h-[48px] items-center gap-2 self-end rounded-full px-5 py-2.5 font-display font-bold disabled:opacity-50"
          >
            <MessageCircle size={16} aria-hidden="true" /> {sending ? 'Posting…' : 'Comment'}
          </button>
        </div>
      ) : (
        <p className="mt-4 rounded-2xl bg-lav px-4 py-3 text-sm font-bold text-ink">
          <Link to="/signin" className="underline">Create a free account</Link> to join the conversation and vote.
        </p>
      )}

      <ul className="mt-5 space-y-4">
        {comments.length === 0 && (
          <li className="text-sm font-semibold text-ink-mute">No comments yet — be the first to hype!</li>
        )}
        {comments.map((c) => {
          const author = getUser(sg.state, c.authorId);
          const mine = me?.id === c.authorId;
          return (
            <li key={c.id} className="flex items-start gap-3">
              {author && (
                <Link to={`/u/${author.username}`}>
                  <Avatar name={author.displayName} hue={author.hue} src={author.avatar} emoji={author.avatarEmoji} size={38} />
                </Link>
              )}
              <div className="min-w-0 flex-1 rounded-2xl border border-line bg-white px-4 py-3">
                <p className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-display text-sm font-bold text-ink">{author?.displayName ?? 'Creator'}</span>
                  <span className="text-xs font-semibold text-ink-mute">{timeAgo(c.createdAt)}</span>
                </p>
                <p className="mt-1 text-sm text-ink-soft">{c.text}</p>
              </div>
              {mine && (
                <button
                  type="button"
                  aria-label="Delete your comment"
                  onClick={() => void sg.deleteBattleComment(battleId, c.id).then((r) => toast(r.message))}
                  className="rounded-full p-2 text-ink-mute hover:bg-blush hover:text-brand-pink"
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-right">
        <ReportButton targetType="battle" targetId={battleId} label="Report battle" />
      </p>
    </div>
  );
}
