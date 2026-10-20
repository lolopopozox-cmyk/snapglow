/**
 * High-resolution card PNG export.
 *  - 'feed' : 1080 × 1350 (4:5) — for the feed and profile grids
 *  - 'story': 1080 × 1920 (9:16) — sized for Snapchat Stories
 * Drawn on canvas — no clipped text: titles auto-fit and wrap.
 */
import type { FlexCardData, User } from './types';
import { badgeEmoji, templateById } from './templates';

export type ExportSize = 'feed' | 'story';

const FEED_W = 1080;
const FEED_H = 1350;
const STORY_W = 1080;
const STORY_H = 1920;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  base: number,
  min: number,
  weight: number,
): number {
  let size = base;
  ctx.font = `${weight} ${size}px "Unbounded", Inter, sans-serif`;
  while (size > min && ctx.measureText(text).width > maxWidth) {
    size -= 4;
    ctx.font = `${weight} ${size}px "Unbounded", Inter, sans-serif`;
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
  // ellipsis if text was cut
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
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read the image.'));
    img.src = src;
  });
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function brandPill(ctx: CanvasRenderingContext2D, W: number, ink: string) {
  ctx.font = '700 34px Inter, sans-serif';
  const pillText = 'SNAP GLOW';
  const pillW = ctx.measureText(pillText).width + 70;
  roundRect(ctx, (W - pillW) / 2, 56, pillW, 64, 32);
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fill();
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(pillText, W / 2, 90);
}

async function drawBackground(
  ctx: CanvasRenderingContext2D,
  card: FlexCardData,
  W: number,
  H: number,
  fullBleed: boolean,
) {
  const t = templateById(card.template);
  if (card.imageKind === 'upload' && card.imageDataUrl) {
    const img = await loadImage(card.imageDataUrl);
    if (fullBleed) {
      drawCover(ctx, img, 0, 0, W, H);
    } else {
      drawCover(ctx, img, 90, 170, W - 180, 640);
      ctx.save();
      roundRect(ctx, 90, 170, W - 180, 640, 48);
      ctx.strokeStyle = 'rgba(255,255,255,0.65)';
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.restore();
    }
    return;
  }
  const art = await loadImage(t.art);
  drawCover(ctx, art, 0, 0, W, H);
}

function streakLine(card: FlexCardData): string {
  const label = card.streakLabel.trim();
  return label ? `🔥 ${card.streak} · ${label}` : `🔥 ${card.streak}`;
}

export async function renderCardPng(
  card: FlexCardData,
  owner: User,
  size: ExportSize = 'feed',
): Promise<Blob> {
  const t = templateById(card.template);
  const W = size === 'story' ? STORY_W : FEED_W;
  const H = size === 'story' ? STORY_H : FEED_H;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available in this browser.');
  await document.fonts.ready.catch(() => undefined);

  if (size === 'story') {
    // ── 9:16 story layout: full-bleed art, text anchored to the bottom ──
    await drawBackground(ctx, card, W, H, true);
    const leg = ctx.createLinearGradient(0, H * 0.42, 0, H);
    leg.addColorStop(0, 'rgba(8,10,34,0)');
    leg.addColorStop(1, 'rgba(8,10,34,0.62)');
    ctx.fillStyle = leg;
    ctx.fillRect(0, 0, W, H);
    const sheen = ctx.createLinearGradient(0, 0, 0, H * 0.22);
    sheen.addColorStop(0, 'rgba(255,255,255,0.16)');
    sheen.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, W, H * 0.22);

    brandPill(ctx, W, t.ink);

    // streak chip
    ctx.font = '700 44px Inter, sans-serif';
    const sText = streakLine(card);
    const sW = ctx.measureText(sText).width + 64;
    roundRect(ctx, (W - sW) / 2, H - 640, sW, 76, 38);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sText, W / 2, H - 602);

    // title
    const maxTextW = W - 160;
    const titleSize = fitFont(ctx, card.title, maxTextW, 132, 64, 800);
    ctx.font = `800 ${titleSize}px "Unbounded", Inter, sans-serif`;
    const lines = wrapLines(ctx, card.title, maxTextW, 3);
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 28;
    let ty = H - 500;
    for (const ln of lines) {
      ctx.fillText(ln, W / 2, ty);
      ty += titleSize * 1.1;
    }
    ctx.shadowBlur = 0;

    // username + badges
    ctx.font = '700 46px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillText(`@${owner.username}`, W / 2, ty + 40);
    const badgeRow = card.badges.map(badgeEmoji).join('  ');
    if (badgeRow) {
      ctx.font = '64px Inter, sans-serif';
      ctx.fillText(badgeRow, W / 2, ty + 130);
    }
    ctx.font = '600 32px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText('Made with Snap Glow', W / 2, H - 80);
  } else {
    // ── 4:5 feed layout ──
    await drawBackground(ctx, card, W, H, false);
    // legibility: gentle bottom shade + soft vignette
    const leg = ctx.createLinearGradient(0, H * 0.45, 0, H);
    leg.addColorStop(0, 'rgba(8,10,34,0)');
    leg.addColorStop(1, 'rgba(8,10,34,0.42)');
    ctx.fillStyle = leg;
    ctx.fillRect(0, 0, W, H);
    const sheen = ctx.createLinearGradient(0, 0, 0, H * 0.3);
    sheen.addColorStop(0, 'rgba(255,255,255,0.18)');
    sheen.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, W, H * 0.3);

    brandPill(ctx, W, t.ink);

    if (!(card.imageKind === 'upload' && card.imageDataUrl)) {
      // avatar monogram floating directly on the artwork (matches the UI card)
      const initials = owner.displayName
        .split(/\s+/)
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
      const cx = W / 2;
      const cy = 170 + 640 / 2 - 40;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = 30;
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.beginPath();
      ctx.arc(cx, cy, 130, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#3B2A6E';
      ctx.font = '800 110px "Unbounded", Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(initials, cx, cy + 6);
    }

    // title (auto-fit, wrapped, never clipped)
    const maxTextW = W - 220;
    const titleSize = fitFont(ctx, card.title, maxTextW, 104, 54, 800);
    ctx.font = `800 ${titleSize}px "Unbounded", Inter, sans-serif`;
    const lines = wrapLines(ctx, card.title, maxTextW, 2);
    ctx.fillStyle = t.ink;
    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = 24;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let ty = 950;
    for (const ln of lines) {
      ctx.fillText(ln, W / 2, ty);
      ty += titleSize * 1.08;
    }
    ctx.shadowBlur = 0;

    // username
    ctx.font = '700 44px Inter, sans-serif';
    ctx.fillStyle = t.sub;
    ctx.fillText(`@${owner.username}`, W / 2, ty + 30);

    // streak + badges
    const badgeRow = card.badges.map(badgeEmoji).join('  ');
    ctx.font = '700 46px Inter, sans-serif';
    ctx.fillStyle = t.ink;
    const sText = badgeRow ? `${streakLine(card)}   ${badgeRow}` : streakLine(card);
    ctx.fillText(sText, W / 2, ty + 108);

    // footer note
    ctx.font = '600 30px Inter, sans-serif';
    ctx.fillStyle = t.sub;
    ctx.fillText('Made with Snap Glow', W / 2, H - 70);
  }

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
