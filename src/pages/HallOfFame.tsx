import { Link } from 'react-router-dom';
import { Crown, Medal, Sparkles, Trophy } from 'lucide-react';
import { leaderboard, useSnapGlow } from '../lib/store';
import { Seo } from '../components/Seo';
import { Avatar, CtaButton, EmptyState, PageHeader } from '../components/ui';
import { handle } from '../lib/format';

export default function HallOfFame() {
  const sg = useSnapGlow();
  const rows = leaderboard(sg.state, 'most-wins');
  const top3 = rows.slice(0, 3);
  const next3 = rows.slice(3, 6);
  // Classic podium order: 2nd left, 1st center (elevated), 3rd right.
  const podium = [top3[1], top3[0], top3[2]].filter(
    (r): r is (typeof rows)[number] => Boolean(r),
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Seo
        title="Hall of Fame · Snap Glow"
        description="Legendary Snap Glow creators, timeless flexes."
        path="/hall-of-fame"
      />

      <PageHeader eyebrow="Legends" title="Hall of Fame" sub="Legendary creators. Timeless flexes." />

      <p className="mb-8 flex flex-wrap items-center gap-2 text-sm font-semibold text-ink-mute">
      </p>

      {rows.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No legends yet"
          body="Nobody has won a battle yet. Start one and claim your place in history."
          action={<CtaButton to="/battles/new">Create Battle</CtaButton>}
        />
      ) : (
        <>
          <section aria-label="Top three creators of all time">
            <div className="grid grid-cols-3 items-end gap-2 sm:gap-6">
              {podium.map(({ user, stats }, i) => {
                const place = podium.length === 3 ? (i === 0 ? 2 : i === 1 ? 1 : 3) : i + 1;
                const first = place === 1;
                return (
                  <div
                    key={user.id}
                    className={`rounded-card border bg-white p-3 text-center shadow-soft sm:p-6 ${
                      first ? 'border-amber-300 ring-2 ring-amber-400' : 'border-line'
                    } ${first ? 'pt-8 sm:pt-12' : 'pt-4 sm:pt-6'}`}
                  >
                    <div className="mb-2 flex justify-center" aria-hidden="true">
                      {place === 1 ? (
                        <Crown size={30} className="text-amber-500" />
                      ) : (
                        <Medal size={26} className={place === 2 ? 'text-slate-400' : 'text-amber-700'} />
                      )}
                    </div>
                    <div className="mb-2 flex justify-center">
                      <Avatar name={user.displayName} hue={user.hue} size={first ? 84 : 64} ring={first} />
                    </div>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-ink-mute">#{place}</p>
                    <h2 className="mt-1 flex flex-wrap items-center justify-center gap-1.5 font-display text-lg font-extrabold text-ink sm:text-xl">
                      <Link to={`/u/${user.username}`} className="hover:text-brand-violet">
                        {user.displayName}
                      </Link>
                    </h2>
                    <p className="truncate text-xs font-semibold text-ink-mute sm:text-sm">{handle(user.username)}</p>
                    <p className="mt-2 font-display text-base font-extrabold text-ink sm:text-lg">
                      {stats.wins} {stats.wins === 1 ? 'battle win' : 'battle wins'}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {next3.length > 0 && (
            <section aria-label="Ranks four to six" className="mt-8">
              <div className="grid gap-4 sm:grid-cols-3">
                {next3.map(({ user, stats }, i) => (
                  <div key={user.id} className="card-surface flex items-center gap-3 rounded-card p-4">
                    <span className="grid w-8 shrink-0 place-items-center font-display text-xl font-extrabold text-ink-mute">
                      {i + 4}
                    </span>
                    <Avatar name={user.displayName} hue={user.hue} size={48} />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-1.5">
                        <Link to={`/u/${user.username}`} className="truncate font-display text-base font-bold text-ink hover:text-brand-violet">
                          {user.displayName}
                        </Link>
                      </p>
                      <p className="text-sm font-bold text-ink-mute">
                        {stats.wins} {stats.wins === 1 ? 'win' : 'wins'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <section className="mt-12 rounded-card border border-line border-2 border-ink bg-sun-tint p-8 text-center shadow-soft sm:p-12">
        <span className="mb-4 inline-grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-soft" aria-hidden="true">
          <Sparkles size={28} className="text-brand-violet" />
        </span>
        <h2 className="font-display text-3xl font-extrabold text-ink">Think you can join the legends?</h2>
        <p className="mx-auto mt-2 max-w-lg font-semibold text-ink-soft">
          Design a flex card, battle head-to-head, and climb your way into the Hall of Fame.
        </p>
        <div className="mt-6">
          <CtaButton to="/create">Create your card</CtaButton>
        </div>
      </section>
    </div>
  );
}
