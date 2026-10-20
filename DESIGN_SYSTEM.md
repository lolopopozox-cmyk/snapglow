# Snap Glow — Design System

**Current version: v7 "Snap Pop"** (bold graphic pop-brutalism). This document is the
source of truth for the visual language. Previous systems: v1 (rounded pastel), v2
(premium pastel), v3–v4 (fantasy sky), v5 (editorial premium), v6 (Skyline Pop).
v7 is a total break — new palette, new type, new structure, new surface language.

---

## 1. Direction

Snap Pop takes its energy from the Snapchat world — vivid yellow, sticker
culture, bold graphic shapes — **without** copying Snapchat's logo, name or
brand assets. Everything is flat, bordered and confident:

- **Flat vivid color** — no pastel gradients as a design language.
- **2px ink borders everywhere** — cards, buttons, panels, chips, fields.
- **Hard offset shadows** — solid ink shadows (`6px 6px 0`), never blurred.
- **Sticker badges** — slightly rotated chips with borders + hard shadows.
- **Halftone dot patterns** — the texture of the system (replaces film grain).
- **Light backgrounds only** — yellow / cream / white / flat tints. Ink
  (`#141414`) is for text, borders and shadows ONLY, never large surfaces.

## 2. Palette

| Token | Value | Use |
|---|---|---|
| `sun` | `#FFCE00` | Primary — CTAs, logo tile, marquee, final CTA panel |
| `sunsoft` | `#FFDF4D` | CTA hover |
| `sun-tint` | `#FFF3B8` | Page heroes, pale-yellow sections |
| `cream` / `paper` | `#FFF9E8` | Page background |
| `ink` | `#141414` | Text, borders, hard shadows (never surfaces) |
| `ink-soft` | `#3D3D38` | Secondary text |
| `ink-mute` | `#7C7668` | Captions, meta |
| `brand-violet` | `#7C3AED` | Secondary pop — vote-B side, level badges |
| `brand-pink` | `#FF5CA8` | Accent pop — stickers, vote bars |
| `brand-sky` | `#38BDF8` | Third accent — feature panels |
| Tints | `lav #EDE9FE`, `mint #DCFCE7`, `blush #FFD9EA`, `cyantint #D8F3FF`, `peach #FFE3B3` | Flat section / card fills |

Tailwind note: the legacy token names (`line`, `sky`, `lav`, `mint`, …) are
kept in `tailwind.config.js` but remapped — `line` IS ink, `sky` (tint) is
pale yellow. Pages inherit v7 through the tokens.

## 3. Typography

| Role | Font | Notes |
|---|---|---|
| Display | **Unbounded** (Google Fonts, 500–900) | Chunky, futuristic, unmistakable. Headlines, logo, VS disc, big numbers. Tracking −0.01em. |
| Labels / nav / buttons | **Space Grotesk** (500–700) | Stickers, nav links, button labels, meta. |
| Body | **Inter** (400–800) | Paragraphs, forms, UI text. |

- `.hero-display` — Unbounded 800, uppercase, `clamp(2.5rem, 7.2vw, 6.25rem)`,
  line-height 1.04.
- `.marker` — yellow marker highlight band behind one headline word.
- `.grad-text` — vivid violet → hot pink gradient text, used sparingly
  (e.g. rank #1).
- The canvas PNG exporter (`src/lib/renderCard.ts`) draws card titles in
  Unbounded to match.

## 4. Surface language

- **`.card-surface`** — white, `2px solid ink`, radius 20px, shadow
  `6px 6px 0 ink`.
- **`.card-hover`** — on hover the card translates −2px and the shadow grows
  to `9px 9px 0` (physical lift against the hard shadow).
- **Buttons** (`.btn-cta` yellow / `.btn-violet` / `.btn-ghost` white) — flat
  fill, 2px ink border, pill shape, hard shadow `5px 5px 0`; hover presses
  to `3px 3px 0` with a 2px translate; active fully presses in. This physical
  press feel is a signature interaction.
- **`.sticker` / `.eyebrow`** — white (or colored) pill chip, 2px ink border,
  `3px 3px 0` shadow, Space Grotesk uppercase; usually rotated −2°…+3°.
- **`.page-hero`** — flat pale-yellow tint panel, 2px ink border, hard shadow.
  No artwork panels (the fantasy sky is retired as page dressing; template
  art lives INSIDE cards as content).
- **`.nav-bar`** — flat white header, 2px ink bottom border.
- **`.halftone`** — radial-dot pattern patches for decoration.
- Tailwind hard shadows: `shadow-pop` 3px, `shadow-soft` 4px,
  `shadow-hard` 6px, `shadow-lift` 7px, `shadow-hard-lg` 10px — all solid ink.

## 5. Home structure

Centered composition (a deliberate break from the old left-text/right-cards):

1. **Hero** — cream + halftone; rotated sticker eyebrow; MEGA centered
   Unbounded headline ("Show your *vibe,* / get noticed.", marker highlight);
   centered subtext + CTA row; **fan of 5 flex cards** rotated −12°…+12°,
   overlapping, center card largest, with two integrated sticker badges
   ("100% Free", "No password needed").
2. **Marquee ticker** — full-bleed yellow strip, 2px ink top/bottom borders,
   Unbounded items separated by ✦, CSS scroll animation (stops under
   `prefers-reduced-motion`).
3. **Daily challenge** — violet sticker-style strip with a rotated sticker
   tag and yellow CTA.
4. **Features** — two large flat-color panels (sky / violet) with template
   art framed inside an ink border, plus two tint cards.
5. **How it works** — 4 flat-tint cards with big ghost numbers.
6. **Trending rail**, **live battle preview** (two cards + huge yellow VS
   disc), **leaderboard preview**, **final CTA** (giant yellow panel, ink
   type, violet primary button).

## 6. Rules that never change

- Exact brand text **"Snap Glow"** — never append "AI".
- **No dark page backgrounds** — ink never becomes a surface.
- **No fake stats, users or engagement** — honest empty states; hero cards
  are labeled product previews, not real people.
- **Fan-made disclaimer** stays in the footer; never claim Snap Inc.
  affiliation; never ask for Snapchat passwords.
- Adsterra slots stay labeled placeholders, never adjacent to vote/download
  buttons.
- Accessibility: visible violet focus rings, `prefers-reduced-motion`
  disables marquee/reveal/press animations, content is visible without JS
  (reveal is progressive enhancement only).
