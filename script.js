/* SnapGlow - Shared JS */
var SG = {
  g: function(k, d) { try { var v = localStorage.getItem('sg_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  s: function(k, v) { try { localStorage.setItem('sg_' + k, JSON.stringify(v)); } catch (e) {} },
  toast: function(m, d) { d = d || 3000;
    var t = document.createElement('div'); t.className = 'toast'; t.textContent = m;
    document.body.appendChild(t); setTimeout(function() { t.style.opacity = '0'; setTimeout(function() { t.remove(); }, 300); }, d);
  },
  spinner: function(el) { el.innerHTML = '<div class="spinner" style="margin:20px auto"></div>'; },
  ageOk: function() { return this.g('age18', false); },
  ageYes: function() { this.s('age18', true);
    var gates = document.querySelectorAll('.age-gate'); for (var i = 0; i < gates.length; i++) gates[i].classList.add('hide');
    var locked = document.querySelectorAll('.locked'); for (var j = 0; j < locked.length; j++) locked[j].classList.add('show');
  },
  streak: function() {
    var t = new Date().toDateString(), l = this.g('last', ''), s = this.g('streak', 0);
    if (l !== t) { var y = new Date(Date.now() - 86400000).toDateString(); s = (l === y) ? s + 1 : 1; this.s('last', t); this.s('streak', s); } return s;
  },
  coins: function() { return this.g('coins', 100); },
  addCoins: function(n) { this.s('coins', this.coins() + n); },
  spendCoins: function(n) { var c = this.coins(); if (c >= n) { this.s('coins', c - n); return true; } return false; },
  shareSnap: function(t) { window.open('https://snapchat.com/share?text=' + encodeURIComponent(t) + '&url=' + encodeURIComponent(location.href), '_blank'); },
  copy: function(t) { navigator.clipboard.writeText(t).then(function() { SG.toast('Copied!'); }).catch(function() {}) },
  fmt: function(n) { return n.toLocaleString(); },
  emoji: function() { var e = ['\u{1F525}','\u{1F60E}','\u{1F4A5}','\u{1F451}','\u{1F31F}','\u{2728}']; return e[Math.floor(Math.random() * e.length)]; },
  badges: function() { return this.g('badges', []); },
  giveBadge: function(n) { var b = this.badges(); if (b.indexOf(n) === -1) { b.push(n); this.s('badges', b); this.toast('Badge: ' + n); } },
  trackView: function() { fetch('/api/track', { method: 'POST' }).catch(function() {}); }
};
/* Nav + Footer injector */
document.addEventListener('DOMContentLoaded', function() {
  var nav = document.querySelector('.nav');
  if (nav) {
    var pages = [{ n: 'Home', h: '/' }, { n: 'Generator', h: '/generator' }, { n: 'Features', h: '/features' }, { n: 'Profile', h: '/profile' }, { n: 'Contact', h: '/contact' }];
    var links = ''; for (var i = 0; i < pages.length; i++) links += '<li><a href="' + pages[i].h + '">' + pages[i].n + '</a></li>';
    nav.innerHTML = '<div class="nav-inner"><a class="nav-logo" href="/">SnapGlow</a><ul class="nav-links">' + links + '</ul><div class="hamburger" onclick="this.parentElement.querySelector(\'.nav-links\').classList.toggle(\'open\')"><span></span><span></span><span></span></div></div>';
    var path = location.pathname;
    var as = nav.querySelectorAll('a');
    for (var j = 0; j < as.length; j++) if (as[j].getAttribute('href') === path) as[j].classList.add('active');
  }
  var ft = document.querySelector('.footer');
  if (ft) {
    ft.innerHTML = '<div class="grd"><div><h4>SnapGlow</h4><ul><li><a href="/privacy">Privacy</a></li><li><a href="/tms">Terms</a></li><li><a href="/dmca">DMCA</a></li></ul></div><div><h4>Tools</h4><ul><li><a href="/generator">AI Generator</a></li><li><a href="/features">Features</a></li><li><a href="/profile">Profile</a></li></ul></div><div><h4>Contact</h4><p style="color:var(--txt-dim);font-size:0.85rem">mranonymous.efx@gmail.com</p></div></div><div class="copy">&copy; 2026 SnapGlow. Uses Adstera ads.</div>';
  }
  SG.trackView();
});