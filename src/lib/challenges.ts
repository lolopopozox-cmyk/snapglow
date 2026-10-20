/**
 * Daily Challenge themes, Glow Points economy, and level ladder.
 *
 * One Snap-themed card theme per day, rotating deterministically so every
 * visitor sees the same theme on the same day.
 */

export const CHALLENGE_THEMES = [
  { id: 'neon-nights', name: 'Neon Nights', blurb: 'Electric glow — light up the dark' },
  { id: 'golden-hour', name: 'Golden Hour Glow', blurb: 'Warm sunset vibes only' },
  { id: 'streak-keeper', name: 'Streak Keeper', blurb: 'Show off your longest streak' },
  { id: 'cloud-nine', name: 'Cloud Nine', blurb: 'Soft, dreamy, floating' },
  { id: 'midnight-snap', name: 'Midnight Snap', blurb: 'After-hours energy' },
  { id: 'trophy-time', name: 'Trophy Time', blurb: 'Champion mindset' },
  { id: 'candy-skies', name: 'Candy Skies', blurb: 'Sweet pastel dreams' },
  { id: 'lens-flare', name: 'Lens Flare', blurb: 'Caught in the light' },
  { id: 'besties-day', name: 'Besties Day', blurb: 'For your day-one people' },
  { id: 'throwback', name: 'Throwback', blurb: 'Memory lane looks good on you' },
  { id: 'fresh-start', name: 'Fresh Start', blurb: 'Clean slate, big energy' },
  { id: 'electric-dreams', name: 'Electric Dreams', blurb: 'High voltage creativity' },
  { id: 'sunset-chaser', name: 'Sunset Chaser', blurb: 'Golden skies ahead' },
  { id: 'crown-yourself', name: 'Crown Yourself', blurb: 'Royalty looks good on you' },
] as const;

export interface ChallengeTheme {
  id: string;
  name: string;
  blurb: string;
}

const MS_DAY = 86_400_000;

/** Deterministic theme for a calendar day (UTC). */
export function challengeForDay(date: Date = new Date()): ChallengeTheme & { dayKey: string } {
  const dayKey = date.toISOString().slice(0, 10);
  const dayNum = Math.floor(date.getTime() / MS_DAY);
  const theme = CHALLENGE_THEMES[((dayNum % CHALLENGE_THEMES.length) + CHALLENGE_THEMES.length) % CHALLENGE_THEMES.length];
  return { ...theme, dayKey };
}

/** Glow Points awarded for activity (on-platform only — never money). */
export const POINTS = {
  createCard: 10,
  challengeBonus: 15,
  createPost: 5,
  vote: 2,
  comment: 3,
  likeReceived: 0,
  battleWin: 25,
  battleCreate: 5,
  dailyLogin: 5,
  follow: 1,
} as const;

export interface LevelDef {
  name: string;
  minPoints: number;
  blurb: string;
}

export const LEVELS: LevelDef[] = [
  { name: 'Rising Star', minPoints: 0, blurb: 'Every legend starts somewhere' },
  { name: 'Hot Creator', minPoints: 100, blurb: 'The community is noticing' },
  { name: 'Superstar', minPoints: 300, blurb: 'A Snap Glow standout' },
  { name: 'Legend', minPoints: 750, blurb: 'Hall-of-Fame material' },
];

export function levelForPoints(points: number): LevelDef {
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (points >= l.minPoints) current = l;
  }
  return current;
}

/** Points still needed to reach the next level (0 when maxed). */
export function pointsToNextLevel(points: number): number {
  const next = LEVELS.find((l) => l.minPoints > points);
  return next ? next.minPoints - points : 0;
}
