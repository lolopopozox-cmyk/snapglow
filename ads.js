/* ============================================================
   SnapGlow - Adsterra Ads Hub
   ============================================================
   MAKE MONEY IN 4 STEPS (full guide in ADSTERRA-SETUP.md):

   1. Create a FREE publisher account at: https://adsterra.com
   2. Websites -> Add Website -> enter your live URL (snapglow.vercel.app)
      -> wait for approval (usually < 24h)
   3. Create ad units and paste your keys / script URLs below
   4. Set ENABLED to true, push the update. Ads run site-wide.

   NOTHING else in the project needs to change - this file
   automatically fills every ad slot on every page.
   ============================================================ */

var ADSTERRA = {

  // Set to true ONLY after pasting your real keys below
  ENABLED: false,

  // ---- BANNER AD UNITS --------------------------------------
  // In Adsterra dashboard: Ad Units -> Create -> "Banner"
  // Copy the 'key' value from the generated code (the long
  // hex string inside  'key' : '...')
  BANNERS: {
    // 728x90 - shown in the top slot on desktop
    topDesktop: { key: '', width: 728, height: 90 },
    // 320x50 - shown in the top slot on mobile
    topMobile:  { key: '', width: 320, height: 50 },
    // 300x250 - shown in the mid-page and generator slots
    box:        { key: '', width: 300, height: 250 }
  },

  // ---- SITE-WIDE SCRIPTS (best earners) ---------------------
  // In Adsterra dashboard: Ad Units -> Create -> "Social Bar"
  // and "Popunder". Copy the whole <script src="..."> URL.
  SOCIAL_BAR_URL: '',   // e.g. '//pl12345678.profitablecpmrate.com/1a/2b/3c/abc123.js'
  POPUNDER_URL:   '',   // e.g. '//pl12345678.profitablecpmrate.com/4d/5e/6f/def456.js'

  // ---- DIRECT LINK (no approval needed, works instantly) ----
  // Adsterra dashboard: Direct Link -> copy your URL.
  // Used as a fallback CTA button inside empty ad slots.
  DIRECT_LINK_URL: ''   // e.g. 'https://www.profitablegate.com/abcdef/12345/'
};

/* ============================================================
   Engine - no changes needed below this line
   ============================================================ */
(function () {
  function loadScript(src, attrs, cb) {
    var s = document.createElement('script');
    s.type = 'text/javascript';
    s.async = true;
    if (attrs) for (var k in attrs) s.setAttribute(k, attrs[k]);
    s.src = src.indexOf('//') === 0 ? 'https:' + src : src;
    if (cb) { s.onload = cb; s.onerror = cb; }
    document.body.appendChild(s);
  }

  // Adsterra iframe banners read window.atOptions when they run,
  // so banners must load one at a time to avoid mixing sizes.
  function renderBanner(el, unit, cb) {
    if (!el || !unit.key) { if (cb) cb(); return; }
    window.atOptions = {
      key: unit.key, format: 'iframe',
      height: unit.height, width: unit.width, params: {}
    };
    loadScript('//www.highperformanceformat.com/' + unit.key + '/invoke.js', null, cb);
  }

  function directLinkFallback(el) {
    if (!el || !ADSTERRA.DIRECT_LINK_URL) return;
    var a = document.createElement('a');
    a.href = ADSTERRA.DIRECT_LINK_URL;
    a.target = '_blank';
    a.rel = 'noopener';
    a.className = 'btn btn-fill';
    a.style.margin = '10px auto';
    a.style.display = 'inline-block';
    a.textContent = '\u{1F31F} Unlock Premium Snap Tools';
    el.appendChild(a);
  }

  function start() {
    var boxes = document.querySelectorAll('.ad-box');

    if (!ADSTERRA.ENABLED) {
      // Not configured yet: hide empty ad boxes so the site looks clean
      for (var i = 0; i < boxes.length; i++) boxes[i].style.display = 'none';
      return;
    }

    // Site-wide monetization scripts (load once per page)
    if (ADSTERRA.SOCIAL_BAR_URL) loadScript(ADSTERRA.SOCIAL_BAR_URL, { 'data-cfasync': 'false' });
    if (ADSTERRA.POPUNDER_URL)   loadScript(ADSTERRA.POPUNDER_URL, { 'data-cfasync': 'false' });

    var top = document.getElementById('ad-banner-top');
    var topUnit = (window.innerWidth < 728) ? ADSTERRA.BANNERS.topMobile : ADSTERRA.BANNERS.topDesktop;

    // Queue banners sequentially so each gets its own atOptions
    renderBanner(top, topUnit, function () {
      renderBanner(document.getElementById('ad-mid'), ADSTERRA.BANNERS.box, function () {
        renderBanner(document.getElementById('ad-gen'), ADSTERRA.BANNERS.box);
      });
    });

    // Direct-link CTA in any slot that has no banner key
    if (ADSTERRA.DIRECT_LINK_URL) {
      var slots = [top, document.getElementById('ad-mid'), document.getElementById('ad-gen')];
      var keys = [topUnit, ADSTERRA.BANNERS.box, ADSTERRA.BANNERS.box];
      for (var j = 0; j < slots.length; j++) {
        if (slots[j] && !keys[j].key) directLinkFallback(slots[j]);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
