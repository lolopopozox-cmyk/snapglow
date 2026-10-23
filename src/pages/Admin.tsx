import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  BadgeCheck,
  Flag,
  Gauge,
  Lock,
  Search as SearchIcon,
  Settings,
  ShieldCheck,
  Trash2,
  UserX,
} from 'lucide-react';
import { sessionUser, useSnapGlow } from '../lib/store';
import { supabase } from '../lib/supabase';
import type { Report } from '../lib/types';
import { Seo } from '../components/Seo';
import { Avatar, CtaButton, EmptyState, PageHeader, Stat, Tabs } from '../components/ui';
import { useToast } from '../components/Toast';
import { handle, timeAgo, formatCount } from '../lib/format';

/* ────────────────────────────────────────────────────────────────
   Admin access model: there is NO admin signup. Rights are granted
   by inserting the account into the `admins` table (database-level,
   enforced by RLS on every admin operation). This page only renders
   what the database already authorizes.
   ──────────────────────────────────────────────────────────────── */

export function AdminLogin() {
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <Seo title="Operations Login · Snap Glow" description="Snap Glow staff access." path="/admin/login" noindex />
      <div className="card-surface rounded-card border-2 border-ink p-8 text-center shadow-lift">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl border-2 border-ink bg-ink text-sun shadow-pop" aria-hidden="true">
          <Lock size={26} />
        </span>
        <h1 className="font-display mt-5 text-3xl font-extrabold text-ink">Snap Glow Operations</h1>
        <p className="mt-2 text-sm font-semibold text-ink-soft">
          Restricted area. Administrator rights live in the database — there is no public admin
          signup, and this form grants nothing by itself.
        </p>
        <div className="mt-6 space-y-3">
          <CtaButton to="/admin" className="w-full">
            <ShieldCheck size={18} aria-hidden="true" /> Continue to dashboard
          </CtaButton>
          <p className="text-xs font-semibold text-ink-mute">
            Sign in first with your regular Snap Glow account — the dashboard checks the admins
            table server-side.
          </p>
          <Link to="/" className="text-sm font-extrabold text-ink-mute hover:text-brand-violet">
            ← Back to Snap Glow
          </Link>
        </div>
      </div>
    </div>
  );
}

type AdminTab = 'overview' | 'reports' | 'users' | 'battles' | 'config';

const ADMIN_TABS: Array<{ id: AdminTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'reports', label: 'Reports' },
  { id: 'users', label: 'Users' },
  { id: 'battles', label: 'Battles' },
  { id: 'config', label: 'Config' },
];

