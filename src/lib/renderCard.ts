/**
 * Snap Glow premium card renderer (v2).
 * ─────────────────────────────────────────────────────────────
 * Layered, art-directed canvas engine. Six distinct themes (see
 * cardThemes.ts), deterministic seeded decoration, treated circular
 * photo (never covered), Snap Glow wordmark on every card, and
 * typography that auto-fits — plus a WYSIWYG canvas preview used by
 * the creator UI so the preview IS the exported image.
 *
 * Sizes: 'feed' 1080×1350 (4:5) · 'story' 1080×1920 (9:16).
 */
import type { FlexCardData, User } from './types';
import { badgeEmoji } from './templates';
import { resolveTheme, type CardTheme } from './cardThemes';

export type ExportSize = 'feed' | 'story';

const FEED_W = 1080;
const FEED_H = 1350;
const STORY_W = 1080;
const STORY_H = 1920;

/* ── small deterministic RNG (same card+seed → same art) ─────── */

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── canvas primitives ───────────────────────────────────────── */

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  base: number,
  min: number,
  weight: number,
  family = '"Unbounded", Inter, sans-serif',
): number {
  let size = base;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > min && ctx.measureText(text).width > maxWidth) {
    size -= 4;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const trial = line ? `${line} ${w}` : w;
    if (ctx.measureText(trial).width <= maxWidth) {
      line = trial;
    } else {
      if (line) lines.push(line);
      line = w;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) lines.length = maxLines;
  const joined = lines.join(' ');
  if (joined.length < text.length && lines.length) {
    let last = lines[lines.length - 1];
    while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    lines[lines.length - 1] = `${last}…`;
  }
  return lines;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read the image.'));
    img.src = src;
  });
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/* ── theme background painters ───────────────────────────────── */

