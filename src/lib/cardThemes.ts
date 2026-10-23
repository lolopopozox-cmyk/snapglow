/**
 * Snap Glow premium card themes (v2 generator).
 *
 * Six genuinely distinct art directions — each is a different composition,
 * not a recolor. Themes unlock with Glow levels so progression feels real:
 *   Rising Star (0)   → Neon Identity, Clean Signature
 *   Hot Creator (100) → Streak Legend, Cosmic Profile
 *   Superstar (300)   → Elite Flex
 *   Legend (750)      → Champion Edition
 *
 * `minPoints` mirrors the level ladder in challenges.ts.
 */

export type ThemeStyle =
  | 'neon-identity'
  | 'clean-signature'
  | 'streak-legend'
  | 'cosmic-profile'
  | 'elite-flex'
  | 'champion-edition';

export interface CardTheme {
  id: ThemeStyle;
  name: string;
  blurb: string;
  /** Glow Points required to use this theme */
  minPoints: number;
  /** primary background colors (top → bottom) */
  bg: [string, string, string];
  /** headline text color */
  ink: string;
  /** secondary text color */
  sub: string;
  /** accent used for rings, chips, underline glows */
  accent: string;
  /** second accent for duotone effects */
  accent2: string;
  /** small emoji used on the picker tile */
  vibe: string;
}

export const CARD_THEMES: CardTheme[] = [
  {
    id: 'neon-identity',
    name: 'Neon Identity',
    blurb: 'Night-city neon — rim-lit photo, electric duotone type',
    minPoints: 0,
    bg: ['#0B0620', '#1B0F4A', '#0E2A6E'],
    ink: '#FFFFFF',
    sub: 'rgba(255,255,255,0.78)',
    accent: '#38BDF8',
    accent2: '#FF5CA8',
    vibe: '⚡',
  },
  {
    id: 'clean-signature',
    name: 'Clean Signature',
    blurb: 'Editorial minimalism — premium paper, perfect spacing',
    minPoints: 0,
    bg: ['#FFFDF6', '#FFF3D6', '#FFE9B8'],
    ink: '#141414',
    sub: 'rgba(20,20,20,0.62)',
    accent: '#FFCE00',
    accent2: '#7C3AED',
    vibe: '✒️',
  },
  {
    id: 'streak-legend',
    name: 'Streak Legend',
    blurb: 'Firestorm energy — giant streak numerals, sunset heat',
    minPoints: 100,
    bg: ['#2D0A05', '#8A1E0B', '#F59E0B'],
    ink: '#FFF7ED',
    sub: 'rgba(255,247,237,0.8)',
    accent: '#FB923C',
    accent2: '#FDE68A',
    vibe: '🔥',
  },
  {
    id: 'cosmic-profile',
    name: 'Cosmic Profile',
    blurb: 'Deep-space atmosphere — starfields, nebula glow, orbit ring',
    minPoints: 100,
    bg: ['#020118', '#150B3F', '#3B1178'],
    ink: '#F5F3FF',
    sub: 'rgba(245,243,255,0.75)',
    accent: '#A78BFA',
    accent2: '#67E8F9',
    vibe: '🌌',
  },
  {
    id: 'elite-flex',
    name: 'Elite Flex',
    blurb: 'Black-tie luxury — gold foil type, deco frame details',
    minPoints: 300,
    bg: ['#0A0A0C', '#17151A', '#241F14'],
    ink: '#F8F5EC',
    sub: 'rgba(248,245,236,0.68)',
    accent: '#E7C766',
    accent2: '#B48A2F',
    vibe: '👑',
  },
  {
    id: 'champion-edition',
    name: 'Champion Edition',
    blurb: 'Stadium spotlight — victory banner, laurel arcs, gold rush',
    minPoints: 750,
    bg: ['#1A1003', '#4A2A06', '#B97A0F'],
    ink: '#FFFBEA',
    sub: 'rgba(255,251,234,0.8)',
    accent: '#FFD34D',
    accent2: '#FF7A1A',
    vibe: '🏆',
  },
];

export function themeById(id: string): CardTheme {
  return CARD_THEMES.find((t) => t.id === id) ?? CARD_THEMES[0];
}

/** Legacy v1 template ids → closest v2 theme (old cards keep rendering). */
const LEGACY_ALIAS: Record<string, ThemeStyle> = {
  'neon-flex': 'neon-identity',
  'streak-legend': 'streak-legend',
  'pink-aura': 'cosmic-profile',
  champion: 'champion-edition',
  'electric-bloom': 'neon-identity',
  'fresh-mint': 'clean-signature',
  'prism-pop': 'cosmic-profile',
};

export function resolveTheme(template: string): CardTheme {
  return themeById(LEGACY_ALIAS[template] ?? template);
}

export function themeUnlocked(theme: CardTheme, points: number): boolean {
  return points >= theme.minPoints;
}
