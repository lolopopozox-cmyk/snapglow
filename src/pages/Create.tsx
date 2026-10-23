import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CalendarHeart,
  Check,
  Download,
  Image as ImageIcon,
  Lock,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Seo } from '../components/Seo';
import {
  CtaButton,
  GatePrompt,
  GhostButton,
  PageHeader,
  Stepper,
  Field,
  TextArea,
} from '../components/ui';
import { useToast } from '../components/Toast';
import { sessionUser, useSnapGlow } from '../lib/store';
import { BADGES } from '../lib/templates';
import { CARD_THEMES, themeById, themeUnlocked } from '../lib/cardThemes';
import { downloadCardPng, renderCardToCanvas, type ExportSize } from '../lib/renderCard';
import { challengeForDay, POINTS, levelForPoints } from '../lib/challenges';
import type { FlexCardData, User } from '../lib/types';

const MAX_BYTES = 5 * 1024 * 1024;
const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const STEPS = ['Add Photo', 'Customize', 'Preview', 'Publish'];

/* ── WYSIWYG canvas preview — the exact exported image ───────── */
function CanvasPreview({
  card,
  owner,
  size,
}: {
  card: FlexCardData;
  owner: User;
  size: ExportSize;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const canvas = ref.current;
    if (!canvas) return;
    renderCardToCanvas(canvas, card, owner, size)
      .then(() => {
        if (!cancelled) setError('');
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Preview failed');
      });
    return () => {
      cancelled = true;
    };
  }, [card, owner, size]);

  return (
    <div className="rounded-3xl border border-line bg-white p-4">
      <canvas
        ref={ref}
        role="img"
        aria-label="Live card preview — exactly what gets downloaded"
        className={`mx-auto w-full max-w-sm rounded-2xl shadow-lift ${
          size === 'story' ? 'aspect-[9/16]' : 'aspect-[4/5]'
        } object-contain`}
      />
      {error && <p className="mt-2 text-center text-sm font-bold text-brand-pink">{error}</p>}
      <p className="mt-3 text-center text-xs font-bold text-ink-mute">
        This preview is rendered by the same engine as the exported PNG — what you see is what you get.
      </p>
    </div>
  );
}

