# Snap Glow — Page-builder contracts

You are writing page components for the Snap Glow demo project. The scaffold,
design tokens, data layer and shared components already exist — read this file
fully, then write ONLY the files assigned to you.

Project root: `~/workspace/snap-glow/snap-glow-project/`
Pages live in: `src/pages/`
Run `npm install` / `npm run build`: **DO NOT** — the parent verifies the build.
Just write correct TypeScript + JSX.

## Hard rules (violations fail acceptance)

1. **Brand is exactly “Snap Glow”** — never write “AI” next to the brand, never
   claim Snapchat affiliation. Use the `<Logo />` component; don't invent logos.
2. **NO dark page backgrounds.** Pages, headers, footers, modals, menus, cards,
   grids, admin surfaces: white / cream / pale lavender / mint / cyan / blush
   only. Dark *text* is fine. Card *artwork* (inside `FlexCard`/`CardArt`) may be
   vivid — that's user content, not page chrome.
3. **Every person, like, vote, follower count and battle tally is DEMO sample
   data.** Render `<DemoBadge />` next to sample people/activity wherever it
   appears (user names, like counts, vote counts, follower counts, wins).
   Never write copy that presents sample data as genuine.
4. **No dead buttons.** Every button/link must do something real (navigate,
   call the store, open a working modal, copy a link…). If an action needs a
   demo profile and the visitor has none, toast: “Sign in (demo) to …” — and
   link them to `/signin`.
5. **Accessibility:** semantic headings (one `h1` per page), labels on all
   inputs (use `Field`/`TextArea`/`SelectEl`), `aria-pressed` on toggles,
   visible focus comes free from `:focus-visible`, `alt`/aria-labels on
   artwork, no horizontal overflow, responsive (mobile → desktop).
6. **Light CTA:** primary actions use `btn-cta` class or `<CtaButton>`.
7. Wrap page content in a light container; the App shell already provides
   header/footer/max-width. Don't re-render header/footer.
8. TypeScript strict. No unused imports that break nothing (fine), but no
   type errors. Prefer the helpers below over hand-rolled logic.

## What you may import

```tsx
// SEO head (REQUIRED on every page — see titles per route below)
import { Seo } from '../components/Seo';
// <Seo title="…" description="…" path="/route" noindex={true|false} />

// Store (the ONLY data access)
import { useSnapGlow, api, getUser, getCard, getPost, getBattle,
         isBattleLive, battleWinner, userStats, feedPosts, trendingCards,
         leaderboard, recentWinners, searchAll, computeAchievements,
         siteUrl, BACKEND_MODE, ME_ID } from '../lib/store';
import type { BoardKind } from '../lib/store';

// UI kit
import { Avatar, DemoBadge, CardArt, FlexCard, CtaButton, GhostButton,
         PageHeader, EmptyState, Stepper, Countdown, Tabs, Stat,
         Field, TextArea, SelectEl, Modal, ShareRow, ReportButton,
         PostCard, CardLikeButton, SectionTitle, FollowButton } from '../components/ui';
import { useToast } from '../components/Toast';

// helpers
import { timeAgo, formatCount, formatClock, handle, uid } from '../lib/format';
import { TEMPLATES, templateById, BADGES, badgeEmoji } from '../lib/templates';

// routing
import { Link, useNavigate, useParams, useSearchParams, Navigate } from 'react-router-dom';
// icons
import { /* … */ } from 'lucide-react';   // any icons you need
```

`const sg = useSnapGlow();` then `sg.state.users`, `sg.toggleLikePost(id)`,
`sg.vote(battleId, 'a'|'b')`, `sg.publishCard(input)`, etc. — all actions
return `{ ok, message, id? }`; show `message` with `const { toast } = useToast(); toast(res.message);`.
`sg.state.profile` is the demo profile or `null`.

## SEO titles (exact)

