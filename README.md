# Snap Glow 🟢

**The web home for Snapchat users — Show Your Vibe. Get Noticed.**

Snap Glow is a community site for **Snapchat users**: create flex and streak
cards, share them in the feed, battle head-to-head in 1v1 vote battles (each
contestant gets a shareable vote link), earn Glow Points, and climb the
leaderboards — including a Top Voters board for the community's most active
voters.

> **How accounts work.** Snap Glow uses site-local accounts: sign up with a
> display name, username and password (stored as a SHA-256 hash, never plain
> text). Everything lives in your browser's localStorage — there is no backend
> yet, so accounts don't sync across devices. See `docs/BACKEND_SETUP.md` for
> the production upgrade path.

**Fan-made utility.** Snap Glow is not affiliated with, endorsed by, or
sponsored by Snap Inc. It never asks for your Snapchat password.

## Quick start (Windows + VS Code)

You already have VS Code and npm installed. You do **not** need to install
anything else (Node.js 18+ is required — check with `node --version`).

1. **Extract the ZIP** — right-click `snap-glow-project.zip` → *Extract All*.
   You'll get a folder named `snap-glow-project`.
2. **Open the folder in VS Code** — File → *Open Folder…* → select
   `snap-glow-project`.
3. **Open a terminal** — menu *Terminal* → *New Terminal*.
4. **Install dependencies:**
   ```powershell
   npm install
   ```
   (First run downloads packages; it can take a few minutes.)
5. **Configure environment (optional):**
   ```powershell
   Copy-Item .env.example .env
   ```
   The site runs fine **without** this. Set `VITE_SITE_URL` to your real domain
   when you deploy (used for canonical URLs, sitemap and share links).
6. **Start the dev server:**
   ```powershell
   npm run dev
   ```
7. **Open the URL** printed in the terminal (usually
   http://localhost:5173) in your browser.
8. **Production build check:**
   ```powershell
   npm run build
   ```
   This must finish with no errors. It creates the `dist/` folder.
9. **Preview the production build** (optional):
   ```powershell
   npm run preview
   ```
   Then open the printed URL (usually http://localhost:4173).

## Going live

- **Deploy:** `docs/DEPLOY_VERCEL.md` — push to GitHub, import into Vercel,
  done. `vercel.json` is included.
- **Earn:** `docs/ADSTERRA_SETUP.md` — create an Adsterra publisher account,
  paste ad codes into `src/lib/ads.ts`, redeploy.
- **SEO:** `docs/SEO_SETUP.md` — Search Console steps, sitemap, notes.

## Project structure

```
snap-glow-project/
├── public/               # robots.txt, sitemap.xml, favicon, manifest, art/
├── src/
│   ├── components/       # Logo, Header, Footer, Seo, Toast, ui kit, Versus, AdSlot
│   ├── lib/              # types, store (data layer), auth (SHA-256),
│   │                     # challenges + points, templates, ads registry,
│   │                     # formatting, PNG card renderer (4:5 + 9:16 Story)
│   ├── pages/            # 22 page components → 29 routes (see below)
│   ├── App.tsx           # router + layout
│   ├── main.tsx          # entry
│   └── index.css         # design tokens
├── docs/
│   ├── ADSTERRA_SETUP.md # going live with ads
│   ├── BACKEND_SETUP.md  # Supabase upgrade path (schema, RLS, finalization)
│   ├── DEPLOY_VERCEL.md  # GitHub → Vercel steps
│   └── SEO_SETUP.md      # Search Console steps, sitemap, CSR caveat
├── DESIGN_SYSTEM.md      # colors, type, components
├── CONTRACTS.md          # component/data contracts for contributors
├── vercel.json           # Vercel build + SPA rewrites
├── .env.example          # placeholder env names only — no secrets
└── package.json
```

## Routes (29)

| Route | Page |
|---|---|
| `/` | Home (hero, Daily Challenge, trending, live battle, top creators) |
| `/discover` | Discover Snapchat creators |
| `/feed` | Community feed (newest / trending / popular) + composer |
| `/trending` | Trending cards |
| `/create` | Card creator (Upload → Customize → Preview → Publish), 4:5 + 9:16 Story PNG |
| `/cards/:id` | Card detail + PNG download (both sizes) |
| `/u/:username` | Public profile (cards, posts, achievements, level, points) |
| `/posts/:id` | Post detail + comments |
| `/battles` | Battles overview (ending soon, live, recently ended) |
| `/battles/new` | Create a battle |
| `/battles/:id` | Battle page (shareable URL, `?vote=a`/`?vote=b` vote links) |
| `/battles/:id/results` | Battle results (winner / tie) |
| `/leaderboards/daily`, `/weekly`, `/most-liked`, `/most-wins`, `/rising`, `/top-voters`, `/recent-winners` | Leaderboards |
| `/hall-of-fame` | Hall of Fame |
| `/search` | Search creators, cards, posts |
| `/contact` | Contact (mailto) |
| `/privacy`, `/terms`, `/guidelines` | Legal |
| `/signin` | Create account / log in |
| `/dashboard` | My cards, posts, battles, achievements, points |
| `/admin` | Admin/moderation **setup guide** (no fake panel) |
| `*` | 404 |

## Key systems

- **Accounts** — username + password, SHA-256 hashed, localStorage sessions.
  Gated features (create, vote, post, battle) show a friendly
  "Create your free account first" prompt when logged out.
- **Glow Points & levels** — earn points for creating (+10), voting (+2),
  commenting (+3), winning battles (+25), daily login (+5), Daily Challenge
  bonus (+15). Levels: Rising Star → Hot Creator → Superstar → Legend.
  Points are on-platform recognition only — never money, never payouts.
- **Vote battles** — 12h default countdown, one vote per account, live counts,
  per-contestant shareable vote links (`/battles/:id?vote=a`).
- **Top Voters** — leaderboard of most active voters; the #1 voter earns a
  permanent Top Voter crown badge.
- **Daily Challenge** — one Snap-themed card theme per day; creating for it
  earns bonus points.
- **Notifications** — the bell shows real events: likes milestones, new
  followers, battles ending soon/ended, level-ups, today's challenge.
- **Streak cards** — streak numbers are typed in by owners and are **not
  verified by Snapchat** (stated wherever streaks appear).
- **Ads** — five tasteful Adsterra slots (`src/lib/ads.ts`), never next to
  vote/download buttons. Placeholders render until you paste real codes.

## Honest limits (read before judging features)

- **No backend yet.** Accounts, cards, votes and points live in this browser
  only. Clearing site data wipes them; "Reset local data" in the footer does
  the same on purpose.
- **Voting is one-per-account in this browser**, not a certified election.
  Battles settle when the countdown ends.
- **No fake users.** A fresh install shows honest empty states
  ("Be the first to post!") instead of sample people.
- **Contact opens your email app** (mailto) — nothing is sent server-side.
- **No admin panel** ships — `/admin` documents the secure setup instead of
  faking one.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Type-check + production build into `dist/` |
| `npm run preview` | Serve the production build locally |

## Tech

React 19 · TypeScript · Vite 7 · Tailwind CSS 3.4 · React Router 7 ·
Lucide icons. Artwork: AI-generated backgrounds in `public/art/` + canvas PNG
export (1080×1350 feed, 1080×1920 Snapchat Story).
