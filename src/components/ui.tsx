/**
 * Snap Glow shared UI kit — light surfaces only.
 * Pages compose these; they never hand-roll the same patterns.
 */
import { useEffect, useId, useRef, useState } from 'react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';
import {
  Copy,
  Flag,
  Flame,
  Heart,
  Link2,
  MessageCircle,
  Share2,
  Timer,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { FlexCardData, Post, User } from '../lib/types';
import { templateById, badgeEmoji } from '../lib/templates';
import { levelForPoints } from '../lib/challenges';
import { api, getUser, sessionUser, useSnapGlow } from '../lib/store';
import { formatClock, formatCount, handle as fmtHandle, timeAgo } from '../lib/format';
import { useToast } from './Toast';

/* ── Reveal: subtle fade-up on scroll — progressive enhancement only ──
   Content is visible by default (see .reveal CSS). The fade only applies when
   `html.js` is set. The effect below (a) shows immediately if the element is
   already near the viewport, (b) observes with a forgiving config, and
   (c) force-reveals on a safety timeout — so content can never stay hidden,
   even if IntersectionObserver never fires (headless/virtual-time
   environments, blocked observers, layout edge cases). */
export function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        el.classList.add('in');
      }
    };
    // Already in or near the viewport? Reveal immediately, no waiting.
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight || 800;
    if (rect.top < vh * 1.15 && rect.bottom > -vh * 0.15) {
      finish();
      return;
    }
    // No IntersectionObserver at all: reveal now.
    if (typeof IntersectionObserver === 'undefined') {
      finish();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            finish();
            io.unobserve(e.target);
          }
        });
      },
      // Forgiving: reveal as soon as ANY pixel nears the viewport.
      { threshold: 0, rootMargin: '0px 0px 20% 0px' },
    );
    io.observe(el);
    // Safety net: never leave content hidden forever.
    const t = window.setTimeout(() => {
      finish();
      io.disconnect();
    }, 2500);
    return () => {
      window.clearTimeout(t);
      io.disconnect();
    };
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  );
}

