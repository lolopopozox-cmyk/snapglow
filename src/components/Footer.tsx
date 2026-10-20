import { Link } from 'react-router-dom';
import { Mail, RotateCcw } from 'lucide-react';
import { Logo } from './Logo';
import { api } from '../lib/store';
import { useToast } from './Toast';

const COLS: Array<{ title: string; links: Array<{ to: string; label: string }> }> = [
  {
    title: 'Explore',
    links: [
      { to: '/discover', label: 'Discover creators' },
      { to: '/feed', label: 'Community feed' },
      { to: '/trending', label: 'Trending cards' },
      { to: '/battles', label: 'Vote battles' },
    ],
  },
  {
    title: 'Community',
    links: [
      { to: '/leaderboards', label: 'Leaderboards' },
      { to: '/leaderboards/top-voters', label: 'Top Voters' },
      { to: '/hall-of-fame', label: 'Hall of Fame' },
      { to: '/guidelines', label: 'Community Guidelines' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { to: '/privacy', label: 'Privacy Policy' },
      { to: '/terms', label: 'Terms of Service' },
      { to: '/contact', label: 'Contact' },
      { to: '/admin', label: 'Admin / moderation setup' },
    ],
  },
];

export function Footer() {
  const { toast } = useToast();
  return (
    <footer className="mt-20 border-t-2 border-ink bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs font-medium leading-relaxed text-ink-soft">
            The web home for Snapchat users — flex cards, streak cards, vote battles and
            leaderboards. Show your vibe, get noticed.
          </p>
          <a
            href="mailto:snapglowofficial@gmail.com"
            className="btn-ghost mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-ink"
          >
            <Mail size={16} aria-hidden="true" /> snapglowofficial@gmail.com
          </a>
          <p className="mt-4 max-w-xs text-xs font-medium leading-relaxed text-ink-mute">
            Fan-made utility for Snapchat users. Not affiliated with, endorsed by, or sponsored by
            Snap Inc. Snap Glow never asks for your Snapchat password.
          </p>
        </div>
        {COLS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="font-grotesk text-sm font-bold uppercase tracking-[0.14em] text-ink">{col.title}</h2>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="font-medium text-ink-soft transition hover:text-brand-violet hover:underline hover:decoration-brand-violet/40 hover:underline-offset-4"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t-2 border-ink">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6">
          <p className="text-sm font-medium text-ink-mute">© 2026 Snap Glow · Made for Snapchat users</p>
          <button
            onClick={() => {
              if (window.confirm('Delete all local Snap Glow data (accounts, cards, posts, battles)? This cannot be undone.')) {
                api.resetAll();
                toast('All local data cleared.');
              }
            }}
            className="btn-ghost inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-ink-mute"
          >
            <RotateCcw size={15} aria-hidden="true" /> Reset local data
          </button>
        </div>
      </div>
    </footer>
  );
}
