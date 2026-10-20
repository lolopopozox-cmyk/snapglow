import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ChevronDown, LogOut, Menu, Plus, Search, User, X } from 'lucide-react';
import { Logo } from './Logo';
import { getNotifications, sessionUser, useSnapGlow } from '../lib/store';
import { Avatar } from './ui';
import { useToast } from './Toast';

const NAV = [
  { to: '/discover', label: 'Discover' },
  { to: '/feed', label: 'Feed' },
  { to: '/battles', label: 'Battles' },
  { to: '/leaderboards', label: 'Leaderboards' },
];

const MORE_LINKS = [
  { to: '/hall-of-fame', label: 'Hall of Fame' },
  { to: '/trending', label: 'Trending cards' },
  { to: '/contact', label: 'Contact' },
  { to: '/guidelines', label: 'Community Guidelines' },
];

function useDismiss(onDismiss: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onDismiss();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [onDismiss]);
  return ref;
}

/**
 * Header bar v7 "Snap Pop": flat white bar with a 2px ink bottom border
 * (see .nav-bar), yellow-tile logo, bold Space Grotesk nav, "More"
 * dropdown, real search input, live notification bell, flat-yellow
 * Create Card button with hard shadow, account menu. Light surfaces only.
 */
export function Header() {
  const sg = useSnapGlow();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [query, setQuery] = useState('');

  const me = sessionUser(sg.state);
  const { list: notifications, unread } = me
    ? getNotifications(sg.state, me.id)
    : { list: [], unread: 0 };

  const moreRef = useDismiss(() => setMoreOpen(false));
  const bellRef = useDismiss(() => setBellOpen(false));
  const userRef = useDismiss(() => setUserOpen(false));

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `rounded-full border-2 px-3.5 py-1.5 font-grotesk text-[0.95rem] font-bold transition ${
      isActive
        ? 'border-ink bg-sun text-ink shadow-pop'
        : 'border-transparent text-ink-soft hover:border-ink hover:bg-sun-tint hover:text-ink'
    }`;

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  };

  const logout = () => {
    sg.logout();
    setUserOpen(false);
    toast('Logged out. See you soon!');
    navigate('/');
  };

  return (
    <header className="nav-bar sticky top-0 z-[60]">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:gap-2.5 sm:px-6">
        <Logo />
        <nav className="ml-1 hidden items-center gap-0.5 lg:flex" aria-label="Primary">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={linkCls}>
              {n.label}
            </NavLink>
          ))}
          <div className="relative" ref={moreRef}>
            <button
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              aria-haspopup="true"
              className={`inline-flex items-center gap-1 rounded-full border-2 px-3.5 py-1.5 font-grotesk text-[0.95rem] font-bold transition ${
                moreOpen ? 'border-ink bg-sun text-ink shadow-pop' : 'border-transparent text-ink-soft hover:border-ink hover:bg-sun-tint hover:text-ink'
              }`}
            >
              More <ChevronDown size={15} aria-hidden="true" className={`transition ${moreOpen ? 'rotate-180' : ''}`} />
            </button>
            {moreOpen && (
              <div className="card-surface absolute left-0 top-full mt-2 w-56 rounded-2xl p-2">
                {MORE_LINKS.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setMoreOpen(false)}
                    className="block rounded-xl px-4 py-2.5 font-semibold text-ink-soft transition hover:bg-sky hover:text-ink"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <form
            onSubmit={submitSearch}
            role="search"
            className="hidden min-w-0 flex-1 items-center md:flex"
            style={{ maxWidth: '15rem' }}
          >
            <label htmlFor="header-search" className="sr-only">
              Search Snap Glow
            </label>
            <div className="relative w-full">
              <Search
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute"
              />
              <input
                id="header-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search vibes, creators, or topics…"
                className="w-full rounded-full border-2 border-ink bg-white py-1.5 pl-10 pr-4 text-sm font-semibold text-ink placeholder:text-ink-mute focus:outline-none focus:ring-2 focus:ring-brand-violet/50"
              />
            </div>
          </form>
          <button
            onClick={() => navigate('/search')}
            aria-label="Search Snap Glow"
            className="btn-ghost grid h-9 w-9 place-items-center rounded-full text-ink-soft md:hidden"
          >
            <Search size={18} />
          </button>

          <div className="relative" ref={bellRef}>
            <button
              onClick={() => (me ? setBellOpen((v) => !v) : navigate('/signin'))}
              aria-expanded={bellOpen}
              aria-haspopup="true"
              aria-label={me ? `Notifications${unread ? `, ${unread} unread` : ''}` : 'Sign in to see notifications'}
              className="btn-ghost relative grid h-9 w-9 place-items-center rounded-full text-ink-soft"
            >
              <Bell size={18} />
              {me && unread > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand-coral px-1 text-[0.65rem] font-extrabold text-white ring-2 ring-white"
                >
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
            {bellOpen && me && (
              <div className="card-surface absolute right-0 top-full mt-2 max-h-[70vh] w-80 overflow-y-auto rounded-2xl p-2">
                <div className="flex items-center justify-between px-3 pb-1 pt-2">
                  <p className="text-sm font-extrabold text-ink">Notifications</p>
                  {unread > 0 && (
                    <button
                      onClick={() => sg.markAllNotificationsRead()}
                      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold text-brand-violet hover:bg-lav"
                    >
                      <CheckCheck size={13} aria-hidden="true" /> Mark all read
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm font-semibold text-ink-mute">
                    All caught up. When your cards get likes, your battles near their end, or a new
                    daily challenge drops, you&apos;ll see it here.
                  </p>
                ) : (
                  notifications.map((n) => {
                    const body = (
                      <>
                        <p className={`text-sm font-bold leading-snug ${n.read ? 'text-ink-soft' : 'text-ink'}`}>
                          {!n.read && <span aria-hidden="true" className="mr-1.5 inline-block h-2 w-2 rounded-full bg-brand-violet" />}
                          {n.text}
                        </p>
                        <p className="mt-0.5 text-xs font-semibold text-ink-mute">{n.meta}</p>
                      </>
                    );
                    return n.link ? (
                      <Link
                        key={n.id}
                        to={n.link}
                        onClick={() => setBellOpen(false)}
                        className="block rounded-xl px-3 py-2.5 transition hover:bg-sky/60"
                      >
                        {body}
                      </Link>
                    ) : (
                      <div key={n.id} className="rounded-xl px-3 py-2.5">
                        {body}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <Link
            to="/create"
            className="btn-cta hidden items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold sm:inline-flex"
          >
            <Plus size={16} aria-hidden="true" strokeWidth={2.6} /> Create Card
          </Link>

          {me ? (
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setUserOpen((v) => !v)}
                aria-expanded={userOpen}
                aria-haspopup="true"
                aria-label={`${me.displayName}'s account menu`}
                className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border-2 border-ink bg-white shadow-pop"
              >
                <Avatar name={me.displayName} hue={me.hue} size={36} />
              </button>
              {userOpen && (
                <div className="card-surface absolute right-0 top-full mt-2 w-60 rounded-2xl p-2">
                  <div className="px-3 pb-1 pt-2">
                    <p className="truncate font-display text-base font-bold text-ink">{me.displayName}</p>
                    <p className="truncate text-xs font-semibold text-ink-mute">@{me.username} · {me.points.toLocaleString()} pts</p>
                  </div>
                  <Link
                    to={`/u/${me.username}`}
                    onClick={() => setUserOpen(false)}
                    className="block rounded-xl px-4 py-2.5 font-semibold text-ink-soft transition hover:bg-sky hover:text-ink"
                  >
                    My profile
                  </Link>
                  <Link
                    to="/dashboard"
                    onClick={() => setUserOpen(false)}
                    className="block rounded-xl px-4 py-2.5 font-semibold text-ink-soft transition hover:bg-sky hover:text-ink"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-ink-soft transition hover:bg-blush hover:text-brand-pink"
                  >
                    <LogOut size={15} aria-hidden="true" /> Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/signin"
              aria-label="Sign in or create an account"
              className="btn-ghost grid h-9 w-9 place-items-center rounded-full text-ink-soft"
            >
              <User size={17} />
            </Link>
          )}
          <button
            className="btn-ghost grid h-9 w-9 place-items-center rounded-full text-ink lg:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav className="border-t-2 border-ink bg-white px-4 py-3 lg:hidden" aria-label="Mobile">
          <ul className="mx-auto flex max-w-7xl flex-col gap-1">
            {[...NAV, ...MORE_LINKS].map((n) => (
              <li key={n.to}>
                <NavLink to={n.to} className={linkCls} onClick={() => setMenuOpen(false)}>
                  {n.label}
                </NavLink>
              </li>
            ))}
            <li>
              <Link
                to="/create"
                onClick={() => setMenuOpen(false)}
                className="btn-cta mt-2 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold"
              >
                <Plus size={18} aria-hidden="true" strokeWidth={2.6} /> Create Card
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
