# Snap Glow — SEO Setup (beginner guide)

This is the honest, step-by-step path from the demo build to a site Google
can actually index. **Code alone cannot guarantee indexing or rankings** —
those depend on the live site, real content, ownership verification, and
Google's current policies.

## 1. What already ships in the code

- Unique `<title>` + meta description per public route (`src/components/Seo.tsx`,
  titles listed in `CONTRACTS.md`).
- Canonical URLs built from `VITE_SITE_URL` — currently the placeholder
  `https://www.your-domain.com`. **Replace it with your real domain** in
  `.env` (`VITE_SITE_URL=https://www.your-domain.com`) and in
  `public/sitemap.xml` + `public/robots.txt` before launch.
- Open Graph tags, favicon, `site.webmanifest`, semantic HTML
  (`<main>`, headings, alt/aria labels).
- `public/robots.txt` — allows public pages; disallows `/signin`,
  `/dashboard`, `/admin`, `/create`.
- `public/sitemap.xml` — static public routes only. Dynamic demo pages
  (`/u/:username`, `/posts/:id`, `/battles/:id`…) carry
  `<meta name="robots" content="noindex">` until real backend data exists,
  so they are correctly excluded.
- No structured data is invented. No AdSense code. No keyword stuffing.

## 2. Deploy with a real domain

1. Deploy the production build (`npm run build` → `dist/`) to your host
   (Vercel, Netlify, Cloudflare Pages…).
2. Connect your custom domain and enable HTTPS.
3. **SPA routing:** configure your host to serve `index.html` for unknown
   paths (e.g. Vercel: `rewrites`; Netlify: `_redirects` with
   `/* /index.html 200`). Without this, `/feed` etc. 404 on refresh.
4. Set the `VITE_SITE_URL` env var to your real domain and redeploy.

## 3. Google Search Console — step by step

1. Go to https://search.google.com/search-console and sign in.
2. **Add property** → choose *Domain* (recommended; verifies all subdomains)
   or *URL prefix* with your exact `https://www.your-domain.com`.
3. **Verify ownership** with one of Google's supported methods:
   - *Domain:* add the TXT record Google gives you at your DNS provider,
     then click Verify (DNS can take minutes–hours).
   - *URL prefix:* upload Google's HTML file to `public/` and redeploy, or
     add the meta tag to `index.html`.
4. **Submit the sitemap:** left menu → *Sitemaps* → enter
   `sitemap.xml` → Submit. Expect “Success” within a day.
5. **Inspect URLs:** paste a public URL (e.g. `/discover`) into the top bar
   → *Test live URL* → *Request indexing* for key pages.
6. **Monitor:** *Pages* report (indexing), *Performance* (clicks/impressions),
   *Core Web Vitals*. Fix real errors it reports; ignore “Discovered —
   currently not indexed” for a brand-new site (normal; can take weeks).
7. Troubleshooting: if pages aren't indexed after 3–4 weeks, check
   robots.txt isn't blocking, canonicals are absolute + reachable, and the
   site returns 200 (not soft-404) for public routes.

## 4. The client-rendering caveat (important)

This is a **Vite client-rendered SPA**: crawlers receive a nearly empty
`index.html` and must execute JavaScript to see content. Google *can* render
JS, but it is slower and less reliable than server-rendered HTML, and
social-media link previews (X, Facebook, WhatsApp) generally **will not**
show your per-page OG titles/descriptions because they don't run JS.

Options, cheapest first:
1. **Accept it** — fine for a demo/hobby launch; Google still indexes JS
   sites, just more slowly.
2. **Prerender** the static public routes at build time
   (`vite-plugin-prerender` / `react-snap` style) so crawlers and scrapers
   get real HTML. Dynamic demo pages stay noindex.
3. **SSR** (e.g. migrate to Next.js) — biggest effort, best SEO + previews.

The current build documents the limitation instead of pretending the OG
tags work everywhere.

## 5. Content rules that keep you policy-safe

- Replace ALL demo seed content with real users/content before promoting
  the site — or keep the demo labels. Never present fabricated likes,
  votes, reviews or testimonials as genuine.
- Don't promise rankings, indexing speed, or AdSense approval anywhere.
- When you later add ads: only with real, owner-approved publisher code,
  clearly separated from navigation/download/vote controls.

## 6. Launch checklist

- [ ] Real domain in `VITE_SITE_URL`, `public/sitemap.xml`, `public/robots.txt`
- [ ] `npm run build` passes; `dist/` deployed; SPA rewrites configured
- [ ] Search Console property verified; sitemap submitted
- [ ] Key public URLs inspected + indexing requested
- [ ] Demo seed data replaced or clearly labelled
- [ ] Contact email is a real monitored inbox
- [ ] Legal pages reviewed for your jurisdiction
