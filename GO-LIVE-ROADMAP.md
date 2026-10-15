# 🚀 GO-LIVE ROADMAP - From this folder to a live website

Total time: ~15 minutes. Your site is already 100% built, committed and
deploy-ready. You only need to connect your accounts. Follow top to bottom.

---

## STAGE 1 — GitHub (≈ 5 min)

### Step 1.1 — Create a GitHub account (skip if you have one)
- Go to **https://github.com/signup**
- Username, email, password → verify email

### Step 1.2 — Create an EMPTY repository
- Go to **https://github.com/new** (make sure you are logged in)
- Repository name: `SnapGlow`
- Visibility: **Public** (Vercel's free Hobby plan works with public repos)
- ⚠️ **DO NOT** tick "Add a README", ".gitignore" or "license"
  → the repo must be COMPLETELY EMPTY or the push will be rejected
- Click **Create repository**

### Step 1.3 — Push your code
After creating, GitHub shows you a repo URL like
`https://github.com/YOUR-USERNAME/SnapGlow.git` — copy it, then run
in this folder (Git Bash):

```bash
git remote add origin https://github.com/YOUR-USERNAME/SnapGlow.git
git push -u origin main
```

**What happens:** a window pops up in your browser → log in to GitHub →
click **Authorize**. That's it — your code is now on GitHub.

*(Alternative: tell ZCode your repo URL and it runs these commands for you —
the same browser login window will appear for you to authorize.)*

✅ **Check:** refresh the repo page on GitHub — you should see all your files.

---

## STAGE 2 — Vercel (≈ 5 min)

### Step 2.1 — Sign up with GitHub
- Go to **https://vercel.com/signup**
- Click **Continue with GitHub** → authorize Vercel
(Signing up with GitHub is important — it links your repo for 1-click deploys)

### Step 2.2 — Import the project
- Click **Add New... → Project**
- Find **SnapGlow** in the list → click **Import**
- Framework Preset: **Other** (it's detected automatically — leave settings as-is)
- ⚠️ DON'T click Deploy yet — first add the secret keys (Step 2.3)

### Step 2.3 — Add Environment Variables (required!)
On the import page, open **Environment Variables** and add these 5:

| Name | Value |
|---|---|
| `NOMASK_API_KEY` | your real Nomask API key (the nmk_live_... one) |
| `IMAGE_API_URL` | `https://nomask.ai/api/v1` |
| `IMAGE_MODEL` | `deepseek/deepseek-v4-pro` |
| `ADMIN_PASSWORD` | a NEW strong password for your admin panel |
| `CONTACT_EMAIL` | `mranonymous.efx@gmail.com` |

### Step 2.4 — Deploy
- Click **Deploy** → wait ~30 seconds
- 🎉 You get your live URL: **https://snapglow.vercel.app** (or similar)

✅ **Check:** open the URL on your phone — age gate shows, generator works.

**From now on:** every time you (or ZCode) `git push` to GitHub,
Vercel redeploys the site automatically. That's your update workflow.

---

## STAGE 3 — Turn On Ads & Money (≈ 24h wait for approval)

Follow the full guide in **ADSTERRA-SETUP.md**. Short version:

1. Deploy must be live FIRST (done in Stage 2) ✅
2. Sign up at **https://adsterra.com** as a **Publisher**
3. Websites → Add Website → your vercel.app URL → declare 18+ honestly
4. Wait for approval (usually under 24h)
5. Create ad units (Banner 728x90 + 320x50 + 300x250, **Social Bar**, Popunder, Direct Link)
6. Paste the keys into **`ads.js`** (one file, everything else is automatic)
7. In `ads.js` set `ENABLED: true`
8. Commit + push:
   ```bash
   git add ads.js
   git commit -m "Enable Adsterra ads"
   git push
   ```
9. Vercel auto-deploys → ads live → earnings start counting in the
   Adsterra dashboard (payouts weekly, crypto minimum ~$5)

---

## STAGE 4 (optional) — Custom domain
- Buy a domain (Namecheap/Porkbun, ~$10/yr)
- Vercel dashboard → your project → **Settings → Domains** → add it
- Follow the DNS instructions Vercel shows (point the nameservers/A record)
- Update `snapglow.vercel.app` references in `sitemap.xml`, `robots.txt`
  and the meta tags before submitting to Google Search Console

---

## 🆘 If something goes wrong

| Problem | Fix |
|---|---|
| Push rejected ("non-fast-forward") | Your GitHub repo wasn't empty. Delete the repo on GitHub and recreate it EMPTY, then push again |
| Browser login window never appears | Run `git credential-manager github login` manually, then push |
| Vercel deploy fails | Check the deploy log (click the failed deployment). Most likely a missing env var |
| Generator says "Generation failed" | `NOMASK_API_KEY` env var missing/invalid in Vercel → Settings → Environment Variables |
| Admin panel | `https://YOUR-URL/admin-sec-portal-x92a` + the ADMIN_PASSWORD you set |
