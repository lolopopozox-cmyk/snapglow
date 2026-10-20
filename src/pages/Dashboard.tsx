import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Download,
  Flame,
  LayoutDashboard,
  Lock,
  LogOut,
  Pencil,
  Plus,
  Swords,
  Trophy,
} from 'lucide-react';
import { Seo } from '../components/Seo';
import {
  Avatar,
  FlexCard,
  CtaButton,
  GatePrompt,
  GhostButton,
  PageHeader,
  EmptyState,
  Tabs,
  Stat,
  Field,
  TextArea,
  SelectEl,
  Modal,
  PostCard,
  LevelBadge,
  PointsChip,
} from '../components/ui';
import { useToast } from '../components/Toast';
import {
  useSnapGlow,
  getUser,
  getCard,
  isBattleLive,
  battleWinner,
  userStats,
  computeAchievements,
  sessionUser,
} from '../lib/store';
import { levelForPoints, pointsToNextLevel } from '../lib/challenges';
import { formatCount, handle, timeAgo } from '../lib/format';
import { downloadCardPng, type ExportSize } from '../lib/renderCard';
import type { FlexCardData } from '../lib/types';

type TabId = 'cards' | 'posts' | 'battles' | 'achievements';

function CardDownloadButton({ card }: { card: FlexCardData }) {
  const sg = useSnapGlow();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [size, setSize] = useState<ExportSize>('feed');

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex overflow-hidden rounded-full border border-line bg-white" role="group" aria-label="Download size">
        {(['feed', 'story'] as ExportSize[]).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={size === s}
            onClick={() => setSize(s)}
            className={`px-2.5 py-1 text-[0.7rem] font-extrabold ${size === s ? 'bg-lav text-brand-violet' : 'text-ink-mute'}`}
            title={s === 'story' ? '9:16 — for Snapchat Stories' : '4:5 — for the feed'}
          >
            {s === 'story' ? '9:16' : '4:5'}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          const owner = getUser(sg.state, card.ownerId);
          if (!owner) {
            toast('Could not find the card owner.');
            return;
          }
          setBusy(true);
          try {
            await downloadCardPng(card, owner, size);
            toast(size === 'story' ? 'Story PNG downloaded (1080×1920).' : 'PNG downloaded (1080×1350).');
          } catch {
            toast('Download failed — try again.');
          } finally {
            setBusy(false);
          }
        }}
        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-extrabold text-ink transition hover:border-brand-cyan disabled:cursor-wait disabled:opacity-60"
      >
        <Download size={15} aria-hidden="true" />
        {busy ? 'Rendering…' : 'PNG'}
      </button>
    </div>
  );
}

