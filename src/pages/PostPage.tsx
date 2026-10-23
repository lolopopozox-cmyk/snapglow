import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { getPost, getUser, sessionUser, siteUrl, useSnapGlow } from '../lib/store';
import { Seo } from '../components/Seo';
import { Avatar, GhostButton, PostCard, ReportButton, ShareRow, TextArea } from '../components/ui';
import { useToast } from '../components/Toast';
import { timeAgo } from '../lib/format';
import NotFound from './NotFound';

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const sg = useSnapGlow();
  const { toast } = useToast();
  const [comment, setComment] = useState('');
  const me = sessionUser(sg.state);

  const post = id ? getPost(sg.state, id) : undefined;
  if (!post) return <NotFound />;

  const author = getUser(sg.state, post.authorId);
  if (!author) return <NotFound />;

  const moreFromAuthor = sg.state.posts
    .filter((p) => p.authorId === post.authorId && p.id !== post.id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 2);

  const submitComment = async () => {
    const res = await sg.addComment(post.id, comment);
    toast(res.message);
    if (res.ok) setComment('');
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Seo
        title={`Post by ${author.displayName} · Snap Glow`}
        description={`A community post by ${author.displayName} on Snap Glow.`}
        path={`/posts/${post.id}`}
        noindex
      />

      <Link to="/feed" className="mb-5 inline-flex items-center gap-1.5 text-sm font-extrabold text-ink-mute hover:text-brand-violet">
        <ArrowLeft size={16} aria-hidden="true" /> Back to feed
      </Link>

      <h1 className="mb-6 flex flex-wrap items-center gap-2 font-display text-3xl font-extrabold text-ink">
        Post by {author.displayName}
      </h1>

      <PostCard post={post} />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <ShareRow url={`${siteUrl()}/posts/${post.id}`} title={`Post by ${author.displayName} · Snap Glow`} />
        <ReportButton targetType="post" targetId={post.id} />
      </div>

      <section aria-labelledby="comments-heading" className="mt-10">
        <h2 id="comments-heading" className="mb-4 font-display text-2xl font-extrabold text-ink">
          Comments ({post.comments.length})
        </h2>

        <div className="card-surface mb-6 rounded-card p-5">
          {me ? (
            <>
              <TextArea
                label="Add a comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
                placeholder="Say something kind…"
                hint={`${comment.length}/500`}
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={submitComment}
                  disabled={!comment.trim()}
                  className="btn-cta rounded-full px-6 py-2.5 font-display text-base font-bold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Comment
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="font-display text-lg font-bold text-ink">Create a free account to join the conversation.</p>
              <GhostButton to="/signin">Join free</GhostButton>
            </div>
          )}
        </div>

        {post.comments.length === 0 ? (
          <p className="rounded-card border border-dashed border-line bg-white px-5 py-8 text-center font-semibold text-ink-mute">
            No comments yet — be the first to reply.
          </p>
        ) : (
          <ul className="space-y-4">
            {post.comments.map((c) => {
              const commenter = getUser(sg.state, c.authorId);
              if (!commenter) return null;
              const mine = !!me && c.authorId === me.id;
              return (
                <li key={c.id} className="card-surface rounded-card p-4">
                  <div className="mb-2 flex items-center gap-2.5">
                    <Avatar name={commenter.displayName} hue={commenter.hue} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-1.5">
                        <span className="font-display text-base font-bold text-ink">{commenter.displayName}</span>
                      </p>
                      <p className="text-xs font-semibold text-ink-mute">{timeAgo(c.createdAt)}</p>
                    </div>
                    {mine && (
                      <button
                        type="button"
                        onClick={() => void sg.deleteComment(post.id, c.id).then((r) => toast(r.message))}
                        aria-label="Delete your comment"
                        className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-extrabold text-ink-mute hover:bg-blush hover:text-brand-pink"
                      >
                        <Trash2 size={14} aria-hidden="true" /> Delete
                      </button>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap font-semibold leading-relaxed text-ink">{c.text}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {moreFromAuthor.length > 0 && (
        <section aria-labelledby="more-heading" className="mt-10">
          <h2 id="more-heading" className="mb-4 font-display text-2xl font-extrabold text-ink">
            More from {author.displayName}
          </h2>
          <div className="space-y-5">
            {moreFromAuthor.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
