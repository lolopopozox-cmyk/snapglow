# 💰 Adsterra Ads - Setup Guide (Make Money)

All ad configuration lives in **one file: `ads.js`** (project root).
No HTML editing needed — it automatically fills every ad slot on every page.

## The Order Matters

> **Deploy the site FIRST, then apply to Adsterra.**
> Adsterra requires a live, working URL to approve your website.

1. Push to GitHub → deploy to Vercel (see README)
2. Confirm `https://your-site.vercel.app` loads in your browser
3. Then follow the steps below

## Step 1 - Create Your Account (free)

1. Go to **https://adsterra.com** → click **Sign Up** → choose **Publisher** (you show ads, you get paid)
2. Confirm your email

## Step 2 - Add Your Website

1. Dashboard → **Websites** → **Add Website**
2. Enter your live URL: `https://your-site.vercel.app`
3. Category: pick the closest match to your content.
   ⚠️ **Be honest about the 18+ nature of the site** — hiding it is the #1 reason for bans.
4. Description: short, accurate ("AI profile picture generator and social tools for Snapchat users")
5. Wait for approval — usually within 24 hours

## Step 3 - Create Ad Units & Paste Keys in `ads.js`

In the dashboard go to **Ad Units → Create**. For each one below, copy the
`key` (the long hex string inside `'key' : '...'`) into `ads.js`:

| Adsterra unit | Paste into | Shows where |
|---|---|---|
| Banner 728x90 | `BANNERS.topDesktop.key` | Homepage top (desktop) |
| Banner 320x50 | `BANNERS.topMobile.key` | Homepage top (mobile) |
| Banner 300x250 | `BANNERS.box.key` | Homepage mid + Generator page |
| Social Bar | `SOCIAL_BAR_URL` | Whole site (highest earnings for most sites) |
| Popunder | `POPUNDER_URL` | Whole site |
| Direct Link | `DIRECT_LINK_URL` | CTA buttons in any empty ad slot |

- **Banner** units give you the `'key' : '...'` code — copy only the string.
- **Social Bar / Popunder** give you a `<script src="...">` tag — copy just the URL.
- **Direct Link** gives you a plain URL.

**Social Bar** is usually the top earner on entertainment/social traffic —
definitely create it. (In Social Bar settings you can enable the 18+ / adult toggle.)

## Step 4 - Turn It On

In `ads.js` change:

```js
ENABLED: false,
```

to

```js
ENABLED: true,
```

Commit + push. Vercel auto-redeploys and ads go live everywhere.
(Until you do this, the ad boxes stay hidden — the site looks clean.)

## Step 5 - Get Paid

- **Payments tab** → add a payout method (USDT crypto has the lowest minimum, ~$5; also Paxum, WebMoney, wire)
- Payouts run **weekly (every Tuesday)** once you pass the minimum
- Track live earnings in the Adsterra dashboard → **Statistics**

## Rules That Keep Your Account Alive (read once, save your money)

1. **Never ask/encourage clicks** ("click ads to support us" = instant ban). The site's labels stay neutral ("Advertisement", "Sponsored", "Ads keep SnapGlow free").
2. **Never click your own ads** — not even once, not from any device on your network.
3. **Don't send bot/fake traffic** (autosurfs, PTC, bought "cheap traffic") — detected and banned, earnings forfeited.
4. **Keep the 18+ age gate** — it protects you on both ad policy and legal sides.
5. Real traffic ideas: share your generator on TikTok/YouTube Shorts/Reddit with your referral link, submit `sitemap.xml` to Google Search Console, keep adding the tools listed on /features.

## Honest Expectations

Ad networks pay per 1000 impressions/clicks (CPM). New sites with
little traffic earn cents at first — earnings scale with real visitors.
Focus on getting genuine users (the built-in referral system + share buttons
help), and the ads compound from there.
