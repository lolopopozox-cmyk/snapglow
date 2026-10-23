import { Link, useLocation } from 'react-router-dom';
import { Home as HomeIcon, Compass, PlusCircle, Swords, User } from 'lucide-react';
import { sessionUser, useSnapGlow } from '../lib/store';

/**
 * Deliberate mobile navigation: a fixed bottom tab bar (Home, Discover,
 * Create, Battles, Profile). Shown below the `lg` breakpoint only — the
 * desktop header stays unchanged.
 */
export function MobileTabBar() {
  const sg = useSnapGlow();
  const me = sessionUser(sg.state);
  const { pathname } = useLocation();

  const tabs = [
    { to: '/', label: 'Home', icon: HomeIcon, exact: true },
    { to: '/discover', label: 'Discover', icon: Compass },
    { to: '/create', label: 'Create', icon: PlusCircle },
    { to: '/battles', label: 'Battles', icon: Swords },
    me
      ? { to: `/u/${me.username}`, label: 'Profile', icon: User }
      : { to: '/signin', label: 'Sign in', icon: User },
  ];

  const active = (tab: { to: string; exact?: boolean }) =>
    tab.exact ? pathname === tab.to : pathname.startsWith(tab.to);

  return (
    <nav
      aria-label="Mobile primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-white/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const on = active(tab);
          return (
            <li key={tab.to} className="flex-1">
              <Link
                to={tab.to}
                aria-current={on ? 'page' : undefined}
                className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 text-[11px] font-extrabold transition ${
                  on ? 'text-ink' : 'text-ink-mute'
                }`}
              >
                <span
                  className={`grid h-8 w-8 place-items-center rounded-full border-2 transition ${
                    on ? 'border-ink bg-sun shadow-pop' : 'border-transparent'
                  }`}
                >
                  <Icon size={17} aria-hidden="true" />
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
