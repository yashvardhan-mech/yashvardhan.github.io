/* Shift — pit stop animations.
   1. Intro: wheel gun unscrews the nut, worn tyre off, fresh tyre on, nut torqued, garage doors open.
   2. Gear change: the old panel is pulled off like a tyre, the new one is bolted on (PitStop.swap).
   3. Scroll: sections "bolt" into place as they appear.
   4. Links to other pages: doors close, then the next page opens with the doors.
   Plain script; respects prefers-reduced-motion; the intro plays once per visit and can be skipped. */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ORANGE = '#FF6B1A', CHALK = '#EEEAE2', ASPHALT = '#0C0D0F', PANEL = '#15171A', RULE = '#3A3F46';
  var MONO = "'IBM Plex Mono', ui-monospace, monospace";

  function store(key, val) {
    try { if (val === undefined) return sessionStorage.getItem(key); sessionStorage.setItem(key, val); } catch (e) { return null; }
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function anim(el, frames, opts) {
    if (!el || !el.animate) return Promise.resolve();
    return el.animate(frames, Object.assign({ fill: 'forwards' }, opts)).finished.catch(function () {});
  }

  /* ---------- styles ---------- */
  var css = ''
    + '.pit-overlay{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;pointer-events:auto}'
    + '.pit-door{position:absolute;left:0;right:0;height:50.5%;background:' + ASPHALT + ';background-image:repeating-linear-gradient(90deg,transparent 0 46px,rgba(255,255,255,.035) 46px 48px)}'
    + '.pit-door.top{top:0;border-bottom:3px solid ' + ORANGE + '}.pit-door.bottom{bottom:0;border-top:3px solid ' + ORANGE + '}'
    + '.pit-stage{position:relative;display:flex;flex-direction:column;align-items:center;gap:22px}'
    + '.pit-rig{position:relative;width:min(56vmin,380px);aspect-ratio:1}'
    + '.pit-rig svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}'
    + '.pit-board{display:flex;flex-direction:column;align-items:center;gap:8px;font-family:' + MONO + ';color:' + CHALK + '}'
    + '.pit-board .lbl{font-size:12px;letter-spacing:.14em;color:#A3A8B0}'
    + '.pit-board .time{font-family:Archivo,system-ui,sans-serif;font-weight:800;font-stretch:125%;font-size:clamp(34px,6vw,56px);line-height:1;font-variant-numeric:tabular-nums}'
    + '.pit-lights{display:flex;gap:10px}.pit-lights span{width:14px;height:14px;border-radius:50%;background:#3A1A10;transition:background .15s,box-shadow .15s}'
    + '.pit-lights span.red{background:#E5372B;box-shadow:0 0 12px #E5372B}.pit-lights.go span{background:#2BD46A;box-shadow:0 0 12px #2BD46A}'
    + '.pit-skip{position:absolute;right:20px;bottom:20px;min-height:44px;padding:0 18px;border-radius:999px;border:1px solid ' + RULE + ';background:' + PANEL + ';color:' + CHALK + ';font-family:' + MONO + ';font-size:12px;letter-spacing:.12em;cursor:pointer}'
    + '.pit-skip:hover{border-color:' + ORANGE + '}'
    + '.bolt{opacity:0;transform:translateY(28px) rotate(-1.5deg);transition:opacity .55s ease,transform .7s cubic-bezier(.2,1.4,.4,1)}'
    + '.bolt.bolted{opacity:1;transform:none}'
    + '@keyframes pit-torque{0%,100%{transform:translateX(0)}20%{transform:translateX(-3px)}40%{transform:translateX(3px)}60%{transform:translateX(-2px)}80%{transform:translateX(2px)}}'
    + '.pit-ring{position:absolute;display:none;border-radius:50%;border:3px solid ' + ORANGE + ';box-sizing:border-box;pointer-events:none;animation:pit-pulse 1.2s ease-out infinite}'
    + '@keyframes pit-pulse{0%{box-shadow:0 0 0 0 rgba(255,107,26,.55);opacity:1}100%{box-shadow:0 0 0 22px rgba(255,107,26,0);opacity:.6}}'
    + '.pit-hot{position:absolute;display:none;border-radius:50%;background:transparent;border:none;cursor:pointer;touch-action:none;z-index:2;padding:0}'
    + '.pit-hot:focus-visible{outline:3px solid ' + ORANGE + ';outline-offset:4px}'
    + '.pit-gantry{display:flex;gap:10px;padding:10px 14px;border-radius:12px;background:#000;border:1px solid #2B2F35;margin-bottom:6px}'
    + '.pit-gantry span{width:26px;height:26px;border-radius:50%;background:#2A1210;box-shadow:inset 0 0 0 3px #111;transition:background .08s,box-shadow .08s}'
    + '.pit-gantry span.on{background:#FF2A1F;box-shadow:0 0 18px 4px rgba(255,42,31,.7),inset 0 0 0 3px #111}'
    + '.pit-mute{position:fixed;left:20px;bottom:20px;z-index:10000;min-height:44px;padding:0 16px;display:inline-flex;align-items:center;gap:8px;border-radius:999px;border:1px solid ' + RULE + ';background:rgba(21,23,26,.88);color:' + CHALK + ';font-family:' + MONO + ';font-size:11px;letter-spacing:.12em;cursor:pointer;backdrop-filter:blur(6px)}'
    + '.pit-mute:hover{border-color:' + ORANGE + '}.pit-mute[aria-pressed="false"] .pit-wave{opacity:.2}.pit-mute:focus-visible{outline:3px solid ' + ORANGE + ';outline-offset:3px}'
    + '@media (prefers-reduced-motion:reduce){.bolt{opacity:1;transform:none;transition:none}}';
  var st = document.createElement('style'); st.id = 'pitstop-css'; st.textContent = css; document.head.appendChild(st);

  /* ---------- sound effects (generated with Web Audio, no files) ---------- */
  var Sfx = (function () {
    var ctx = null, master = null, noise = null;
    var muted = false;
    try { muted = localStorage.getItem('pit-muted') === '1'; } catch (e) {}

    function noiseBuffer(c) {
      var len = c.sampleRate * 1.5, b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      return b;
    }
    function env(g, t, attack, peak, decay) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    }
    function noiseSrc(c, buf) { var s = c.createBufferSource(); s.buffer = buf; s.loop = true; return s; }

    // each sound: (context, output node, start time, noise buffer, option)
    var DEFS = {
      gun: function (c, out, t, nb, dur) { // wheel gun: buzzing motor + ratchet rattle
        dur = dur || 0.45;
        var o = c.createOscillator(); o.type = 'sawtooth';
        o.frequency.setValueAtTime(70, t); o.frequency.linearRampToValueAtTime(140, t + 0.06); o.frequency.setValueAtTime(140, t + dur - 0.05); o.frequency.linearRampToValueAtTime(90, t + dur);
        var am = c.createGain(); am.gain.value = 0.5;
        var lfo = c.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 42;
        var lg = c.createGain(); lg.gain.value = 0.5; lfo.connect(lg); lg.connect(am.gain);
        var n = noiseSrc(c, nb), bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 1.2;
        var ng = c.createGain(); ng.gain.value = 0.35; n.connect(bp); bp.connect(ng); ng.connect(am);
        o.connect(am);
        var g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.55, t + 0.02);
        g.gain.setValueAtTime(0.55, t + dur - 0.06); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        am.connect(g); g.connect(out);
        [o, lfo, n].forEach(function (s) { s.start(t); s.stop(t + dur + 0.02); });
      },
      whoosh: function (c, out, t, nb, vol) { // tyre flying past
        var n = noiseSrc(c, nb), bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.9;
        bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(2600, t + 0.22); bp.frequency.exponentialRampToValueAtTime(500, t + 0.4);
        var g = c.createGain(); env(g, t, 0.12, (vol || 0.6) * 1.8, 0.3);
        n.connect(bp); bp.connect(g); g.connect(out); n.start(t); n.stop(t + 0.45);
      },
      thud: function (c, out, t, nb, vol) { // tyre landing on the hub
        var o = c.createOscillator(); o.type = 'sine';
        o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
        var g = c.createGain(); env(g, t, 0.005, (vol || 0.9) * 1.5, 0.22);
        o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.26);
        var n = noiseSrc(c, nb), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
        var ng = c.createGain(); env(ng, t, 0.002, (vol || 0.9) * 0.4, 0.06);
        n.connect(lp); lp.connect(ng); ng.connect(out); n.start(t); n.stop(t + 0.1);
      },
      beep: function (c, out, t, nb, hi) { // start lights: red beeps, green tone
        var o = c.createOscillator(); o.type = 'square'; o.frequency.value = hi ? 1320 : 880;
        var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3000;
        var g = c.createGain(); env(g, t, 0.005, hi ? 0.8 : 0.6, hi ? 0.38 : 0.11);
        o.connect(lp); lp.connect(g); g.connect(out); o.start(t); o.stop(t + (hi ? 0.42 : 0.14));
      },
      rumble: function (c, out, t, nb, dur) { // garage doors rolling
        dur = dur || 0.7;
        var n = noiseSrc(c, nb), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 160; lp.Q.value = 3;
        var trem = c.createOscillator(); trem.frequency.value = 18; var tg = c.createGain(); tg.gain.value = 0.25;
        var g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.9, t + 0.08);
        g.gain.setValueAtTime(0.9, t + dur - 0.2); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        trem.connect(tg); tg.connect(g.gain);
        n.connect(lp); lp.connect(g); g.connect(out);
        n.start(t); n.stop(t + dur + 0.02); trem.start(t); trem.stop(t + dur + 0.02);
      },
      clunk: function (c, out, t, nb) { // gear lever engaging
        var n = noiseSrc(c, nb), bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 6;
        var g = c.createGain(); env(g, t, 0.002, 1.4, 0.07);
        n.connect(bp); bp.connect(g); g.connect(out); n.start(t); n.stop(t + 0.1);
        var o = c.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(90, t + 0.08);
        var og = c.createGain(); env(og, t, 0.003, 1.0, 0.09); o.connect(og); og.connect(out); o.start(t); o.stop(t + 0.12);
      }
    };

    function ac() {
      if (muted) return null;
      if (!ctx) {
        var C = window.AudioContext || window.webkitAudioContext;
        if (!C) return null;
        try { ctx = new C(); } catch (e) { return null; }
        master = ctx.createGain(); master.gain.value = 0.5;
        var comp = ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination);
        noise = noiseBuffer(ctx);
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }
    function play(name, opt, delay) {
      var c = ac(); if (!c) return;
      try { DEFS[name](c, master, c.currentTime + (delay || 0) + 0.005, noise, opt); } catch (e) {}
    }
    function setMuted(m) {
      muted = m;
      try { localStorage.setItem('pit-muted', m ? '1' : '0'); } catch (e) {}
      if (m && ctx) ctx.suspend();
      if (!m) { ac(); play('beep'); }
      document.querySelectorAll('.pit-mute').forEach(function (b) { b.setAttribute('aria-pressed', m ? 'false' : 'true'); b.querySelector('span').textContent = m ? 'SOUND OFF' : 'SOUND ON'; });
    }
    return { play: play, unlock: ac, isMuted: function () { return muted; }, setMuted: setMuted, DEFS: DEFS, noiseBuffer: noiseBuffer };
  })();

  function muteButton() {
    if (document.querySelector('.pit-mute')) return;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'pit-mute';
    b.setAttribute('aria-label', 'Sound effects');
    b.setAttribute('aria-pressed', Sfx.isMuted() ? 'false' : 'true');
    b.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path class="pit-wave" d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg><span>' + (Sfx.isMuted() ? 'SOUND OFF' : 'SOUND ON') + '</span>';
    b.addEventListener('click', function () { Sfx.setMuted(!Sfx.isMuted()); });
    document.body.appendChild(b);
  }

  /* ---------- artwork ---------- */
  function wheelSVG(fresh) {
    var stripe = fresh ? ORANGE : '#5E636B';
    var s = '<svg viewBox="-150 -150 300 300" aria-hidden="true"><g class="spinme">';
    s += '<circle r="142" fill="#111214"/>';
    for (var i = 0; i < 36; i++) { // tread blocks
      var a = i * 10 * Math.PI / 180;
      s += '<line x1="' + (136 * Math.cos(a)).toFixed(1) + '" y1="' + (136 * Math.sin(a)).toFixed(1) + '" x2="' + (142 * Math.cos(a)).toFixed(1) + '" y2="' + (142 * Math.sin(a)).toFixed(1) + '" stroke="#26282C" stroke-width="5"/>';
    }
    s += '<circle r="124" fill="none" stroke="' + stripe + '" stroke-width="5"' + (fresh ? '' : ' stroke-dasharray="40 14"') + '/>';
    s += '<circle r="100" fill="#1C1F23" stroke="' + RULE + '" stroke-width="3"/>';
    for (var j = 0; j < 10; j++) { // spokes
      var b = j * 36 * Math.PI / 180, c = Math.cos(b), d = Math.sin(b), px = -d, py = c;
      s += '<path d="M' + (30 * c + 6 * px).toFixed(1) + ' ' + (30 * d + 6 * py).toFixed(1) + ' L' + (92 * c + 10 * px).toFixed(1) + ' ' + (92 * d + 10 * py).toFixed(1) + ' L' + (92 * c - 10 * px).toFixed(1) + ' ' + (92 * d - 10 * py).toFixed(1) + ' L' + (30 * c - 6 * px).toFixed(1) + ' ' + (30 * d - 6 * py).toFixed(1) + 'Z" fill="#2B2F35"/>';
    }
    s += '<circle r="34" fill="#24272C" stroke="' + RULE + '" stroke-width="2"/>';
    return s + '</g></svg>';
  }
  function nutSVG() {
    var pts = [];
    for (var i = 0; i < 6; i++) { var a = (i * 60 + 30) * Math.PI / 180; pts.push((24 * Math.cos(a)).toFixed(1) + ',' + (24 * Math.sin(a)).toFixed(1)); }
    return '<svg viewBox="-150 -150 300 300" aria-hidden="true"><g class="nut"><polygon points="' + pts.join(' ') + '" fill="' + ORANGE + '"/><circle r="9" fill="' + ASPHALT + '"/><circle r="15" fill="none" stroke="#B9480F" stroke-width="2"/></g></svg>';
  }
  function gunSVG() {
    // wheel gun pointing left; socket tip sits on the nut at (0,0)
    return '<svg viewBox="-150 -150 300 300" aria-hidden="true"><g class="gun">'
      + '<rect x="18" y="-14" width="70" height="28" rx="6" fill="#B8BCC4"/>'
      + '<rect x="6" y="-11" width="16" height="22" rx="3" fill="#7D828B"/>'
      + '<rect x="80" y="-26" width="74" height="52" rx="12" fill="' + CHALK + '"/>'
      + '<rect x="110" y="20" width="28" height="70" rx="10" fill="#C9CCD1" transform="rotate(12 124 20)"/>'
      + '<rect x="102" y="28" width="10" height="18" rx="4" fill="' + ORANGE + '"/>'
      + '<path d="M150 6 C210 10 220 90 260 140" fill="none" stroke="#2B2F35" stroke-width="12" stroke-linecap="round"/>'
      + '</g></svg>';
  }

  /* ---------- overlay ---------- */
  function buildOverlay(withRig) {
    var o = document.createElement('div');
    o.className = 'pit-overlay';
    o.innerHTML = '<div class="pit-door top"></div><div class="pit-door bottom"></div>'
      + (withRig
        ? '<div class="pit-stage" aria-hidden="true"><div class="pit-rig">'
          + '<div class="w-old">' + wheelSVG(false) + '</div><div class="w-new">' + wheelSVG(true) + '</div>'
          + '<div class="w-nut">' + nutSVG() + '</div><div class="w-gun">' + gunSVG() + '</div></div>'
          + '<div class="pit-board"><div class="pit-lights"><span></span><span></span><span></span></div>'
          + '<span class="time">0.00 s</span><span class="lbl" aria-live="polite">PIT STOP</span></div></div>'
          + '<button class="pit-skip" type="button">SKIP PIT STOP ›</button>'
        : '');
    document.body.appendChild(o);
    return o;
  }

  function openDoors(o) {
    Sfx.play('rumble', 0.7);
    var stage = o.querySelector('.pit-stage'), skip = o.querySelector('.pit-skip');
    if (skip) skip.remove();
    var p = [
      anim(o.querySelector('.pit-door.top'), [{ transform: 'translateY(0)' }, { transform: 'translateY(-101%)' }], { duration: 650, easing: 'cubic-bezier(.7,0,.2,1)' }),
      anim(o.querySelector('.pit-door.bottom'), [{ transform: 'translateY(0)' }, { transform: 'translateY(101%)' }], { duration: 650, easing: 'cubic-bezier(.7,0,.2,1)' })
    ];
    if (stage) p.push(anim(stage, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.08)' }], { duration: 300 }));
    return Promise.all(p).then(function () { o.remove(); });
  }

  /* five red lights, then lights out */
  async function lightsOut(board, lbl) {
    var g = document.createElement('div');
    g.className = 'pit-gantry';
    for (var i = 0; i < 5; i++) g.appendChild(document.createElement('span'));
    board.insertBefore(g, board.firstChild);
    if (g.animate) await anim(g, [{ opacity: 0, transform: 'translateY(-10px)' }, { opacity: 1, transform: 'none' }], { duration: 220 });
    var lamps = g.querySelectorAll('span');
    for (var j = 0; j < 5; j++) { lamps[j].classList.add('on'); Sfx.play('beep'); lbl.textContent = 'STARTING LIGHTS · ' + (j + 1) + ' OF 5'; await wait(380); }
    await wait(500 + Math.random() * 500);
    lamps.forEach(function (l) { l.classList.remove('on'); });
    lbl.textContent = 'LIGHTS OUT';
    Sfx.play('whoosh', 0.8); Sfx.play('gun', 0.25, 0.05);
    await wait(260);
  }

  /* ---------- 1. intro: the visitor does the pit stop ---------- */
  function intro() {
    var o = buildOverlay(true);
    var q = function (s) { return o.querySelector(s); };
    var rig = q('.pit-rig'), oldW = q('.w-old'), newW = q('.w-new'), nut = q('.w-nut'), gun = q('.w-gun');
    var oldSpin = oldW.querySelector('.spinme'), newSpin = newW.querySelector('.spinme');
    var time = q('.time'), lbl = q('.lbl'), lights = q('.pit-lights'), dots = lights.querySelectorAll('span');
    [oldW, newW, nut, gun].forEach(function (e) { e.style.position = 'absolute'; e.style.inset = '0'; });
    newW.style.opacity = '0';
    newW.style.transform = 'translateX(160%)';
    gun.style.transform = 'translateX(140%)';
    [oldSpin, newSpin].forEach(function (e) { e.style.transformOrigin = '0 0'; });
    q('.pit-stage').removeAttribute('aria-hidden');
    rig.setAttribute('aria-hidden', 'false');

    // pulsing ring that shows where to tap
    var ring = document.createElement('div');
    ring.className = 'pit-ring';
    rig.appendChild(ring);
    // one real button per step, so keyboard users can do it too
    var hot = document.createElement('button');
    hot.type = 'button';
    hot.className = 'pit-hot';
    rig.appendChild(hot);

    var done = false, busy = false, step = 0, t0 = 0, raf;
    function tick() { if (done || !t0) return; time.textContent = ((performance.now() - t0) / 1000).toFixed(2) + ' s'; raf = requestAnimationFrame(tick); }
    function startClock() { if (!t0) { t0 = performance.now(); tick(); } }

    var STEPS = [
      { text: 'STEP 1 OF 4 · TAP THE NUT TO UNSCREW IT', aria: 'Unscrew the wheel nut', box: [38, 38, 24, 24] },
      { text: 'STEP 2 OF 4 · SWIPE THE WORN TYRE OFF', aria: 'Pull the worn tyre off', box: [2, 2, 96, 96], drag: oldW },
      { text: 'STEP 3 OF 4 · PUSH THE FRESH TYRE ON', aria: 'Push the fresh tyre on', box: [60, 12, 76, 76], drag: newW },
      { text: 'STEP 4 OF 4 · TAP THE NUT TO TIGHTEN IT', aria: 'Tighten the wheel nut', box: [38, 38, 24, 24] }
    ];
    function show(i) {
      var s = STEPS[i];
      lbl.textContent = s.text;
      hot.setAttribute('aria-label', s.aria);
      var b = s.box;
      [hot, ring].forEach(function (el) { el.style.left = b[0] + '%'; el.style.top = b[1] + '%'; el.style.width = b[2] + '%'; el.style.height = b[3] + '%'; });
      ring.style.display = 'block'; hot.style.display = 'block';
      hot.focus({ preventScroll: true });
    }
    function hideHint() { ring.style.display = 'none'; hot.style.display = 'none'; }

    var finish = function () {
      if (done) return; done = true; cancelAnimationFrame(raf);
      store('pit-intro', '1');
      return openDoors(o);
    };
    q('.pit-skip').addEventListener('click', finish);
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { document.removeEventListener('keydown', esc); finish(); } });

    /* the four actions */
    var ACT = [
      async function unscrew() {
        dots[0].classList.add('red'); Sfx.play('beep');
        Sfx.play('whoosh', 0.25);
        await anim(gun, [{ transform: 'translateX(140%)' }, { transform: 'translateX(0)' }], { duration: 260, easing: 'cubic-bezier(.2,.8,.3,1)' });
        gun.style.animation = 'pit-torque .08s linear 5'; Sfx.play('gun', 0.46);
        await anim(nut, [{ transform: 'rotate(0) scale(1)' }, { transform: 'rotate(-900deg) scale(1.25)' }], { duration: 440, easing: 'ease-in' });
        gun.style.animation = '';
        anim(nut, [{ transform: 'rotate(-900deg) scale(1.25)', opacity: 1 }, { transform: 'rotate(-900deg) scale(1.25) translateY(-30%)', opacity: 0 }], { duration: 200 });
        await anim(gun, [{ transform: 'translateX(0)' }, { transform: 'translateX(70%)' }], { duration: 180 });
      },
      async function tyreOff() {
        dots[1].classList.add('red'); Sfx.play('beep');
        Sfx.play('whoosh', 0.7);
        var from = oldW.style.transform || 'translateX(0)';
        anim(oldSpin, [{ transform: 'rotate(0)' }, { transform: 'rotate(-220deg)' }], { duration: 380 });
        await anim(oldW, [{ transform: from, opacity: 1 }, { transform: 'translateX(-170%)', opacity: 0 }], { duration: 380, easing: 'cubic-bezier(.6,0,.9,.6)' });
        // the fresh tyre rolls up and waits beside the hub
        Sfx.play('whoosh', 0.3);
        anim(newSpin, [{ transform: 'rotate(200deg)' }, { transform: 'rotate(0)' }], { duration: 420, easing: 'cubic-bezier(.2,.9,.3,1)' });
        await anim(newW, [{ transform: 'translateX(160%)', opacity: 0 }, { transform: 'translateX(48%) scale(.8)', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.2,.9,.3,1)' });
        newW.style.opacity = '1'; newW.style.transform = 'translateX(48%) scale(.8)';
      },
      async function tyreOn() {
        dots[2].classList.add('red'); Sfx.play('beep');
        Sfx.play('whoosh', 0.45); Sfx.play('thud', 0.9, 0.3);
        var from = newW.style.transform || 'translateX(48%) scale(.8)';
        anim(newSpin, [{ transform: 'rotate(120deg)' }, { transform: 'rotate(0)' }], { duration: 360, easing: 'cubic-bezier(.2,.9,.3,1)' });
        await anim(newW, [{ transform: from, opacity: 1 }, { transform: 'translateX(-2%) scale(1)', opacity: 1, offset: .8 }, { transform: 'translateX(0) scale(1)', opacity: 1 }], { duration: 360, easing: 'cubic-bezier(.2,.9,.3,1)' });
        newW.style.transform = 'translateX(0)';
      },
      async function tighten() {
        await anim(gun, [{ transform: 'translateX(70%)' }, { transform: 'translateX(0)' }], { duration: 160 });
        gun.style.animation = 'pit-torque .08s linear 5'; Sfx.play('gun', 0.42);
        await anim(nut, [{ transform: 'rotate(-900deg) scale(1.25)', opacity: 0 }, { transform: 'rotate(0) scale(1)', opacity: 1 }], { duration: 400, easing: 'ease-out' });
        gun.style.animation = '';
        await anim(gun, [{ transform: 'translateX(0)' }, { transform: 'translateX(150%)' }], { duration: 240, easing: 'cubic-bezier(.6,0,.9,.5)' });
        lights.classList.add('go'); Sfx.play('beep', true);
        done = true; cancelAnimationFrame(raf);
        var secs = ((performance.now() - t0) / 1000).toFixed(2);
        time.textContent = secs + ' s';
        lbl.textContent = 'YOUR PIT STOP · BACK ON TRACK';
        await wait(700);
        if (window.F1Car) await window.F1Car.leave(o);
        await lightsOut(q('.pit-board'), lbl);
        if (window.Titles) await window.Titles.play();
        store('pit-intro', '1');
        openDoors(o);
      }
    ];

    async function act() {
      if (busy || done) return;
      busy = true; hideHint(); startClock(); Sfx.unlock();
      await ACT[step]();
      step++; busy = false;
      if (!done && step < STEPS.length) show(step);
    }

    /* tap, or drag the tyre left for steps 2 and 3 */
    var drag = null;
    hot.addEventListener('pointerdown', function (e) {
      var s = STEPS[step]; if (busy || done || !s || !s.drag) return;
      drag = { x: e.clientX, dx: 0, el: s.drag, base: s.drag === newW ? 'translateX(48%) scale(.8)' : 'translateX(0)' };
      hot.setPointerCapture(e.pointerId);
    });
    hot.addEventListener('pointermove', function (e) {
      if (!drag) return;
      drag.dx = Math.min(0, e.clientX - drag.x);
      drag.el.style.transform = drag.base + ' translateX(' + drag.dx + 'px)';
    });
    hot.addEventListener('pointerup', function () {
      if (!drag) return;
      var d = drag; drag = null;
      if (Math.abs(d.dx) > 6 && Math.abs(d.dx) < 50) { d.el.style.transform = d.base; return; } // too short: snap back
      act();
    });
    hot.addEventListener('click', function (e) {
      // keyboard (Enter/Space) and plain taps on the nut steps
      if (e.detail === 0 || !STEPS[step].drag) act();
    });

    // the car drives into the box first, then the close-up tyre change starts
    (window.F1Car ? window.F1Car.arrive(o) : Promise.resolve()).then(function () { if (!done) show(0); });
    // nudge if nobody taps for a while
    setTimeout(function () { if (!t0 && !done) lbl.textContent = 'STEP 1 OF 4 · TAP THE ORANGE NUT · OR SKIP ›'; }, 5000);
  }

  /* ---------- 2. gear change: tyre off, tyre on ---------- */
  function swap(oldEl, newEl, done) {
    Sfx.play('clunk'); Sfx.play('whoosh', 0.22, 0.05); Sfx.play('gun', 0.12, 0.62);
    if (reduce || !oldEl || !newEl || oldEl === newEl || !oldEl.animate) {
      if (oldEl && oldEl !== newEl) oldEl.hidden = true;
      if (newEl) newEl.hidden = false;
      if (done) done();
      return;
    }
    anim(oldEl, [
      { transform: 'none', opacity: 1, filter: 'blur(0)' },
      { transform: 'translateX(-60px) rotate(-3deg)', opacity: 0, filter: 'blur(3px)' }
    ], { duration: 240, easing: 'cubic-bezier(.6,0,.9,.6)', fill: 'none' }).then(function () {
      document.querySelectorAll('.panel').forEach(function (p) { p.hidden = p !== newEl; });
      oldEl.hidden = true;
      newEl.hidden = false;
      if (done) done();
      return anim(newEl, [
        { transform: 'translateX(90px) rotate(4deg)', opacity: 0 },
        { transform: 'translateX(-6px) rotate(-.6deg)', opacity: 1, offset: .7 },
        { transform: 'none', opacity: 1 }
      ], { duration: 520, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'none' });
    }).then(function () {
      newEl.style.animation = 'pit-torque .07s linear 3'; // the wheel gun's final rattle
      setTimeout(function () { newEl.style.animation = ''; }, 260);
    });
  }

  /* ---------- 3. bolt sections in on scroll ---------- */
  function bolts() {
    if (reduce || !('IntersectionObserver' in window)) return;
    var sel = [
      '#mercedes h2', '#mercedes > div > div', '#mercedes > div:nth-of-type(3) > div',
      '#logbook h2', '#logbook tbody tr',
      '#how h2', '#how .container > div:nth-of-type(2) > div',
      '#contact h2', '#contact .container > div', '.result-card', '#photos figure', '#photos .container > div:last-child',
      'main h2', 'section h2'
    ].join(',');
    var els = Array.prototype.slice.call(document.querySelectorAll(sel)).filter(function (el) {
      return !el.closest('.panel') && !el.closest('#cockpit') && !el.closest('#top');
    });
    var groups = new Map();
    els.forEach(function (el) {
      el.classList.add('bolt');
      var n = groups.get(el.parentNode) || 0; groups.set(el.parentNode, n + 1);
      el.style.transitionDelay = Math.min(n, 6) * 80 + 'ms';
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('bolted'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 4. page-to-page: doors close, next page opens ---------- */
  function links() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a || reduce || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
      var href = a.getAttribute('href');
      if (!/\.html(#.*)?$/.test(href) || /^https?:/.test(href)) return;
      e.preventDefault();
      Sfx.play('rumble', 0.5);
      var o = buildOverlay(false);
      var top = o.querySelector('.pit-door.top'), bottom = o.querySelector('.pit-door.bottom');
      Promise.all([
        anim(top, [{ transform: 'translateY(-101%)' }, { transform: 'translateY(0)' }], { duration: 420, easing: 'cubic-bezier(.7,0,.2,1)' }),
        anim(bottom, [{ transform: 'translateY(101%)' }, { transform: 'translateY(0)' }], { duration: 420, easing: 'cubic-bezier(.7,0,.2,1)' })
      ]).then(function () { store('pit-nav', '1'); window.location.href = a.href; });
    });
  }

  /* ---------- start ---------- */
  window.PitStop = { sfx: Sfx, swap: swap, replay: function () { store('pit-intro', ''); intro(); } };

  function start() {
    muteButton();
    bolts();
    links();
    if (reduce) return;
    if (store('pit-nav') === '1') { store('pit-nav', '0'); openDoors(buildOverlay(false)); return; }
    if (store('pit-intro') !== '1') intro();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
