import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Download, Flame } from 'lucide-react';
import { Seo } from '../components/Seo';
import {
  Avatar,
  FlexCard,
  GhostButton,
  CardLikeButton,
  FollowButton,
  ShareRow,
  ReportButton,
  SectionTitle,
} from '../components/ui';
import { useToast } from '../components/Toast';
import { useSnapGlow, getUser, siteUrl } from '../lib/store';
import { templateById, badgeEmoji } from '../lib/templates';
import { downloadCardPng, type ExportSize } from '../lib/renderCard';
import { timeAgo, formatCount, handle } from '../lib/format';
import NotFound from './NotFound';

export default function CardPage() {
  const { id } = useParams();
  const sg = useSnapGlow();
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [exportSize, setExportSize] = useState<ExportSize>('feed');

  const card = sg.state.cards.find((c) => c.id === id);
  const owner = card ? getUser(sg.state, card.ownerId) : undefined;

  if (!card || !card.published || !owner) {
    return <NotFound />;
  }

  const template = templateById(card.template);
  const others = sg.state.cards.filter(
    (c) => c.published && c.ownerId === owner.id && c.id !== card.id,
  );

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError('');
    try {
      await downloadCardPng(card, owner, exportSize);
      toast(exportSize === 'story' ? 'Story PNG downloaded (1080×1920) — ready for Snapchat Stories.' : 'PNG downloaded (1080×1350).');
    } catch (err) {
      setDownloadError(`Download failed: ${err instanceof Error ? err.message : 'unknown error'}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <Seo
        title={`"${card.title}" by ${owner.displayName} · Snap Glow`}
        description={`A flex profile card by ${owner.displayName} on Snap Glow.`}
        path={`/cards/${card.id}`}
        noindex
      />

      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        <FlexCard card={card} owner={owner} className="mx-auto max-w-md" />

        <div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={`/u/${owner.username}`}
              className="flex items-center gap-3 rounded-2xl p-1 transition hover:bg-white"
            >
              <Avatar name={owner.displayName} hue={owner.hue} size={52} />
              <span>
                <span className="flex items-center gap-2 font-display text-lg font-extrabold text-ink">
                  {owner.displayName}
                </span>
                <span className="text-sm font-bold text-ink-mute">{handle(owner.username)}</span>
              </span>
            </Link>
            <FollowButton userId={owner.id} />
          </div>

          <h1 className="font-display mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            {card.title}
          </h1>
          {card.caption && <p className="mt-2 text-lg text-ink-soft">{card.caption}</p>}

          <dl className="mt-5 space-y-2.5 text-base">
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-extrabold text-ink">Template:</dt>
              <dd className="text-ink-soft">{template.name}</dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-extrabold text-ink">Streak:</dt>
              <dd className="text-ink-soft">
                <span className="inline-flex items-center gap-1 font-bold text-ink">
                  <Flame size={15} aria-hidden="true" className="text-brand-pink" /> {card.streak}
                  {card.streakLabel.trim() ? ` · ${card.streakLabel.trim()}` : ''}
                </span>{' '}
                <span className="text-sm text-ink-mute">(entered by the card owner, not verified by Snapchat)</span>
              </dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-extrabold text-ink">Badges:</dt>
              <dd className="text-ink-soft">
                {card.badges.length > 0 ? (
                  <span className="text-lg" aria-label={`Badges: ${card.badges.join(', ')}`}>
                    {card.badges.map((b) => (
                      <span key={b} aria-hidden="true" title={b}>
                        {badgeEmoji(b)}
                      </span>
                    ))}
                  </span>
                ) : (
                  'None'
                )}
              </dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-extrabold text-ink">Published:</dt>
              <dd className="text-ink-soft">{timeAgo(card.createdAt)}</dd>
            </div>
            <div className="flex flex-wrap items-center gap-x-2">
              <dt className="font-extrabold text-ink">Likes:</dt>
              <dd className="flex items-center gap-2 text-ink-soft">
                {formatCount(card.likes.length)} likes
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <CardLikeButton cardId={card.id} count={card.likes.length} />
            <div className="flex overflow-hidden rounded-full border-2 border-line bg-white" role="group" aria-label="Download size">
              {(['feed', 'story'] as ExportSize[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={exportSize === s}
                  onClick={() => setExportSize(s)}
                  className={`px-4 py-3 font-display text-base font-bold ${exportSize === s ? 'bg-lav text-brand-violet' : 'text-ink-mute'}`}
                  title={s === 'story' ? '9:16 — sized for Snapchat Stories' : '4:5 — for the feed'}
                >
                  {s === 'story' ? '9:16 Story' : '4:5 Feed'}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-full border-2 border-line bg-white px-6 py-3 font-display text-lg font-bold text-ink transition hover:border-brand-cyan disabled:cursor-wait disabled:opacity-60"
            >
              <Download size={19} aria-hidden="true" />
              {downloading ? 'Rendering…' : 'Download PNG'}
            </button>
          </div>
          {downloadError && (
            <p role="alert" className="mt-3 max-w-md rounded-2xl bg-blush px-4 py-3 text-sm font-bold text-ink">
              {downloadError}
            </p>
          )}

          <div className="mt-6">
            <ShareRow url={`${siteUrl()}/cards/${card.id}`} title={card.title} />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <GhostButton to={`/u/${owner.username}`}>Open creator profile</GhostButton>
            <ReportButton targetType="card" targetId={card.id} />
          </div>
        </div>
      </div>

      {others.length > 0 && (
        <div className="mt-14">
          <SectionTitle
            title={`More from ${owner.displayName}`}
            linkTo={`/u/${owner.username}`}
            linkLabel="View profile"
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {others.slice(0, 4).map((c) => (
              <Link
                key={c.id}
                to={`/cards/${c.id}`}
                className="rounded-3xl transition hover:-translate-y-1"
                aria-label={`View flex card “${c.title}”`}
              >
                <FlexCard card={c} owner={owner} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
