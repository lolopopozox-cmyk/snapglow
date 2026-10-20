import { BookOpen, ClipboardList, LayoutDashboard, ShieldAlert } from 'lucide-react';
import { Seo } from '../components/Seo';
import { GhostButton, PageHeader } from '../components/ui';

const MISSING = [
  'A Supabase project (database + auth) to replace browser-local storage',
  'An `admins` table mapping user ids to moderator roles',
  'Row-Level Security (RLS) policies that lock admin tables down',
  'Server-side role checks on every privileged action — never frontend flags',
  'An audit log table recording who did what, and when',
];

const SETUP_STEPS = [
  'Create a Supabase project for Snap Glow.',
  'Run the SQL in docs/BACKEND_SETUP.md to create the admins, reports and audit tables.',
  'Add your user id to the admins table.',
  'Deploy the edge function that finalizes battles when their countdown ends.',
  'Never expose the service-role key in the browser — it stays server-side only.',
];

const PANEL_FEATURES = [
  'Live metrics: users, cards, posts, battles and votes',
  'Report queue with actions (dismiss / remove / warn) and the original reasons',
  'Full audit log of every moderation action',
  'Confirm-before-delete on every destructive action',
];

export default function Admin() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Seo
        title="Admin / Moderation Setup · Snap Glow"
        description="How to set up secure admin access for Snap Glow."
        path="/admin"
        noindex
      />

      <PageHeader
        eyebrow="Restricted"
        title="Admin / Moderation — setup required"
        sub="There is no moderator panel yet — here's the honest, secure path to one."
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-mint px-4 py-2 text-sm font-extrabold text-ink">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
          Storage: this browser (local accounts)
        </span>
      </PageHeader>

      <div className="card-surface mb-8 flex items-start gap-4 rounded-card border-l-4 border-l-brand-cyan p-5 sm:p-6">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyantint text-brand-cyan" aria-hidden="true">
          <ShieldAlert size={26} />
        </span>
        <div>
          <h2 className="font-display text-xl font-extrabold text-ink">No admin panel in this build — by design</h2>
          <p className="mt-1 font-semibold leading-relaxed text-ink-soft">
            There is no admin panel in this build — and that&apos;s intentional. A fake &ldquo;protected&rdquo;
            panel would be a security lie: anything checked only in the browser can be bypassed. Real moderation
            needs a real backend with server-side role checks.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <section className="card-surface rounded-card p-6" aria-labelledby="missing-heading">
          <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-blush text-brand-pink" aria-hidden="true">
            <ShieldAlert size={24} />
          </span>
          <h2 id="missing-heading" className="mb-3 font-display text-xl font-extrabold text-ink">
            What&apos;s missing
          </h2>
          <ul className="list-disc space-y-2 pl-5 font-semibold text-ink-soft">
            {MISSING.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="card-surface rounded-card p-6" aria-labelledby="steps-heading">
          <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-mint text-brand-green" aria-hidden="true">
            <ClipboardList size={24} />
          </span>
          <h2 id="steps-heading" className="mb-3 font-display text-xl font-extrabold text-ink">
            Setup steps
          </h2>
          <ol className="list-decimal space-y-2 pl-5 font-semibold text-ink-soft">
            {SETUP_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section className="card-surface rounded-card p-6" aria-labelledby="panel-heading">
          <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-lav text-brand-violet" aria-hidden="true">
            <LayoutDashboard size={24} />
          </span>
          <h2 id="panel-heading" className="mb-3 font-display text-xl font-extrabold text-ink">
            What the real panel includes
          </h2>
          <ul className="list-disc space-y-2 pl-5 font-semibold text-ink-soft">
            {PANEL_FEATURES.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card-surface mt-6 flex flex-wrap items-center gap-4 rounded-card p-6" aria-labelledby="docs-heading">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyantint text-brand-cyan" aria-hidden="true">
          <BookOpen size={24} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="docs-heading" className="font-display text-xl font-extrabold text-ink">
            Project docs
          </h2>
          <p className="font-semibold text-ink-soft">
            Read <code className="rounded-lg bg-lav px-2 py-0.5 font-mono text-sm font-bold text-ink">docs/BACKEND_SETUP.md</code> in
            the project for the full secure setup guide, SQL and edge-function plan.
          </p>
        </div>
        <GhostButton to="/contact">Ask about setup</GhostButton>
      </section>
    </div>
  );
}
