import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Seo } from '../components/Seo';
import { useSnapGlow, searchAll, getUser } from '../lib/store';
import {
  Avatar,
  FlexCard,
  PageHeader,
  EmptyState,
  PostCard,
} from '../components/ui';
import { Search } from 'lucide-react';
import { handle, timeAgo } from '../lib/format';

export default function SearchPage() {
  const sg = useSnapGlow();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  const [value, setValue] = useState(q);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(value.trim())}`);
  };

  const results = q ? searchAll(sg.state, q) : null;
  const total = results ? results.users.length + results.cards.length + results.posts.length : 0;

  return (
    <>
      <Seo
        title="Search · Snap Glow"
        description="Search Snap Glow creators, cards and posts."
        path="/search"
        noindex={true}
      />
      <PageHeader title="Search" sub="Search Snap Glow creators, cards and posts." />

      <form onSubmit={submit} className="mb-8 flex gap-3" role="search">
        <label htmlFor="site-search" className="sr-only">
          Search Snap Glow
        </label>
        <input
          id="site-search"
          key={q}
          type="search"
          defaultValue={q}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Try @sanaqueen, “vibes” or #goodvibes"
          className="w-full rounded-2xl border-2 border-line bg-white px-4 py-3 text-base font-semibold text-ink placeholder:text-ink-mute/70 focus:border-brand-cyan focus:outline-none"
        />
        <button type="submit" className="btn-cta inline-flex items-center gap-2 rounded-full px-6 py-3 font-display text-base font-bold">
          <Search size={18} aria-hidden="true" /> Search
        </button>
      </form>

      {!results ? (
        <EmptyState
          icon={Search}
          title="Search Snap Glow"
          body="Try @sanaqueen, 'vibes' or #goodvibes"
        />
      ) : total === 0 ? (
        <EmptyState
          icon={Search}
          title={`No results for “${q}”`}
          body="Try a different name, word or hashtag — or explore the community instead."
          action={<Link to="/discover" className="btn-cta inline-flex items-center gap-2 rounded-full px-6 py-3 font-display text-lg font-bold">Explore Community</Link>}
        />
      ) : (
        <div className="space-y-12">
          <p className="flex items-center gap-2 text-sm text-ink-mute">
          </p>

          {results.users.length > 0 && (
            <section>
              <h2 className="font-display mb-4 text-2xl font-extrabold text-ink">
                Creators <span className="text-lg text-ink-mute">({results.users.length})</span>
              </h2>
              <div className="card-surface divide-y divide-line overflow-hidden rounded-card">
                {results.users.map((u) => (
                  <Link
                    key={u.id}
                    to={`/u/${u.username}`}
                    className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-lav/40"
                  >
                    <Avatar name={u.displayName} hue={u.hue} size={48} />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2 font-extrabold text-ink">
                        <span className="truncate">{u.displayName}</span>
                      </span>
                      <span className="text-sm text-ink-mute">
                        {handle(u.username)} · joined {timeAgo(u.joinedAt)}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results.cards.length > 0 && (
            <section>
              <h2 className="font-display mb-4 text-2xl font-extrabold text-ink">
                Cards <span className="text-lg text-ink-mute">({results.cards.length})</span>
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
                {results.cards.map((card) => {
                  const owner = getUser(sg.state, card.ownerId);
                  if (!owner) return null;
                  return (
                    <Link key={card.id} to={`/cards/${card.id}`} className="transition hover:-translate-y-1">
                      <FlexCard card={card} owner={owner} className="shadow-soft hover:shadow-lift" />
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {results.posts.length > 0 && (
            <section>
              <h2 className="font-display mb-4 text-2xl font-extrabold text-ink">
                Posts <span className="text-lg text-ink-mute">({results.posts.length})</span>
              </h2>
              <div className="mx-auto flex max-w-2xl flex-col gap-5">
                {results.posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}
