import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CalendarHeart,
  Check,
  Download,
  Image as ImageIcon,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Seo } from '../components/Seo';
import {
  Avatar,
  CardArt,
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
import { TEMPLATES, templateById, BADGES, badgeEmoji } from '../lib/templates';
import { downloadCardPng, type ExportSize } from '../lib/renderCard';
import { challengeForDay, POINTS } from '../lib/challenges';
import type { FlexCardData, User } from '../lib/types';

const MAX_BYTES = 5 * 1024 * 1024;
const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const TINTS = [
  { id: 'white', label: 'White', hex: '#FFFFFF' },
  { id: 'cream', label: 'Cream', hex: '#FFFBF4' },
  { id: 'lavender', label: 'Lavender', hex: '#F7F4FF' },
  { id: 'mint', label: 'Mint', hex: '#F1FDF7' },
  { id: 'cyan', label: 'Cyan', hex: '#EFFBFF' },
  { id: 'blush', label: 'Blush', hex: '#FFF3F7' },
];

const STEPS = ['Upload Image', 'Customize', 'Preview', 'Publish'];

/* ── Live preview (mirrors FlexCard styling) ──────────────────── */
function PreviewCard({
  title,
  username,
  streak,
  streakLabel,
  templateId,
  badges,
  tint,
  photo,
}: {
  title: string;
  username: string;
  streak: number;
  streakLabel: string;
  templateId: string;
  badges: string[];
  tint: string;
  photo: string | null;
}) {
  const t = templateById(templateId);
  return (
    <div className="rounded-3xl border border-line p-5" style={{ background: tint }}>
      <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-3xl shadow-lift">
        <CardArt
          templateId={templateId}
          seed="draft-seed"
          label={`“${t.name}” template preview`}
          className="absolute inset-0 h-full w-full"
        />
        {photo && (
          <img
            src={photo}
            alt="Your uploaded photo"
            className="absolute inset-x-6 top-6 h-[46%] w-[calc(100%-3rem)] rounded-2xl object-cover shadow-lift"
          />
        )}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.06) 40%, rgba(0,0,0,0.42) 100%)' }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 flex flex-col p-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 rounded-full bg-black/30 px-2.5 py-1 text-xs font-extrabold text-white">
              <span aria-hidden="true">🔥</span> {streak}
              {streakLabel.trim() ? ` · ${streakLabel.trim()}` : ''}
            </span>
          </div>
          <div className="flex flex-1 flex-col items-center justify-end pb-2 text-center">
            <Avatar name={title || 'You'} hue={160} size={64} ring />
            <p
              className="font-display mt-2 text-2xl font-extrabold leading-tight"
              style={{ color: t.ink, textShadow: '0 2px 10px rgba(0,0,0,.35)' }}
            >
              {title || 'Your name'}
            </p>
            <p className="text-sm font-bold" style={{ color: t.sub }}>
              @{username || 'you'}
            </p>
            {badges.length > 0 && (
              <div className="mt-1.5 flex items-center gap-1.5 text-lg" aria-label={`Badges: ${badges.join(', ')}`}>
                {badges.map((b) => (
                  <span key={b} aria-hidden="true">
                    {badgeEmoji(b)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
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

  const [step, setStep] = useState(1);
  const [photo, setPhoto] = useState<string | null>(null);
  const [useArt, setUseArt] = useState(false);
  const [error, setError] = useState('');
  const [caption, setCaption] = useState('');
  const [streak, setStreak] = useState(0);
  const [streakLabel, setStreakLabel] = useState('');
  const [templateId, setTemplateId] = useState('neon-flex');
  const [badges, setBadges] = useState<string[]>([]);
  const [tint, setTint] = useState(TINTS[0].hex);
  const [forChallenge, setForChallenge] = useState(false);
  const [exportSize, setExportSize] = useState<ExportSize>('feed');
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

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

  const canNext = step === 1 ? !!photo || useArt : true;

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
      setUseArt(false);
    };
    reader.onerror = () => setError('Could not read that file — try another image.');
    reader.readAsDataURL(file);
  };

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

  const handlePublish = () => {
    const res = sg.publishCard({
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

  return (
    <>
      <Seo
        title="Create Your Flex Card · Snap Glow"
        description="Upload a photo, pick a template, preview and download your flex profile card — sized for Snapchat Stories."
        path="/create"
        noindex
      />
      <PageHeader eyebrow="Card studio" title="Create Your Flex Card" sub="Design a flex or streak card in four steps — download it for your Snapchat Story or publish it to the feed.">
        <GhostButton to="/feed">Back to feed</GhostButton>
      </PageHeader>

      <div className="mb-8">
        <Stepper steps={STEPS} current={step} />
      </div>

      {/* ── Step 1: upload ─────────────────────────────────── */}
      {step === 1 && (
        <section aria-label="Step 1: upload image" className="mx-auto max-w-2xl">
          <h2 className="font-display mb-4 text-2xl font-extrabold text-ink">Upload Image</h2>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            aria-label="Choose an image file"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          {!photo && !useArt ? (
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
                  JPEG, PNG, WebP or GIF · up to 5MB · your photo stays in this browser
                </span>
              </button>
              <div className="my-5 flex items-center gap-3" aria-hidden="true">
                <span className="h-px flex-1 bg-line" />
                <span className="text-sm font-bold text-ink-mute">or</span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <div className="text-center">
                <GhostButton
                  onClick={() => {
                    setUseArt(true);
                    setPhoto(null);
                    setError('');
                  }}
                >
                  <Sparkles size={18} aria-hidden="true" /> Use template art instead
                </GhostButton>
              </div>
            </>
          ) : (
            <div className="card-surface flex flex-col items-center gap-4 rounded-card p-6 sm:flex-row">
              {photo ? (
                <img src={photo} alt="Your uploaded photo" className="h-40 w-40 rounded-2xl object-cover shadow-lift" />
              ) : (
                <div className="h-40 w-40 overflow-hidden rounded-2xl" aria-label="Template art selected">
                  <CardArt templateId={templateId} seed="draft-seed" label="Template art" className="h-full w-full" />
                </div>
              )}
              <div className="text-center sm:text-left">
                <p className="font-display text-lg font-extrabold text-ink">
                  {photo ? 'Photo ready' : 'Template art selected'}
                </p>
                <p className="mt-1 text-sm text-ink-mute">
                  {photo ? 'This is the photo that will appear on your card.' : 'The template artwork will appear on your card instead of a photo.'}
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
                    onClick={() => {
                      setPhoto(null);
                      setUseArt(false);
                      setError('');
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-extrabold text-ink hover:border-brand-pink hover:text-brand-pink"
                  >
                    <Trash2 size={15} aria-hidden="true" /> Remove
                  </button>
                </div>
              </div>
            </div>
          )}
          {error && (
            <p role="alert" className="mt-4 rounded-2xl bg-blush px-4 py-3 text-sm font-bold text-ink">
              {error}
            </p>
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
                      className={`inline-flex items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-extrabold transition ${
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
              <p className="mb-1.5 block text-sm font-extrabold text-ink" id="template-picker-label">
                Choose Template
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="radiogroup" aria-labelledby="template-picker-label">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={templateId === t.id}
                    aria-label={t.name}
                    onClick={() => setTemplateId(t.id)}
                    className={`rounded-2xl border-2 p-2 text-left transition ${
                      templateId === t.id
                        ? 'border-brand-violet bg-white shadow-soft'
                        : 'border-line bg-white hover:border-brand-cyan'
                    }`}
                  >
                    <CardArt templateId={t.id} seed={t.id} label={`${t.name} preview`} className="h-24 w-full rounded-xl" />
                    <p className="mt-1.5 text-center text-sm font-extrabold text-ink">{t.name}</p>
                  </button>
                ))}
              </div>
              <div className="mt-5">
                <p className="mb-1.5 block text-sm font-extrabold text-ink" id="tint-picker-label">
                  Background Tint
                </p>
                <div className="flex flex-wrap gap-2" role="group" aria-labelledby="tint-picker-label">
                  {TINTS.map((tintOpt) => (
                    <button
                      key={tintOpt.id}
                      type="button"
                      aria-pressed={tint === tintOpt.hex}
                      aria-label={tintOpt.label}
                      title={tintOpt.label}
                      onClick={() => setTint(tintOpt.hex)}
                      className={`h-10 w-10 rounded-full border-2 transition ${
                        tint === tintOpt.hex ? 'border-brand-violet ring-2 ring-brand-violet/30' : 'border-line'
                      }`}
                      style={{ background: tintOpt.hex }}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-6">
                <PreviewCard
                  title={me.displayName}
                  username={me.username}
                  streak={streak}
                  streakLabel={streakLabel}
                  templateId={templateId}
                  badges={badges}
                  tint={tint}
                  photo={photo}
                />
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
            <PreviewCard
              title={me.displayName}
              username={me.username}
              streak={streak}
              streakLabel={streakLabel}
              templateId={templateId}
              badges={badges}
              tint={tint}
              photo={photo}
            />
            <div className="card-surface rounded-card p-6">
              <h3 className="font-display text-xl font-extrabold text-ink">Your card checklist</h3>
              <ul className="mt-4 space-y-4">
                <CheckItem
                  ok={!!photo || useArt}
                  label="Image"
                  detail={photo ? 'Your uploaded photo' : 'Template art'}
                />
                <CheckItem ok label="Creator" detail={`${me.displayName} (@${me.username})`} />
                <CheckItem ok label="Template" detail={templateById(templateId).name} />
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
                    className={`rounded-2xl border-2 p-3 text-left transition ${
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
            disabled={!canNext}
            className="btn-cta inline-flex items-center gap-2 rounded-full px-6 py-3 font-display text-lg font-bold disabled:cursor-not-allowed disabled:opacity-40"
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
              setUseArt(false);
              setCaption('');
              setStreak(0);
              setStreakLabel('');
              setTemplateId('neon-flex');
              setBadges([]);
              setTint(TINTS[0].hex);
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
    </>
  );
}
