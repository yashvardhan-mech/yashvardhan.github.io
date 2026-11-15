/* Shift: opening titles. An original motorsport-style title sequence built from Yashvardhan's own photos.
   Plays after "lights out" (before the garage doors open) once per visit, and from the "Watch the intro" button.
   Plain script; skippable (button, Esc, click); skipped entirely for reduced motion. */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var IMG = 'assets/img/';
  var RED = '#E10E1C', ORANGE = '#FF6B1A', CHALK = '#F2EFEA', INK = '#0A0A0B';
  var MONO = "'IBM Plex Mono',ui-monospace,monospace";
  var EXP = "font-family:Archivo,system-ui,sans-serif;font-weight:900;font-stretch:125%";

  // script font for first names and roles
  var lk = document.createElement('link');
  lk.rel = 'stylesheet'; lk.href = 'https://fonts.googleapis.com/css2?family=Yellowtail&display=swap';
  document.head.appendChild(lk);

  var css = ''
    + '.tt{position:fixed;inset:0;z-index:10050;background:' + INK + ';overflow:hidden;color:' + CHALK + ';cursor:pointer}'
    + '.tt-bar{position:absolute;left:0;right:0;height:7vh;background:#000;z-index:20}.tt-bar.t{top:0}.tt-bar.b{bottom:0}'
    + '.tt-card{position:absolute;inset:0;overflow:hidden;opacity:0}'
    + '.tt-img{position:absolute;inset:-4%;background-size:cover;background-position:center}'
    + '.tt-tint{position:absolute;inset:0}'
    + '.tt-script{font-family:Yellowtail,"Brush Script MT",cursive;font-weight:400;color:' + RED + ';line-height:1;white-space:nowrap}'
    + '.tt-bold{' + EXP + ';text-transform:uppercase;line-height:.86;letter-spacing:-.02em;white-space:nowrap;transform:skewX(-8deg)}'
    + '.tt-ghost{position:absolute;left:0;' + EXP + ';text-transform:uppercase;white-space:nowrap;line-height:.8;letter-spacing:-.02em;color:transparent;-webkit-text-stroke:2px rgba(255,255,255,.14)}'
    + '.tt-tag{position:absolute;font-family:' + MONO + ';font-size:clamp(9px,1vw,13px);letter-spacing:.16em;color:rgba(242,239,234,.75);z-index:5}'
    + '.tt-skip{position:absolute;right:20px;bottom:calc(7vh + 14px);z-index:30;min-height:44px;padding:0 18px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:rgba(0,0,0,.5);color:' + CHALK + ';font-family:' + MONO + ';font-size:12px;letter-spacing:.14em;cursor:pointer}'
    + '.tt-floor{position:absolute;left:-50%;right:-50%;bottom:-10%;height:70%;transform:perspective(500px) rotateX(72deg);transform-origin:bottom;background:repeating-linear-gradient(90deg,transparent 0 46px,rgba(255,255,255,.07) 46px 48px),repeating-linear-gradient(0deg,rgba(255,255,255,.0) 0 60px,rgba(255,255,255,.18) 60px 62px);animation:tt-floor .35s linear infinite}'
    + '@keyframes tt-floor{to{background-position:0 0,0 62px}}'
    + '.tt-streak{position:absolute;height:2px;width:60vw;background:linear-gradient(90deg,transparent,#fff,transparent);filter:drop-shadow(0 0 8px #fff)}'
    + '.tt-band{position:absolute;left:-20%;right:-20%;top:50%;height:clamp(70px,13vw,170px);transform:translateY(-50%) rotate(-18deg);background:' + CHALK + ';display:flex;align-items:center;justify-content:center;gap:2vw;box-shadow:0 0 0 3px ' + INK + ',0 0 0 5px ' + CHALK + '}'
    + '.tt-disc{position:absolute;left:50%;top:50%;width:min(70vmin,620px);aspect-ratio:1;border-radius:50%;transform:translate(-50%,-50%);background:repeating-conic-gradient(from 0deg,#2b2b2e 0 8deg,#111 8deg 16deg);box-shadow:inset 0 0 0 7vmin #0d0d0f,inset 0 0 0 7.6vmin ' + RED + ';filter:blur(1.5px);animation:tt-spin .22s linear infinite}'
    + '@keyframes tt-spin{to{transform:translate(-50%,-50%) rotate(360deg)}}'
    + '.tt-watch{display:inline-flex;align-items:center;gap:10px;align-self:flex-start;min-height:44px;padding:0 18px 0 14px;border-radius:999px;border:1px solid #3A3F46;background:transparent;color:' + CHALK + ';font-family:' + MONO + ';font-size:12px;letter-spacing:.12em;cursor:pointer}'
    + '.tt-watch:hover{border-color:' + ORANGE + '}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function anim(el, kf, o) { if (!el || !el.animate) return Promise.resolve(); return el.animate(kf, Object.assign({ fill: 'forwards', easing: 'cubic-bezier(.2,.9,.25,1)' }, o)).finished.catch(function () {}); }
  function sfx(n, o, d) { try { if (window.PitStop && window.PitStop.sfx) window.PitStop.sfx.play(n, o, d); } catch (e) {} }
  function el(parent, cls, style, html) { var d = document.createElement('div'); d.className = cls; if (style) d.setAttribute('style', style); if (html) d.innerHTML = html; parent.appendChild(d); return d; }
  function tags(card, list) { list.forEach(function (t) { el(card, 'tt-tag', t[1], t[0]); }); }
  function preload(srcs) { return Promise.all(srcs.map(function (s) { return new Promise(function (r) { var i = new Image(); i.onload = i.onerror = r; i.src = s; }); })); }

  var playing = null;

  /* the cards: each builds its DOM and runs its own motion, returns when it's time to cut */
  var CARDS = [
    // 0. light tunnel opener
    async function (stage) {
      var c = el(stage, 'tt-card', 'background:radial-gradient(ellipse at 50% 60%,#2a2a2e,#060607 70%)');
      el(c, 'tt-floor');
      for (var i = 0; i < 5; i++) { var s = el(c, 'tt-streak', 'top:' + (14 + i * 15) + '%;left:-60vw'); anim(s, [{ transform: 'translateX(0)' }, { transform: 'translateX(220vw)' }], { duration: 650 + i * 120, delay: i * 90, easing: 'linear', fill: 'none' }); }
      var w = el(c, '', 'position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);text-align:center;z-index:3',
        '<div class="tt-bold" style="font-size:clamp(64px,16vw,230px);color:transparent;-webkit-text-stroke:2px ' + CHALK + '">SHIFT</div>'
        + '<div style="font-family:' + MONO + ';font-size:clamp(10px,1.2vw,14px);letter-spacing:.3em;margin-top:2vh;color:#bbb">YASHVARDHAN SONEGARA · PORTFOLIO · 2026</div>');
      c.style.opacity = 1; sfx('whoosh', 0.7);
      await anim(w, [{ opacity: 0, transform: 'translate(-50%,-50%) scale(1.5)', filter: 'blur(12px)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)', filter: 'blur(0)' }], { duration: 700 });
      await wait(450);
      return c;
    },
    // 1. name card: huge red #24, portrait behind, script first name
    async function (stage) {
      var c = el(stage, 'tt-card', 'background:#111');
      var im = el(c, 'tt-img', 'background-image:url(' + IMG + 'me.jpg);background-position:62% 30%;filter:grayscale(.35) contrast(1.15) brightness(.85)');
      el(c, 'tt-tint', 'background:linear-gradient(90deg,rgba(10,10,11,.92) 0%,rgba(10,10,11,.55) 38%,rgba(120,0,8,.25) 70%,rgba(10,10,11,.6) 100%)');
      var big = el(c, '', 'position:absolute;right:3vw;top:44%;transform:translateY(-50%);' + EXP + ';font-size:clamp(110px,20vw,300px);line-height:.8;color:' + RED + ';opacity:.9;white-space:nowrap;transform-origin:right center', '#24');
      var name = el(c, '', 'position:absolute;left:6vw;bottom:15vh;z-index:4;display:flex;align-items:flex-end;gap:1.2vw;flex-wrap:wrap',
        '<span class="tt-script" style="font-size:clamp(34px,6vw,86px);transform:rotate(-8deg) translateY(.2em)">Yashvardhan</span><span class="tt-bold" style="font-size:clamp(44px,8.5vw,128px)">SONEGARA</span>');
      tags(c, [['Nº 24', 'top:calc(7vh + 18px);left:6vw'], ['BANGALORE · INDIA', 'top:calc(7vh + 18px);right:6vw'], ['VIDYASHILP ACADEMY', 'bottom:calc(7vh + 18px);right:6vw']]);
      c.style.opacity = 1; sfx('thud', 0.8);
      anim(im, [{ transform: 'scale(1.18)' }, { transform: 'scale(1.04)' }], { duration: 1900, easing: 'cubic-bezier(.2,.7,.3,1)' });
      anim(big, [{ transform: 'translate(20vw,-50%) skewX(-8deg)', opacity: 0 }, { transform: 'translate(0,-50%) skewX(-8deg)', opacity: .9 }], { duration: 650 });
      await wait(260);
      await anim(name, [{ opacity: 0, transform: 'translateX(-6vw) skewX(-10deg)' }, { opacity: 1, transform: 'none' }], { duration: 520 });
      await wait(1050);
      return c;
    },
    // 2. light floor: gearbox on pale grey, ghost word above and below
    async function (stage) {
      var c = el(stage, 'tt-card', 'background:linear-gradient(#e9e8e6,#cfcdca)');
      var g1 = el(c, 'tt-ghost', 'top:9vh;font-size:clamp(90px,20vw,300px);-webkit-text-stroke:0;color:rgba(0,0,0,.08)', 'GEARBOX GEARBOX');
      var g2 = el(c, 'tt-ghost', 'bottom:7vh;font-size:clamp(90px,20vw,300px);-webkit-text-stroke:0;color:rgba(0,0,0,.08)', 'GEARBOX GEARBOX');
      var im = el(c, 'tt-img', 'inset:auto;left:50%;top:44%;width:min(56vw,58vh,620px);aspect-ratio:1;transform:translate(-50%,-50%);background-image:url(' + IMG + 'gearbox-full.jpg);mix-blend-mode:multiply;filter:contrast(1.2) brightness(1.08);-webkit-mask-image:radial-gradient(ellipse 72% 72% at center,#000 62%,transparent 100%);mask-image:radial-gradient(ellipse 72% 72% at center,#000 62%,transparent 100%)');
      var name = el(c, '', 'position:absolute;left:50%;bottom:16vh;transform:translateX(-50%);z-index:4;display:flex;align-items:flex-end;gap:1vw;color:' + INK,
        '<span class="tt-script" style="font-size:clamp(28px,4.5vw,64px);transform:rotate(-8deg) translateY(.15em)">Builder</span><span class="tt-bold" style="font-size:clamp(40px,7vw,104px);color:' + INK + '">4-SPEED</span>');
      tags(c, [['1ST GEAR', 'top:calc(7vh + 18px);left:6vw;color:#333'], ['20 · 53 · 73 · 110 RPM', 'top:calc(7vh + 18px);right:6vw;color:#333'], ['3D-PRINTED', 'bottom:calc(7vh + 18px);right:6vw;color:#333']]);
      c.style.opacity = 1; sfx('whoosh', 0.5);
      anim(g1, [{ transform: 'translateX(0)' }, { transform: 'translateX(-18vw)' }], { duration: 1600, easing: 'linear' });
      anim(g2, [{ transform: 'translateX(-30vw)' }, { transform: 'translateX(-12vw)' }], { duration: 1600, easing: 'linear' });
      anim(im, [{ transform: 'translate(-50%,-46%) scale(.94)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }], { duration: 500 });
      await anim(name, [{ opacity: 0, letterSpacing: '.4em', filter: 'blur(8px)' }, { opacity: 1, letterSpacing: '0', filter: 'blur(0)' }], { duration: 520, delay: 180 });
      await wait(800);
      return c;
    },
    // 3. diagonal band over the hackathon photo, red underside
    async function (stage) {
      var c = el(stage, 'tt-card', 'background:#0d0d0f');
      var im = el(c, 'tt-img', 'background-image:url(' + IMG + 'hackathon-judges.jpg);filter:grayscale(1) contrast(1.2) brightness(.55)');
      el(c, 'tt-tint', 'background:linear-gradient(162deg,transparent 0 52%,' + RED + ' 52.2% 100%);opacity:.9;mix-blend-mode:multiply');
      var band = el(c, 'tt-band', '', '<span class="tt-script" style="font-size:clamp(26px,4.2vw,60px);transform:rotate(-4deg)">Stop the</span><span class="tt-bold" style="font-size:clamp(36px,7vw,104px);color:' + INK + '">SECOND CELL</span><span style="font-family:' + MONO + ';font-size:clamp(10px,1.2vw,15px);letter-spacing:.14em;color:#444;align-self:flex-start;margin-top:2vw">39.75 °C<br>PEAK</span>');
      tags(c, [['MERCEDES-BENZ R&amp;D INDIA · HACKATHON', 'top:calc(7vh + 18px);left:6vw'], ['4TH GEAR · OVERDRIVE', 'bottom:calc(7vh + 18px);right:6vw']]);
      c.style.opacity = 1; sfx('gun', 0.18);
      anim(im, [{ transform: 'scale(1.15) translateX(2%)' }, { transform: 'scale(1.05) translateX(-2%)' }], { duration: 1700, easing: 'linear' });
      await anim(band, [{ transform: 'translate(60%,-50%) rotate(-18deg)' }, { transform: 'translate(0,-50%) rotate(-18deg)' }], { duration: 480 });
      await wait(950);
      return c;
    },
    // 4. photographer: BMW drift, red grade, ghost outline name sweeping
    async function (stage) {
      var c = el(stage, 'tt-card', 'background:#000');
      var im = el(c, 'tt-img', 'background-image:url(' + IMG + 'bmw-drift.jpg);filter:contrast(1.15) saturate(1.2) brightness(.8)');
      el(c, 'tt-tint', 'background:linear-gradient(0deg,rgba(0,0,0,.85),transparent 55%),linear-gradient(90deg,rgba(150,0,10,.35),transparent 60%)');
      var gh = el(c, 'tt-ghost', 'top:50%;font-size:clamp(100px,22vw,330px);transform:translateY(-50%)', 'OFF THE CLOCK · OFF THE CLOCK');
      var name = el(c, '', 'position:absolute;left:6vw;bottom:15vh;z-index:4;display:flex;align-items:flex-end;gap:1vw;flex-wrap:wrap',
        '<span class="tt-script" style="font-size:clamp(28px,4.8vw,70px);transform:rotate(-8deg) translateY(.15em)">Photographer</span><span class="tt-bold" style="font-size:clamp(40px,7.5vw,112px)">OFF THE CLOCK</span>');
      tags(c, [['CANON EOS 600D', 'top:calc(7vh + 18px);left:6vw'], ['79 MM · f/11 · 1/125 s', 'top:calc(7vh + 18px);right:6vw']]);
      c.style.opacity = 1; sfx('whoosh', 0.6);
      anim(im, [{ transform: 'scale(1.1) translateX(-3%)' }, { transform: 'scale(1.1) translateX(3%)' }], { duration: 1500, easing: 'linear' });
      anim(gh, [{ transform: 'translate(0,-50%)' }, { transform: 'translate(-40vw,-50%)' }], { duration: 1500, easing: 'linear' });
      await anim(name, [{ opacity: 0, transform: 'translateY(4vh)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: 150 });
      await wait(800);
      return c;
    },
    // 5. moon: black, slow push in
    async function (stage) {
      var c = el(stage, 'tt-card', 'background:#000');
      var im = el(c, 'tt-img', 'inset:auto;left:50%;top:48%;width:min(48vh,48vw);aspect-ratio:1;transform:translate(-50%,-50%);background-image:url(' + IMG + 'moon3.jpg)');
      var name = el(c, '', 'position:absolute;left:50%;bottom:15vh;transform:translateX(-50%);z-index:4;display:flex;align-items:flex-end;gap:1vw',
        '<span class="tt-script" style="font-size:clamp(26px,4vw,58px);transform:rotate(-8deg) translateY(.15em)">Night shift</span><span class="tt-bold" style="font-size:clamp(36px,6vw,90px)">THE MOON</span>');
      tags(c, [['250 MM · f/11 · 1/125 s · ISO 100', 'top:calc(7vh + 18px);left:50%;transform:translateX(-50%)']]);
      c.style.opacity = 1;
      anim(im, [{ transform: 'translate(-50%,-50%) scale(.8)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(1.02)', opacity: 1 }], { duration: 1300, easing: 'cubic-bezier(.2,.7,.3,1)' });
      await anim(name, [{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: 250 });
      await wait(700);
      return c;
    },
    // 6. wheel blur and the title
    async function (stage) {
      var c = el(stage, 'tt-card', 'background:radial-gradient(circle at 50% 50%,#1b1b1e,#050506 70%)');
      var disc = el(c, 'tt-disc');
      var t = el(c, '', 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:4;text-align:center',
        '<div class="tt-bold" style="font-size:clamp(46px,9vw,140px)">SHIFT THROUGH</div><div class="tt-bold" style="font-size:clamp(46px,9vw,140px);color:' + ORANGE + '">MY WORK</div>');
      c.style.opacity = 1; sfx('rumble', 0.8);
      anim(disc, [{ opacity: 0, filter: 'blur(1.5px)' }, { opacity: 1, filter: 'blur(3px)' }], { duration: 500 });
      await anim(t, [{ opacity: 0, transform: 'translate(-50%,-50%) scale(1.6)', filter: 'blur(14px)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)', filter: 'blur(0)' }], { duration: 560, delay: 200 });
      sfx('thud', 1);
      await wait(900);
      return c;
    }
  ];

  async function cut(stage, prev) {
    // a hard white flash between cards, like a camera strobe
    var f = el(stage, '', 'position:absolute;inset:0;background:#fff;z-index:15;pointer-events:none');
    anim(f, [{ opacity: .85 }, { opacity: 0 }], { duration: 180, easing: 'linear' }).then(function () { f.remove(); });
    if (prev) setTimeout(function () { prev.remove(); }, 40);
  }

  function play() {
    if (reduce) return Promise.resolve();
    if (playing) return playing;
    var o = document.createElement('div'); o.className = 'tt'; o.setAttribute('role', 'presentation');
    el(o, 'tt-bar t'); el(o, 'tt-bar b');
    var stage = el(o, '', 'position:absolute;inset:0');
    var skip = document.createElement('button'); skip.type = 'button'; skip.className = 'tt-skip'; skip.textContent = 'SKIP INTRO ›'; o.appendChild(skip);
    document.body.appendChild(o);
    var stopped = false, resolveFn;
    playing = new Promise(function (r) { resolveFn = r; });
    function finish() {
      if (stopped) return; stopped = true;
      document.removeEventListener('keydown', esc);
      anim(o, [{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: 'ease-in' }).then(function () { o.remove(); playing = null; resolveFn(); });
    }
    function esc(e) { if (e.key === 'Escape') finish(); }
    skip.addEventListener('click', function (e) { e.stopPropagation(); finish(); });
    o.addEventListener('click', finish);
    document.addEventListener('keydown', esc);
    (async function () {
      await preload(['me.jpg', 'gearbox-full.jpg', 'hackathon-judges.jpg', 'bmw-drift.jpg', 'moon3.jpg'].map(function (s) { return IMG + s; }));
      var prev = null;
      for (var i = 0; i < CARDS.length && !stopped; i++) {
        if (i) await cut(stage, prev);
        prev = await CARDS[i](stage);
      }
      finish();
    })();
    return playing;
  }

  window.Titles = { play: play };

  // "Watch the intro" button in the hero
  function addButton() {
    var hero = document.querySelector('#top .container') || document.getElementById('top');
    if (!hero || reduce) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'tt-watch';
    b.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.5v11l9-5.5z" fill="' + ORANGE + '"/></svg>WATCH THE INTRO';
    b.addEventListener('click', function () { play(); });
    hero.appendChild(b);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addButton); else addButton();
})();
