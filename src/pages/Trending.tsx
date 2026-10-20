import { Link } from 'react-router-dom';
import { Seo } from '../components/Seo';
import { useSnapGlow, trendingCards, getUser } from '../lib/store';
import { FlexCard, PageHeader, EmptyState, CtaButton } from '../components/ui';
import { Flame, Heart } from 'lucide-react';
import { formatCount } from '../lib/format';

export default function Trending() {
  const sg = useSnapGlow();
  const cards = trendingCards(sg.state, 12);

  return (
    <>
      <Seo
        title="Trending Cards · Snap Glow"
        description="The most-loved flex cards on Snap Glow right now."
        path="/trending"
        noindex={false}
      />
      <PageHeader
        title="Trending Cards"
        sub="The most-loved flex cards on Snap Glow right now."
      />
      <p className="mb-5 flex items-center gap-2 text-sm text-ink-mute">

      </p>

      {cards.length === 0 ? (
        <EmptyState
          icon={Flame}
          title="No trending cards yet"
          body="Once creators start sharing flex cards, the most-loved ones will show up here."
          action={<CtaButton to="/create">Create Your Card</CtaButton>}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((card, i) => {
            const owner = getUser(sg.state, card.ownerId);
            if (!owner) return null;
            return (
              <Link key={card.id} to={`/cards/${card.id}`} className="group relative block transition hover:-translate-y-1">
                <span
                  aria-hidden="true"
                  className="font-display absolute -top-3 left-3 z-10 rounded-full border-2 border-ink bg-brand-pink px-3 py-1 text-sm font-extrabold text-white shadow-pop"
                >
                  #{i + 1}
                </span>
                <FlexCard card={card} owner={owner} className="shadow-soft group-hover:shadow-lift" />
                <span className="mt-2 flex items-center justify-center gap-1.5 text-sm font-bold text-ink-soft">
                  <Heart size={14} className="text-brand-pink" aria-hidden="true" />
                  {formatCount(card.likes.length)} likes
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
