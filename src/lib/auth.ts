/**
 * Client-side password hashing (SHA-256).
 *
 * Passwords are NEVER stored in plaintext — only the hex digest is kept in
 * localStorage. This is a single-device personal-site scheme, not a
 * substitute for a real server-side auth backend (see docs/BACKEND_SETUP.md).
 */

function bytesToHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** FNV-1a fallback for non-secure contexts where crypto.subtle is missing. */
function fnv1aHex(text: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x811c9dc5;
  const salted = `snapglow$${text}$v4`;
  for (let i = 0; i < salted.length; i++) {
    const c = salted.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193);
    h2 = Math.imul(h2 ^ (c + 31), 0x01000193);
  }
  const hex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  return `fnv1a:${hex(h1)}${hex(h2)}`;
}

export async function hashPassword(password: string): Promise<string> {
  try {
    const subtle = globalThis.crypto?.subtle;
    if (subtle) {
      const digest = await subtle.digest('SHA-256', new TextEncoder().encode(`snapglow$${password}$v4`));
      return `sha256:${bytesToHex(digest)}`;
    }
  } catch {
    /* fall through to FNV-1a */
  }
  return fnv1aHex(password);
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const computed = storedHash.startsWith('fnv1a:')
    ? fnv1aHex(password)
    : await hashPassword(password);
  if (computed.length !== storedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) diff |= computed.charCodeAt(i) ^ storedHash.charCodeAt(i);
  return diff === 0;
}
