/* Shift — cockpit: gear shifter, spinning gears, readouts, needle, panels.
   Plain script (not a module) so it works when index.html is opened by double-click. */
(function () {
  'use strict';

  /* ---------- data: the real gearbox ---------- */
  var GEARS = {
    N:   { name: 'Neutral', ratio: '—',   teeth: '—',  rpm: 0,   status: 'NEUTRAL · MOTOR RUNNING · OUTPUT DISENGAGED' },
    '1': { name: '1st', ratio: '4.00 : 1', teeth: '8 → 32',  rpm: 20,  drive: 8,  output: 32, status: 'ENGAGED · OUTPUT TURNING AT 20 RPM, AS MEASURED' },
    '2': { name: '2nd', ratio: '1.50 : 1', teeth: '16 → 24', rpm: 53,  drive: 16, output: 24, status: 'ENGAGED · OUTPUT TURNING AT 53 RPM, AS MEASURED' },
    '3': { name: '3rd', ratio: '1.30 : 1', teeth: '20 → 26', rpm: 73,  drive: 20, output: 26, status: 'ENGAGED · OUTPUT TURNING AT 73 RPM, AS MEASURED' },
    '4': { name: '4th', ratio: '0.64 : 1', teeth: '25 → 16', rpm: 110, drive: 25, output: 16, status: 'OVERDRIVE · OUTPUT TURNING AT 110 RPM, AS MEASURED' }
  };

  /* ---------- gear geometry ---------- */
  var M = 10, VBW = 520, VBH = 360, CY = 180;
  var C = { orange: '#FF6B1A', raised: '#1C1F23', chalk: '#EEEAE2', viz: '#101114' };

  function pt(cx, cy, r, deg) {
    var t = deg * Math.PI / 180;
    return (cx + r * Math.cos(t)).toFixed(2) + ' ' + (cy + r * Math.sin(t)).toFixed(2);
  }

  function gearPath(N, cx, cy, off) {
    var r = M * N / 2, ra = r + 0.9 * M, rf = r - 1.15 * M, p = 360 / N, d = '';
    for (var k = 0; k < N; k++) {
      var c = k * p + off;
      if (k === 0) d += 'M' + pt(cx, cy, rf, c - 0.30 * p) + ' ';
      d += 'L' + pt(cx, cy, ra, c - 0.13 * p) + ' ';
      d += 'A' + ra.toFixed(2) + ' ' + ra.toFixed(2) + ' 0 0 1 ' + pt(cx, cy, ra, c + 0.13 * p) + ' ';
      d += 'L' + pt(cx, cy, rf, c + 0.30 * p) + ' ';
      d += 'A' + rf.toFixed(2) + ' ' + rf.toFixed(2) + ' 0 0 1 ' + pt(cx, cy, rf, (k + 1) * p + off - 0.30 * p) + ' ';
    }
    return { d: d + 'Z', ra: ra, rf: rf };
  }

  function gearGroup(N, cx, cy, off, kind, seconds, extra) {
    var g = gearPath(N, cx, cy, off);
    var attrs = '';
    if (seconds) attrs = ' class="spin ' + (kind === 'drive' ? 'cw' : 'ccw') + '" style="animation-duration:' + seconds.toFixed(6) + 's' + (extra || '') + '"';
    else if (extra) attrs = ' style="' + extra.replace(/^;/, '') + '"';
    var stroke = kind === 'drive' ? '' : ' stroke="' + C.chalk + '" stroke-width="1.5"';
    var s = '<g' + attrs + '>';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (g.ra + 2) + '" fill="none"/>';
    s += kind === 'drive'
      ? '<path d="' + g.d + '" fill="' + C.orange + '"/>'
      : '<path d="' + g.d + '" fill="' + C.raised + '" stroke="' + C.chalk + '" stroke-width="2" stroke-linejoin="round"/>';
    if (g.rf > 70) {
      var n = g.rf > 110 ? 6 : 5, hr = g.rf * 0.17, hd = g.rf * 0.58;
      for (var i = 0; i < n; i++) {
        var a = (i * 360 / n + 18) * Math.PI / 180;
        s += '<circle cx="' + (cx + hd * Math.cos(a)).toFixed(2) + '" cy="' + (cy + hd * Math.sin(a)).toFixed(2) + '" r="' + hr.toFixed(2) + '" fill="' + C.viz + '"' + stroke + '/>';
      }
    } else {
      s += '<circle cx="' + (cx + g.rf * 0.62).toFixed(2) + '" cy="' + cy + '" r="' + Math.max(3, g.rf * 0.11).toFixed(2) + '" fill="' + C.viz + '"' + stroke + '/>';
    }
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + Math.max(6, g.rf * 0.26).toFixed(2) + '" fill="' + C.viz + '"' + stroke + '/>';
    return s + '</g>';
  }

  function pairSVG(gear) {
    var data = GEARS[gear], neutral = gear === 'N';
    var A = neutral ? 8 : data.drive, B = neutral ? 32 : data.output, gap = neutral ? 36 : 0;
    var raA = M * A / 2 + 0.9 * M, raB = M * B / 2 + 0.9 * M;
    var a = M * (A + B) / 2 + gap;
    var x0 = (VBW - (raA + a + raB)) / 2, cxA = x0 + raA, cxB = cxA + a;
    var offB = B % 2 === 0 ? 180 / B : 0;
    var driveSec = neutral ? 60 / 80 : 60 / (data.rpm * B / A);
    var outSec = neutral ? null : 60 / data.rpm;
    var label = neutral
      ? 'Neutral: the drive gear turns, the output gear is pulled out of mesh and stopped'
      : data.name + ' gear: a ' + A + '-tooth drive gear turning a ' + B + '-tooth output gear at ' + data.rpm + ' rpm';
    return '<svg viewBox="0 0 ' + VBW + ' ' + VBH + '" role="img" aria-label="' + label + '" style="width:100%;height:auto;display:block;max-height:440px">'
      + '<line x1="' + (x0 - 16) + '" y1="' + CY + '" x2="' + (cxB + raB + 16) + '" y2="' + CY + '" stroke="#2F343B" stroke-width="1.5" stroke-dasharray="6 6"/>'
      + gearGroup(A, cxA, CY, 0, 'drive', driveSec)
      + gearGroup(B, cxB, CY, offB, 'output', outSec, neutral ? ';opacity:.45' : '')
      + [cxA, cxB].map(function (cx) {
          return '<path d="M' + (cx - 7) + ' ' + CY + ' H' + (cx + 7) + ' M' + cx + ' ' + (CY - 7) + ' V' + (CY + 7) + '" stroke="#8A9099" stroke-width="1.5"/>';
        }).join('')
      + '</svg>';
  }

  /* ---------- spin CSS (added here so the gears turn even if styles.css lacks it) ---------- */
  function ensureSpinCSS() {
    if (document.getElementById('spin-css')) return;
    var st = document.createElement('style');
    st.id = 'spin-css';
    st.textContent =
      '.spin{transform-box:fill-box;transform-origin:50% 50%;animation-timing-function:linear;animation-iteration-count:infinite}' +
      '.cw{animation-name:cw}.ccw{animation-name:ccw}' +
      '@keyframes cw{to{transform:rotate(360deg)}}@keyframes ccw{to{transform:rotate(-360deg)}}' +
      '@media (prefers-reduced-motion:reduce){.spin{animation:none}}';
    document.head.appendChild(st);
  }

  /* ---------- state ---------- */
  function $(id) { return document.getElementById(id); }
  function setText(id, v) { var el = $(id); if (el) el.textContent = v; }

  function setGear(g, announce) {
    if (!GEARS[g]) g = 'N';
    var d = GEARS[g];

    document.querySelectorAll('.knob[data-gear]').forEach(function (k) {
      k.setAttribute('aria-pressed', k.getAttribute('data-gear') === g ? 'true' : 'false');
    });
    setText('gear-badge', g);
    setText('readout-gear', g);
    setText('readout-name', d.name);
    setText('readout-ratio', d.ratio);
    setText('readout-teeth', d.teeth);
    setText('readout-output', String(d.rpm));
    setText('status-line', d.status);

    var needle = $('needle');
    if (needle) needle.style.setProperty('--needle', (-90 + d.rpm / 120 * 180) + 'deg');

    var viz = $('viz');
    if (viz) viz.innerHTML = pairSVG(g); // rebuilding restarts both gears together, in mesh

    var heading = '', oldPanel = null, newPanel = null;
    document.querySelectorAll('.panel[data-gear]').forEach(function (p) {
      var on = p.getAttribute('data-gear') === g;
      if (!p.hidden && !on) oldPanel = p;
      if (on) { newPanel = p; var h = p.querySelector('h2'); if (h) heading = h.textContent; }
    });
    if (announce && window.PitStop && oldPanel) {
      window.PitStop.swap(oldPanel, newPanel); // tyre off, tyre on
    } else {
      document.querySelectorAll('.panel[data-gear]').forEach(function (p) { p.hidden = p !== newPanel; });
    }
    if (viz && viz.firstChild && viz.firstChild.animate && announce) {
      viz.firstChild.animate([{ transform: 'scale(.92) rotate(-6deg)', opacity: 0 }, { transform: 'none', opacity: 1 }],
        { duration: 420, easing: 'cubic-bezier(.2,1.3,.4,1)' });
    }
    if (announce && heading) setText('live-region', heading);
  }

  function init() {
    ensureSpinCSS();
    document.addEventListener('click', function (e) {
      var el = e.target.closest('[data-gear].knob, [data-shift-to]');
      if (!el) return;
      var g = el.classList.contains('knob') ? el.getAttribute('data-gear') : el.getAttribute('data-shift-to');
      setGear(g, true);
    });
    setGear('N', false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();