function CheckItem({ ok, label, detail }: { ok: boolean; label: string; detail?: string }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${ok ? 'bg-mint text-ink' : 'bg-blush text-ink-mute'}`}
        aria-hidden="true"
      >
        {ok ? <Check size={14} /> : <X size={14} />}
      </span>
      <span>
        <span className="font-extrabold text-ink">{label}</span>
        {detail && <span className="block text-sm text-ink-mute">{detail}</span>}
      </span>
    </li>
  );
}

export default function Create() {
  const sg = useSnapGlow();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const me = sessionUser(sg.state);
  const challenge = challengeForDay();
  const myLevel = levelForPoints(me?.points ?? 0);

  const [step, setStep] = useState(1);
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [caption, setCaption] = useState('');
  const [streak, setStreak] = useState(0);
  const [streakLabel, setStreakLabel] = useState('');
  const [templateId, setTemplateId] = useState('neon-identity');
  const [badges, setBadges] = useState<string[]>([]);
  const [forChallenge, setForChallenge] = useState(false);
  const [exportSize, setExportSize] = useState<ExportSize>('feed');
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  const myPoints = me?.points ?? 0;
  // keep the selected theme valid for the user's level (before the sign-in
  // early return — hooks must run on every render)
  useEffect(() => {
    if (!themeUnlocked(themeById(templateId), myPoints)) {
      setTemplateId('neon-identity');
    }
  }, [myPoints, templateId]);

  if (!me) {
    return (
      <>
        <Seo
          title="Create Your Flex Card · Snap Glow"
          description="Upload a photo, pick a template, preview and download your flex profile card."
          path="/create"
          noindex
        />
        <PageHeader eyebrow="Card studio" title="Create Your Flex Card" sub="Design a flex or streak card in four steps." />
        <GatePrompt feature="design cards" />
      </>
    );
  }

  const draftCard = (): { card: FlexCardData; owner: User } => ({
    card: {
      id: 'draft',
      ownerId: me.id,
      title: me.displayName,
      caption: caption.trim(),
      template: templateId,
      imageKind: photo ? 'upload' : 'art',
      imageDataUrl: photo || undefined,
      artSeed: 'draft-seed',
      streak,
      streakLabel: streakLabel.trim(),
      badges,
      likes: [],
      challengeDay: forChallenge ? challenge.dayKey : undefined,
      createdAt: new Date().toISOString(),
      published: false,
    },
    owner: me,
  });

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!OK_TYPES.includes(file.type)) {
      setError('Please choose a JPEG, PNG, WebP or GIF image.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('That file is over 5MB — pick a smaller image.');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(typeof reader.result === 'string' ? reader.result : null);
    };
    reader.onerror = () => setError('Could not read that file — try another image.');
    reader.readAsDataURL(file);
  };

  const handleDownload = async () => {
    const { card, owner } = draftCard();
    setDownloading(true);
    setDownloadError('');
    try {
      await downloadCardPng(card, owner, exportSize);
      toast(
        exportSize === 'story'
          ? 'Story PNG downloaded (1080×1920) — ready for your Snapchat Story.'
          : 'PNG downloaded (1080×1350).',
      );
    } catch (err) {
      setDownloadError(`Download failed: ${err instanceof Error ? err.message : 'unknown error'}`);
    } finally {
      setDownloading(false);
    }
  };

  const handlePublish = async () => {
    const res = await sg.publishCard({
      title: me.displayName,
      caption: caption.trim(),
      template: templateId,
      streak,
      streakLabel: streakLabel.trim(),
      badges,
      imageKind: photo ? 'upload' : 'art',
      imageDataUrl: photo || undefined,
      challengeDay: forChallenge ? challenge.dayKey : undefined,
    });
    toast(res.message);
    if (res.ok && res.id) navigate(`/cards/${res.id}`);
  };

  const toggleBadge = (id: string) =>
    setBadges((prev) => (prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]));

  const theme = themeById(templateId);

  return (
    <>
      <Seo
        title="Create Your Flex Card · Snap Glow"
        description="Upload a photo, pick a premium theme, preview and download your flex profile card — sized for Snapchat Stories."
        path="/create"
        noindex
      />
      <PageHeader eyebrow="Card studio" title="Create Your Flex Card" sub="Design a premium flex or streak card in four steps — download it for your Snapchat Story or publish it to the feed.">
        <GhostButton to="/feed">Back to feed</GhostButton>
      </PageHeader>

      <div className="mb-8">
        <Stepper steps={STEPS} current={step} />
      </div>

      {/* ── Step 1: photo ──────────────────────────────────── */}
      {step === 1 && (
        <section aria-label="Step 1: add photo" className="mx-auto max-w-2xl">
          <h2 className="font-display mb-2 text-2xl font-extrabold text-ink">Add Your Photo</h2>
          <p className="mb-4 text-sm font-semibold text-ink-soft">
            Your Snapchat profile picture works great. No photo? We&apos;ll use your avatar or initials —
            every card stays centered on you.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            aria-label="Choose an image file"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          {!photo ? (
            <>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFile(e.dataTransfer.files?.[0]);
                }}
                className="flex w-full flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-line bg-white px-6 py-14 text-center transition hover:border-brand-cyan"
              >
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-lav text-brand-violet" aria-hidden="true">
                  <Upload size={26} />
                </span>
                <span className="font-display text-xl font-extrabold text-ink">Drop a photo here, or click to browse</span>
                <span className="text-sm font-semibold text-ink-mute">
                  JPEG, PNG, WebP or GIF · up to 5MB · your photo stays yours
                </span>
              </button>
              {error && (
                <p role="alert" className="mt-4 rounded-2xl bg-blush px-4 py-3 text-sm font-bold text-ink">
                  {error}
                </p>
              )}
              <p className="mt-5 text-center text-sm font-semibold text-ink-mute">
                You can continue without a photo and add it anytime.
              </p>
            </>
          ) : (
            <div className="card-surface flex flex-col items-center gap-4 rounded-card p-6 sm:flex-row">
              <img src={photo} alt="Your uploaded photo" className="h-40 w-40 rounded-full border-4 border-ink object-cover shadow-lift" />
              <div className="text-center sm:text-left">
                <p className="font-display text-lg font-extrabold text-ink">Photo ready 🎉</p>
                <p className="mt-1 text-sm text-ink-mute">
                  It will be cropped into a treated circular portrait on your card — always fully visible.
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-extrabold text-ink hover:border-brand-cyan"
                  >
                    <RefreshCw size={15} aria-hidden="true" /> Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhoto(null)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-extrabold text-ink hover:border-brand-pink hover:text-brand-pink"
                  >
                    <Trash2 size={15} aria-hidden="true" /> Remove
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Step 2: customize ──────────────────────────────── */}
      {step === 2 && (
        <section aria-label="Step 2: customize">
          <h2 className="font-display mb-4 text-2xl font-extrabold text-ink">Customize</h2>
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            <div className="space-y-5">
              <div className="rounded-2xl border border-line bg-white p-4">
                <p className="text-sm font-extrabold text-ink">Creating as</p>
                <p className="mt-0.5 text-sm font-semibold text-ink-soft">
                  {me.displayName} <span className="text-ink-mute">@{me.username}</span>
                  <span className="ml-2 rounded-full bg-lav px-2.5 py-0.5 text-xs font-extrabold text-brand-violet">
                    {myLevel.name}
                  </span>
                </p>
              </div>
              <div>
                <TextArea
                  label="Caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value.slice(0, 140))}
                  placeholder="A line about your vibe…"
                  maxLength={140}
                />
                <p className="mt-1 text-right text-xs font-bold text-ink-mute">{caption.length}/140</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Streak count"
                  type="number"
                  min={0}
                  max={99999}
                  value={streak}
                  onChange={(e) => setStreak(Math.max(0, Math.min(99999, Number(e.target.value) || 0)))}
                />
                <Field
                  label="Streak label (optional)"
                  value={streakLabel}
                  onChange={(e) => setStreakLabel(e.target.value)}
                  placeholder="e.g. Streak with @alex"
                  maxLength={60}
                />
              </div>
              <p className="-mt-2 text-sm text-ink-mute">
                Streaks are entered by you and are not verified by Snapchat.
              </p>
              <div>
                <p className="mb-1.5 block text-sm font-extrabold text-ink" id="badge-picker-label">
                  Badges
                </p>
                <div className="flex flex-wrap gap-2" role="group" aria-labelledby="badge-picker-label">
                  {BADGES.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      aria-pressed={badges.includes(b.id)}
                      onClick={() => toggleBadge(b.id)}
                      className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-extrabold transition ${
                        badges.includes(b.id)
                          ? 'border-brand-violet bg-lav text-ink'
                          : 'border-line bg-white text-ink-soft hover:border-brand-cyan'
                      }`}
                    >
                      <span aria-hidden="true">{b.emoji}</span> {b.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={forChallenge}
                onClick={() => setForChallenge((v) => !v)}
                className={`flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition ${
                  forChallenge ? 'border-brand-violet bg-lav/50' : 'border-line bg-white'
                }`}
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border-2 border-ink bg-sun text-ink shadow-pop" aria-hidden="true">
                  <CalendarHeart size={20} />
                </span>
                <span>
                  <span className="block font-extrabold text-ink">
                    Enter today&apos;s Daily Challenge: {challenge.name}
                  </span>
                  <span className="block text-sm text-ink-soft">
                    {challenge.blurb} — earn +{POINTS.challengeBonus} bonus Glow Points on publish.
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={`ml-auto grid h-7 w-12 shrink-0 place-items-center rounded-full transition ${forChallenge ? 'bg-brand-violet' : 'bg-line'}`}
                >
                  <span className={`h-5 w-5 rounded-full bg-white shadow transition ${forChallenge ? 'translate-x-2.5' : '-translate-x-2.5'}`} />
                </span>
              </button>
            </div>
            <div>
              <p className="mb-1.5 block text-sm font-extrabold text-ink" id="theme-picker-label">
                Card Theme
              </p>
              <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-labelledby="theme-picker-label">
                {CARD_THEMES.map((t) => {
                  const unlocked = themeUnlocked(t, me.points);
                  const selected = templateId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={unlocked ? t.name : `${t.name} — unlocks at ${levelForPoints(t.minPoints).name}`}
                      disabled={!unlocked}
                      onClick={() => unlocked && setTemplateId(t.id)}
                      className={`relative overflow-hidden rounded-2xl border-2 p-3 text-left transition ${
                        selected
                          ? 'border-brand-violet shadow-soft ring-2 ring-brand-violet/20'
                          : unlocked
                            ? 'border-line hover:border-brand-cyan'
                            : 'cursor-not-allowed border-line opacity-70'
                      }`}
                      style={{ background: `linear-gradient(135deg, ${t.bg[0]}, ${t.bg[1]} 55%, ${t.bg[2]})` }}
                    >
                      <span className="text-2xl" aria-hidden="true">{t.vibe}</span>
                      <span className="mt-1 block font-display text-sm font-extrabold" style={{ color: t.ink }}>
                        {t.name}
                      </span>
                      <span className="mt-0.5 block text-[11px] font-semibold leading-snug" style={{ color: t.sub }}>
                        {t.blurb}
                      </span>
                      {!unlocked && (
                        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-ink/85 px-2 py-1 text-[10px] font-extrabold text-sun">
                          <Lock size={10} aria-hidden="true" /> {levelForPoints(t.minPoints).name}
                        </span>
                      )}
                      {selected && (
                        <span className="absolute inset-x-3 bottom-2 rounded-full bg-sun px-2 py-0.5 text-center text-[10px] font-extrabold text-ink">
                          Selected
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs font-semibold text-ink-mute">
                Earn Glow Points to unlock Streak Legend, Cosmic Profile, Elite Flex and Champion
                Edition themes.
              </p>
              <div className="mt-5">
                <CanvasPreview card={draftCard().card} owner={me} size="feed" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Step 3: preview ────────────────────────────────── */}
      {step === 3 && (
        <section aria-label="Step 3: preview">
          <h2 className="font-display mb-4 text-2xl font-extrabold text-ink">Preview</h2>
          <div className="grid items-start gap-8 lg:grid-cols-[1fr_1fr]">
            <CanvasPreview card={draftCard().card} owner={me} size={exportSize} />
            <div className="card-surface rounded-card p-6">
              <h3 className="font-display text-xl font-extrabold text-ink">Your card checklist</h3>
              <ul className="mt-4 space-y-4">
                <CheckItem
                  ok={!!photo || !!me.avatar}
                  label="Portrait"
                  detail={photo ? 'Your uploaded photo' : me.avatar ? 'Your profile avatar' : 'Initials monogram'}
                />
                <CheckItem ok label="Creator" detail={`${me.displayName} (@${me.username})`} />
                <CheckItem ok label="Theme" detail={theme.name} />
                <CheckItem
                  ok
                  label="Badges"
                  detail={badges.length > 0 ? `${badges.length} selected` : 'None selected (optional)'}
                />
                <CheckItem
                  ok
                  label="Streak"
                  detail={streak > 0 ? `🔥 ${streak}${streakLabel.trim() ? ` · ${streakLabel.trim()}` : ''}` : 'No streak set (optional)'}
                />
                {forChallenge && (
                  <CheckItem ok label="Daily Challenge" detail={`${challenge.name} · +${POINTS.challengeBonus} bonus points`} />
                )}
              </ul>
              <p className="mt-5 rounded-2xl bg-lav px-4 py-3 text-sm font-semibold text-ink">
                Looking good? Continue to Publish to download your PNG or share it on the feed.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── Step 4: publish ────────────────────────────────── */}
      {step === 4 && (
        <section aria-label="Step 4: publish" className="mx-auto max-w-3xl">
          <h2 className="font-display mb-4 text-2xl font-extrabold text-ink">Publish</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="card-surface rounded-card p-6">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-mint text-ink" aria-hidden="true">
                <Download size={22} />
              </span>
              <h3 className="font-display mt-3 text-xl font-extrabold text-ink">Download PNG</h3>
              <p className="mt-1.5 text-sm text-ink-soft">
                Export a high-resolution card image — 4:5 for the feed, or 9:16 sized for your
                Snapchat Story.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Export size">
                {(
                  [
                    { id: 'feed', label: '4:5 Feed', detail: '1080×1350' },
                    { id: 'story', label: '9:16 Story', detail: '1080×1920' },
                  ] as Array<{ id: ExportSize; label: string; detail: string }>
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={exportSize === opt.id}
                    onClick={() => setExportSize(opt.id)}
                    className={`min-h-[56px] rounded-2xl border-2 p-3 text-left transition ${
                      exportSize === opt.id
                        ? 'border-brand-violet bg-lav/40'
                        : 'border-line bg-white hover:border-brand-cyan'
                    }`}
                  >
                    <span className="block font-extrabold text-ink">{opt.label}</span>
                    <span className="block text-xs font-semibold text-ink-mute">{opt.detail}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="btn-cta mt-4 inline-flex items-center gap-2 rounded-full px-6 py-3 font-display text-lg font-bold disabled:cursor-wait disabled:opacity-60"
              >
                {downloading ? (
                  'Rendering…'
                ) : (
                  <>
                    <ImageIcon size={18} aria-hidden="true" /> Download PNG
                  </>
                )}
              </button>
              {downloadError && (
                <p role="alert" className="mt-3 rounded-2xl bg-blush px-4 py-3 text-sm font-bold text-ink">
                  {downloadError}
                </p>
              )}
            </div>
            <div className="card-surface rounded-card p-6">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-lav text-brand-violet" aria-hidden="true">
                <Sparkles size={22} />
              </span>
              <h3 className="font-display mt-3 text-xl font-extrabold text-ink">Publish to feed</h3>
              <p className="mt-1.5 text-sm text-ink-soft">
                Share your card with the Snap Glow community — it appears on your profile and in the
                public feed{forChallenge ? `, tagged for today's ${challenge.name} challenge` : ''}.
              </p>
              <button
                type="button"
                onClick={handlePublish}
                className="btn-cta mt-4 inline-flex items-center gap-2 rounded-full px-6 py-3 font-display text-lg font-bold"
              >
                Publish card <ArrowRight size={18} aria-hidden="true" />
              </button>
              <p className="mt-4 text-xs font-semibold text-ink-mute">
                Publishing earns +{POINTS.createCard} Glow Points
                {forChallenge ? ` + ${POINTS.challengeBonus} challenge bonus` : ''}.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── nav ────────────────────────────────────────────── */}
      <div className="mt-10 flex items-center justify-between">
        {step > 1 ? (
          <GhostButton onClick={() => setStep((s) => s - 1)}>
            <ArrowLeft size={18} aria-hidden="true" /> Back
          </GhostButton>
        ) : (
          <span />
        )}
        {step < 4 && (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="btn-cta inline-flex items-center gap-2 rounded-full px-6 py-3 font-display text-lg font-bold"
          >
            Next <ArrowRight size={18} aria-hidden="true" />
          </button>
        )}
        {step === 4 && (
          <button
            type="button"
            onClick={() => {
              setStep(1);
              setPhoto(null);
              setCaption('');
              setStreak(0);
              setStreakLabel('');
              setTemplateId('neon-identity');
              setBadges([]);
              setForChallenge(false);
              setError('');
              window.scrollTo(0, 0);
            }}
            className="text-sm font-extrabold text-brand-violet hover:underline"
          >
            Start a new card
          </button>
        )}
      </div>
      <div className="mt-6">
        <CtaButton to="/dashboard" className="text-sm">Back to dashboard</CtaButton>
      </div>
    </>
  );
}
