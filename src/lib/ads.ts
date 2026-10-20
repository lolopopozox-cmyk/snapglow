/**
 * Adsterra ad-slot registry.
 *
 * HOW TO GO LIVE WITH ADS (full guide: docs/ADSTERRA_SETUP.md):
 *  1. Create your publisher account at https://www.adsterra.com
 *  2. Add your site, create ad units (banners work best in these slots)
 *  3. Paste each unit's embed HTML (the <script> or <iframe> Adsterra gives
 *     you) as the value for the matching slot below
 *  4. Rebuild and redeploy (`npm run build`)
 *
 * Until a slot has code, the site renders a clearly-labeled placeholder
 * where the ad will appear — never a fake ad, never a blank hole.
 */

export type AdSlotId =
  | 'feed-inline'
  | 'leaderboard-sidebar'
  | 'discover-hero-bottom'
  | 'battles-hero-bottom'
  | 'battle-side';

export const AD_SLOTS: Record<AdSlotId, string> = {
  /** In-feed card, shown after every 6th post in the community feed. */
  'feed-inline': '',
  /** Desktop sidebar on leaderboard pages (hidden on mobile). */
  'leaderboard-sidebar': '',
  /** Below the page hero on Discover. */
  'discover-hero-bottom': '',
  /** Below the page hero on Battles. */
  'battles-hero-bottom': '',
  /** Side column on the battle detail page (stacks below on mobile). */
  'battle-side': '',
};

/** Friendly label shown on placeholders so the owner knows what goes where. */
export const AD_SLOT_LABELS: Record<AdSlotId, string> = {
  'feed-inline': 'Feed ad · 6th-post slot',
  'leaderboard-sidebar': 'Leaderboard sidebar ad',
  'discover-hero-bottom': 'Discover page ad',
  'battles-hero-bottom': 'Battles page ad',
  'battle-side': 'Battle page side ad',
};
