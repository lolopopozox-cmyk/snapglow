import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Seo } from '../components/Seo';
import { CtaButton, GhostButton } from '../components/ui';
import { Search, Compass } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <>
      <Seo
        title="Page not found · Snap Glow"
        description="This page drifted off the map. Head back home or search Snap Glow."
        path="/404"
        noindex={true}
      />
      <div className="mx-auto max-w-xl py-10 text-center sm:py-16">
        <p aria-hidden="true" className="grad-text font-display text-8xl font-extrabold sm:text-9xl">
          404
        </p>
        <h1 className="font-display mt-4 text-3xl font-extrabold tracking-tight text-ink">
          This page drifted off the map.
        </h1>
        <p className="mx-auto mt-2 max-w-md text-lg text-ink-soft">
          The link you followed doesn't exist — but there's plenty of glow left to find.
        </p>

        <form onSubmit={submitSearch} className="mx-auto mt-8 flex max-w-md gap-3" role="search">
          <label htmlFor="notfound-search" className="sr-only">
            Search Snap Glow
          </label>
          <input
            id="notfound-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search creators, cards, posts…"
            className="w-full rounded-2xl border-2 border-line bg-white px-4 py-3 text-base font-semibold text-ink placeholder:text-ink-mute/70 focus:border-brand-cyan focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Search"
            className="btn-cta grid h-12 w-12 shrink-0 place-items-center rounded-2xl"
          >
            <Search size={20} aria-hidden="true" />
          </button>
        </form>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <CtaButton to="/">Back home</CtaButton>
          <GhostButton to="/discover">
            <Compass size={18} aria-hidden="true" /> Discover creators
          </GhostButton>
        </div>
      </div>
    </>
  );
}
