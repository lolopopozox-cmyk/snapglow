import { useEffect } from 'react';
import { siteUrl } from '../lib/store';

interface SeoProps {
  title: string;
  description: string;
  /** path like "/feed" — used for the canonical URL */
  path: string;
  /** true for private / auth / admin pages */
  noindex?: boolean;
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  const sel = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector<HTMLMetaElement>(sel);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  const sel = `link[rel="${rel}"]`;
  let el = document.head.querySelector<HTMLLinkElement>(sel);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Per-route SEO head manager (no extra dependency).
 * Canonicals use VITE_SITE_URL (placeholder https://www.your-domain.com
 * until the real domain is configured — see docs/SEO_SETUP.md).
 */
export function Seo({ title, description, path, noindex }: SeoProps) {
  useEffect(() => {
    const canonical = `${siteUrl()}${path}`;
    document.title = title;
    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
    upsertLink('canonical', canonical);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', canonical);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:site_name', 'Snap Glow');
    upsertMeta('property', 'og:image', `${siteUrl()}/art/hero-sky.jpg`);
    upsertMeta('property', 'og:image:alt', 'Snap Glow — the web home for Snapchat users');
    upsertMeta('name', 'twitter:image', `${siteUrl()}/art/hero-sky.jpg`);
    upsertMeta('name', 'twitter:card', 'summary');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
  }, [title, description, path, noindex]);
  return null;
}