function paintBase(ctx: CanvasRenderingContext2D, t: CardTheme, W: number, H: number) {
  const g = ctx.createLinearGradient(0, 0, W * 0.4, H);
  g.addColorStop(0, t.bg[0]);
  g.addColorStop(0.55, t.bg[1]);
  g.addColorStop(1, t.bg[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function paintVignette(ctx: CanvasRenderingContext2D, W: number, H: number, strength = 0.28) {
  const g = ctx.createRadialGradient(W / 2, H * 0.42, Math.min(W, H) * 0.35, W / 2, H * 0.55, Math.max(W, H) * 0.78);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

/** Fine dot halftone texture, themed — gives printed richness. */
function paintHalftone(ctx: CanvasRenderingContext2D, t: CardTheme, W: number, H: number, seed: number, alpha = 0.05) {
  const rnd = mulberry32(seed);
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let i = 0; i < 420; i++) {
    const x = rnd() * W;
    const y = rnd() * H;
    const r = 1 + rnd() * 2.2;
    ctx.fillStyle = i % 2 ? t.accent : '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** NEON IDENTITY — duotone glow bands + scanlines + city haze. */
function paintNeon(ctx: CanvasRenderingContext2D, t: CardTheme, W: number, H: number, seed: number) {
  paintBase(ctx, t, W, H);
  const rnd = mulberry32(seed);
  // horizon haze bands
  for (let i = 0; i < 3; i++) {
    const y = H * (0.52 + i * 0.14);
    const g = ctx.createLinearGradient(0, y - 90, 0, y + 90);
    g.addColorStop(0, hexToRgba(i % 2 ? t.accent2 : t.accent, 0));
    g.addColorStop(0.5, hexToRgba(i % 2 ? t.accent2 : t.accent, 0.16));
    g.addColorStop(1, hexToRgba(i % 2 ? t.accent2 : t.accent, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, y - 90, W, 180);
  }
  // neon streaks
  ctx.save();
  ctx.globalAlpha = 0.22;
  for (let i = 0; i < 5; i++) {
    const x = rnd() * W;
    const h = 120 + rnd() * 380;
    const grad = ctx.createLinearGradient(x, H * 0.45, x, H * 0.45 + h);
    grad.addColorStop(0, i % 2 ? t.accent2 : t.accent);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, H * 0.45, 4 + rnd() * 5, h);
  }
  ctx.restore();
  // scanlines
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#ffffff';
  for (let y = 0; y < H; y += 8) ctx.fillRect(0, y, W, 2);
  ctx.restore();
  paintHalftone(ctx, t, W, H, seed + 7, 0.04);
  paintVignette(ctx, W, H, 0.3);
}

/** CLEAN SIGNATURE — paper warmth, faint grid, ink accents. */
function paintClean(ctx: CanvasRenderingContext2D, t: CardTheme, W: number, H: number, seed: number) {
  paintBase(ctx, t, W, H);
  // soft sun wash
  const sun = ctx.createRadialGradient(W * 0.78, H * 0.16, 40, W * 0.78, H * 0.16, W * 0.7);
  sun.addColorStop(0, hexToRgba(t.accent, 0.34));
  sun.addColorStop(1, hexToRgba(t.accent, 0));
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, W, H);
  // faint dot grid
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#141414';
  const step = 72;
  for (let x = step / 2; x < W; x += step) {
    for (let y = step / 2; y < H; y += step) {
      ctx.beginPath();
      ctx.arc(x, y, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
  paintHalftone(ctx, t, W, H, seed + 3, 0.03);
}

/** STREAK LEGEND — heat flare + rising embers. */
function paintStreak(ctx: CanvasRenderingContext2D, t: CardTheme, W: number, H: number, seed: number) {
  paintBase(ctx, t, W, H);
  // bottom heat flare
  const flare = ctx.createRadialGradient(W / 2, H * 0.9, 60, W / 2, H * 0.86, W * 0.85);
  flare.addColorStop(0, hexToRgba(t.accent2, 0.5));
  flare.addColorStop(0.5, hexToRgba(t.accent, 0.22));
  flare.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = flare;
  ctx.fillRect(0, 0, W, H);
  // embers
  const rnd = mulberry32(seed);
  ctx.save();
  for (let i = 0; i < 60; i++) {
    const x = rnd() * W;
    const y = H * (0.35 + rnd() * 0.62);
    const r = 1.5 + rnd() * 3.5;
    ctx.globalAlpha = 0.14 + rnd() * 0.3;
    ctx.fillStyle = i % 3 ? t.accent2 : '#FFFBEB';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  paintVignette(ctx, W, H, 0.34);
}

/** COSMIC PROFILE — starfield, nebulae, light rays. */
function paintCosmic(ctx: CanvasRenderingContext2D, t: CardTheme, W: number, H: number, seed: number) {
  paintBase(ctx, t, W, H);
  const rnd = mulberry32(seed);
  // nebula blobs
  for (let i = 0; i < 4; i++) {
    const cx = rnd() * W;
    const cy = rnd() * H;
    const r = W * (0.25 + rnd() * 0.3);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, hexToRgba(i % 2 ? t.accent : t.accent2, 0.16));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  // starfield (two depth layers)
  for (let layer = 0; layer < 2; layer++) {
    ctx.save();
    for (let i = 0; i < 90; i++) {
      const x = rnd() * W;
      const y = rnd() * H;
      const r = layer ? 0.8 + rnd() * 1.6 : 1.6 + rnd() * 2.6;
      ctx.globalAlpha = layer ? 0.35 + rnd() * 0.4 : 0.55 + rnd() * 0.45;
      ctx.fillStyle = i % 7 === 0 ? t.accent2 : '#FFFFFF';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  // diagonal light rays
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.translate(W * 0.8, 0);
  ctx.rotate((Math.PI / 180) * 28);
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i % 2 ? t.accent : '#ffffff';
    ctx.fillRect(-W, i * 130, W * 2.2, 26 + i * 8);
  }
  ctx.restore();
  paintVignette(ctx, W, H, 0.4);
}

/** ELITE FLEX — black-tie deco: gold beams + corner frame drawn later. */
function paintElite(ctx: CanvasRenderingContext2D, t: CardTheme, W: number, H: number, seed: number) {
  paintBase(ctx, t, W, H);
  // gold beam wash from top-left
  const beam = ctx.createLinearGradient(0, 0, W, H);
  beam.addColorStop(0, hexToRgba(t.accent, 0.14));
  beam.addColorStop(0.4, 'rgba(0,0,0,0)');
  ctx.fillStyle = beam;
  ctx.fillRect(0, 0, W, H);
  // diagonal satin stripes
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-Math.PI / 6);
  for (let i = -14; i < 14; i++) {
    ctx.fillStyle = t.accent;
    ctx.fillRect(i * 110, -H, 38, H * 2);
  }
  ctx.restore();
  paintHalftone(ctx, t, W, H, seed + 11, 0.035);
  paintVignette(ctx, W, H, 0.42);
}

/** CHAMPION EDITION — spotlight cone + confetti flecks. */
function paintChampion(ctx: CanvasRenderingContext2D, t: CardTheme, W: number, H: number, seed: number) {
  paintBase(ctx, t, W, H);
  // stadium spotlight cone
  ctx.save();
  const cone = ctx.createLinearGradient(W / 2, -80, W / 2, H * 0.72);
  cone.addColorStop(0, hexToRgba(t.accent, 0.4));
  cone.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = cone;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 110, -80);
  ctx.lineTo(W / 2 + 110, -80);
  ctx.lineTo(W / 2 + W * 0.52, H * 0.72);
  ctx.lineTo(W / 2 - W * 0.52, H * 0.72);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // victory confetti
  const rnd = mulberry32(seed);
  ctx.save();
  for (let i = 0; i < 48; i++) {
    const x = rnd() * W;
    const y = H * (0.05 + rnd() * 0.5);
    ctx.globalAlpha = 0.12 + rnd() * 0.3;
    ctx.fillStyle = i % 3 === 0 ? t.accent2 : t.accent;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rnd() * Math.PI);
    ctx.fillRect(-7, -3, 14, 6);
    ctx.restore();
  }
  ctx.restore();
  paintVignette(ctx, W, H, 0.32);
}

function paintBackground(ctx: CanvasRenderingContext2D, themeId: string, t: CardTheme, W: number, H: number, seed: number) {
  switch (themeId) {
    case 'clean-signature': return paintClean(ctx, t, W, H, seed);
    case 'streak-legend': return paintStreak(ctx, t, W, H, seed);
    case 'cosmic-profile': return paintCosmic(ctx, t, W, H, seed);
    case 'elite-flex': return paintElite(ctx, t, W, H, seed);
    case 'champion-edition': return paintChampion(ctx, t, W, H, seed);
    default: return paintNeon(ctx, t, W, H, seed);
  }
}

/* ── branded elements ────────────────────────────────────────── */

/** The Snap Glow wordmark pill — brand-yellow, ink text (site identity). */
function drawWordmark(ctx: CanvasRenderingContext2D, W: number, y: number, scale = 1) {
  const text = 'SNAP GLOW';
  ctx.save();
  ctx.font = `700 ${34 * scale}px "Space Grotesk", Inter, sans-serif`;
  const tw = ctx.measureText(text).width;
  const pillW = tw + 56 * scale;
  const pillH = 58 * scale;
  const x = (W - pillW) / 2;
  // pill
  ctx.shadowColor = 'rgba(0,0,0,0.28)';
  ctx.shadowBlur = 18 * scale;
  ctx.shadowOffsetY = 5 * scale;
  ctx.fillStyle = '#FFCE00';
  roundRect(ctx, x, y, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  // ink border (neo-brutalist signature)
  ctx.lineWidth = 3 * scale;
  ctx.strokeStyle = '#141414';
  roundRect(ctx, x, y, pillW, pillH, pillH / 2);
  ctx.stroke();
  // text
  ctx.fillStyle = '#141414';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, W / 2, y + pillH / 2 + 1 * scale);
  ctx.restore();
}

/** Treated circular photo — the user stays the hero, never covered. */
function drawPhotoCircle(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  initials: string,
  t: CardTheme,
  cx: number,
  cy: number,
  R: number,
  seed: number,
) {
  const rnd = mulberry32(seed + 99);
  // outer glow halo
  const halo = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.45);
  halo.addColorStop(0, hexToRgba(t.accent, 0.32));
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.45, 0, Math.PI * 2);
  ctx.fill();

  // shadow + photo disc
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 44;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R - 5, 0, Math.PI * 2);
  ctx.clip();
  if (img) {
    const scale = Math.max((2 * (R - 5)) / img.width, (2 * (R - 5)) / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
  } else {
    // initials fallback: gradient disc from the theme accents
    const g = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
    g.addColorStop(0, t.accent);
    g.addColorStop(1, t.accent2);
    ctx.fillStyle = g;
    ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    ctx.fillStyle = '#141414';
    ctx.font = `800 ${Math.round(R * 0.62)}px "Unbounded", Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, cx, cy + R * 0.04);
  }
  ctx.restore();

  // inner rim light + ink ring (brand signature)
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R - 4, 0, Math.PI * 2);
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#141414';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, R - 10, -Math.PI * 0.85, -Math.PI * 0.15);
  ctx.lineWidth = 5;
  ctx.strokeStyle = `rgba(255,255,255,${0.55 + rnd() * 0.2})`;
  ctx.stroke();
  ctx.restore();
}

/** Rounded chip with emoji + text — used for streak + badges. */
function drawChip(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  t: CardTheme,
  dark: boolean,
  scale = 1,
): number {
  ctx.save();
  ctx.font = `700 ${36 * scale}px "Space Grotesk", Inter, sans-serif`;
  const tw = ctx.measureText(text).width;
  const w = tw + 52 * scale;
  const h = 64 * scale;
  roundRect(ctx, cx - w / 2, y, w, h, h / 2);
  ctx.fillStyle = dark ? 'rgba(10,8,24,0.55)' : 'rgba(255,255,255,0.9)';
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = dark ? hexToRgba(t.accent, 0.8) : '#141414';
  roundRect(ctx, cx - w / 2, y, w, h, h / 2);
  ctx.stroke();
  ctx.fillStyle = dark ? '#FFFFFF' : '#141414';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, y + h / 2 + 1);
  ctx.restore();
  return w;
}

/** Elite/champion decorative corner frame. */
function drawDecoCorners(ctx: CanvasRenderingContext2D, W: number, H: number, color: string, inset = 46, len = 130) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 7;
  const corners: Array<[number, number, number, number]> = [
    [inset, inset, 1, 1],
    [W - inset, inset, -1, 1],
    [inset, H - inset, 1, -1],
    [W - inset, H - inset, -1, -1],
  ];
  for (const [x, y, dx, dy] of corners) {
    ctx.beginPath();
    ctx.moveTo(x + dx * len, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + dy * len);
    ctx.stroke();
  }
  ctx.restore();
}

/** Laurel-style geometric arcs for champion (abstract, on-brand). */
function drawVictoryArcs(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, t: CardTheme) {
  ctx.save();
  ctx.strokeStyle = hexToRgba(t.accent, 0.65);
  ctx.lineWidth = 8;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(cx + side * (R * 0.62), cy, R * (0.5 + i * 0.16), side < 0 ? Math.PI * 0.75 : Math.PI * 0.25, side < 0 ? Math.PI * 1.25 : Math.PI * 0.75);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/* ── main layout ─────────────────────────────────────────────── */

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || '★';
}

async function photoFor(card: FlexCardData, owner: User): Promise<HTMLImageElement | null> {
  const src = card.imageKind === 'upload' ? (card.imageDataUrl ?? cardImagePathUrl(card)) : null;
  const finalSrc = src ?? owner.avatar ?? null;
  if (!finalSrc) return null;
  try {
    return await loadImage(finalSrc);
  } catch {
    return null;
  }
}

/** Public Supabase storage URL for an uploaded card photo. */
export function cardImagePathUrl(card: FlexCardData): string | null {
  if (!card.imagePath) return null;
  const env = (import.meta as unknown as { env?: Record<string, string> }).env ?? {};
  const base = env.VITE_SUPABASE_URL?.replace(/\/$/, '');
  return base ? `${base}/storage/v1/object/public/card-images/${card.imagePath}` : null;
}

async function drawCard(
  ctx: CanvasRenderingContext2D,
  card: FlexCardData,
  owner: User,
  W: number,
  H: number,
  story: boolean,
) {
  const theme = resolveTheme(card.template);
  const seed = hashSeed(card.id + owner.id);
  const photo = await photoFor(card, owner);
  await document.fonts.ready.catch(() => undefined);

  paintBackground(ctx, theme.id, theme, W, H, seed);

  // ── top band: wordmark (every card) ──
  drawWordmark(ctx, W, story ? 120 : 72, 1);

  // ── theme extras around the photo ──
  const cx = W / 2;
  const photoR = story ? 300 : 268;
  const photoCy = story ? H * 0.36 : 560;

  if (theme.id === 'elite-flex') drawDecoCorners(ctx, W, H, hexToRgba(theme.accent, 0.8));
  if (theme.id === 'champion-edition') {
    drawVictoryArcs(ctx, cx, photoCy, photoR * 1.28, theme);
    drawDecoCorners(ctx, W, H, hexToRgba(theme.accent, 0.75), 40, 110);
  }
  if (theme.id === 'streak-legend' && card.streak > 0) {
    // giant streak numeral ghosted behind the photo
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.font = `900 ${story ? 560 : 500}px "Unbounded", Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = theme.accent2;
    ctx.fillText(String(card.streak), cx, photoCy + 30);
    ctx.restore();
  }
  if (theme.id === 'cosmic-profile') {
    // orbit ring around the photo
    ctx.save();
    ctx.translate(cx, photoCy);
    ctx.rotate(-0.32);
    ctx.strokeStyle = hexToRgba(theme.accent, 0.55);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, 0, photoR * 1.42, photoR * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    // orbit sparkle
    ctx.fillStyle = theme.accent2;
    ctx.beginPath();
    ctx.arc(photoR * 1.36, -photoR * 0.18, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── hero photo ──
  drawPhotoCircle(ctx, photo, initialsOf(owner.displayName), theme, cx, photoCy, photoR, seed);

  // ── bottom scrim for legibility on dark themes ──
  if (theme.id !== 'clean-signature') {
    const scrimTop = story ? H * 0.58 : 900;
    const scrim = ctx.createLinearGradient(0, scrimTop - 140, 0, H);
    scrim.addColorStop(0, 'rgba(6,4,18,0)');
    scrim.addColorStop(1, 'rgba(6,4,18,0.55)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, scrimTop - 140, W, H - scrimTop + 140);
  }

  // ── name (auto-fit, wrap 2) ──
  const nameY = story ? H * 0.66 : 940;
  const maxTextW = W - 170;
  const baseSize = story ? 108 : 96;
  const nameSize = fitFont(ctx, owner.displayName.toUpperCase(), maxTextW, baseSize, 48, 800);
  ctx.font = `800 ${nameSize}px "Unbounded", Inter, sans-serif`;
  const lines = wrapLines(ctx, owner.displayName.toUpperCase(), maxTextW, 2);

  // theme-specific name treatment
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let ny = nameY;
  for (const ln of lines) {
    if (theme.id === 'neon-identity') {
      ctx.shadowColor = hexToRgba(theme.accent2, 0.85);
      ctx.shadowBlur = 34;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(ln, cx, ny);
    } else if (theme.id === 'elite-flex' || theme.id === 'champion-edition') {
      const g = ctx.createLinearGradient(cx - maxTextW / 2, ny - 60, cx + maxTextW / 2, ny + 60);
      g.addColorStop(0, theme.accent2);
      g.addColorStop(0.5, theme.accent);
      g.addColorStop(1, theme.accent2);
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 16;
      ctx.fillStyle = g;
      ctx.fillText(ln, cx, ny);
    } else {
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 18;
      ctx.fillStyle = theme.ink;
      ctx.fillText(ln, cx, ny);
    }
    ny += nameSize * 1.12;
  }
  ctx.restore();

  // accent underline bar
  const underY = ny - nameSize * 0.42;
  const barW = Math.min(300, maxTextW * 0.5);
  ctx.save();
  ctx.fillStyle = theme.accent;
  roundRect(ctx, cx - barW / 2, underY, barW, 12, 6);
  ctx.fill();
  ctx.restore();

  // ── handle ──
  const handleY = underY + 66;
  ctx.save();
  ctx.font = `700 44px "Space Grotesk", Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = theme.accent;
  ctx.fillText(`@${owner.username}`, cx, handleY);
  ctx.restore();

  // ── caption (optional, 1 line) ──
  let nextY = handleY + 64;
  if (card.caption.trim()) {
    ctx.save();
    const capSize = fitFont(ctx, card.caption.trim(), W - 220, 38, 26, 600, '"Space Grotesk", Inter, sans-serif');
    ctx.font = `600 ${capSize}px "Space Grotesk", Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = theme.sub;
    ctx.fillText(card.caption.trim(), cx, nextY);
    ctx.restore();
    nextY += 56;
  }

  // ── streak + badges chips ──
  const dark = theme.id !== 'clean-signature';
  const chips: string[] = [];
  if (card.streak > 0) chips.push(`🔥 ${card.streak}${card.streakLabel.trim() ? ` · ${card.streakLabel.trim()}` : ''}`);
  for (const b of card.badges.slice(0, 4)) chips.push(badgeEmoji(b));
  if (chips.length) {
    // measure total width for a centered row (wrap to 2 rows if wide)
    ctx.font = '700 36px "Space Grotesk", Inter, sans-serif';
    const widths = chips.map((c) => ctx.measureText(c).width + 52);
    const gap = 22;
    const total = widths.reduce((a, b) => a + b, 0) + gap * (chips.length - 1);
    let rowY = nextY;
    const maxRowW = W - 140;
    let x = cx - Math.min(total, maxRowW) / 2;
    if (total > maxRowW) {
      // two centered rows: split roughly in half
      const half = Math.ceil(chips.length / 2);
      const drawRow = (items: string[], y: number) => {
        ctx.font = '700 36px "Space Grotesk", Inter, sans-serif';
        const ws = items.map((c) => ctx.measureText(c).width + 52);
        const tot = ws.reduce((a, b) => a + b, 0) + gap * (items.length - 1);
        let xx = cx - tot / 2;
        items.forEach((c, i) => {
          drawChipAt(ctx, c, xx, y, theme, dark, ws[i]);
          xx += ws[i] + gap;
        });
      };
      drawRow(chips.slice(0, half), rowY);
      drawRow(chips.slice(half), rowY + 84);
      rowY += 84;
    } else {
      chips.forEach((c, i) => {
        drawChipAt(ctx, c, x, rowY, theme, dark, widths[i]);
        x += widths[i] + gap;
      });
    }
    nextY = rowY + 84;
  }

  // ── footer line ──
  ctx.save();
  ctx.font = '600 30px "Space Grotesk", Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = dark ? 'rgba(255,255,255,0.66)' : 'rgba(20,20,20,0.55)';
  ctx.fillText('fan-made for Snapchatters · not affiliated with Snap Inc.', cx, H - 64);
  ctx.restore();
}

function drawChipAt(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  t: import('./cardThemes').CardTheme,
  dark: boolean,
  w: number,
) {
  const h = 64;
  ctx.save();
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = dark ? 'rgba(10,8,24,0.55)' : 'rgba(255,255,255,0.92)';
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = dark ? hexToRgba(t.accent, 0.8) : '#141414';
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.stroke();
  ctx.fillStyle = dark ? '#FFFFFF' : '#141414';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 36px "Space Grotesk", Inter, sans-serif';
  ctx.fillText(text, x + w / 2, y + h / 2 + 1);
  ctx.restore();
}

/* ── public API ──────────────────────────────────────────────── */

/** Renders the card onto an existing canvas element (WYSIWYG preview). */
export async function renderCardToCanvas(
  canvas: HTMLCanvasElement,
  card: FlexCardData,
  owner: User,
  size: ExportSize = 'feed',
): Promise<void> {
  const W = size === 'story' ? STORY_W : FEED_W;
  const H = size === 'story' ? STORY_H : FEED_H;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available in this browser.');
  await drawCard(ctx, card, owner, W, H, size === 'story');
}

export async function renderCardPng(
  card: FlexCardData,
  owner: User,
  size: ExportSize = 'feed',
): Promise<Blob> {
  const W = size === 'story' ? STORY_W : FEED_W;
  const H = size === 'story' ? STORY_H : FEED_H;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available in this browser.');
  await drawCard(ctx, card, owner, W, H, size === 'story');
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Could not encode the PNG.');
  return blob;
}

/** Triggers a browser download of the rendered card PNG. */
export async function downloadCardPng(
  card: FlexCardData,
  owner: User,
  size: ExportSize = 'feed',
): Promise<void> {
  const blob = await renderCardPng(card, owner, size);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = size === 'story' ? `snap-glow-story-${card.id}.png` : `snap-glow-${card.id}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
