/**
 * Adsterra ad slot.
 *
 * Renders the owner's real ad code when configured (see src/lib/ads.ts),
 * otherwise a clearly-labeled placeholder so placements stay visible and
 * honest during development. Slots collapse gracefully and are NEVER placed
 * next to vote/download buttons (no accidental-click traps).
 */
import { AD_SLOTS, AD_SLOT_LABELS, type AdSlotId } from '../lib/ads';

export function AdSlot({ slot, className = '' }: { slot: AdSlotId; className?: string }) {
  const code = (AD_SLOTS[slot] ?? '').trim();
  if (code) {
    return (
      <div className={`overflow-hidden rounded-2xl ${className}`} role="complementary" aria-label="Advertisement">
        <p className="mb-1 text-center text-[0.65rem] font-bold uppercase tracking-widest text-ink-mute">
          Advertisement
        </p>
        <div
          className="flex justify-center"
          dangerouslySetInnerHTML={{ __html: code }}
        />
      </div>
    );
  }
  return (
    <div
      className={`rounded-2xl border-2 border-dashed border-line bg-white/60 px-4 py-6 text-center ${className}`}
      role="complementary"
      aria-label={`Advertisement placeholder: ${AD_SLOT_LABELS[slot]}`}
    >
      <p className="text-[0.65rem] font-extrabold uppercase tracking-widest text-ink-mute">Advertisement</p>
      <p className="mt-1 text-xs font-semibold text-ink-mute">
        {AD_SLOT_LABELS[slot]} — paste your Adsterra code in <code className="font-bold">src/lib/ads.ts</code>
      </p>
    </div>
  );
}