| Route | title | description | noindex |
|---|---|---|---|
| `/` | Snap Glow — Show Your Vibe. Get Noticed. | Design flex profile cards, share them in the feed, battle head-to-head and climb the leaderboards. | no |
| `/discover` | Discover Creators · Snap Glow | Find new creators, explore trending flex cards and join the Snap Glow community. | no |
| `/feed` | Community Feed · Snap Glow | Browse the newest, trending and most-loved flex cards and posts from the Snap Glow community. | no |
| `/trending` | Trending Cards · Snap Glow | The most-loved flex cards on Snap Glow right now. | no |
| `/create` | Create Your Flex Card · Snap Glow | Upload a photo, pick a template, preview and download your flex profile card. | **yes** |
| `/cards/:id` | “{title}” by {name} · Snap Glow | A flex profile card by {name} on Snap Glow. | **yes** (demo data) |
| `/u/:username` | {name} ({@user}) · Snap Glow | Flex cards, posts and achievements from {name} on Snap Glow. | **yes** (demo data) |
| `/posts/:id` | Post by {name} · Snap Glow | A community post by {name} on Snap Glow. | **yes** (demo data) |
| `/battles` | Vote Battles · Snap Glow | Head-to-head flex-card battles. Vote for your favorite before the clock runs out. | no |
| `/battles/new` | Create a Battle · Snap Glow | Pick two flex cards and start a head-to-head vote battle. | **yes** |
| `/battles/:id` | {title} — Live Battle · Snap Glow | Vote in “{title}” on Snap Glow. | **yes** (demo data) |
| `/battles/:id/results` | {title} — Results · Snap Glow | Final results for “{title}” on Snap Glow. | **yes** (demo data) |
| `/leaderboards…` | Leaderboards · Snap Glow (prefix kind, e.g. “Daily Top Flexers · Snap Glow”) | See who's leading on Snap Glow… | no |
| `/hall-of-fame` | Hall of Fame · Snap Glow | Legendary Snap Glow creators, timeless flexes. | no |
| `/search` | Search · Snap Glow | Search Snap Glow creators, cards and posts. | **yes** |
| `/contact` | Contact Us · Snap Glow | Questions about Snap Glow? Email snapglowofficial@gmail.com. | no |
| `/privacy` | Privacy Policy · Snap Glow | How Snap Glow (demo) handles your data. | no |
| `/terms` | Terms of Service · Snap Glow | The rules for using Snap Glow. | no |
| `/guidelines` | Community Guidelines · Snap Glow | Be kind, be original, keep Snap Glow fun. | no |
| `/signin` | Sign In (Demo) · Snap Glow | Create a local demo profile — no password, no real account. | **yes** |
| `/dashboard` | My Dashboard · Snap Glow | Your cards, posts, battles and achievements (demo, this device). | **yes** |
| `/admin` | Admin / Moderation Setup · Snap Glow | How to set up secure admin access for Snap Glow. | **yes** |
| 404 | Page not found · Snap Glow | … | **yes** |

`<Seo … path="/the-route" />` — canonicals use the placeholder domain; that is
intentional and documented.

## Honesty copy (reuse verbatim where fitting)

- Streaks: “Streak counts are entered by the card owner and are not verified by Snapchat.”
- Voting: “Demo voting — one vote per demo identity in this browser. Not a secure election.”
- Publishing: “Published to the demo feed on this device only — it won't appear on other devices.”
- Sample data: `<DemoBadge />` + “Sample data” wording.

## Page specs (your assignment lists which are yours)

General: loading states aren't needed (local data is synchronous) but every
page needs **empty states** (`<EmptyState>`) where lists can be empty and a
**not-found** treatment where an id/username doesn't resolve (render `<NotFound/>`
or an inline EmptyState with a link home — both fine, but use the shared
NotFound component via import from './NotFound' when a whole page is missing).

HOME (`src/pages/Home.tsx`) — `/`
- Hero: pill “👋 Welcome to Snap Glow”, h1 “Show Your Vibe” (ink) + “Get Noticed.” (`grad-text`), copy about flex cards/battles/rankings, `<CtaButton to="/create">Create Your Card</CtaButton>` + `<GhostButton to="/feed">Explore Community</GhostButton>`.
- Right: decorative tilted collage — 2–3 `FlexCard`s (from `trendingCards(sg.state, 3)`) with rotate + `sg-float`, plus floating crown/sparkle icons. aria-hidden on pure decoration.
- Feature strip: 4 items (Create Cards / Share & Connect / Vote Battles / Top Rankings) with pastel icon chips (mint, lav, cyantint, blush) in one `card-surface` row.
- “How Snap Glow Works”: 4 numbered steps (Design → Share → Battle → Climb) as cards.
- Trending Cards rail: horizontal scroll (`no-scrollbar`, scroll buttons) of `FlexCard` linked to `/cards/:id`, `<SectionTitle linkTo="/trending">`.
- Live battles preview: first live battle → head-to-head mini (two cards + VS badge + Countdown + link).
- Leaderboard preview: top 5 of `leaderboard(sg.state,'daily')` rows (rank, Avatar, name, likes, wins) + link.
- Final CTA band (pale gradient, NOT dark): “Ready to glow?” + CtaButton.
- DemoBadge near sample-data sections (“Sample creators”).

DISCOVER (`src/pages/Discover.tsx`) — `/discover`
- Search input (navigates to `/search?q=`), filter tabs (All, Trending, New, Most Liked, Top Creators) via `Tabs`.
- Featured Creators: top 4 users by likes → cards with Avatar, name, handle, stats, FollowButton.
- Trending Cards grid below (reuse FlexCard, linked).
- All sample people get DemoBadge.

