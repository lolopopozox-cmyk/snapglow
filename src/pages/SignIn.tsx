import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, LogIn, ShieldCheck, UserPlus } from 'lucide-react';
import { Seo } from '../components/Seo';
import { Avatar, CtaButton, Field, GhostButton, PageHeader, Tabs } from '../components/ui';
import { useToast } from '../components/Toast';
import { sessionUser, useSnapGlow } from '../lib/store';

const USERNAME_RE = /^[a-z0-9_.]{3,20}$/;

/** Emoji personas offered at sign-up (mixed personas). */
const PERSONA_EMOJIS = ['👦', '👦🏻', '👦🏿', '🧑', '👩', '👩🏽', '👩🏻‍🦰', '🧕', '👱‍♀️', '🧑‍🦱'];

/** Initial-disc color swatches (HSL hues). */
const HUE_SWATCHES: Array<{ hue: number; label: string }> = [
  { hue: 0, label: 'Red' },
  { hue: 30, label: 'Orange' },
  { hue: 55, label: 'Yellow' },
  { hue: 140, label: 'Green' },
  { hue: 200, label: 'Sky' },
  { hue: 260, label: 'Violet' },
  { hue: 320, label: 'Pink' },
  { hue: 350, label: 'Rose' },
];

type TabId = 'create' | 'login';

function CreateForm() {
  const sg = useSnapGlow();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  /** null = "Skip — use my initials" (default). */
  const [persona, setPersona] = useState<string | null>(null);
  const [hue, setHue] = useState(260);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; username?: string; password?: string; form?: string }>({});

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (displayName.trim().length < 2) next.name = 'Please enter a display name (2+ characters).';
    if (!USERNAME_RE.test(username.trim().toLowerCase()))
      next.username = 'Usernames need 3–20 characters: lowercase letters, numbers, dots or underscores.';
    if (password.length < 6) next.password = 'Choose a password with at least 6 characters.';
    if (next.name || next.username || next.password) {
      setErrors(next);
      return;
    }
    setBusy(true);
    const res = await sg.signUp(
      displayName,
      username,
      password,
      persona ? { hue, avatarEmoji: persona } : { hue },
    );
    setBusy(false);
    if (res.ok) {
      toast(res.message);
      navigate('/dashboard');
    } else {
      setErrors({ form: res.message });
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-line bg-white p-4">
        <Avatar
          name={displayName.trim() || 'Your name'}
          hue={hue}
          emoji={persona ?? undefined}
          size={56}
          ring
        />
        <div>
          <p className="text-sm font-extrabold text-ink">Your avatar</p>
          <p className="mt-1 text-xs font-medium text-ink-mute">
            Pick a vibe — an emoji persona or your initials in your color. You can upload a real photo
            on your profile later.
          </p>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-extrabold text-ink">Pick a vibe</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Avatar persona">
            <button
              type="button"
              onClick={() => setPersona(null)}
              aria-pressed={persona === null}
              title="Skip — use my initials"
              aria-label="Skip — use my initials"
              className={`grid h-12 w-12 min-h-[44px] min-w-[44px] place-items-center rounded-full border-2 bg-white transition ${
                persona === null ? 'border-ink' : 'border-transparent hover:border-brand-cyan'
              }`}
            >
              <Avatar name={displayName.trim() || 'You'} hue={hue} size={38} />
            </button>
            {PERSONA_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setPersona(emoji)}
                aria-pressed={persona === emoji}
                aria-label={`Emoji persona ${emoji}`}
                title={`Emoji persona ${emoji}`}
                className={`grid h-12 w-12 min-h-[44px] min-w-[44px] place-items-center rounded-full border-2 bg-white text-2xl transition ${
                  persona === emoji ? 'border-ink' : 'border-transparent hover:border-brand-cyan'
                }`}
              >
                <span aria-hidden="true">{emoji}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs font-medium text-ink-mute">
            First disc = <span className="font-bold text-ink">Skip — use my initials</span>.
          </p>
          <p className="mb-2 mt-4 text-sm font-extrabold text-ink">Disc color</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Avatar disc color">
            {HUE_SWATCHES.map((s) => (
              <button
                key={s.hue}
                type="button"
                onClick={() => setHue(s.hue)}
                aria-pressed={hue === s.hue}
                aria-label={s.label}
                title={s.label}
                style={{ background: `hsl(${s.hue}, 82%, 52%)` }}
                className={`h-10 w-10 rounded-full border-2 border-ink transition ${
                  hue === s.hue ? 'ring-2 ring-brand-violet' : 'hover:opacity-80'
                }`}
              />
            ))}
          </div>
        </div>
        <div>
          <Field
            label="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Sana Queen"
            maxLength={40}
            autoComplete="name"
          />
          {errors.name && <p role="alert" className="mt-1.5 text-sm font-bold text-brand-pink">{errors.name}</p>}
        </div>
        <div>
          <Field
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. sanaqueen"
            maxLength={20}
            autoComplete="username"
            hint="3–20 characters: lowercase letters, numbers, dots or underscores"
          />
          {errors.username && <p role="alert" className="mt-1.5 text-sm font-bold text-brand-pink">{errors.username}</p>}
        </div>
        <div>
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            autoComplete="new-password"
            hint="Stored as a secure hash in this browser — never in plain text."
          />
          {errors.password && <p role="alert" className="mt-1.5 text-sm font-bold text-brand-pink">{errors.password}</p>}
        </div>
      </div>
      {errors.form && (
        <p role="alert" className="mt-4 rounded-2xl bg-blush px-4 py-3 text-sm font-bold text-ink">{errors.form}</p>
      )}
      <div className="mt-6">
        <button
          type="submit"
          disabled={busy}
          className="btn-cta inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-display text-lg font-bold disabled:opacity-60"
        >
          <UserPlus size={19} aria-hidden="true" /> {busy ? 'Creating…' : 'Create my account'}
        </button>
      </div>
      <p className="mt-4 flex items-start gap-2 text-xs font-medium leading-relaxed text-ink-mute">
        <ShieldCheck size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-brand-violet" />
        This is a Snap Glow account — not your Snapchat account. We will never ask for your Snapchat
        password.
      </p>
    </form>
  );
}