export default function Dashboard() {
  const sg = useSnapGlow();
  const { toast } = useToast();
  const [tab, setTab] = useState<TabId>('cards');
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [postCaption, setPostCaption] = useState('');
  const [postCardId, setPostCardId] = useState('');

  const me = sessionUser(sg.state);

  if (!me) {
    return (
      <>
        <Seo
          title="My Dashboard · Snap Glow"
          description="Your cards, posts, battles and achievements on Snap Glow."
          path="/dashboard"
          noindex
        />
        <PageHeader eyebrow="Dashboard" title="My Dashboard" />
        <GatePrompt feature="see your dashboard" />
      </>
    );
  }

  const stats = userStats(sg.state, me.id);
  const level = levelForPoints(me.points);
  const toNext = pointsToNextLevel(me.points);
  const myCards = sg.state.cards.filter((c) => c.ownerId === me.id && c.published);
  const myPosts = sg.state.posts.filter((p) => p.authorId === me.id);
  const myBattles = sg.state.battles.filter((b) => {
    const a = getCard(sg.state, b.cardAId);
    const c = getCard(sg.state, b.cardBId);
    return a?.ownerId === me.id || c?.ownerId === me.id;
  });
  const achievements = computeAchievements(sg.state, me.id);

  const openEditor = () => {
    setEditName(me.displayName);
    setEditBio(me.bio);
    setEditOpen(true);
  };

  const saveProfile = () => {
    const res = sg.updateProfile({ displayName: editName, bio: editBio });
    toast(res.message);
    if (res.ok) setEditOpen(false);
  };

  const submitPost = () => {
    const res = sg.createPost(postCaption, postCardId || undefined);
    toast(res.message);
    if (res.ok) {
      setPostCaption('');
      setPostCardId('');
    }
  };

  const battleStatus = (battleId: string, cardAId: string, cardBId: string) => {
    const battle = sg.state.battles.find((b) => b.id === battleId);
    if (!battle) return null;
    if (isBattleLive(battle)) {
      return (
        <span className="rounded-full bg-mint px-3 py-1 text-xs font-extrabold text-ink">
          <Swords size={12} className="mr-1 inline" aria-hidden="true" /> Live
        </span>
      );
    }
    const w = battleWinner(sg.state, battleId);
    if (w === 'a' || w === 'b') {
      const winningCard = getCard(sg.state, w === 'a' ? cardAId : cardBId);
      const winner = winningCard ? getUser(sg.state, winningCard.ownerId) : undefined;
      return (
        <span className="rounded-full bg-lav px-3 py-1 text-xs font-extrabold text-ink">
          <Trophy size={12} className="mr-1 inline" aria-hidden="true" /> Won by {winner?.displayName ?? 'unknown'}
        </span>
      );
    }
    return (
      <span className="rounded-full bg-lav px-3 py-1 text-xs font-extrabold text-ink">It&apos;s a tie</span>
    );
  };

  return (
    <>
      <Seo
        title="My Dashboard · Snap Glow"
        description="Your cards, posts, battles and achievements on Snap Glow."
        path="/dashboard"
        noindex
      />
      <PageHeader eyebrow="Dashboard" title="My Dashboard" sub="Your cards, posts, battles and Glow Points.">
        <GhostButton to="/create">
          <Plus size={18} aria-hidden="true" /> New card
        </GhostButton>
      </PageHeader>

      {!sg.state.storageOk && (
        <div role="alert" className="mb-6 flex items-start gap-3 rounded-2xl border border-line bg-blush p-4">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-ink" aria-hidden="true" />
          <p className="text-sm font-bold text-ink">
            Browser storage is full — new cards and posts work for this session only and may not survive a reload.
          </p>
        </div>
      )}

      {/* header card */}
      <div className="card-surface flex flex-col gap-4 rounded-card p-6 sm:flex-row sm:items-center">
        <Avatar name={me.displayName} hue={me.hue} size={72} ring />
        <div className="flex-1">
          <p className="flex flex-wrap items-center gap-2 font-display text-2xl font-extrabold text-ink">
            {me.displayName} <LevelBadge points={me.points} />
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm font-bold text-ink-mute">
            {handle(me.username)} <PointsChip points={me.points} />
          </p>
          <p className="mt-1.5 text-ink-soft">{me.bio ? me.bio : 'No bio yet — tell the community about your vibe.'}</p>
          {toNext > 0 ? (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-brand-violet">
              <Flame size={14} aria-hidden="true" /> {toNext} points to {levelForPoints(me.points + toNext).name}
            </p>
          ) : (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-brand-violet">
              <Trophy size={14} aria-hidden="true" /> Max level reached — true Legend status
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={openEditor}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-white px-5 py-2.5 font-display text-base font-bold text-ink transition hover:border-brand-violet hover:text-brand-violet"
        >
          <Pencil size={16} aria-hidden="true" /> Edit profile
        </button>
      </div>

      {/* stats */}
      <div className="card-surface mt-6 grid grid-cols-2 gap-6 rounded-card p-6 sm:grid-cols-5">
        <Stat label="Cards" value={stats.cards} />
        <Stat label="Likes received" value={formatCount(stats.likesReceived)} />
        <Stat label="Battles won" value={stats.wins} />
        <Stat label="Votes cast" value={stats.votesCast} />
        <Stat label="Followers" value={formatCount(stats.followers)} />
      </div>

      <div className="mt-8">
        <Tabs<TabId>
          ariaLabel="Dashboard sections"
          tabs={[
            { id: 'cards', label: 'My Cards' },
            { id: 'posts', label: 'My Posts' },
            { id: 'battles', label: 'My Battles' },
            { id: 'achievements', label: 'Achievements' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {/* ── My cards ── */}
      {tab === 'cards' && (
        <div className="mt-6">
          {myCards.length === 0 ? (
            <EmptyState
              icon={LayoutDashboard}
              title="No cards yet"
              body="Design your first flex or streak card — it only takes a minute."
              action={<CtaButton to="/create">Create your card</CtaButton>}
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {myCards.map((c) => (
                <div key={c.id} className="flex flex-col gap-2">
                  <Link
                    to={`/cards/${c.id}`}
                    className="rounded-3xl transition hover:-translate-y-1"
                    aria-label={`View your flex card “${c.title}”`}
                  >
                    <FlexCard card={c} owner={me} />
                  </Link>
                  <div className="flex items-center justify-between gap-2 px-1">
                    <span className="truncate text-sm font-bold text-ink-mute">{timeAgo(c.createdAt)}</span>
                    <CardDownloadButton card={c} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── My posts ── */}
      {tab === 'posts' && (
        <div className="mt-6">
          <div className="card-surface rounded-card p-6">
            <h2 className="font-display text-xl font-extrabold text-ink">New post</h2>
            <div className="mt-4">
              <TextArea
                label="Caption"
                value={postCaption}
                onChange={(e) => setPostCaption(e.target.value)}
                placeholder="Share an update with the community…"
                maxLength={280}
              />
            </div>
            {myCards.length > 0 && (
              <div className="mt-4">
                <SelectEl
                  label="Attach a card (optional)"
                  value={postCardId}
                  onChange={(e) => setPostCardId(e.target.value)}
                >
                  <option value="">No card</option>
                  {myCards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </SelectEl>
              </div>
            )}
            <div className="mt-4">
              <CtaButton onClick={submitPost}>Post</CtaButton>
            </div>
          </div>
          <div className="mt-6 space-y-5">
            {myPosts.length === 0 ? (
              <EmptyState
                icon={LayoutDashboard}
                title="No posts yet"
                body="Use the composer above to share your first post with the community."
              />
            ) : (
              myPosts.map((p) => <PostCard key={p.id} post={p} />)
            )}
          </div>
        </div>
      )}

      {/* ── My battles ── */}
      {tab === 'battles' && (
        <div className="mt-6">
          {myBattles.length === 0 ? (
            <EmptyState
              icon={Swords}
              title="No battles yet"
              body="Put two cards head-to-head and let the community vote."
              action={<CtaButton to="/battles/new">Create a battle</CtaButton>}
            />
          ) : (
            <ul className="space-y-3">
              {myBattles.map((b) => {
                const a = getCard(sg.state, b.cardAId);
                const c = getCard(sg.state, b.cardBId);
                const aOwner = a ? getUser(sg.state, a.ownerId) : undefined;
                const cOwner = c ? getUser(sg.state, c.ownerId) : undefined;
                return (
                  <li key={b.id}>
                    <Link
                      to={`/battles/${b.id}`}
                      className="card-surface flex flex-wrap items-center justify-between gap-3 rounded-card p-5 transition hover:-translate-y-0.5"
                    >
                      <span>
                        <span className="font-display text-lg font-extrabold text-ink">{b.title}</span>
                        <span className="mt-0.5 block text-sm font-semibold text-ink-mute">
                          {a ? `“${a.title}”` : 'Card'} ({aOwner?.displayName ?? '—'}) vs {c ? `“${c.title}”` : 'Card'} ({cOwner?.displayName ?? '—'})
                        </span>
                      </span>
                      <span className="flex items-center gap-3">
                        {battleStatus(b.id, b.cardAId, b.cardBId)}
                        <span className="text-sm font-extrabold text-brand-violet">View →</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* ── Achievements ── */}
      {tab === 'achievements' && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={`rounded-card border-2 p-5 ${
                a.unlocked ? 'card-surface' : 'bg-white opacity-70'
              }`}
              style={a.unlocked ? { borderColor: '#a3e635' } : undefined}
            >
              <span
                className={`grid h-11 w-11 place-items-center rounded-2xl ${a.unlocked ? 'bg-mint text-ink' : 'bg-lav text-ink-mute'}`}
                aria-hidden="true"
              >
                {a.unlocked ? <Trophy size={20} /> : <Lock size={20} />}
              </span>
              <p className="font-display mt-3 text-lg font-extrabold text-ink">{a.label}</p>
              <p className="mt-1 text-sm text-ink-soft">{a.blurb}</p>
              <p className="mt-2 text-xs font-extrabold uppercase tracking-wider text-ink-mute">
                {a.unlocked ? 'Unlocked' : 'Locked'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Account ── */}
      <div className="mt-10 rounded-card border-2 border-dashed border-line bg-white p-6">
        <h2 className="font-display text-xl font-extrabold text-ink">Account</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Logged in as <strong className="text-ink">@{me.username}</strong>. Your account and content
          live in this browser.
        </p>
        <button
          type="button"
          onClick={() => {
            sg.logout();
            toast('Logged out. See you soon!');
          }}
          className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-line bg-white px-5 py-2.5 font-display text-base font-bold text-ink transition hover:border-brand-pink hover:text-brand-pink"
        >
          <LogOut size={16} aria-hidden="true" /> Log out
        </button>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit profile">
        <Field
          label="Display name"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          maxLength={40}
        />
        <div className="mt-4">
          <TextArea
            label="Bio"
            value={editBio}
            onChange={(e) => setEditBio(e.target.value.slice(0, 160))}
            maxLength={160}
            placeholder="A line about you…"
          />
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setEditOpen(false)}
            className="rounded-full border border-line bg-white px-5 py-2.5 font-bold text-ink-soft"
          >
            Cancel
          </button>
          <button type="button" onClick={saveProfile} className="btn-cta rounded-full px-5 py-2.5 font-display font-bold">
            Save
          </button>
        </div>
      </Modal>
    </>
  );
}
