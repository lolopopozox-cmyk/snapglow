# Adsterra Setup — Snap Glow

Snap Glow earns through **Adsterra display ads** placed in tasteful, fixed slots.
Ad code is never bundled until you paste it in — the site ships with clearly
labeled placeholders instead.

## 1. Create your Adsterra publisher account

1. Go to https://www.adsterra.com and sign up as a **Publisher**.
2. Add your site (your live domain, e.g. `snapglow.example.com`) and wait for
   approval. Approval can take a few hours to a few days.
3. In the Adsterra dashboard, create ad units. **Banners** (e.g. 728×90,
   300×250, 320×50) fit the slots below best.

## 2. Paste your ad codes

Open `src/lib/ads.ts`. You will see the `AD_SLOTS` registry:

```ts
export const AD_SLOTS: Record<AdSlotId, string> = {
  'feed-inline': '',
  'leaderboard-sidebar': '',
  'discover-hero-bottom': '',
  'battles-hero-bottom': '',
  'battle-side': '',
};
```

For each slot, paste the embed HTML Adsterra gives you (the `<script>` or
`<iframe>` snippet) as the value, for example:

```ts
'feed-inline': `<script async src="https://...adsterra.js" data-...></script>`,
```

Where each slot appears:

| Slot | Placement |
|---|---|
| `feed-inline` | Inside the community feed, after every 6th post |
| `leaderboard-sidebar` | Desktop sidebar on leaderboard pages (hidden on mobile) |
| `discover-hero-bottom` | Below the page hero on Discover |
| `battles-hero-bottom` | Below the page hero on Battles |
| `battle-side` | Side column on the battle detail page (stacks below content on mobile) |

## 3. Rebuild and redeploy

```bash
npm run build
```

Then redeploy (Vercel redeploys automatically on every GitHub push — see
`docs/DEPLOY_VERCEL.md`).

## 4. Test

1. Open the live site in a normal browser window.
2. Scroll the feed — an ad should render after the 6th post.
3. Check the leaderboard page on desktop (sidebar) and on mobile (slot hidden).
4. Open a battle page — the side ad should sit beside the matchup, never
   overlapping the vote buttons.

## Rules that keep you safe

- **Never click your own ads** and never ask others to — Adsterra bans for this.
- Slots are deliberately **kept away from vote and download buttons** so there
  are no accidental-click traps. Do not move them next to those controls.
- Popunders / full-page interstitials are **not** wired in — banners only, so
  the site never feels ad-stuffed.
- Keep ad density as shipped: the layout was designed around these five slots.

## Troubleshooting

- **Ad doesn't show**: check the browser console for blocked scripts (ad
  blockers hide them — test in a clean profile without extensions).
- **Wrong size**: create a matching banner size in Adsterra, or let the slot
  center whatever renders — the container is fluid.
- **HTTPS**: your live site must be served over HTTPS (Vercel does this by
  default) or browsers will block the ad scripts.