TRENDING (`src/pages/Trending.tsx`) — `/trending`
- Grid of `trendingCards` (all published), rank numbers, like counts, linked cards. EmptyState if none.

SEARCH (`src/pages/Search.tsx`) — `/search`
- Read `?q=` via `useSearchParams`; input + submit; results from `searchAll(sg.state, q)` grouped: Creators / Cards / Posts with counts; hashtag hint; EmptyState for no query (“Try @sanaqueen, ‘vibes’ or #goodvibes”) and for no results.

CONTACT (`src/pages/Contact.tsx`) — `/contact`
- Info card: official email as big `mailto:snapglowofficial@gmail.com` CTA button + “we reply within 24 hours” (honest: it's the stated intent).
- Form (name, email, subject select, message) that on submit **composes a mailto** (`window.location.href = mailto:…?subject=…&body=…`) with a clear note: “This opens your email app — messages are sent by you, not stored on a server.” Validate first.
- Quick links card (Privacy, Terms, Guidelines, FAQ anchor on page? keep 3 links + email card).

LEGAL (`src/pages/Privacy.tsx`, `Terms.tsx`, `Guidelines.tsx`)
- Honest, feature-based. Privacy: demo mode localStorage data, no accounts, mailto contact, public demo content, deletion = Reset demo data / clear browser storage, no invented company/address/certifications. Terms: eligibility (13+), acceptable use, user content license (demo), no Snapchat affiliation, demo limitations, contact email. Guidelines: be kind, original content only, no spam/hate, reporting flow (demo), streak honesty note, consequences in production.
- Prose styling: max-w-3xl, h2 sections, updated date “October 2026”.

NOTFOUND (`src/pages/NotFound.tsx`) — `*`
- Big “404”, friendly copy, search box (→ /search), links home/discover/create. Export default component (App imports it; other pages may import it for missing ids).

CREATE (`src/pages/Create.tsx`) — `/create` (noindex)
- 4 steps with `Stepper`: 1 Upload Image, 2 Customize, 3 Preview, 4 Publish.
- Step 1: drag-and-drop + click file input; validate type (jpeg/png/webp/gif) & size ≤ 5MB; preview thumb; “Use sample art instead” option (generative art); replace/remove buttons; error text region (`role="alert"`).
- Step 2: two-column like reference — left: display name (Field), username (Field, validated), caption (TextArea), streak number input + note “Streak counts are entered by you and are not verified by Snapchat.”; right: template grid (7 `TEMPLATES`, radio-style cards with mini CardArt + name, keyboard accessible), badge picker (6 badges, toggle pills), background tint swatches (light tints that frame the preview: white/cream/lav/mint/cyantint/blush).
- Step 3: live large preview (reuse the preview component you build) + checklist summary.
- Step 4: Download PNG (calls `downloadCardPng` from `lib/renderCard` — show progress state then success; on failure show error, never claim success) + Publish (requires demo profile → else prompt to `/signin`; calls `sg.publishCard`; on ok navigate to `/cards/:id`).
- Keep ALL editor surfaces light. Back/Next navigation, step validation.

CARD PAGE (`src/pages/CardPage.tsx`) — `/cards/:id` (noindex)
- Large card render + owner row (Avatar, name, FollowButton), like button (`CardLikeButton`), caption, template name, streak (with unverified note), badges, created date, DemoBadge.
- Actions: Download PNG (`downloadCardPng`), Share (`ShareRow` with `siteUrl()` URL), ReportButton, “Open creator profile”.
- “More from {name}” grid. Missing id → NotFound.

DASHBOARD (`src/pages/Dashboard.tsx`) — `/dashboard` (noindex)
- If no profile: EmptyState → sign in (demo) CTA.
- Header: Avatar, name, handle, bio (editable via small form → `sg.updateProfile`), stats row (`Stat`: cards, likes received, wins, followers).
- Tabs: My Cards / My Posts / My Battles / Achievements.
- My Cards: grid of my cards with Download + “view” links; empty → Create CTA.
- My Posts: my posts via PostCard; “New post” composer (TextArea + optional card select → `sg.createPost`).
- My Battles: battles involving my cards + “Create battle” link.
- Achievements: `computeAchievements` grid with unlocked/locked styling.
- Sign out button + storage warning if `!sg.state.storageOk`.

SIGNIN (`src/pages/SignIn.tsx`) — `/signin` (noindex)
- Tabs: Sign in / Create demo profile / Recover access.
- Sign in tab: honestly explains there are no real accounts yet — the form IS the demo profile creator (display name + username) with the banner: “Demo mode — sign in creates a local demo profile only. No password, nothing leaves this browser.”
- Create tab: same form, framed as onboarding (pick name, username, hue choice swatches).
- Recover tab: explains no passwords exist in demo; production plan = email magic link via Supabase Auth (docs/BACKEND_SETUP.md).
- On success → navigate('/dashboard'). Validate inputs; show errors.

FEED (`src/pages/Feed.tsx`) — `/feed`
- `Tabs` newest/trending/popular wired to `feedPosts(sg.state, filter)` — real computed ordering.
- Composer card at top (if profile; else prompt to sign in): TextArea + Post button → `sg.createPost`.
- Post list via `<PostCard>`; EmptyState when filter yields none.
- “Sample posts” DemoBadge note.

POST PAGE (`src/pages/PostPage.tsx`) — `/posts/:id` (noindex)
- Full PostCard-style detail + comments list (Avatar, name, timeAgo, text; delete own via `sg.deleteComment`), comment composer (requires profile), ShareRow, ReportButton, “More from this creator”. Missing → NotFound.

PROFILE (`src/pages/Profile.tsx`) — `/u/:username` (noindex)
- Cover band (pale gradient), Avatar xl, name + DemoBadge, handle, bio, joined date, FollowButton / Edit (if me → link dashboard).
- Stats: cards, likes, wins, followers (all with DemoBadge tooltip context).
- Tabs: Cards (FlexCard grid → /cards/:id) / Posts (PostCard list) / Achievements (`computeAchievements`).
- Missing user → NotFound.

BATTLES (`src/pages/Battles.tsx`) — `/battles`
- Hero header + “Create Battle” CtaButton (→ /battles/new).
- Live battles: `BattleCard` head-to-head (see BattlePage spec for the component — put shared `VersusCard` in this file and export it for BattlePage? NO — cross-page imports get messy. Instead: implement the versus layout inline in each file, or create `src/components/Versus.tsx` YOURSELF if you're assigned Battles pages and export `VersusBattle` from there. The Battles-pages agent owns `src/components/Versus.tsx`.)
- Ended battles list with winner/tie chips linking to results.

BATTLE NEW (`src/pages/BattleNew.tsx`) — `/battles/new` (noindex)
- Title field, two card pickers (select from published cards, grouped by owner, with mini previews), duration select (6/12/24/48h, default 12), live summary of the matchup, Create → `sg.createBattle` → navigate to `/battles/:id`. Requires demo profile.

BATTLE PAGE (`src/pages/BattlePage.tsx`) — `/battles/:id` (noindex)
- Symmetrical head-to-head: creator header (Avatar, name, handle) above each card, big VS badge center, card art both sides, vote counts with DemoBadge, `Countdown`, vote buttons (lime left / violet right, `aria-pressed` when I voted), one-vote-per-demo-identity enforced by store, ended → link to results.
- ShareRow with the battle URL (unique shareable URL), ReportButton, demo-voting disclaimer.
- If ended → show result summary + link to `/battles/:id/results`.

BATTLE RESULTS (`src/pages/BattleResults.tsx`) — `/battles/:id/results` (noindex)
- Winner banner (or tie banner: “It's a tie — both creators share the crown”), animated vote bars (percentage, respect reduced-motion), exact tallies with DemoBadge, “Finalized from stored votes at {endsAt}” transparency note, rematch CTA (→ /battles/new), back to battles.
- If battle still live → Countdown + link to vote.

LEADERBOARDS (`src/pages/Leaderboards.tsx`) — `/leaderboards/:kind`
- Validate `:kind` against daily/weekly/most-liked/most-wins/rising/recent-winners else `<Navigate to="/leaderboards/daily" replace/>`.
- Tabs for the 6 kinds (+ note that “recent winners” shows battles).
- Rows: rank (1–3 get crown/medal icons), Avatar, name + DemoBadge, Cards/Likes/Wins columns; responsive (stack on mobile).
- Right promo card (like reference): crown icon, “Become a Top Creator”, copy, CtaButton → /create.
- recent-winners kind: list of ended battles with winner/tie chips → results links.
- most-liked kind: rank CARDS (FlexCard) instead of users.
- “Demo standings — computed from sample data” caption under the table.

HALL OF FAME (`src/pages/HallOfFame.tsx`) — `/hall-of-fame`
- All-time top 3 podium (gold/silver/bronze styling, light!) from `leaderboard(sg.state,'most-wins')`, then ranks 4–6 grid; each with wins count + DemoBadge; intro copy “Legendary creators. Timeless flexes.”

ADMIN (`src/pages/Admin.tsx`) — `/admin` (noindex)
- **Do NOT build a fake dashboard.** Page title “Admin / Moderation — setup required”.
- Explain: no admin exists in demo mode; list the secure setup steps (Supabase project, `admins` table + RLS, server-side role checks, never frontend flags, audit log table) with a link to `docs/BACKEND_SETUP.md`; show current backend mode badge (`BACKEND_MODE`); list what the future panel will include (metrics, report queue, audit log). Light info cards only.
