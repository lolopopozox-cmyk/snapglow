# SnapGlow - Elevate Your Snap Presence

**25+ AI-powered Snapchat profile tools & uncensored image generation**

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Environment Variables
Copy `.env.example` to `.env.local` and add your actual API keys:
- `NOMASK_API_KEY` - Your Nomask AI API key
- `ADMIN_PASSWORD` - Password for the admin panel
- `CONTACT_EMAIL` - Your contact email

Or set these in your Vercel dashboard when deploying.

### 3. Run Locally
```bash
npm run dev
```
This uses `vercel dev` to serve the site and serverless functions locally.

### 4. Deploy to Vercel
1. Push this repo to GitHub
2. Import the repo in Vercel (vercel.com)
3. Set the environment variables in Vercel dashboard
4. Deploy!

## Project Structure
```
SnapGlow-Project/
  api/
    generate-image.js   # AI image generation endpoint
    contact.js          # Contact form handler
    track.js            # Page view tracking
    admin/stats.js      # Admin stats endpoint (protected)
  data/
    contacts.json       # Contact form submissions
    stats.json          # Page view analytics
  index.html            # Home page
  generator.html        # AI Generator page
  generator.js          # Generator logic
  features.html         # All features showcase
  profile.html          # User dashboard
  contact.html          # Contact form
  privacy.html          # Privacy Policy
  tms.html              # Terms of Service
  dmca.html             # DMCA Copyright
  admin-sec-portal-x92a.html  # Hidden admin panel
  admin-sec-portal-x92a.js    # Admin logic
  style.css             # Global styles
  script.js             # Shared JS utilities
  package.json          # Dependencies
  vercel.json           # Vercel configuration
  _redirects            # SPA routing rules
  robots.txt            # SEO - disallow admin
  sitemap.xml           # SEO sitemap
```

## Admin Panel
Visit `/admin-sec-portal-x92a` and enter your ADMIN_PASSWORD.

## Features
- AI Profile Picture Generator (uncensored, 18+)
- Snap Score Booster Simulator
- Custom Snapcode Generator
- Flex Card Maker
- Roast Dominator (AI roasts)
- Daily GlowUp Streak Counter
- AI Snap Story Writer
- Spin to Win Casino Mini-Game
- Badge System (8 badges)
- Leaderboard
- Referral System
- And 15+ more features

## Ads
This site integrates Adstera ads. Update the Adstera script in HTML files with your actual Adstera account details.

## Important Notes
- All AI-generated content is uncensored (NSFW-capable)
- Users must confirm they are 18+ to access generation features
- No user login required - all data stored in browser localStorage
- Contact form submissions are saved to the JSON database

## Contact
Email: mranonymous.efx@gmail.com