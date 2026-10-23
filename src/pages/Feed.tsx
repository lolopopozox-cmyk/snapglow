import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper } from 'lucide-react';
import { feedPosts, sessionUser, useSnapGlow } from '../lib/store';
import type { FeedFilter } from '../lib/store';
import { Seo } from '../components/Seo';
import { EmptyState, GhostButton, PageHeader, PostCard, Tabs, TextArea } from '../components/ui';
import { AdSlot } from '../components/AdSlot';
import { useToast } from '../components/Toast';

const FILTERS: Array<{ id: FeedFilter; label: string }> = [
  { id: 'newest', label: 'Newest' },
  { id: 'trending', label: 'Trending' },
  { id: 'popular', label: 'Popular' },
];

const EMPTY_COPY: Record<FeedFilter, string> = {
  newest: 'No posts yet — be the first to share your Snapchat vibe with the community.',
  trending: 'Nothing is trending right now. Like and comment to get the conversation moving.',
  popular: 'No popular posts yet — the community is just warming up.',
};

export default function Feed() {
  const sg = useSnapGlow();
  const { toast } = useToast();
  const [filter, setFilter] = useState<FeedFilter>('newest');
  const [text, setText] = useState('');
  const me = sessionUser(sg.state);
  const posts = feedPosts(sg.state, filter);

  const submit = async () => {
    const res = await sg.createPost(text);
    toast(res.message);
    if (res.ok) setText('');
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
        sub="Discover new cards, like, comment and share — the Snapchatter way."
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
            <p className="font-display text-lg font-bold text-ink">
              Create a free account to join the conversation.
            </p>
            <GhostButton to="/signin">Join free</GhostButton>
          </div>
        )}
      </div>

      <div className="mb-6">
        <Tabs tabs={FILTERS} active={filter} onChange={setFilter} ariaLabel="Feed filters" />
      </div>

      {posts.length === 0 ? (
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