export default function AdminDashboard() {
  const sg = useSnapGlow();
  const { toast } = useToast();
  const me = sessionUser(sg.state);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<AdminTab>('overview');
  const [reports, setReports] = useState<Report[]>([]);
  const [query, setQuery] = useState('');
  const [pointsJson, setPointsJson] = useState(
    JSON.stringify({ card: 10, challenge: 15, comment: 3, vote: 2, battleCreate: 5, battleWin: 25, dailyLogin: 5, follow: 2, profileLike: 2, like: 1 }, null, 2),
  );
  const [levelsJson, setLevelsJson] = useState(
    JSON.stringify([
      { name: 'Rising Star', minPoints: 0 },
      { name: 'Hot Creator', minPoints: 100 },
      { name: 'Superstar', minPoints: 300 },
      { name: 'Legend', minPoints: 750 },
    ], null, 2),
  );

  useEffect(() => {
    if (!me) return;
    let done = false;
    (async () => {
      if (!supabase) return;
      const { data } = await supabase.from('admins').select('user_id').eq('user_id', me.id);
      if (done) return;
      const admin = (data ?? []).length > 0;
      setIsAdmin(admin);
      if (admin) {
        const reps = await sg.adminListReports();
        if (!done) setReports(reps);
      }
    })();
    return () => {
      done = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id]);

  const act = async (fn: () => Promise<{ ok: boolean; message: string }>, audit?: string, target?: string) => {
    const res = await fn();
    toast(res.message);
    if (res.ok) {
      if (audit) void sg.adminAudit(audit, target ?? '');
      void sg.refresh();
      if (tab === 'reports') setReports(await sg.adminListReports());
    }
    return res;
  };

  const users = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...sg.state.users];
    return q
      ? list.filter((u) => u.displayName.toLowerCase().includes(q) || u.username.includes(q))
      : list;
  }, [sg.state.users, query]);

  if (!me) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <Seo title="Admin · Snap Glow" description="Staff area." path="/admin" noindex />
        <EmptyState
          icon={Lock}
          title="Sign in required"
          body="Sign in with your Snap Glow staff account to open the operations dashboard."
          action={<CtaButton to="/admin/login">Go to staff login</CtaButton>}
        />
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <Seo title="Admin · Snap Glow" description="Staff area." path="/admin" noindex />
        <EmptyState
          icon={UserX}
          title="Access denied"
          body="This account is not an administrator. Admin rights are granted in the database only — never through the website."
          action={<CtaButton to="/">Back to Snap Glow</CtaButton>}
        />
      </div>
    );
  }

  const openReports = reports.filter((r) => r.status === 'open').length;
  const liveBattles = sg.state.battles.filter((b) => b.status === 'live').length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Seo title="Operations Dashboard · Snap Glow" description="Staff area." path="/admin" noindex />
      <PageHeader eyebrow="Staff only" title="Operations Dashboard" sub="Moderation, community management and platform configuration." />

      {isAdmin === null && <p className="text-sm font-bold text-ink-mute">Checking authorization…</p>}

      {isAdmin === true && (
        <>
          <div className="mt-6">
            <Tabs tabs={ADMIN_TABS} active={tab} onChange={setTab} ariaLabel="Admin sections" />
          </div>

          {tab === 'overview' && (
            <section className="mt-6 space-y-6" aria-label="Platform overview">
              <div className="card-surface grid grid-cols-2 gap-4 rounded-card px-4 py-5 sm:grid-cols-5">
                <Stat label="Creators" value={formatCount(sg.state.users.length)} />
                <Stat label="Cards" value={formatCount(sg.state.cards.length)} />
                <Stat label="Posts" value={formatCount(sg.state.posts.length)} />
                <Stat label="Live battles" value={liveBattles} />
                <Stat label="Open reports" value={openReports} />
              </div>
              <div className="card-surface rounded-card p-5">
                <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-ink">
                  <Gauge size={18} aria-hidden="true" /> Platform health
                </h2>
                <ul className="mt-3 space-y-2 text-sm font-semibold text-ink-soft">
                  <li>✅ Row Level Security enforced on all tables (Supabase Postgres)</li>
                  <li>✅ Votes validated server-side (one per account, no votes after end)</li>
                  <li>✅ Points awarded by database triggers only — clients cannot self-award</li>
                  <li>✅ Admin actions audited in the audit_log table</li>
                  <li>✅ No admin signup exists; rights granted only via the database</li>
                </ul>
              </div>
            </section>
          )}

          {tab === 'reports' && (
            <section className="mt-6" aria-label="Moderation reports">
              {reports.length === 0 ? (
                <EmptyState icon={Flag} title="No reports" body="The moderation queue is empty. Reports filed by users appear here." />
              ) : (
                <ul className="space-y-4">
                  {reports.map((r) => (
                    <li key={r.id} className="card-surface rounded-card p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-display text-base font-extrabold text-ink">
                          {r.targetType} · {r.reason}
                        </p>
                        <span className={`rounded-full border-2 border-ink px-3 py-1 text-xs font-extrabold ${r.status === 'open' ? 'bg-sun text-ink' : r.status === 'actioned' ? 'bg-mint text-ink' : 'bg-white text-ink-mute'}`}>
                          {r.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-ink-soft">{r.details || '—'}</p>
                      <p className="mt-1 text-xs font-semibold text-ink-mute">
                        target: {r.targetId} · {timeAgo(r.createdAt)}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void act(() => sg.adminSetReportStatus(r.id, 'dismissed'), 'report-dismiss', r.id)}
                          className="min-h-[40px] rounded-full border border-line bg-white px-4 py-1.5 text-xs font-extrabold text-ink-soft hover:border-brand-cyan"
                        >
                          Dismiss
                        </button>
                        <button
                          type="button"
                          onClick={() => void act(() => sg.adminSetReportStatus(r.id, 'reviewed'), 'report-review', r.id)}
                          className="min-h-[40px] rounded-full border border-line bg-white px-4 py-1.5 text-xs font-extrabold text-ink-soft hover:border-brand-cyan"
                        >
                          Mark reviewed
                        </button>
                        {r.targetType === 'card' && (
                          <button
                            type="button"
                            onClick={() => {
                              if (!window.confirm('Delete this card?')) return;
                              void act(async () => {
                                const res = await sg.adminDeleteCard(r.targetId);
                                if (res.ok) await sg.adminSetReportStatus(r.id, 'actioned');
                                return res;
                              }, 'card-delete', r.targetId);
                            }}
                            className="min-h-[40px] rounded-full border-2 border-ink bg-blush px-4 py-1.5 text-xs font-extrabold text-brand-pink"
                          >
                            <Trash2 size={12} className="mr-1 inline" aria-hidden="true" /> Delete card
                          </button>
                        )}
                        {r.targetType === 'post' && (
                          <button
                            type="button"
                            onClick={() => {
                              if (!window.confirm('Delete this post?')) return;
                              void act(async () => {
                                const res = await sg.adminDeletePost(r.targetId);
                                if (res.ok) await sg.adminSetReportStatus(r.id, 'actioned');
                                return res;
                              }, 'post-delete', r.targetId);
                            }}
                            className="min-h-[40px] rounded-full border-2 border-ink bg-blush px-4 py-1.5 text-xs font-extrabold text-brand-pink"
                          >
                            <Trash2 size={12} className="mr-1 inline" aria-hidden="true" /> Delete post
                          </button>
                        )}
                        {r.targetType === 'battle' && (
                          <button
                            type="button"
                            onClick={() => {
                              if (!window.confirm('Delete this battle?')) return;
                              void act(async () => {
                                const res = await sg.adminDeleteBattle(r.targetId);
                                if (res.ok) await sg.adminSetReportStatus(r.id, 'actioned');
                                return res;
                              }, 'battle-delete', r.targetId);
                            }}
                            className="min-h-[40px] rounded-full border-2 border-ink bg-blush px-4 py-1.5 text-xs font-extrabold text-brand-pink"
                          >
                            <Trash2 size={12} className="mr-1 inline" aria-hidden="true" /> Delete battle
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {tab === 'users' && (
            <section className="mt-6" aria-label="User management">
              <div className="mb-4 flex items-center gap-2">
                <SearchIcon size={16} aria-hidden="true" className="text-ink-mute" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or username…"
                  aria-label="Search users"
                  className="min-h-[44px] w-full max-w-sm rounded-full border-2 border-ink bg-white px-4 text-sm font-semibold text-ink"
                />
              </div>
              <ul className="space-y-3">
                {users.map((u) => {
                  const featured = sg.state.featured.includes(u.id);
                  return (
                    <li key={u.id} className="card-surface flex flex-wrap items-center gap-3 rounded-card p-4">
                      <Avatar name={u.displayName} hue={u.hue} src={u.avatar} emoji={u.avatarEmoji} size={44} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-base font-extrabold text-ink">
                          {u.displayName}{' '}
                          {u.isDemo && <span className="rounded-full bg-lav px-2 py-0.5 text-[10px] font-extrabold text-brand-violet">DEMO</span>}
                          {u.isSuspended && <span className="ml-1 rounded-full bg-blush px-2 py-0.5 text-[10px] font-extrabold text-brand-pink">SUSPENDED</span>}
                        </p>
                        <p className="text-xs font-semibold text-ink-mute">
                          {handle(u.username)} · {u.points} pts · {sg.state.cards.filter((c) => c.ownerId === u.id).length} cards
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {featured ? (
                          <button type="button" onClick={() => void act(() => sg.adminUnfeature(u.id), 'unfeature', u.id)} className="min-h-[40px] rounded-full border border-line bg-white px-3 py-1.5 text-xs font-extrabold text-ink-soft">
                            Unfeature
                          </button>
                        ) : (
                          <button type="button" onClick={() => void act(() => sg.adminFeature(u.id), 'feature', u.id)} className="min-h-[40px] rounded-full border border-line bg-white px-3 py-1.5 text-xs font-extrabold text-ink-soft hover:border-brand-cyan">
                            <BadgeCheck size={12} className="mr-1 inline" aria-hidden="true" /> Feature
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => void act(() => sg.adminSetSuspended(u.id, !u.isSuspended), 'suspend', u.id)}
                          className={`min-h-[40px] rounded-full border-2 border-ink px-3 py-1.5 text-xs font-extrabold ${u.isSuspended ? 'bg-mint text-ink' : 'bg-blush text-brand-pink'}`}
                        >
                          {u.isSuspended ? 'Restore' : 'Suspend'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void act(() => sg.adminSetDemo(u.id, !u.isDemo), 'demo-flag', u.id)}
                          className="min-h-[40px] rounded-full border border-line bg-white px-3 py-1.5 text-xs font-extrabold text-ink-soft"
                        >
                          {u.isDemo ? 'Clear demo' : 'Mark demo'}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {tab === 'battles' && (
            <section className="mt-6" aria-label="Battle management">
              {sg.state.battles.length === 0 ? (
                <EmptyState icon={Activity} title="No battles" body="No battles exist yet." />
              ) : (
                <ul className="space-y-3">
                  {sg.state.battles.map((b) => {
                    const tally = sg.state.tallies[b.id];
                    return (
                      <li key={b.id} className="card-surface flex flex-wrap items-center gap-3 rounded-card p-4">
                        <div className="min-w-0 flex-1">
                          <Link to={`/battles/${b.id}`} className="truncate font-display text-base font-extrabold text-ink hover:text-brand-violet">
                            {b.title}
                          </Link>
                          <p className="text-xs font-semibold text-ink-mute">
                            {b.status} · {tally ? tally.a + tally.b : 0} votes · {timeAgo(b.createdAt)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (!window.confirm('Delete this battle?')) return;
                            void act(() => sg.adminDeleteBattle(b.id), 'battle-delete', b.id);
                          }}
                          className="min-h-[40px] rounded-full border-2 border-ink bg-blush px-3 py-1.5 text-xs font-extrabold text-brand-pink"
                        >
                          <Trash2 size={12} className="mr-1 inline" aria-hidden="true" /> Delete
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}

          {tab === 'config' && (
            <section className="mt-6 grid gap-6 md:grid-cols-2" aria-label="Platform configuration">
              <div className="card-surface rounded-card p-5">
                <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-ink">
                  <Settings size={17} aria-hidden="true" /> Points rules
                </h2>
                <p className="mt-1 text-xs font-semibold text-ink-mute">Server triggers read these values when awarding Glow Points.</p>
                <textarea
                  value={pointsJson}
                  onChange={(e) => setPointsJson(e.target.value)}
                  aria-label="Points rules JSON"
                  className="mt-3 h-56 w-full rounded-2xl border-2 border-ink bg-white p-3 font-mono text-xs text-ink"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => {
                    try {
                      void act(() => sg.adminSetConfig('points_rules', JSON.parse(pointsJson)), 'config-points', 'points_rules');
                    } catch {
                      toast('Invalid JSON — fix the syntax first.');
                    }
                  }}
                  className="btn-cta mt-3 rounded-full px-5 py-2.5 font-display text-sm font-bold"
                >
                  Save points rules
                </button>
              </div>
              <div className="card-surface rounded-card p-5">
                <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-ink">
                  <Settings size={17} aria-hidden="true" /> Level thresholds
                </h2>
                <p className="mt-1 text-xs font-semibold text-ink-mute">The Glow level ladder (name + minimum points). Unlock gates read these values.</p>
                <textarea
                  value={levelsJson}
                  onChange={(e) => setLevelsJson(e.target.value)}
                  aria-label="Level thresholds JSON"
                  className="mt-3 h-56 w-full rounded-2xl border-2 border-ink bg-white p-3 font-mono text-xs text-ink"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => {
                    try {
                      void act(() => sg.adminSetConfig('level_thresholds', JSON.parse(levelsJson)), 'config-levels', 'level_thresholds');
                    } catch {
                      toast('Invalid JSON — fix the syntax first.');
                    }
                  }}
                  className="btn-cta mt-3 rounded-full px-5 py-2.5 font-display text-sm font-bold"
                >
                  Save thresholds
                </button>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
