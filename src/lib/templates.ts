/**
 * Card templates — the 7 editor themes.
 * Card *artwork* may be vivid (it is user content); the surrounding
 * site UI always stays light.
 */
export interface CardTemplate {
  id: string;
  name: string;
  blurb: string;
  /** Generated photo-style artwork used as the card background (UI + PNG export) */
  art: string;
  /** 3-stop diagonal gradient for the card background (fallback / tint) */
  bg: [string, string, string];
  /** 3 accent hues used for mesh-gradient blobs layered over bg */
  mesh: [string, string, string];
  glow: string;
  ink: string; // main text on the card
  sub: string; // secondary text on the card
  decor: 'bolts' | 'flames' | 'sparkles' | 'crowns' | 'waves' | 'leaves' | 'prism';
}

export const TEMPLATES: CardTemplate[] = [
  {
    id: 'neon-flex',
    name: 'Neon Flex',
    blurb: 'Electric violet-to-cyan glow',
    art: '/art/tpl-neon-flex.jpg',
    bg: ['#6D28D9', '#4F46E5', '#0891B2'],
    mesh: ['#A78BFA', '#22D3EE', '#F0ABFC'],
    glow: '#DDD6FE',
    ink: '#FFFFFF',
    sub: '#E9E4FF',
    decor: 'bolts',
  },
  {
    id: 'streak-legend',
    name: 'Streak Legend',
    blurb: 'Fiery gold for streak keepers',
    art: '/art/tpl-streak-legend.jpg',
    bg: ['#92400E', '#D97706', '#FBBF24'],
    mesh: ['#FDE68A', '#F97316', '#FCD34D'],
    glow: '#FEF3C7',
    ink: '#FFFFFF',
    sub: '#FFF7E0',
    decor: 'flames',
  },
  {
    id: 'pink-aura',
    name: 'Pink Aura',
    blurb: 'Soft pink dream',
    art: '/art/tpl-pink-aura.jpg',
    bg: ['#DB2777', '#F472B6', '#FBCFE8'],
    mesh: ['#F9A8D4', '#FDA4AF', '#FCE7F3'],
    glow: '#FCE7F3',
    ink: '#831843',
    sub: '#9D174D',
    decor: 'sparkles',
  },
  {
    id: 'champion',
    name: 'Champion',
    blurb: 'Royal purple + gold crowns',
    art: '/art/tpl-champion.jpg',
    bg: ['#3B0764', '#6D28D9', '#B45309'],
    mesh: ['#A78BFA', '#F59E0B', '#DDD6FE'],
    glow: '#EDE9FE',
    ink: '#FFFFFF',
    sub: '#F1EAFF',
    decor: 'crowns',
  },
  {
    id: 'electric-bloom',
    name: 'Electric Bloom',
    blurb: 'Ocean cyan bloom',
    art: '/art/tpl-electric-bloom.jpg',
    bg: ['#0C4A6E', '#1D4ED8', '#7C3AED'],
    mesh: ['#38BDF8', '#818CF8', '#A5F3FC'],
    glow: '#E0F2FE',
    ink: '#FFFFFF',
    sub: '#E4F4FF',
    decor: 'waves',
  },
  {
    id: 'fresh-mint',
    name: 'Fresh Mint',
    blurb: 'Clean mint freshness',
    art: '/art/tpl-fresh-mint.jpg',
    bg: ['#065F46', '#10B981', '#A7F3D0'],
    mesh: ['#6EE7B7', '#5EEAD4', '#D1FAE5'],
    glow: '#ECFDF5',
    ink: '#064E3B',
    sub: '#065F46',
    decor: 'leaves',
  },
  {
    id: 'prism-pop',
    name: 'Prism Pop',
    blurb: 'Candy prism gradient',
    art: '/art/tpl-prism-pop.jpg',
    bg: ['#BE185D', '#7C3AED', '#0E7490'],
    mesh: ['#F0ABFC', '#A5B4FC', '#67E8F9'],
    glow: '#FCE7F3',
    ink: '#FFFFFF',
    sub: '#FBE9F5',
    decor: 'prism',
  },
];

export function templateById(id: string): CardTemplate {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

export const BADGES = [
  { id: 'crown', label: 'Crown', emoji: '👑' },
  { id: 'flame', label: 'On fire', emoji: '🔥' },
  { id: 'star', label: 'Star', emoji: '⭐' },
  { id: 'bolt', label: 'Bolt', emoji: '⚡' },
  { id: 'heart', label: 'Loved', emoji: '💖' },
  { id: 'gem', label: 'Gem', emoji: '💎' },
] as const;

export function badgeEmoji(id: string): string {
  return BADGES.find((b) => b.id === id)?.emoji ?? '✨';
}
