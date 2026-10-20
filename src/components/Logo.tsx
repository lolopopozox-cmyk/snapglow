import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';

/**
 * Snap Glow wordmark v7 "Snap Pop": a flat yellow tile with an ink crown
 * glyph (original artwork — not Snapchat's ghost), 2px ink border + hard
 * shadow, plus the exact brand text "Snap Glow" in Unbounded — "Snap" in
 * ink, "Glow" in violet. Never renders "AI" anywhere near the brand.
 */
export function Logo({ compact = false }: { compact?: boolean }) {
  const s = compact ? 28 : 34;
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Snap Glow — home">
      <span
        className="grid place-items-center border-2 border-ink bg-sun shadow-pop"
        style={{ width: s, height: s, borderRadius: '0.65rem' }}
        aria-hidden="true"
      >
        <Crown size={compact ? 15 : 18} color="#141414" strokeWidth={2.4} />
      </span>
      {!compact && (
        <span className="font-display text-[0.95rem] font-bold tracking-tight">
          <span className="text-ink">Snap</span>&nbsp;<span className="text-brand-violet">Glow</span>
        </span>
      )}
    </Link>
  );
}