/* ── Avatar: photo / emoji persona / vivid initial disc with ink border ── */
export function Avatar({
  name,
  hue,
  size = 40,
  ring = false,
  src,
  emoji,
}: {
  name: string;
  hue: number;
  size?: number;
  ring?: boolean;
  /** uploaded photo (data URL or public storage URL) */
  src?: string;
  /** emoji persona, shown instead of initials when no photo */
  emoji?: string;
}) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <span
      aria-hidden="true"
      title={name}
      className={`grid shrink-0 select-none place-items-center overflow-hidden rounded-full border-2 border-ink font-grotesk font-bold text-white ${ring ? 'shadow-pop' : ''}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `hsl(${hue}, 82%, 52%)`,
        textShadow: '0 1px 3px rgba(0,0,0,.3)',
      }}
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : emoji ? (
        <span style={{ fontSize: size * 0.5 }}>{emoji}</span>
      ) : (
        initials
      )}
    </span>
  );
}

/* ── CardArt: generated photo-style artwork per template ──────── */
export function CardArt({
  templateId,
  className = '',
  label,
}: {
  templateId: string;
  /** kept for API compatibility; art is fixed per template */
  seed?: string;
  className?: string;
  label: string;
}) {
  const t = templateById(templateId);
  return (
    <span className={`relative block overflow-hidden ${className}`} role="img" aria-label={label}>
      <img
        src={t.art}
        alt=""
        aria-hidden="true"
        draggable={false}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <span
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 32%)',
        }}
      />
    </span>
  );
}

/* ── FlexCard: the profile flex-card visual ──────────────────── */
export function FlexCard({
  card,
  owner,
  className = '',
}: {
  card: FlexCardData;
  owner: User;
  className?: string;
}) {
  const t = templateById(card.template);
  return (
    <article
      className={`relative aspect-[3/4] w-full overflow-hidden rounded-[1.5rem] border-2 border-ink shadow-lift ${className}`}
      aria-label={`Flex card “${card.title}” by ${owner.displayName}`}
    >
      <CardArt templateId={card.template} seed={card.artSeed} label="" className="absolute inset-0 h-full w-full" />
      {card.imageKind === 'upload' && card.imageDataUrl && (
        <img
          src={card.imageDataUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-x-6 top-6 h-[46%] w-[calc(100%-3rem)] rounded-3xl object-cover shadow-lift ring-1 ring-white/40"
        />
      )}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(24,12,46,0.04) 42%, rgba(24,12,46,0.48) 100%)' }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex flex-col p-4">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/25 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-md">
            <Flame size={13} aria-hidden="true" /> {card.streak}{card.streakLabel.trim() ? ` · ${card.streakLabel.trim()}` : ''}
          </span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-end pb-2 text-center">
          <Avatar name={owner.displayName} hue={owner.hue} size={64} ring />
          <h3
            className="font-display mt-2.5 text-lg font-bold leading-[1.1] tracking-tight sm:text-[1.65rem]"
            style={{ color: t.ink, textShadow: '0 2px 12px rgba(0,0,0,.4)' }}
          >
            {card.title}
          </h3>
          <p className="mt-0.5 text-sm font-semibold" style={{ color: t.sub, textShadow: '0 1px 6px rgba(0,0,0,.35)' }}>
            {fmtHandle(owner.username)}
          </p>
          <div className="mt-1.5 flex items-center gap-1.5 text-lg" aria-label={`Badges: ${card.badges.join(', ') || 'none'}`}>
            {card.badges.map((b) => (
              <span key={b} aria-hidden="true" className="drop-shadow-[0_2px_4px_rgba(0,0,0,.4)]">{badgeEmoji(b)}</span>
            ))}
          </div>
          <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            <Heart size={11} className="inline" aria-hidden="true" />
            {formatCount(card.likes.length)} likes
          </p>
        </div>
      </div>
    </article>
  );
}

/* ── ShowcaseCard: static product preview for the hero ──────────
   Renders template artwork with a generic title. Deliberately shows NO
   username, NO avatar, NO like counts — it is a product preview, not a
   real user's card. Always renders, never depends on store data. */
export function ShowcaseCard({
  templateId,
  title,
  className = '',
}: {
  templateId: string;
  title: string;
  className?: string;
}) {
  const t = templateById(templateId);
  return (
    <article
      className={`relative aspect-[3/4] w-full overflow-hidden rounded-[1.5rem] border-2 border-ink shadow-lift ${className}`}
      aria-label={`Card preview: ${title} (${t.name} template)`}
    >
      <CardArt templateId={templateId} label="" className="absolute inset-0 h-full w-full" />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(24,12,46,0.04) 42%, rgba(24,12,46,0.48) 100%)' }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex flex-col p-4">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center rounded-full border border-white/30 bg-white/25 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur-md">
            Preview
          </span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-end pb-2 text-center">
          <h3
            className="font-display text-lg font-bold leading-[1.1] tracking-tight sm:text-[1.65rem]"
            style={{ color: t.ink, textShadow: '0 2px 12px rgba(0,0,0,.4)' }}
          >
            {title}
          </h3>
          <p
            className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-white/90"
            style={{ textShadow: '0 1px 6px rgba(0,0,0,.35)' }}
          >
            {t.name} template
          </p>
        </div>
      </div>
    </article>
  );
}

/* ── Buttons ─────────────────────────────────────────────────── */
export function CtaButton({
  to,
  children,
  className = '',
  onClick,
}: {
  to?: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const cls = `btn-cta inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-grotesk text-[1.05rem] font-bold ${className}`;
  if (to) return <Link to={to} className={cls}>{children}</Link>;
  return <button type="button" onClick={onClick} className={cls}>{children}</button>;
}

export function GhostButton({
  to,
  children,
  className = '',
  onClick,
}: {
  to?: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const cls = `btn-ghost inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-grotesk text-[1.05rem] font-bold ${className}`;
  if (to) return <Link to={to} className={cls}>{children}</Link>;
  return <button type="button" onClick={onClick} className={cls}>{children}</button>;
}

/* ── Page header — flat tint panel, ink border + hard shadow (v7) ── */
export function PageHeader({
  eyebrow,
  title,
  sub,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  sub?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-hero mb-8 rounded-card p-6 sm:p-8">
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          {eyebrow && (
            <p className="eyebrow mb-4">
              {eyebrow}
            </p>
          )}
          <h1 className="font-display text-3xl font-bold leading-[1.12] text-ink sm:text-[2.6rem]">{title}</h1>
          {sub && <p className="mt-3 max-w-xl text-lg font-medium leading-relaxed text-ink-soft">{sub}</p>}
        </div>
        {children && <div className="flex flex-wrap gap-3">{children}</div>}
      </div>
    </div>
  );
}

/* ── Empty state ─────────────────────────────────────────────── */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="card-surface flex flex-col items-center rounded-card px-6 py-14 text-center">
      <span className="mb-5 grid h-16 w-16 place-items-center rounded-2xl border-2 border-ink bg-sun text-ink shadow-pop" aria-hidden="true">
        <Icon size={30} />
      </span>
      <h2 className="font-display text-[1.35rem] font-bold leading-snug text-ink">{title}</h2>
      <p className="mt-2.5 max-w-md leading-relaxed text-ink-soft">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* ── Stepper (card creator) ──────────────────────────────────── */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-2" aria-label="Creation progress">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              aria-current={active ? 'step' : undefined}
              className={`inline-flex items-center gap-2 rounded-full border-2 border-ink px-4 py-2 font-grotesk text-sm font-bold ${
                active
                  ? 'btn-cta'
                  : done
                    ? 'bg-mint text-ink shadow-pop'
                    : 'bg-white text-ink-mute'
              }`}
            >
              <span
                className={`grid h-6 w-6 place-items-center rounded-full border-2 border-ink text-xs ${
                  active ? 'bg-ink text-white' : done ? 'bg-white text-ink' : 'bg-cream text-ink-mute'
                }`}
                aria-hidden="true"
              >
                {n}
              </span>
              {label}
            </span>
            {n < steps.length && <span className="text-ink-mute" aria-hidden="true">→</span>}
          </li>
        );
      })}
    </ol>
  );
}

/* ── Countdown pill ──────────────────────────────────────────── */
export function Countdown({ to }: { to: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const ms = new Date(to).getTime() - now;
  if (ms <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-1.5 text-sm font-extrabold text-ink-mute">
        <Timer size={15} aria-hidden="true" /> Voting ended
      </span>
    );
  }
  return (
    <span className="btn-cta inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-extrabold">
      <Timer size={15} aria-hidden="true" /> Ends in <span className="tabular-nums">{formatClock(ms)}</span>
    </span>
  );
}

/* ── Tabs ────────────────────────────────────────────────────── */
export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  ariaLabel,
}: {
  tabs: Array<{ id: T; label: string }>;
  active: T;
  onChange: (id: T) => void;
  ariaLabel: string;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label={ariaLabel}>
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={`rounded-full px-5 py-2.5 font-display text-[1.02rem] font-bold tracking-tight transition ${
            active === t.id
              ? 'btn-cta'
              : 'border border-line bg-white/80 text-ink-soft backdrop-blur hover:-translate-y-0.5 hover:border-[#c9bdf0] hover:text-brand-violet hover:shadow-soft'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ── Stat ────────────────────────────────────────────────────── */
export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="text-center">
      <p className="font-display text-2xl font-extrabold text-ink">{value}</p>
      <p className="text-xs font-bold uppercase tracking-wider text-ink-mute">{label}</p>
    </div>
  );
}

