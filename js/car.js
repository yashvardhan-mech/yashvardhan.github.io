/* car.js — an original F1-style car (not a real team's car or livery).
   1. #garage: a scroll tour of an exploded F1 render (assets/img/car-exploded.jpg), part by part.
   2. window.F1Car.arrive / leave: the car drives into the pit box, jacks up, and drives away
      (used by pitstop.js around the interactive tyre change).
   Plain script; respects prefers-reduced-motion. */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var O = '#FF6B1A', D = '#15171A', K = '#0A0A0B', C = '#EEEAE2', G = '#3A3F46', MONO = "'IBM Plex Mono',ui-monospace,monospace";

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function anim(el, frames, opts) {
    if (!el || !el.animate) return Promise.resolve();
    return el.animate(frames, Object.assign({ fill: 'forwards' }, opts)).finished.catch(function () {});
  }
  function sfx(name, opt, delay) { var s = window.PitStop && window.PitStop.sfx; if (s) s.play(name, opt, delay); }
  // a quick synthesized engine note: sweeps between two pitches
  function engine(from, to, dur, vol) {
    var s = window.PitStop && window.PitStop.sfx; if (!s || s.isMuted()) return;
    var c = s.unlock(); if (!c) return;
    try {
      var t = c.currentTime + 0.01, g = c.createGain(), f = c.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.setValueAtTime(700, t); f.frequency.linearRampToValueAtTime(2200, t + dur * 0.6);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.22, t + 0.06); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      [['sawtooth', 1], ['square', 1.505]].forEach(function (d) {
        var o = c.createOscillator(); o.type = d[0];
        o.frequency.setValueAtTime(from * d[1], t); o.frequency.exponentialRampToValueAtTime(to * d[1], t + dur * 0.9);
        o.connect(f); o.start(t); o.stop(t + dur + 0.05);
      });
      f.connect(g); g.connect(c.destination);
    } catch (e) {}
  }

  /* ---------- the car (side view, nose to the right) ---------- */
  // each part: exploded offset [dx, dy, rotate], label [x, y, text, anchor]
  var PARTS = {
    floor: { off: [0, 112, 0], lbl: [480, 276, 'FLOOR · GROUND EFFECT'],
      svg: '<path d="M118,246 L862,246 L862,256 L170,259 Z" fill="' + K + '"/><path d="M96,222 L172,246 L124,256 L84,236 Z" fill="' + G + '"/>' },
    enginecover: { off: [-30, -122, 0], lbl: [300, 146, 'ENGINE COVER'],
      svg: '<path d="M150,206 C230,194 310,168 390,148 L486,124 Q512,116 530,124 L566,150 L566,184 L300,204 L168,216 Z" fill="' + O + '"/>'
        + '<path d="M240,196 L446,134 L482,128 L482,150 L300,198 Z" fill="' + D + '"/>'
        + '<text x="400" y="170" fill="' + C + '" font-family="Archivo,system-ui,sans-serif" font-weight="800" font-size="32" font-style="italic">24</text>'
        + '<path d="M532,124 L560,128 L560,144 L534,144 Z" fill="' + K + '"/>' },
    tub: { off: [0, 0, 0], lbl: [628, 228, 'SURVIVAL CELL', 'middle', D],
      svg: '<path d="M536,150 L704,168 L724,200 L724,238 L516,240 L516,176 Z" fill="' + O + '"/>'
        + '<path d="M560,200 L724,206 L724,214 L560,211 Z" fill="' + C + '"/>' },
    sidepod: { off: [-70, 78, 0], lbl: [500, 266, 'SIDEPOD · COOLING'],
      svg: '<path d="M424,186 Q480,168 566,172 L604,178 L604,238 L420,242 Q402,214 424,186 Z" fill="' + D + '"/>'
        + '<path d="M430,214 L600,206 L600,212 L432,222 Z" fill="' + O + '"/>'
        + '<path d="M588,180 L606,180 L606,214 L588,214 Z" fill="' + K + '"/>' },
    nose: { off: [120, -82, 4], lbl: [800, 196, 'NOSE'],
      svg: '<path d="M704,170 L884,212 Q902,218 904,228 L884,234 L722,238 Z" fill="' + O + '"/><path d="M870,214 Q902,218 904,228 L884,234 L866,234 Z" fill="' + D + '"/>' },
    frontwing: { off: [150, 100, 0], lbl: [900, 274, 'FRONT WING'],
      svg: '<path d="M820,240 Q900,232 975,236 L975,246 Q900,244 820,250 Z" fill="' + D + '"/>'
        + '<path d="M840,228 Q910,220 970,224 L970,232 Q910,230 842,236 Z" fill="' + O + '"/>'
        + '<path d="M958,204 L986,208 L986,252 L954,252 Z" fill="' + D + '"/>' },
    helmet: { off: [10, -96, 0], lbl: [644, 128, 'DRIVER', 'start'],
      svg: '<circle cx="612" cy="140" r="20" fill="' + C + '"/><path d="M596,132 Q612,122 630,130" stroke="' + O + '" stroke-width="5" fill="none"/>'
        + '<path d="M616,138 L634,141 L632,152 L616,150 Z" fill="' + K + '"/>' },
    halo: { off: [40, -152, 0], lbl: [625, 104, 'HALO'],
      svg: '<path d="M560,150 Q622,110 692,150 L704,168" stroke="' + D + '" stroke-width="9" fill="none" stroke-linecap="round"/>' },
    rearwing: { off: [-110, -112, -6], lbl: [112, 78, 'REAR WING · DRS'],
      svg: '<path d="M150,128 L162,128 L162,208 L150,208 Z" fill="' + G + '"/>'
        + '<path d="M70,92 L150,92 L156,214 L84,214 Z" fill="' + D + '"/><path d="M74,150 L152,150 L153,160 L76,160 Z" fill="' + O + '"/>'
        + '<path d="M58,96 Q110,86 168,98 L166,112 Q112,104 60,112 Z" fill="' + O + '"/>'
        + '<path d="M64,118 Q112,110 162,120 L160,130 Q112,124 66,132 Z" fill="' + C + '"/>' },
    wheelR: { off: [-170, 22, 0], lbl: [215, 286, '18" WHEEL'], wheel: [215, 212] },
    wheelF: { off: [172, 34, 0], lbl: [800, 286, '18" WHEEL'], wheel: [800, 212] }
  };
  var ORDER = ['floor', 'tub', 'sidepod', 'enginecover', 'nose', 'frontwing', 'halo', 'helmet', 'rearwing', 'wheelR', 'wheelF'];

  function wheel(cx, cy) {
    var marks = '';
    for (var i = 0; i < 5; i++) {
      var a = i * 72 * Math.PI / 180;
      marks += '<rect x="' + (cx - 3) + '" y="' + (cy - 27) + '" width="6" height="11" rx="2" fill="' + O + '" transform="rotate(' + (i * 72) + ' ' + cx + ' ' + cy + ')"/>';
    }
    return '<circle cx="' + cx + '" cy="' + cy + '" r="50" fill="' + K + '"/>'
      + '<circle cx="' + cx + '" cy="' + cy + '" r="43" fill="none" stroke="' + O + '" stroke-width="2" opacity=".85"/>'
      + '<g class="spin"><circle cx="' + cx + '" cy="' + cy + '" r="31" fill="#23262B"/>' + marks
      + '<circle cx="' + cx + '" cy="' + cy + '" r="7" fill="' + O + '"/></g>';
  }

  function carSVG(opts) {
    opts = opts || {};
    var out = '';
    ['floor', 'enginecover', 'tub', 'sidepod', 'helmet', 'halo', 'nose', 'frontwing', 'rearwing', 'wheelR', 'wheelF'].forEach(function (k) {
      var p = PARTS[k], body = p.wheel ? wheel(p.wheel[0], p.wheel[1]) : p.svg, lab = '';
      if (opts.labels) {
        var l = p.lbl, anchor = l[3] || 'middle', col = l[4] || C;
        lab = '<g class="lbl"><text x="' + l[0] + '" y="' + l[1] + '" text-anchor="' + anchor + '" fill="' + col + '" font-family="' + MONO + '" font-size="15" font-weight="500" letter-spacing="2">' + l[2] + '</text></g>';
      }
      out += '<g class="cp' + (k === 'wheelF' ? ' w-front' : '') + '" data-p="' + k + '">' + body + lab + '</g>';
    });
    var jacks = '';
    if (opts.jacks) {
      jacks = '<g class="jack jf"><rect x="990" y="234" width="80" height="12" rx="4" fill="' + G + '"/><path d="M1060,240 L1110,140" stroke="' + G + '" stroke-width="8" stroke-linecap="round"/><rect x="1100" y="128" width="26" height="14" rx="4" fill="' + O + '"/><circle cx="1066" cy="252" r="7" fill="' + K + '"/></g>'
        + '<g class="jack jr"><rect x="-20" y="228" width="80" height="12" rx="4" fill="' + G + '"/><path d="M-10,234 L-60,134" stroke="' + G + '" stroke-width="8" stroke-linecap="round"/><rect x="-76" y="122" width="26" height="14" rx="4" fill="' + O + '"/><circle cx="-14" cy="246" r="7" fill="' + K + '"/></g>';
    }
    return '<svg viewBox="' + (opts.viewBox || '-140 -170 1300 580') + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + (opts.label || 'An original F1-style race car') + '">'
      + (opts.shadow ? '<ellipse cx="500" cy="262" rx="470" ry="10" fill="#000" opacity=".55"/>' : '')
      + '<g class="body">' + out + '</g>' + jacks + '</svg>';
  }

  /* ---------- styles ---------- */
  function css() {
    if (document.getElementById('car-css')) return;
    var s = document.createElement('style'); s.id = 'car-css';
    s.textContent = ''
      + '#garage{position:relative;height:280vh;background:#0C0D0F;color:#EEEAE2}'
      + '#garage .garage-sticky{position:sticky;top:0;height:100vh;display:flex;flex-direction:column;justify-content:center;gap:clamp(8px,2vh,22px);overflow:hidden;padding-top:clamp(84px,13vh,128px);padding-bottom:24px}'
      + '#garage .garage-head{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:12px 32px}'
      + '#garage .garage-tag{font-family:' + MONO + ';font-size:12px;letter-spacing:.14em;color:' + O + '}'
      + '#garage h2{margin:6px 0 0;font-family:Archivo,system-ui,sans-serif;font-weight:800;font-stretch:115%;font-size:clamp(28px,4.6vw,60px);line-height:1;letter-spacing:-.01em}'
      + '#garage .garage-sub{margin:10px 0 0;max-width:46ch;color:#C9CCD1;font-size:clamp(14px,1.4vw,17px);line-height:1.5}'
      + '#garage .garage-read{font-family:' + MONO + ';font-size:12px;letter-spacing:.14em;color:#A3A8B0;text-align:right;min-width:190px}'
      + '#garage .garage-read b{display:block;font-family:Archivo,system-ui,sans-serif;font-weight:800;font-stretch:125%;font-size:clamp(30px,4vw,48px);color:#EEEAE2;letter-spacing:0;font-variant-numeric:tabular-nums}'
      + '#garage .garage-bar{height:3px;background:#2B2F35;border-radius:3px;overflow:hidden;margin-top:8px}'
      + '#garage .garage-bar i{display:block;height:100%;width:0;background:' + O + '}'
      + '#garage .garage-head>div:first-child{flex:1 1 480px;min-width:0}'
      + '@media (max-width:640px){#garage .lbl text{font-size:30px;letter-spacing:1px}}'
      + '#garage .garage-car{position:relative;flex:0 1 auto;min-height:0}'
      + '#garage .garage-car svg{display:block;width:100%;height:auto;max-height:60vh;margin:0 auto;overflow:visible}'
      + '#garage .cp,#garage .spin,.car-scene .spin,.car-scene .jack,.car-scene .body{transform-box:fill-box;transform-origin:center}'
      + '#garage .lines{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .4s}'
      + '#garage .lines i{position:absolute;height:2px;left:-30%;width:30%;background:linear-gradient(90deg,transparent,rgba(238,234,226,.5));animation:garage-line .7s linear infinite}'
      + '#garage.ready .lines{opacity:1}'
      + '#garage.ready .spin{animation:garage-spin .35s linear infinite}'
      + '#garage.ready .garage-car svg{animation:garage-idle .12s linear infinite alternate}'
      + '@keyframes garage-spin{to{transform:rotate(360deg)}}'
      + '@keyframes garage-line{to{transform:translateX(480%)}}'
      + '@keyframes garage-idle{to{transform:translateY(1px)}}'
      + '@media (prefers-reduced-motion: reduce){#garage{height:auto}#garage .garage-sticky{position:static;height:auto;padding-top:80px;padding-bottom:80px}#garage.ready .spin,#garage.ready .garage-car svg{animation:none}#garage .lines{display:none}}'
      + '#garage{height:620vh}'
      + '#garage .tour{position:relative;width:min(100%,calc(62vh * 1672 / 941));aspect-ratio:1672/941;margin:0 auto;border-radius:18px;overflow:hidden;background:#050506;border:1px solid #2B2F35}'
      + '#garage .tour img{position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform;max-width:none;user-select:none;-webkit-user-drag:none}'
      + '#garage .tour-dot{position:absolute;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;background:' + O + ';box-shadow:0 0 0 0 rgba(255,107,26,.7);animation:tour-pulse 1.4s infinite;transition:opacity .3s;pointer-events:none}'
      + '@keyframes tour-pulse{70%{box-shadow:0 0 0 18px rgba(255,107,26,0)}100%{box-shadow:0 0 0 0 rgba(255,107,26,0)}}'
      + '#garage .tour-cap{position:absolute;left:16px;bottom:16px;max-width:min(420px,calc(100% - 32px));padding:14px 16px;border-radius:14px;background:rgba(12,13,15,.86);backdrop-filter:blur(8px);border:1px solid #2B2F35}'
      + '#garage .tour-cap .n{display:block;font-family:' + MONO + ';font-size:11px;letter-spacing:.14em;color:' + O + '}'
      + '#garage .tour-cap b{display:block;margin-top:4px;font-family:Archivo,system-ui,sans-serif;font-weight:800;font-stretch:115%;font-size:clamp(18px,2.2vw,26px);line-height:1.1}'
      + '#garage .tour-cap p{margin:6px 0 0;color:#C9CCD1;font-size:clamp(13px,1.2vw,15px);line-height:1.45}'
      + '@media (max-width:640px){#garage .tour{width:100%;aspect-ratio:auto;height:52vh}#garage .tour-cap{left:10px;right:10px;bottom:10px;max-width:none;padding:10px 12px}}'
      + '@media (prefers-reduced-motion: reduce){#garage{height:auto}#garage .tour-dot{display:none}}'
      // pit-lane scene
      + '.car-scene{position:absolute;inset:0;z-index:5;background:#0C0D0F;overflow:hidden}'
      + '.car-scene .cs-wall{position:absolute;left:0;right:0;top:0;height:46%;background:linear-gradient(#0C0D0F,#15171A);border-bottom:4px solid #2B2F35}'
      + '.car-scene .cs-wall::after{content:"";position:absolute;left:0;right:0;bottom:18%;height:10px;background:repeating-linear-gradient(90deg,' + O + ' 0 60px,#EEEAE2 60px 120px);opacity:.75}'
      + '.car-scene .cs-lane{position:absolute;left:0;right:0;bottom:0;height:54%;background:#1A1C20}'
      + '.car-scene .cs-lane::before{content:"";position:absolute;left:0;right:0;top:16%;border-top:3px dashed rgba(238,234,226,.35)}'
      + '.car-scene .cs-box{position:absolute;left:50%;top:26%;transform:translateX(-50%);width:min(86vw,900px);height:44%;border:4px solid ' + O + ';border-radius:6px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:6px;font-family:Archivo,system-ui,sans-serif;font-weight:800;font-stretch:125%;font-size:clamp(20px,4vw,44px);color:rgba(255,107,26,.35);letter-spacing:.3em}'
      + '.car-scene .cs-car{position:absolute;left:50%;bottom:19%;width:min(94vw,1000px);transform:translateX(-50%)}'
      + '.car-scene .cs-car svg{display:block;width:100%;height:auto;overflow:visible}'
      + '.car-scene .cs-cap{position:absolute;left:0;right:0;top:12%;text-align:center;font-family:' + MONO + ';font-size:clamp(12px,1.6vw,16px);letter-spacing:.24em;color:#EEEAE2}'
      + '.car-scene .cs-cap b{display:block;font-family:Archivo,system-ui,sans-serif;font-weight:800;font-stretch:125%;font-size:clamp(34px,7vw,84px);letter-spacing:.02em;color:' + O + ';line-height:1;margin-bottom:8px}';
    document.head.appendChild(s);
  }

  /* ---------- 1. garage: builds itself as you scroll ---------- */
  function garage() {
    var sec = document.getElementById('garage'); if (!sec) return;
    var host = sec.querySelector('.garage-car'); if (!host) return;
    var IW = 1672, IH = 941;
    // tour stops on the exploded render: [x, y, zoom, title, note]
    var STOPS = [
      [836, 470, 1, 'THE WHOLE CAR', 'A modern F1 car pulled apart. Keep scrolling to go part by part.'],
      [300, 660, 2.0, 'FRONT WING', 'The first part to meet the air. It sets up the airflow for the rest of the car.'],
      [300, 360, 2.0, 'WHEEL, UPRIGHT & BRAKE', 'Carbon brake discs can run at over 1,000 °C under heavy braking.'],
      [740, 310, 1.9, 'SURVIVAL CELL & HALO', 'The carbon-fibre tub protects the driver. The halo above it can take the weight of a bus.'],
      [1150, 330, 2.0, 'POWER UNIT', 'A 1.6-litre V6 turbo hybrid. The engine and electric motors work together.'],
      [1430, 290, 2.1, 'GEARBOX', 'Eight forward gears. Mine has four, and I printed every tooth.'],
      [1410, 120, 2.0, 'REAR WING & DRS', 'A flap opens on the straights to cut drag, then closes for the corners.'],
      [1100, 520, 1.8, 'FLOOR', 'Tunnels under the car pull it down onto the track. That is where most of the grip comes from.'],
      [836, 470, 1, 'BACK TOGETHER', 'Every part has one job. That is how I like to build things too.']
    ];
    var N = STOPS.length;
    host.innerHTML = '<div class="tour"><img src="assets/img/car-exploded.jpg" alt="Exploded view of a modern Formula 1 car, with every part floating apart" decoding="async">'
      + '<span class="tour-dot" aria-hidden="true"></span>'
      + '<div class="tour-cap" aria-live="polite"><span class="n"></span><b></b><p></p></div></div>';
    var tour = host.querySelector('.tour'), img = tour.querySelector('img'), dot = tour.querySelector('.tour-dot'), capEl = tour.querySelector('.tour-cap');
    var pct = sec.querySelector('.garage-read b'), bar = sec.querySelector('.garage-bar i'), state = sec.querySelector('.garage-state');
    var shown = -1;

    function smooth(t) { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); }
    function view(x, y, z) {
      var W = tour.clientWidth, H = tour.clientHeight; if (!W || !H) return;
      var k = Math.max(W / IW, H / IH), s = k * z, iw = IW * s, ih = IH * s;
      var tx = Math.min(0, Math.max(W - iw, W / 2 - x * s)), ty = Math.min(0, Math.max(H - ih, H / 2 - y * s));
      img.style.width = (IW * k) + 'px'; img.style.height = (IH * k) + 'px';
      img.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) scale(' + z.toFixed(3) + ')';
      return [tx, ty, s];
    }
    function caption(i) {
      if (i === shown) return; shown = i;
      var st = STOPS[i];
      capEl.querySelector('.n').textContent = (i === 0 || i === N - 1) ? 'EXPLODED VIEW' : ('PART ' + i + ' OF ' + (N - 2));
      capEl.querySelector('b').textContent = st[3];
      capEl.querySelector('p').textContent = st[4];
      if (capEl.animate && !reduce) capEl.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'ease-out' });
      if (state) state.textContent = (i === 0 || i === N - 1) ? 'TOUR' : 'PART';
      if (i > 0 && i < N - 1) sfx('clunk');
    }
    function render(p) {
      var f = p * (N - 1), i = Math.min(N - 2, Math.floor(f)), t = smooth((f - i - 0.3) / 0.4);
      var a = STOPS[i], b = STOPS[i + 1];
      var x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t, z = a[2] + (b[2] - a[2]) * t;
      var v = view(x, y, z); if (!v) return;
      var near = Math.round(f), st = STOPS[near];
      caption(near);
      // pulsing marker on the part, only while we are parked on a part
      var parked = Math.abs(f - near) < 0.3 && near > 0 && near < N - 1;
      dot.style.opacity = parked ? '1' : '0';
      dot.style.left = (v[0] + st[0] * v[2]) + 'px'; dot.style.top = (v[1] + st[1] * v[2]) + 'px';
      var n = Math.round(Math.min(1, p / 0.98) * 100);
      if (pct) pct.textContent = (near > 0 && near < N - 1) ? (near + '/' + (N - 2)) : (p > 0.5 ? 'DONE' : 'START');
      if (bar) bar.style.width = n + '%';
    }
    if (reduce) { img.onload = function () { render(0); }; render(0); window.addEventListener('resize', function () { render(0); }); return; }
    var ticking = false;
    function onScroll() {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var r = sec.getBoundingClientRect(), span = sec.offsetHeight - window.innerHeight;
        render(span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0);
      });
    }
    img.addEventListener('load', onScroll);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  }

  /* ---------- 2. pit lane: drive in, jack up / drop, drive out ---------- */
  function sceneFor(overlay) {
    var sc = overlay.querySelector('.car-scene');
    if (sc) return sc;
    css();
    sc = document.createElement('div');
    sc.className = 'car-scene';
    sc.setAttribute('aria-hidden', 'true');
    sc.innerHTML = '<div class="cs-wall"></div><div class="cs-lane"><div class="cs-box">BOX</div></div>'
      + '<div class="cs-car"><div class="cs-drive">' + carSVG({ jacks: true, shadow: true, viewBox: '-90 70 1230 210' }) + '</div></div>'
      + '<div class="cs-cap"></div>';
    overlay.appendChild(sc);
    var skip = overlay.querySelector('.pit-skip'); if (skip) { skip.style.zIndex = '6'; }
    return sc;
  }
  function spinWheels(sc, turns, dur, easing) {
    sc.querySelectorAll('.spin').forEach(function (w) {
      anim(w, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(' + (turns * 360) + 'deg)' }], { duration: dur, easing: easing, fill: 'none' });
    });
  }
  function cap(sc, big, small) { sc.querySelector('.cs-cap').innerHTML = (big ? '<b>' + big + '</b>' : '') + (small || ''); }

  async function arrive(overlay) {
    if (reduce) return;
    var sc = sceneFor(overlay);
    var drive = sc.querySelector('.cs-drive'), body = sc.querySelector('.body'), jf = sc.querySelector('.jf'), jr = sc.querySelector('.jr');
    jf.style.opacity = '0'; jr.style.opacity = '0';
    cap(sc, 'BOX, BOX', 'IN THIS LAP · CONFIRM');
    engine(260, 80, 1.4, 0.2); sfx('whoosh', 0.6);
    spinWheels(sc, 9, 1300, 'cubic-bezier(.15,.7,.25,1)');
    await anim(drive, [{ transform: 'translateX(-130vw)' }, { transform: 'translateX(0)' }], { duration: 1300, easing: 'cubic-bezier(.15,.7,.25,1)' });
    // jacks in, car up
    cap(sc, 'JACKS UP', 'CREW READY');
    anim(jf, [{ transform: 'translateX(90px)', opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }], { duration: 220, easing: 'cubic-bezier(.2,.8,.3,1)' });
    await anim(jr, [{ transform: 'translateX(-90px)', opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }], { duration: 220, easing: 'cubic-bezier(.2,.8,.3,1)' });
    sfx('clunk');
    await anim(body, [{ transform: 'translateY(0)' }, { transform: 'translateY(-12px)' }], { duration: 160, easing: 'ease-out' });
    cap(sc, 'YOUR TURN', 'CHANGE THE FRONT-LEFT TYRE');
    await wait(650);
    // zoom into the front wheel, then hand over to the close-up
    var w = sc.querySelector('.w-front').getBoundingClientRect(), box = sc.getBoundingClientRect();
    sc.style.transformOrigin = (w.left + w.width / 2 - box.left) + 'px ' + (w.top + w.height / 2 - box.top) + 'px';
    sfx('whoosh', 0.35);
    await anim(sc, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(3.4)', opacity: 0 }], { duration: 520, easing: 'cubic-bezier(.6,0,.4,1)' });
    sc.style.visibility = 'hidden';
  }

  async function leave(overlay) {
    if (reduce) return;
    var sc = overlay.querySelector('.car-scene'); if (!sc) return;
    var drive = sc.querySelector('.cs-drive'), body = sc.querySelector('.body'), jf = sc.querySelector('.jf'), jr = sc.querySelector('.jr');
    sc.style.visibility = 'visible';
    cap(sc, 'JACKS DOWN', 'GO, GO, GO');
    await anim(sc, [{ transform: 'scale(3.4)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 460, easing: 'cubic-bezier(.2,.8,.3,1)' });
    await anim(body, [{ transform: 'translateY(-12px)' }, { transform: 'translateY(0)' }], { duration: 140, easing: 'ease-in' });
    sfx('thud', 0.8);
    anim(jf, [{ transform: 'translateX(0)', opacity: 1 }, { transform: 'translateX(90px)', opacity: 0 }], { duration: 200 });
    anim(jr, [{ transform: 'translateX(0)', opacity: 1 }, { transform: 'translateX(-90px)', opacity: 0 }], { duration: 200 });
    await wait(180);
    engine(90, 320, 1.1, 0.24); sfx('whoosh', 0.8, 0.35);
    spinWheels(sc, 10, 1000, 'cubic-bezier(.5,0,.85,.4)');
    await anim(drive, [{ transform: 'translateX(0)' }, { transform: 'translateX(130vw)' }], { duration: 1000, easing: 'cubic-bezier(.5,0,.85,.4)' });
    await anim(sc, [{ opacity: 1 }, { opacity: 0 }], { duration: 260 });
    sc.remove();
  }

  window.F1Car = { svg: carSVG, arrive: arrive, leave: leave };

  function start() { css(); garage(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