function LoginForm() {
  const sg = useSnapGlow();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await sg.login(username, password);
    setBusy(false);
    if (res.ok) {
      toast(res.message);
      navigate('/dashboard');
    } else {
      setError(res.message);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className="space-y-4">
        <Field
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. sanaqueen"
          maxLength={20}
          autoComplete="username"
        />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your password"
          autoComplete="current-password"
        />
      </div>
      {error && <p role="alert" className="mt-4 rounded-2xl bg-blush px-4 py-3 text-sm font-bold text-ink">{error}</p>}
      <div className="mt-6">
        <button
          type="submit"
          disabled={busy}
          className="btn-cta inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-display text-lg font-bold disabled:opacity-60"
        >
          <LogIn size={19} aria-hidden="true" /> {busy ? 'Logging in…' : 'Log in'}
        </button>
      </div>
      <p className="mt-4 text-xs font-medium leading-relaxed text-ink-mute">
        Forgot your password? Accounts live in this browser only for now — if you cleared site data,
        create a fresh account. A future update adds proper account recovery.
      </p>
    </form>
  );
}

export default function SignIn() {
  const sg = useSnapGlow();
  const { toast } = useToast();
  const [tab, setTab] = useState<TabId>('create');
  const me = sessionUser(sg.state);

  return (
    <>
      <Seo
        title="Create your free account · Snap Glow"
        description="Join Snap Glow — the web home for Snapchat users. Create flex cards, battle in vote-offs and climb the leaderboards."
        path="/signin"
        noindex
      />
      <PageHeader
        eyebrow="Join the community"
        title="Your Snap Glow account"
        sub="One account for cards, battles, votes and leaderboards — free forever."
      />

      {me ? (
        <div className="card-surface mx-auto max-w-lg rounded-card p-8 text-center">
          <Avatar name={me.displayName} hue={me.hue} size={72} ring />
          <p className="font-display mt-4 text-2xl font-extrabold text-ink">
            You&apos;re signed in as {me.displayName}
          </p>
          <p className="mt-1 text-sm font-bold text-ink-mute">@{me.username}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <CtaButton to="/dashboard">Go to dashboard</CtaButton>
            <GhostButton
              onClick={() => {
                sg.logout();
                toast('Logged out. See you soon!');
              }}
            >
              Log out
            </GhostButton>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-lg">
          <div className="mb-6">
            <Tabs<TabId>
              ariaLabel="Account options"
              tabs={[
                { id: 'create', label: 'Create account' },
                { id: 'login', label: 'Log in' },
              ]}
              active={tab}
              onChange={setTab}
            />
          </div>

          {tab === 'create' ? (
            <div className="card-surface rounded-card p-6 sm:p-8">
              <h2 className="font-display mb-2 flex items-center gap-2 text-2xl font-extrabold text-ink">
                <UserPlus size={22} aria-hidden="true" /> Create your account
              </h2>
              <p className="mb-6 text-ink-soft">
                Pick a display name and username, set a password, and you&apos;re in. Your account
                lives in this browser.
              </p>
              <CreateForm />
            </div>
          ) : (
            <div className="card-surface rounded-card p-6 sm:p-8">
              <h2 className="font-display mb-2 flex items-center gap-2 text-2xl font-extrabold text-ink">
                <LogIn size={22} aria-hidden="true" /> Welcome back
              </h2>
              <p className="mb-6 text-ink-soft">Log in with your Snap Glow username and password.</p>
              <LoginForm />
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-line bg-white p-4">
            <p className="flex items-start gap-2 text-sm font-semibold text-ink-soft">
              <KeyRound size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-brand-violet" />
              Your Snap Glow password is only for Snap Glow. Never enter your Snapchat password
              anywhere except Snapchat itself.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
