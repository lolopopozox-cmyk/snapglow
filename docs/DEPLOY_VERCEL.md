# Deploying Snap Glow — GitHub → Vercel (beginner steps)

Snap Glow is a standard Vite + React app. The included `vercel.json` already
has the right build settings and SPA rewrites, so Vercel just works.

## What you need

- A **GitHub** account (free): https://github.com
- A **Vercel** account (free, sign up with GitHub): https://vercel.com
- **Git** installed on your PC (https://git-scm.com/downloads)

## Step 1 — Put the code on GitHub

Open a terminal **inside the extracted `snap-glow-project` folder** and run:

```bash
git init
git add .
git commit -m "Snap Glow v4"
git branch -M main
```

Then create a new repository on GitHub (github.com → New repository → name it
`snap-glow` → **do not** tick "Add a README") and connect it:

```bash
git remote add origin https://github.com/YOUR-USERNAME/snap-glow.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username. You will be asked to sign in.

> Never commit real secrets. `.env.example` contains placeholder names only —
> that file is safe to commit.

## Step 2 — Import into Vercel

1. Go to https://vercel.com and sign in with GitHub.
2. Click **Add New… → Project**.
3. Choose your `snap-glow` repository → **Import**.
4. Vercel auto-detects the settings from `vercel.json`:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. (Optional) Environment Variables → add `VITE_SITE_URL` =
   `https://your-domain.com` once you have a domain. Until then the site works
   on the free `*.vercel.app` URL.
6. Click **Deploy**. After a minute or two your site is live.

## Step 3 — Updates

Every time you push to GitHub (`git add .` → `git commit -m "..."` →
`git push`), Vercel rebuilds and redeploys automatically. Nothing else to do.

## Step 4 — Custom domain (optional)

1. Buy a domain from any registrar (Namecheap, Cloudflare, etc.).
2. In Vercel: your project → **Settings → Domains** → add the domain.
3. Follow Vercel's DNS instructions (usually one A record or CNAME).
4. Once the domain is live, set `VITE_SITE_URL` to
   `https://your-domain.com` in **Settings → Environment Variables**, then
   **Deployments → Redeploy** so canonical URLs, sitemap and share links use
   the real domain.

## Step 5 — After going live

1. Submit the sitemap (`https://your-domain.com/sitemap.xml`) in Google
   Search Console — see `docs/SEO_SETUP.md`.
2. Paste your Adsterra codes — see `docs/ADSTERRA_SETUP.md`.
3. Update the contact email if `snapglowofficial@gmail.com` isn't yours.

## Troubleshooting

- **Build fails on Vercel but works locally**: make sure `package-lock.json`
  is committed (it is, in this ZIP) and the Node version is 18+ (Vercel
  default is fine).
- **Blank page / 404 on refresh**: `vercel.json` rewrites all routes to
  `/index.html` — if you edited it, restore the `rewrites` section.
- **Images missing**: everything in `public/` (including `public/art/`) is
  served as-is — don't move those files.