/* ── Form fields ─────────────────────────────────────────────── */
const fieldCls =
  'w-full rounded-2xl border-2 border-ink bg-white px-4 py-3 text-base font-semibold text-ink placeholder:text-ink-mute/70 focus:outline-none focus:ring-2 focus:ring-brand-violet/50';

export function Field({
  label,
  hint,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-extrabold text-ink">
        {label}
      </label>
      <input id={id} {...rest} className={fieldCls} />
      {hint && <p className="mt-1 text-sm text-ink-mute">{hint}</p>}
    </div>
  );
}

export function TextArea({
  label,
  hint,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-extrabold text-ink">
        {label}
      </label>
      <textarea id={id} {...rest} className={`${fieldCls} min-h-28 resize-y`} />
      {hint && <p className="mt-1 text-sm text-ink-mute">{hint}</p>}
    </div>
  );
}

export function SelectEl({
  label,
  hint,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; hint?: string; children: ReactNode }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-extrabold text-ink">
        {label}
      </label>
      <select id={id} {...rest} className={fieldCls}>
        {children}
      </select>
      {hint && <p className="mt-1 text-sm text-ink-mute">{hint}</p>}
    </div>
  );
}

/* ── Modal (light) ───────────────────────────────────────────── */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-ink/25 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="card-surface relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-card p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl font-extrabold text-ink">{title}</h2>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full border border-line bg-white text-ink-soft hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Share row: copy link + real share intents ───────────────── */
export function ShareRow({ url, title }: { url: string; title: string }) {
  const { toast } = useToast();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast('Link copied to clipboard.');
    } catch {
      toast('Copy failed — long-press the link to copy it.');
    }
  };
  const enc = encodeURIComponent;
  const targets = [
    { label: 'Post on X', href: `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}` },
    { label: 'Share on Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { label: 'Share on WhatsApp', href: `https://wa.me/?text=${enc(`${title} ${url}`)}` },
    { label: 'Share on Telegram', href: `https://t.me/share/url?url=${enc(url)}&text=${enc(title)}` },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={copy}
        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-extrabold text-ink hover:border-brand-cyan"
      >
        <Copy size={15} aria-hidden="true" /> Copy link
      </button>
      {targets.map((t) => (
        <a
          key={t.label}
          href={t.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-extrabold text-ink hover:border-brand-cyan"
        >
          <Link2 size={15} aria-hidden="true" /> {t.label}
        </a>
      ))}
    </div>
  );
}

/* ── Report dialog ───────────────────────────────────────────── */
const REPORT_REASONS = ['Spam or misleading', 'Harassment or hate', 'Inappropriate content', 'Impersonation', 'Something else'];

export function ReportButton({
  targetType,
  targetId,
  label = 'Report',
}: {
  targetType: 'post' | 'card' | 'user' | 'battle';
  targetId: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const { toast } = useToast();
  const submit = async () => {
    const res = await api.reportContent(targetType, targetId, reason, details);
    toast(res.message);
    if (res.ok) {
      setOpen(false);
      setDetails('');
    }
  };
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold text-ink-mute hover:bg-blush hover:text-brand-pink"
        aria-label={`${label} this ${targetType}`}
      >
        <Flag size={15} aria-hidden="true" /> {label}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Report ${targetType}`}>
        <p className="mb-4 text-sm text-ink-soft">
          Reports are stored for review. A production build routes them to a human moderation queue —
          see <Link to="/guidelines" className="font-bold text-brand-violet underline">Community Guidelines</Link>.
        </p>
        <SelectEl label="Reason" value={reason} onChange={(e) => setReason(e.target.value)}>
          {REPORT_REASONS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </SelectEl>
        <div className="mt-4">
          <TextArea
            label="Details (optional)"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="What did you see?"
            maxLength={500}
          />
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={() => setOpen(false)}
            className="rounded-full border border-line bg-white px-5 py-2.5 font-bold text-ink-soft"
          >
            Cancel
          </button>
          <button onClick={submit} className="btn-cta rounded-full px-5 py-2.5 font-display font-bold">
            Send report
          </button>
        </div>
      </Modal>
    </>
  );
}

/* ── Post card (feed) ────────────────────────────────────────── */
function captionWithTags(caption: string) {
  const parts = caption.split(/(#\w+)/g);
  return parts.map((part, i) =>
    part.startsWith('#') ? (
      <Link
        key={i}
        to={`/search?q=${encodeURIComponent(part)}`}
        className="font-bold text-brand-violet hover:underline"
      >
        {part}
      </Link>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function PostCard({ post }: { post: Post }) {
  const sg = useSnapGlow();
  const { toast } = useToast();
  const author = getUser(sg.state, post.authorId);
  const card = post.cardId ? sg.state.cards.find((c) => c.id === post.cardId) : undefined;
  const cardOwner = card ? getUser(sg.state, card.ownerId) : undefined;
  const me = sessionUser(sg.state);
  const liked = !!me && post.likes.includes(me.id);

  const toggleLike = () => {
    if (!me) {
      toast('Create a free account to like posts.');
      return;
    }
    sg.toggleLikePost(post.id);
  };
  const share = async () => {
    const url = sg.sharePost(post.id);
    try {
      await navigator.clipboard.writeText(url);
      toast('Share link copied — share count +1.');
    } catch {
      toast('Share counted. Copy the URL from the post page to share it.');
    }
  };

  if (!author) return null;
  return (
    <article className="card-surface rounded-card p-5" aria-label={`Post by ${author.displayName}`}>
      <div className="mb-3 flex items-center gap-3">
        <Link to={`/u/${author.username}`} aria-label={`View ${author.displayName}'s profile`}>
          <Avatar name={author.displayName} hue={author.hue} size={44} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2">
            <Link to={`/u/${author.username}`} className="font-display text-lg font-bold text-ink hover:text-brand-violet">
              {author.displayName}
            </Link>
          </p>
          <p className="text-sm font-semibold text-ink-mute">
            {fmtHandle(author.username)} · {timeAgo(post.createdAt)}
          </p>
        </div>
        <ReportButton targetType="post" targetId={post.id} label="" />
      </div>

      <p className="whitespace-pre-wrap text-[1.05rem] font-semibold leading-relaxed text-ink">
        {captionWithTags(post.caption)}
      </p>

      {card && cardOwner && (
        <Link
          to={`/cards/${card.id}`}
          className="mt-4 block overflow-hidden rounded-2xl transition hover:opacity-95"
          aria-label={`Open card “${card.title}”`}
        >
          <div className="pointer-events-none h-72">
            <FlexCard card={card} owner={cardOwner} className="h-full rounded-2xl" />
          </div>
        </Link>
      )}

      <div className="mt-4 flex items-center gap-1 border-t border-line pt-3">
        <button
          onClick={toggleLike}
          aria-pressed={liked}
          aria-label={liked ? 'Unlike this post' : 'Like this post'}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-extrabold transition ${
            liked ? 'bg-blush text-brand-pink' : 'text-ink-mute hover:bg-blush hover:text-brand-pink'
          }`}
        >
          <Heart size={17} fill={liked ? 'currentColor' : 'none'} aria-hidden="true" />
          {formatCount(post.likes.length)}
        </button>
        <Link
          to={`/posts/${post.id}`}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-extrabold text-ink-mute hover:bg-cyantint hover:text-brand-cyan"
          aria-label={`View ${post.comments.length} comments`}
        >
          <MessageCircle size={17} aria-hidden="true" />
          {formatCount(post.comments.length)}
        </Link>
        <button
          onClick={share}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-extrabold text-ink-mute hover:bg-mint hover:text-brand-green"
          aria-label="Share this post"
        >
          <Share2 size={17} aria-hidden="true" />
          {formatCount(post.shares)}
        </button>
      </div>
    </article>
  );
}

/* ── Like button (cards) ─────────────────────────────────────── */
export function CardLikeButton({ cardId, count }: { cardId: string; count: number }) {
  const sg = useSnapGlow();
  const { toast } = useToast();
  const me = sessionUser(sg.state);
  const liked = !!me && (sg.state.cards.find((c) => c.id === cardId)?.likes.includes(me.id) ?? false);
  return (
    <button
      onClick={() => {
        if (!me) {
          toast('Create a free account to like cards.');
          return;
        }
        sg.toggleLikeCard(cardId);
      }}
      aria-pressed={liked}
      aria-label={liked ? 'Unlike this card' : 'Like this card'}
      className={`btn-cta inline-flex items-center gap-2 rounded-full px-6 py-3 font-grotesk text-lg font-bold ${liked ? '' : 'opacity-90'}`}
    >
      <Heart size={19} fill={liked ? 'currentColor' : 'none'} aria-hidden="true" />
      {liked ? 'Liked' : 'Like'} · {formatCount(count)}
    </button>
  );
}

/* ── Section title with optional "view all" ──────────────────── */
export function SectionTitle({
  title,
  sub,
  linkTo,
  linkLabel,
}: {
  title: string;
  sub?: string;
  linkTo?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink">{title}</h2>
        {sub && <p className="mt-1 text-ink-soft">{sub}</p>}
      </div>
      {linkTo && (
        <Link to={linkTo} className="btn-ghost shrink-0 rounded-full px-4 py-2 font-grotesk text-sm font-bold">
          {linkLabel ?? 'View all'}
        </Link>
      )}
    </div>
  );
}

/* ── Follow button ───────────────────────────────────────────── */
export function FollowButton({ userId }: { userId: string }) {
  const sg = useSnapGlow();
  const { toast } = useToast();
  const me = sessionUser(sg.state);
  if (me && me.id === userId) return null;
  const following = !!me && (sg.state.follows[me.id] ?? []).includes(userId);
  return (
    <button
      onClick={() => {
        if (!me) {
          toast('Create a free account to follow creators.');
          return;
        }
        void sg.toggleFollow(userId).then((res) => toast(res.message));
      }}
      aria-pressed={following}
      className={`rounded-full px-5 py-2 font-display text-base font-bold transition ${
        following ? 'border border-line bg-white text-ink-soft hover:border-brand-pink hover:text-brand-pink' : 'btn-cta'
      }`}
    >
      {following ? 'Following' : 'Follow'}
    </button>
  );
}

export type { ButtonHTMLAttributes };

/* ── GatePrompt: friendly nudge for logged-out visitors ───────── */
export function GatePrompt({ feature }: { feature: string }) {
  return (
    <div className="card-surface mx-auto flex max-w-lg flex-col items-center rounded-card px-6 py-14 text-center">
      <span
        className="mb-5 grid h-16 w-16 place-items-center rounded-2xl border-2 border-ink bg-sun text-ink shadow-pop"
        aria-hidden="true"
      >
        <Heart size={30} />
      </span>
      <h2 className="font-display text-[1.35rem] font-bold leading-snug text-ink">Create your free account first</h2>
      <p className="mt-2.5 max-w-md leading-relaxed text-ink-soft">
        You need a Snap Glow account to {feature}. It takes 20 seconds — just a display name,
        a username and a password.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <CtaButton to="/signin">Create free account</CtaButton>
        <GhostButton to="/signin">Log in</GhostButton>
      </div>
    </div>
  );
}

/* ── LevelBadge: Glow level pill (Rising Star → Legend) ───────── */
export function LevelBadge({ points, size = 'md' }: { points: number; size?: 'sm' | 'md' }) {
  const level = levelForPoints(points);
  const cls =
    size === 'sm'
      ? 'px-2.5 py-0.5 text-[0.7rem]'
      : 'px-3.5 py-1 text-xs';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border-2 border-ink bg-brand-violet font-grotesk font-bold uppercase tracking-wider text-white shadow-pop ${cls}`}
      title={`${level.name} · ${points} Glow Points — ${level.blurb}`}
    >
      <Flame size={size === 'sm' ? 11 : 13} aria-hidden="true" /> {level.name}
    </span>
  );
}

/* ── PointsChip: compact Glow Points display ──────────────────── */
export function PointsChip({ points }: { points: number }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-sun-tint px-3 py-1 text-sm font-extrabold text-ink"
      title="Glow Points — earn them by creating, voting, commenting and winning"
    >
      <Flame size={14} aria-hidden="true" className="text-brand-violet" />
      {points.toLocaleString()} <span className="font-bold text-ink-mute">pts</span>
    </span>
  );
}
