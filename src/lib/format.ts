/** Small formatting helpers. */

export function timeAgo(iso: string, now = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/** 12400 -> "12.4K" */
export function formatCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) {
    const v = n / 1000;
    return `${v >= 100 ? Math.round(v) : v.toFixed(1).replace(/\.0$/, '')}K`;
  }
  const v = n / 1_000_000;
  return `${v.toFixed(1).replace(/\.0$/, '')}M`;
}

/** ms -> "08:45:32" */
export function formatClock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

let counter = 0;
export function uid(prefix = 'id'): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** "sanaqueen" -> "@sanaqueen" */
export function handle(username: string): string {
  return username.startsWith('@') ? username : `@${username}`;
}

export function isoDaysAgo(days: number, now = Date.now()): string {
  return new Date(now - days * 24 * 3600 * 1000).toISOString();
}

export function isoHoursAgo(hours: number, now = Date.now()): string {
  return new Date(now - hours * 3600 * 1000).toISOString();
}
