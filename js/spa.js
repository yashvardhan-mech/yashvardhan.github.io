/* Shift: a lap of Spa-Francorchamps.
   1. Hero: the circuit draws itself, a car streaks round, corners labelled.
   2. Lap tracker: mini-map where scroll position = position on the lap.
   3. Sector banners as you pass each corner; chequered flag at the end with your real time on the page.
   Artistic outline of the circuit, not a surveyed map. Plain script; respects reduced motion. */
(function () {
  'use strict';
  var D = 'M168.0 392.0 C163.0 373.7 159.7 351.7 156.0 330.0 C152.3 308.3 149.0 283.7 146.0 262.0 C143.0 240.3 140.0 217.3 138.0 200.0 C136.0 182.7 132.7 170.3 134.0 158.0 C135.3 145.7 140.0 132.3 146.0 126.0 C152.0 119.7 163.7 117.3 170.0 120.0 C176.3 122.7 180.7 130.0 184.0 142.0 C187.3 154.0 186.7 173.7 190.0 192.0 C193.3 210.3 199.0 233.7 204.0 252.0 C209.0 270.3 214.7 288.0 220.0 302.0 C225.3 316.0 230.3 328.3 236.0 336.0 C241.7 343.7 247.7 348.3 254.0 348.0 C260.3 347.7 267.0 341.0 274.0 334.0 C281.0 327.0 275.0 320.7 296.0 306.0 C317.0 291.3 362.7 265.3 400.0 246.0 C437.3 226.7 483.3 207.7 520.0 190.0 C556.7 172.3 596.7 152.0 620.0 140.0 C643.3 128.0 648.3 120.7 660.0 118.0 C671.7 115.3 682.3 125.3 690.0 124.0 C697.7 122.7 698.3 111.3 706.0 110.0 C713.7 108.7 726.0 110.0 736.0 116.0 C746.0 122.0 756.7 134.3 766.0 146.0 C775.3 157.7 788.0 173.3 792.0 186.0 C796.0 198.7 795.0 214.7 790.0 222.0 C785.0 229.3 771.0 231.3 762.0 230.0 C753.0 228.7 743.7 213.7 736.0 214.0 C728.3 214.3 721.0 220.7 716.0 232.0 C711.0 243.3 710.7 264.3 706.0 282.0 C701.3 299.7 695.7 320.3 688.0 338.0 C680.3 355.7 671.3 375.0 660.0 388.0 C648.7 401.0 630.7 406.3 620.0 416.0 C609.3 425.7 597.0 435.3 596.0 446.0 C595.0 456.7 603.7 471.0 614.0 480.0 C624.3 489.0 649.0 493.0 658.0 500.0 C667.0 507.0 672.7 516.7 668.0 522.0 C663.3 527.3 648.0 532.3 630.0 532.0 C612.0 531.7 586.7 527.0 560.0 520.0 C533.3 513.0 500.0 500.7 470.0 490.0 C440.0 479.3 408.3 464.3 380.0 456.0 C351.7 447.7 324.0 441.3 300.0 440.0 C276.0 438.7 251.7 445.0 236.0 448.0 C220.3 451.0 214.3 459.3 206.0 458.0 C197.7 456.7 192.3 451.0 186.0 440.0 C179.7 429.0 173.0 410.3 168.0 392.0Z';
  var PTS = [[168, 392], [156, 330], [146, 262], [138, 200], [134, 158], [146, 126], [170, 120], [184, 142], [190, 192], [204, 252], [220, 302], [236, 336], [254, 348], [274, 334], [296, 306], [400, 246], [520, 190], [620, 140], [660, 118], [690, 124], [706, 110], [736, 116], [766, 146], [792, 186], [790, 222], [762, 230], [736, 214], [716, 232], [706, 282], [688, 338], [660, 388], [620, 416], [596, 446], [614, 480], [658, 500], [668, 522], [630, 532], [560, 520], [470, 490], [380, 456], [300, 440], [236, 448], [206, 458], [186, 440]];
  // corners in lap order: [name, point index, sector]
  var CORNERS = [['La Source',5,1],['Eau Rouge',12,1],['Kemmel',16,1],['Les Combes',19,2],['Rivage',26,2],['Pouhon',30,2],['Stavelot',35,3],['Blanchimont',39,3],['Bus Stop',42,3]];
  var SECTOR_COL = { 1: '#FFD12E', 2: '#2BD46A', 3: '#B36BFF' };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MONO = "'IBM Plex Mono',ui-monospace,monospace";
  var t0 = performance.now();

  var css = ''
    + '#top{position:relative;overflow:hidden}'
    + '#top>.container{position:relative;z-index:1}'
    + '.spa-hero{position:absolute;right:max(-80px,calc((100vw - 1240px)/2 - 60px));top:50%;transform:translateY(-44%);width:min(58vw,780px);pointer-events:none;z-index:0}.spa-hero .base,.spa-hero .lab{opacity:.55}'
    + '.spa-hero svg{display:block;width:100%;height:auto;overflow:visible}'
    + '.spa-hero .base{stroke-dasharray:1;stroke-dashoffset:1}'
    + '.spa-hero.on .base{stroke-dashoffset:0;transition:stroke-dashoffset 2.4s cubic-bezier(.6,.05,.3,1)}'
    + '.spa-hero .car{stroke-dasharray:0 1;opacity:0}'
    + '.spa-hero.on .car{opacity:1;stroke-dasharray:.035 .965;animation:spa-lap 7.5s linear 2.3s infinite;transition:opacity .3s 2.3s}'
    + '.spa-hero .lab{opacity:0;transition:opacity .5s}'
    + '.spa-hero.on .lab{opacity:.75}'
    + '@keyframes spa-lap{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}'
    + '@media (max-width:900px){.spa-hero{opacity:.28;width:120vw;right:-30vw}.spa-hero .lab{display:none}}'
    + '.spa-map{position:fixed;right:10px;bottom:10px;z-index:900;width:156px;padding:9px 11px 8px;pointer-events:none;border-radius:16px;border:1px solid #3A3F46;background:rgba(12,13,15,.86);backdrop-filter:blur(8px);color:#EEEAE2;font-family:' + MONO + ';box-shadow:0 10px 30px rgba(0,0,0,.4);transition:transform .4s,opacity .6s}'
    + '.spa-map svg{display:block;width:100%;height:auto;overflow:visible}'
    + '.spa-map .row{display:flex;justify-content:space-between;gap:8px;font-size:10px;letter-spacing:.12em;color:#A3A8B0}'
    + '.spa-map .corner{font-size:11px;letter-spacing:.1em;color:#EEEAE2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
    + '.spa-map .sec{font-weight:600}'
    + '@media (max-width:600px){.spa-map{width:74px;padding:5px 6px;right:6px;bottom:6px;border-radius:12px;background:rgba(12,13,15,.78)}.spa-map .row.top,.spa-map .corner{display:none}}'
    + '.spa-banner{position:fixed;left:20px;top:84px;z-index:950;display:flex;align-items:stretch;min-height:52px;border-radius:6px;overflow:hidden;background:#0C0D0F;border:1px solid #3A3F46;box-shadow:0 12px 30px rgba(0,0,0,.45);font-family:' + MONO + ';transform:translateX(-120%);pointer-events:none}'
    + '.spa-banner .tag{display:flex;align-items:center;justify-content:center;min-width:52px;padding:0 12px;font-family:Archivo,system-ui,sans-serif;font-weight:800;font-stretch:125%;font-size:20px;color:#0C0D0F}'
    + '.spa-banner .txt{display:flex;flex-direction:column;justify-content:center;padding:6px 18px 6px 14px;gap:2px}'
    + '.spa-banner .k{font-size:10px;letter-spacing:.14em;color:#A3A8B0}'
    + '.spa-banner .v{font-family:Archivo,system-ui,sans-serif;font-weight:800;font-stretch:125%;font-size:20px;letter-spacing:-.01em;color:#EEEAE2;white-space:nowrap}'
    + '.spa-flag{position:fixed;left:50%;top:50%;z-index:960;transform:translate(-50%,-50%) scale(.8);opacity:0;pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:10px;padding:26px 34px;border-radius:20px;background:rgba(12,13,15,.94);border:1px solid #3A3F46;box-shadow:0 20px 60px rgba(0,0,0,.5);font-family:' + MONO + ';color:#EEEAE2;text-align:center}'
    + '.spa-flag .chk{width:220px;height:34px;border-radius:4px;background-color:#EEEAE2;background-image:linear-gradient(45deg,#0C0D0F 25%,transparent 25%,transparent 75%,#0C0D0F 75%),linear-gradient(45deg,#0C0D0F 25%,transparent 25%,transparent 75%,#0C0D0F 75%);background-size:17px 17px;background-position:0 0,8.5px 8.5px;animation:spa-wave .6s ease-in-out infinite alternate;transform-origin:left center}'
    + '@keyframes spa-wave{from{transform:skewY(-3deg)}to{transform:skewY(3deg)}}'
    + '.spa-flag .big{font-family:Archivo,system-ui,sans-serif;font-weight:800;font-stretch:125%;font-size:40px;line-height:1;font-variant-numeric:tabular-nums}'
    + '.spa-flag .k{font-size:11px;letter-spacing:.14em;color:#A3A8B0}'
    + '@media (prefers-reduced-motion:reduce){.spa-hero .base{stroke-dashoffset:0}.spa-hero .car{display:none}.spa-flag .chk{animation:none}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function trackSVG(opts) {
    var s = '<svg viewBox="96 90 730 470" aria-hidden="true">';
    s += '<path d="' + D + '" fill="none" stroke="#1F2227" stroke-width="' + opts.under + '" stroke-linejoin="round" stroke-linecap="round"/>';
    s += '<path class="base" pathLength="1" d="' + D + '" fill="none" stroke="' + opts.col + '" stroke-width="' + opts.w + '" stroke-linejoin="round" stroke-linecap="round"/>';
    if (opts.extra) s += opts.extra;
    return s + '</svg>';
  }
  function fmt(ms) {
    var s = ms / 1000, m = Math.floor(s / 60), r = s - m * 60;
    return m + ':' + (r < 10 ? '0' : '') + r.toFixed(3);
  }
  function sfx(name, opt) { try { if (window.PitStop && window.PitStop.sfx) window.PitStop.sfx.play(name, opt); } catch (e) {} }
  function introGone() { return !document.querySelector('.pit-overlay'); }
  function whenIntroGone(fn) { if (introGone()) return fn(); var iv = setInterval(function () { if (introGone()) { clearInterval(iv); fn(); } }, 150); }

  /* ---------- 1. hero circuit ---------- */
  function hero() {
    var top = document.getElementById('top'); if (!top) return;
    var labs = [['LA SOURCE',5,-14,-16,'end'],['EAU ROUGE',12,10,26,'start'],['KEMMEL STRAIGHT',16,-10,-16,'middle'],['LES COMBES',19,0,-22,'middle'],['POUHON',30,14,6,'start'],['STAVELOT',35,14,22,'start'],['BLANCHIMONT',39,0,30,'middle']];
    var extra = '<path class="car" pathLength="1" d="' + D + '" fill="none" stroke="#FF6B1A" stroke-width="7" stroke-linecap="round" style="filter:drop-shadow(0 0 8px rgba(255,107,26,.9))"/>';
    labs.forEach(function (l) {
      var p = PTS[l[1]];
      extra += '<g class="lab"><circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" fill="#FF6B1A"/><text x="' + (p[0] + l[2]) + '" y="' + (p[1] + l[3]) + '" text-anchor="' + l[4] + '" fill="#A3A8B0" style="font-family:' + MONO + ';font-size:13px;letter-spacing:.12em">' + l[0] + '</text></g>';
    });
    var p0 = PTS[0];
    extra += '<g class="lab"><rect x="' + (p0[0] - 16) + '" y="' + (p0[1] - 3) + '" width="32" height="6" fill="#EEEAE2"/><text x="' + (p0[0] - 22) + '" y="' + (p0[1] + 5) + '" text-anchor="end" fill="#EEEAE2" style="font-family:' + MONO + ';font-size:12px;letter-spacing:.12em">START</text></g>';
    extra += '<text class="lab" x="826" y="580" text-anchor="end" fill="#6B7078" style="font-family:' + MONO + ';font-size:12px;letter-spacing:.14em">SPA-FRANCORCHAMPS · 7.004 KM</text>';
    var wrap = document.createElement('div'); wrap.className = 'spa-hero';
    wrap.innerHTML = trackSVG({ col: '#3A3F46', w: 5, under: 14, extra: extra });
    top.insertBefore(wrap, top.firstChild);
    var go = function () { requestAnimationFrame(function () { requestAnimationFrame(function () { wrap.classList.add('on'); }); }); };
    if (reduce) wrap.classList.add('on'); else whenIntroGone(go);
  }

  /* ---------- 2 + 3. lap tracker, sectors, chequered flag ---------- */
  function tracker() {
    var map = document.createElement('div'); map.className = 'spa-map'; map.setAttribute('aria-hidden', 'true');
    map.innerHTML = '<div class="row top"><span>LAP OF SPA</span><span class="pct">0%</span></div>'
      + trackSVG({ col: '#FF6B1A', w: 9, under: 9, extra: '<circle class="dot" r="13" fill="#EEEAE2" stroke="#0C0D0F" stroke-width="4"/>' })
      + '<div class="row"><span class="sec">S1</span><span class="corner">LA SOURCE</span></div>';
    document.body.appendChild(map);
    var svg = map.querySelector('svg'), base = map.querySelector('.base'), dot = map.querySelector('.dot');
    base.style.strokeDashoffset = '1';
    var real = svg.querySelectorAll('path')[0], L = real.getTotalLength();
    // where each corner sits along the lap (0..1)
    var marks = CORNERS.map(function (c) {
      var p = PTS[c[1]], best = 0, bd = 1e9;
      for (var i = 0; i <= 600; i++) { var q = real.getPointAtLength(L * i / 600), dd = (q.x - p[0]) * (q.x - p[0]) + (q.y - p[1]) * (q.y - p[1]); if (dd < bd) { bd = dd; best = i / 600; } }
      return { name: c[0], f: best, sector: c[2] };
    }).sort(function (a, b) { return a.f - b.f; });

    var banner = document.createElement('div'); banner.className = 'spa-banner'; banner.setAttribute('aria-hidden', 'true');
    banner.innerHTML = '<div class="tag">S1</div><div class="txt"><span class="k">SECTOR 1 · SPA-FRANCORCHAMPS</span><span class="v">La Source</span></div>';
    document.body.appendChild(banner);
    var bTag = banner.querySelector('.tag'), bK = banner.querySelector('.k'), bV = banner.querySelector('.v'), bAnim = null;
    function flash(m) {
      bTag.textContent = 'S' + m.sector; bTag.style.background = SECTOR_COL[m.sector];
      bK.textContent = 'SECTOR ' + m.sector + ' · SPA-FRANCORCHAMPS'; bV.textContent = m.name;
      sfx('beep');
      if (reduce || !banner.animate) return;
      if (bAnim) bAnim.cancel();
      bAnim = banner.animate([{ transform: 'translateX(-120%)' }, { transform: 'translateX(0)', offset: .15 }, { transform: 'translateX(0)', offset: .85 }, { transform: 'translateX(-120%)' }],
        { duration: 2200, easing: 'cubic-bezier(.2,.9,.3,1)' });
    }

    var flag = document.createElement('div'); flag.className = 'spa-flag'; flag.setAttribute('role', 'status');
    flag.innerHTML = '<div class="chk"></div><span class="k">LAP COMPLETE · YOUR TIME ON THIS SITE</span><span class="big">0:00.000</span><span class="k">THANKS FOR THE LAP. THE CONTACT DETAILS ARE RIGHT HERE.</span>';
    document.body.appendChild(flag);
    var finished = false;
    function chequered() {
      finished = true;
      flag.querySelector('.big').textContent = fmt(performance.now() - t0);
      sfx('beep', true);
      if (reduce || !flag.animate) { flag.style.opacity = 1; flag.style.transform = 'translate(-50%,-50%)'; setTimeout(function () { flag.style.opacity = 0; }, 3500); return; }
      flag.animate([{ opacity: 0, transform: 'translate(-50%,-50%) scale(.8)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)', offset: .12 }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)', offset: .85 }, { opacity: 0, transform: 'translate(-50%,-50%) scale(.95)' }],
        { duration: 3800, easing: 'cubic-bezier(.2,.9,.3,1)' });
    }

    var last = -1, ticking = false, pctEl = map.querySelector('.pct'), secEl = map.querySelector('.sec'), corEl = map.querySelector('.corner');
    function update() {
      ticking = false;
      var max = document.documentElement.scrollHeight - innerHeight;
      var f = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
      base.style.strokeDashoffset = String(1 - f);
      var pt = real.getPointAtLength(L * f); dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y);
      pctEl.textContent = Math.round(f * 100) + '%';
      // fade right down while you're reading, unless the screen is wide enough for it to sit beside the content
      var roomy = innerWidth >= 1600;
      map.style.opacity = f > 0.03 ? (idle && !roomy ? '0.12' : '1') : '0'; map.style.transform = f > 0.03 ? 'none' : 'translateY(16px)';
      var cur = marks[0];
      for (var i = 0; i < marks.length; i++) if (f >= marks[i].f) cur = marks[i];
      secEl.textContent = 'S' + cur.sector; secEl.style.color = SECTOR_COL[cur.sector];
      corEl.textContent = cur.name.toUpperCase();
      var idx = marks.indexOf(cur);
      if (idx > last && f > 0.01) { last = idx; if (introGone()) flash(cur); }
      if (f < 0.01) last = -1;
      if (f >= 0.985 && !finished && introGone()) chequered();
    }
    var idle = false, idleT;
    addEventListener('scroll', function () {
      idle = false; clearTimeout(idleT);
      idleT = setTimeout(function () { idle = true; update(); }, 1200);
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    addEventListener('resize', update);
    update();
  }

  function start() { hero(); tracker(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
