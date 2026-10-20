import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Seo } from '../components/Seo';
import { useSnapGlow, trendingCards, leaderboard, isBattleLive, getUser, getCard, sessionUser } from '../lib/store';
import { challengeForDay, POINTS } from '../lib/challenges';
import { formatCount } from '../lib/format';
import {
  Avatar,
  FlexCard,
  ShowcaseCard,
  CtaButton,
  SectionTitle,
  Countdown,
  EmptyState,
  LevelBadge,
  Reveal,
} from '../components/ui';
import {
  ArrowRight,
  CalendarHeart,
  ChevronLeft,
  ChevronRight,
  Flame,
  Heart,
  Palette,
  ShieldCheck,
  Sparkles,
  Swords,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';

/* ── Features — flat-color panels (art lives inside the frame) ── */
const FEATURES_LARGE = [
  {
    icon: Palette,
    title: 'Create Cards',
    body: 'Design a flex or streak card that shows your Snapchat vibe in seconds. Export it for your Story in one tap.',
    to: '/create',
    art: '/art/tpl-neon-flex.jpg',
    panel: 'bg-brand-sky text-ink',
    chip: 'bg-white',
  },
  {
    icon: Swords,
    title: 'Vote Battles',
    body: 'Pit two profiles head-to-head, share your vote link, and let the community decide the winner.',
    to: '/battles',
    art: '/art/tpl-champion.jpg',
    panel: 'bg-brand-violet text-white',
    chip: 'bg-sun text-ink',
  },
];

const FEATURES_SMALL = [
  { icon: Users, title: 'Share & Connect', body: 'Post to the feed and follow Snapchat creators you love.', tint: 'bg-blush' },
  { icon: Trophy, title: 'Top Rankings', body: 'Climb the leaderboards — top voters earn crowns too.', tint: 'bg-mint' },
];

/* Static hero showcase — always renders, never depends on store data.
   Generic titles only: no usernames, no like counts (product preview).
   Fanned −12°…+12°, center card largest. */
const FAN_CARDS = [
  { templateId: 'electric-bloom', title: 'Ocean Mood', rotate: '-rotate-12', shift: 'translate-y-8', z: 'z-0' },
  { templateId: 'neon-flex', title: 'Your Vibe', rotate: '-rotate-6', shift: 'translate-y-3', z: 'z-10' },
  { templateId: 'champion', title: 'Streak Star', rotate: 'rotate-0', shift: 'scale-110', z: 'z-20' },
  { templateId: 'pink-aura', title: 'Good Vibes', rotate: 'rotate-6', shift: 'translate-y-3', z: 'z-10' },
  { templateId: 'prism-pop', title: 'Prism Pop', rotate: 'rotate-12', shift: 'translate-y-8', z: 'z-0' },
];

const STEPS = [
  { n: '01', title: 'Design Your Card', body: 'Pick a template, add your vibe, and make it yours.', tint: 'bg-sun-tint', icon: Palette },
  { n: '02', title: 'Share It', body: 'Post to the feed and download it for your Snapchat Story.', tint: 'bg-blush', icon: Heart },
  { n: '03', title: 'Join Battles', body: 'Go head-to-head, share your vote link, and win.', tint: 'bg-cyantint', icon: Swords },
  { n: '04', title: 'Climb the Ranks', body: 'Earn Glow Points, reach the leaderboard, become a legend.', tint: 'bg-lav', icon: Trophy },
];

const TICKER_ITEMS = ['Flex Cards', 'Vote Battles', 'Streak Cards', 'Leaderboards', 'Hall of Fame'];

export default function Home() {
  const sg = useSnapGlow();
  const railRef = useRef<HTMLDivElement>(null);
  const me = sessionUser(sg.state);
  const trending = trendingCards(sg.state, 12);
  const topFive = leaderboard(sg.state, 'daily').slice(0, 5);
  const liveBattle = sg.state.battles.find((b) => isBattleLive(b));
  const battleCardA = liveBattle ? getCard(sg.state, liveBattle.cardAId) : undefined;
  const battleCardB = liveBattle ? getCard(sg.state, liveBattle.cardBId) : undefined;
  const challenge = challengeForDay();

  const scrollRail = (dir: 1 | -1) => {
    railRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  return (
    <>
      <Seo
        title="Snap Glow — the web home for Snapchat users"
        description="Create flex and streak cards for Snapchat, battle head-to-head in vote-offs, earn Glow Points and climb the leaderboards."
        path="/"
        noindex={false}
      />

      {/* ── HERO — centered mega type, card fan, marquee ─────── */}
      <section className="relative -mt-2 text-center" aria-label="Welcome to Snap Glow">
        {/* flat color accents behind the type */}
        <div className="halftone pointer-events-none absolute -top-4 right-[4%] hidden h-40 w-40 lg:block" aria-hidden="true" />
        <div className="halftone pointer-events-none absolute left-[2%] top-40 hidden h-28 w-28 lg:block" aria-hidden="true" />
        <span className="pointer-events-none absolute -left-10 top-24 hidden h-44 w-44 rounded-full bg-sun/50 lg:block" aria-hidden="true" />
        <span className="pointer-events-none absolute -right-12 top-56 hidden h-36 w-36 rounded-full bg-brand-pink/30 lg:block" aria-hidden="true" />

        <div className="sg-rise relative">
          <p className="sticker -rotate-2">
            <Sparkles size={13} aria-hidden="true" /> The web home for Snapchat users
          </p>
          <h1 className="hero-display mx-auto mt-7 max-w-5xl text-ink">
            Show your <span className="marker">vibe,</span>
            <br />
            get noticed.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-xl font-medium leading-relaxed text-ink-soft">
            Turn your Snapchat energy into scroll-stopping flex cards and streak cards.
            Battle head-to-head. Climb the ranks. Own the spotlight.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/create"
              className="btn-cta btn-xl inline-flex items-center gap-2 rounded-full font-grotesk font-bold"
            >
              Create Your Card <ArrowRight size={20} aria-hidden="true" />
            </Link>
            <Link
              to="/feed"
              className="btn-ghost inline-flex items-center gap-2 rounded-full px-7 py-4 font-grotesk text-lg font-bold"
            >
              <Users size={19} aria-hidden="true" /> Explore Community
            </Link>
          </div>
          <p className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 font-grotesk text-sm font-bold text-ink-soft">
            <span className="inline-flex items-center gap-1.5"><Zap size={14} className="text-brand-gold" aria-hidden="true" /> Free forever</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-brand-green" aria-hidden="true" /> No Snapchat password needed</span>
            <span className="inline-flex items-center gap-1.5"><Trophy size={14} className="text-brand-violet" aria-hidden="true" /> Made for Snapchatters</span>
          </p>
        </div>

        {/* the fan — 5 flex cards, rotated, overlapping */}
        <div className="relative mx-auto mt-14 max-w-4xl px-2" aria-hidden="true">
          <span className="sticker absolute -top-7 left-[2%] z-30 -rotate-6 bg-brand-pink text-white sm:left-[6%]">
            100% Free
          </span>
          <span className="sticker absolute -top-5 right-[1%] z-30 rotate-3 bg-brand-sky text-ink sm:right-[4%]">
            No password needed
          </span>
          <div className="flex items-start justify-center">
            {FAN_CARDS.map((c, i) => (
              <div
                key={c.templateId}
                className={`relative w-[19%] min-w-0 shrink-0 ${c.z} ${i > 0 ? '-ml-[3.5%]' : ''}`}
              >
                <div className={`${c.rotate} ${c.shift} transition duration-300 hover:rotate-0`}>
                  <ShowcaseCard templateId={c.templateId} title={c.title} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* marquee ticker */}
        <div className="bleed marquee mt-16 border-y-2 border-ink bg-sun py-3" aria-hidden="true">
          <div className="marquee-track">
            {[0, 1].map((half) => (
              <div key={half} className="flex shrink-0 items-center">
                {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                  <span key={`${half}-${i}`} className="flex items-center font-display text-sm font-bold uppercase text-ink sm:text-base">
                    <span className="px-5">{item}</span>
                    <span aria-hidden="true">✦</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Daily Challenge — sticker strip ──────────────────── */}
      <Reveal>
        <section className="mt-12 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-card border-2 border-ink bg-brand-violet p-5 shadow-lift sm:px-7">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-ink bg-sun text-ink shadow-pop" aria-hidden="true">
            <CalendarHeart size={22} />
          </span>
          <p className="min-w-0 flex-1">
            <span className="sticker mr-3 -rotate-2 bg-white !py-0.5 text-[0.65rem]">Daily Challenge</span>
            <span className="font-display text-lg font-bold text-white sm:text-xl">
              Today: {challenge.name}
            </span>
            <span className="ml-2 font-grotesk text-sm font-bold text-sunsoft">
              +{POINTS.challengeBonus} bonus Glow Points
            </span>
          </p>
          <Link
            to="/create"
            className="btn-cta inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 font-grotesk text-sm font-bold"
          >
            Take the challenge <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </section>
      </Reveal>

      {/* ── Features — flat-color panels ─────────────────────── */}
      <Reveal>
        <section className="mt-16">
          <SectionTitle title="Everything a Snapchatter needs" sub="Create, battle, and climb — all in one place." />
          <div className="grid gap-6 md:grid-cols-2">
            {FEATURES_LARGE.map((f) => (
              <Link
                key={f.title}
                to={f.to}
                className={`card-hover group block overflow-hidden rounded-card border-2 border-ink shadow-lift ${f.panel}`}
              >
                <span className="block border-b-2 border-ink">
                  <img src={f.art} alt="" aria-hidden="true" loading="lazy" className="h-48 w-full object-cover transition duration-500 group-hover:scale-[1.03] sm:h-56" />
                </span>
                <span className="block p-6 sm:p-7">
                  <span className={`mb-3 grid h-11 w-11 place-items-center rounded-xl border-2 border-ink shadow-pop ${f.chip}`} aria-hidden="true">
                    <f.icon size={20} />
                  </span>
                  <span className="font-display block text-[1.45rem] font-bold leading-snug">
                    {f.title}
                  </span>
                  <span className="mt-1.5 block max-w-md text-[0.95rem] font-medium leading-relaxed opacity-85">{f.body}</span>
                  <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-4 py-1.5 font-grotesk text-sm font-bold text-ink transition group-hover:bg-sun">
                    Try it <ArrowRight size={15} aria-hidden="true" className="transition group-hover:translate-x-1" />
                  </span>
                </span>
              </Link>
            ))}
            {FEATURES_SMALL.map((f) => (
              <div key={f.title} className={`card-hover relative overflow-hidden rounded-card border-2 border-ink p-6 shadow-lift sm:p-7 ${f.tint}`}>
                <span className="mb-3 grid h-11 w-11 place-items-center rounded-xl border-2 border-ink bg-white text-ink shadow-pop" aria-hidden="true">
                  <f.icon size={20} />
                </span>
                <h3 className="font-display text-[1.3rem] font-bold leading-snug text-ink">{f.title}</h3>
                <p className="mt-2 max-w-sm text-[0.95rem] font-medium leading-relaxed text-ink-soft">{f.body}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ── How it works — 4 flat-color cards ────────────────── */}
      <Reveal>
        <section className="mt-16 rounded-card border-2 border-ink bg-white p-6 shadow-lift sm:p-8">
          <SectionTitle title="How Snap Glow Works" sub="From a blank canvas to the top of the ranks — in four moves." />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className={`rounded-2xl border-2 border-ink p-5 ${s.tint}`}>
                <p className="font-display text-3xl font-extrabold text-ink/25" aria-hidden="true">{s.n}</p>
                <span className="mt-3 grid h-11 w-11 place-items-center rounded-xl border-2 border-ink bg-white text-ink shadow-pop" aria-hidden="true">
                  <s.icon size={20} />
                </span>
                <h3 className="font-display mt-3 text-[1.05rem] font-bold leading-snug text-ink">{s.title}</h3>
                <p className="mt-1.5 text-[0.95rem] font-medium text-ink-soft">{s.body}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ── Trending rail ────────────────────────────────────── */}
      <Reveal>
        <section className="mt-16">
          <div className="flex items-end justify-between gap-4">
            <div className="grow">
              <SectionTitle title="Trending Cards" sub="The most-loved flex cards on Snap Glow right now." linkTo="/trending" />
            </div>
            <div className="mb-5 hidden gap-2 sm:flex">
              <button
                type="button"
                onClick={() => scrollRail(-1)}
                aria-label="Scroll trending cards left"
                className="btn-ghost grid h-10 w-10 place-items-center rounded-full text-ink"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={() => scrollRail(1)}
                aria-label="Scroll trending cards right"
                className="btn-ghost grid h-10 w-10 place-items-center rounded-full text-ink"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          {trending.length === 0 ? (
            <EmptyState
              icon={Flame}
              title="No trending cards yet"
              body="Be the first to create a flex card and start a trend."
              action={<CtaButton to="/create">Create Your Card</CtaButton>}
            />
          ) : (
            <div ref={railRef} className="no-scrollbar -mx-1 flex snap-x gap-6 overflow-x-auto px-1 pb-3 pt-1">
              {trending.map((card) => {
                const owner = getUser(sg.state, card.ownerId);
                if (!owner) return null;
                return (
                  <Link
                    key={card.id}
                    to={`/cards/${card.id}`}
                    className="card-hover w-52 shrink-0 snap-start rounded-[1.5rem] sm:w-60"
                  >
                    <FlexCard card={card} owner={owner} />
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </Reveal>

      {/* ── Live battle preview — big VS split panel ─────────── */}
      {liveBattle && battleCardA && battleCardB && (
        <Reveal>
          <section className="mt-16 rounded-card border-2 border-ink bg-white p-6 shadow-lift sm:p-10">
            <SectionTitle title="Live Battle Now" sub="A head-to-head vote-off is happening right now." linkTo={`/battles/${liveBattle.id}`} linkLabel="Vote now" />
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center sm:gap-8">
              {[battleCardA, battleCardB].map((card, idx) => {
                const owner = getUser(sg.state, card.ownerId);
                if (!owner) return null;
                return (
                  <div key={card.id} className={`w-44 shrink-0 sm:w-52 ${idx === 1 ? 'sm:order-3' : ''}`}>
                    <FlexCard card={card} owner={owner} className="card-hover" />
                    <p className="mt-2.5 text-center font-grotesk text-sm font-bold text-ink">{owner.displayName}</p>
                  </div>
                );
              })}
              <div className="flex flex-col items-center gap-3 sm:order-2">
                <span className="grid h-20 w-20 place-items-center rounded-full border-2 border-ink bg-sun font-display text-lg font-bold text-ink shadow-lift" aria-hidden="true">
                  VS
                </span>
                <Countdown to={liveBattle.endsAt} />
              </div>
            </div>
            <div className="mt-7 text-center">
              <CtaButton to={`/battles/${liveBattle.id}`}>Watch &amp; Vote</CtaButton>
            </div>
          </section>
        </Reveal>
      )}

      {/* ── Leaderboard preview ──────────────────────────────── */}
      <Reveal>
        <section className="mt-16">
          <SectionTitle title="Today's Top Creators" sub="Leading the daily standings right now." linkTo="/leaderboards" />
          {topFive.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="No rankings yet"
              body="Create the first card and claim the top spot — it's wide open."
              action={<CtaButton to="/create">Create Your Card</CtaButton>}
            />
          ) : (
            <div className="card-surface divide-y-2 divide-ink/10 overflow-hidden rounded-card">
              {topFive.map((row, i) => (
                <Link
                  key={row.user.id}
                  to={`/u/${row.user.username}`}
                  className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-sun-tint"
                >
                  <span className={`font-display w-10 text-center text-xl font-bold ${i === 0 ? 'grad-text' : 'text-ink-mute'}`}>{i + 1}</span>
                  <Avatar name={row.user.displayName} hue={row.user.hue} size={44} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2 font-bold text-ink">
                      <span className="truncate">{row.user.displayName}</span>
                      <LevelBadge points={row.user.points} size="sm" />
                    </span>
                    <span className="text-sm font-medium text-ink-mute">
                      {formatCount(row.stats.likesReceived)} likes · {row.stats.wins} wins
                    </span>
                  </span>
                  <ChevronRight size={18} className="shrink-0 text-ink-mute" aria-hidden="true" />
                </Link>
              ))}
            </div>
          )}
        </section>
      </Reveal>

      {/* ── Final CTA — big yellow panel ─────────────────────── */}
      <Reveal>
        <section className="relative mt-16 overflow-hidden rounded-card border-2 border-ink bg-sun px-6 py-16 text-center shadow-hard-lg sm:px-12 sm:py-20">
          <div className="halftone pointer-events-none absolute right-6 top-6 h-28 w-28 opacity-70" aria-hidden="true" />
          <div className="halftone pointer-events-none absolute bottom-6 left-6 h-28 w-28 opacity-70" aria-hidden="true" />
          <p className="sticker relative mb-6 -rotate-2 bg-white">Join Snap Glow</p>
          <h2 className="hero-display relative mx-auto max-w-4xl text-ink" style={{ fontSize: 'clamp(2.4rem, 6vw, 5rem)' }}>
            {me ? (
              <>Ready to glow, {me.displayName.split(' ')[0]}?</>
            ) : (
              <>Ready to glow?</>
            )}
          </h2>
          <p className="relative mx-auto mt-5 max-w-xl text-lg font-semibold text-ink/75">
            Create your first flex card in under a minute, download it for your Snapchat Story, and
            put your vibe on the map.
          </p>
          <div className="relative mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/create"
              className="btn-violet btn-xl inline-flex items-center gap-2 rounded-full font-grotesk font-bold"
            >
              Create Your Card <ArrowRight size={20} aria-hidden="true" />
            </Link>
            <Link
              to="/battles"
              className="btn-ghost inline-flex items-center gap-2 rounded-full px-7 py-4 font-grotesk text-lg font-bold"
            >
              <Swords size={19} aria-hidden="true" /> Watch Battles
            </Link>
          </div>
        </section>
      </Reveal>
    </>
  );
}
