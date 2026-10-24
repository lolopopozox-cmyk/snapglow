import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, Sparkles } from 'lucide-react';
import { feedPosts, forYouFeed, getBattle, getCard, getUser, sessionUser, useSnapGlow } from '../lib/store';
import type { FeedFilter } from '../lib/store';
import { Seo } from '../components/Seo';
import { EmptyState, FlexCard, GhostButton, PageHeader, PostCard, Tabs, TextArea } from '../components/ui';
import { AdSlot } from '../components/AdSlot';
import { VersusBattle } from '../components/Versus';
import { useToast } from '../components/Toast';

const FILTERS: Array<{ id: FeedFilter; label: string }> = [
  { id: 'foryou', label: 'For You ✨' },
  { id: 'newest', label: 'Newest' },
  { id: 'trending', label: 'Trending' },
  { id: 'popular', label: 'Popular' },
];

const EMPTY_COPY: Record<FeedFilter, string> = {
  foryou: 'The feed fills up as creators post cards, updates and battles — check back in a moment!',
  newest: 'No posts yet — be the first to share your Snapchat vibe with the community.',
  trending: 'Nothing is trending right now. Like and comment to get the conversation moving.',
  popular: 'No popular posts yet — the community is just warming up.',
};

export default function Feed() {
  const sg = useSnapGlow();
  const { toast } = useToast();
  const [filter, setFilter] = useState<FeedFilter>('foryou');
  const [text, setText] = useState('');
  const me = sessionUser(sg.state);
  const posts = filter === 'foryou' ? [] : feedPosts(sg.state, filter);
  const forYou = forYouFeed(sg.state);

  const submit = async () => {
    const res = await sg.createPost(text);
    toast(res.message);
    if (res.ok) setText('');
  };

  const renderForYouItem = (item: (typeof forYou)[number], i: number) => {
    let node: React.ReactNode = null;
    if (item.kind === 'post') {
      const post = sg.state.posts.find((p) => p.id === item.id);
      node = post ? <PostCard key={item.id} post={post} /> : null;
    } else if (item.kind === 'card') {
      const card = getCard(sg.state, item.id);
      const owner = card ? getUser(sg.state, card.ownerId) : undefined;
      node =
        card && owner ? (
          <div className="card-surface rounded-card p-5" key={item.id}>
            <p className="mb-3 text-xs font-extrabold uppercase tracking-wider text-ink-mute">
              ✨ Fresh flex card
            </p>
            <div className="mx-auto max-w-xs">
              <Link to={`/cards/${card.id}`} aria-label={`Open card “${card.title}”`}>
                <FlexCard card={card} owner={owner} />
              </Link>
            </div>
          </div>
        ) : null;
    } else {
      const battle = getBattle(sg.state, item.id);
      node =
        battle && battle.cardBId ? (
          <div className="card-surface rounded-card p-5" key={item.id}>
            <Link to={`/battles/${battle.id}`} className="mb-3 block text-xs font-extrabold uppercase tracking-wider text-brand-violet hover:underline">
              🔥 Live battle — {battle.title}
            </Link>
            <VersusBattle battleId={battle.id} />
          </div>
        ) : null;
    }
    if (!node) return null;
    return (
      <div key={`${item.kind}-${item.id}`}>
        {node}
        {(i + 1) % 6 === 0 && i < forYou.length - 1 && (
          <div className="mt-5">
            <AdSlot slot="feed-inline" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Seo
        title="Community Feed · Snap Glow"
        description="Browse the newest, trending and most-loved posts and cards from Snapchat users on Snap Glow."
        path="/feed"
      />

      <PageHeader
        eyebrow="Community"
        title="Community Feed"
        sub="For You mixes the hottest posts, fresh cards and live battles — ranked by real engagement."
      />

      <div className="card-surface mb-6 rounded-card p-5">
        {me ? (
          <>
            <TextArea
              label="Share an update"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={280}
              placeholder="What's the vibe today? Try #snapchatvibes"
              hint={`${text.length}/280`}
            />
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={submit}
                disabled={!text.trim()}
                className="btn-cta rounded-full px-7 py-2.5 font-display text-base font-bold disabled:cursor-not-allowed disabled:opacity-50"
              >
                Post
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="font-display text-base font-bold text-ink sm:text-lg">
              Explore freely — create a free account to post, like and vote.
            </p>
            <GhostButton to="/signin">Join free</GhostButton>
          </div>
        )}
      </div>

      <div className="mb-6">
        <Tabs tabs={FILTERS} active={filter} onChange={setFilter} ariaLabel="Feed filters" />
      </div>

      {filter === 'foryou' ? (
        forYou.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Your feed is warming up"
            body={EMPTY_COPY.foryou}
            action={
              me ? (
                <Link to="/create" className="btn-cta inline-flex items-center justify-center rounded-full px-6 py-3 font-display font-bold">
                  Create the first card
                </Link>
              ) : (
                <Link to="/discover" className="btn-cta inline-flex items-center justify-center rounded-full px-6 py-3 font-display font-bold">
                  Explore creators
                </Link>
              )
            }
          />
        ) : (
          <div className="space-y-5">{forYou.map(renderForYouItem)}</div>
        )
      ) : posts.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="Nothing here yet"
          body={EMPTY_COPY[filter]}
          action={
            me ? (
              <Link to="/create" className="btn-cta inline-flex items-center justify-center rounded-full px-6 py-3 font-display font-bold">
                Create the first card
              </Link>
            ) : (
              <Link to="/signin" className="btn-cta inline-flex items-center justify-center rounded-full px-6 py-3 font-display font-bold">
                Create free account
              </Link>
            )
          }
        />
      ) : (
        <div className="space-y-5">
          {posts.map((post, i) => (
            <div key={post.id}>
              <PostCard post={post} />
              {(i + 1) % 6 === 0 && i < posts.length - 1 && (
                <div className="mt-5">
                  <AdSlot slot="feed-inline" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
