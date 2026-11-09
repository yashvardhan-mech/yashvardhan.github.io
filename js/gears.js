/**
 * gears.js — Gear geometry for the Shift portfolio cockpit.
 * Generates SVG path data for trapezoid-tooth gears and
 * composes the animated gear-pair SVG injected into #viz.
 *
 * Exported API:
 *   gearPath(N, cx, cy, offsetDeg) → { d, r, ra, rf }
 *   pairSVG(gear, data)            → SVG string
 */

const M = 10, VBW = 520, VBH = 360, CY = 180;
const C = { orange: '#FF6B1A', raised: '#1C1F23', chalk: '#EEEAE2', viz: '#101114' };

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
const pt = (cx, cy, r, deg) => {
  const t = deg * Math.PI / 180;
  return `${(cx + r * Math.cos(t)).toFixed(2)} ${(cy + r * Math.sin(t)).toFixed(2)}`;
};

// ---------------------------------------------------------------------------
// gearPath — returns the SVG path `d` for a gear with N teeth centred at cx,cy
// ---------------------------------------------------------------------------
export function gearPath(N, cx, cy, offsetDeg = 0) {
  const r = M * N / 2, ra = r + 0.9 * M, rf = r - 1.15 * M, p = 360 / N;
  let d = '';
  for (let k = 0; k < N; k++) {
    const c = k * p + offsetDeg;
    if (k === 0) d += `M${pt(cx, cy, rf, c - 0.30 * p)} `;
    d += `L${pt(cx, cy, ra, c - 0.13 * p)} `;
    d += `A${ra.toFixed(2)} ${ra.toFixed(2)} 0 0 1 ${pt(cx, cy, ra, c + 0.13 * p)} `;
    d += `L${pt(cx, cy, rf, c + 0.30 * p)} `;
    d += `A${rf.toFixed(2)} ${rf.toFixed(2)} 0 0 1 ${pt(cx, cy, rf, (k + 1) * p + offsetDeg - 0.30 * p)} `;
  }
  return { d: d + 'Z', r, ra, rf };
}

function gearGroup(N, cx, cy, offset, kind, seconds, extraStyle = '') {
  const { d, ra, rf } = gearPath(N, cx, cy, offset);
  const spin = seconds ? ` class="spin ${kind === 'drive' ? 'cw' : 'ccw'}" style="animation-duration:${seconds.toFixed(6)}s${extraStyle}"`
                       : (extraStyle ? ` style="${extraStyle.replace(/^;/, '')}"` : '');
  const stroke = kind === 'drive' ? '' : ` stroke="${C.chalk}" stroke-width="1.5"`;
  let s = `<g${spin}>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${ra + 2}" fill="none"/>`; // keeps the bounding box centred so rotation doesn't wobble
  s += kind === 'drive'
    ? `<path d="${d}" fill="${C.orange}"/>`
    : `<path d="${d}" fill="${C.raised}" stroke="${C.chalk}" stroke-width="2" stroke-linejoin="round"/>`;
  if (rf > 70) { // lightening holes on big gears
    const n = rf > 110 ? 6 : 5, hr = rf * 0.17, hd = rf * 0.58;
    for (let i = 0; i < n; i++) {
      const a = (i * 360 / n + 18) * Math.PI / 180;
      s += `<circle cx="${(cx + hd * Math.cos(a)).toFixed(2)}" cy="${(cy + hd * Math.sin(a)).toFixed(2)}" r="${hr.toFixed(2)}" fill="${C.viz}"${stroke}/>`;
    }
  } else { // one rim mark on small gears so the spin is visible
    s += `<circle cx="${(cx + rf * 0.62).toFixed(2)}" cy="${cy}" r="${Math.max(3, rf * 0.11).toFixed(2)}" fill="${C.viz}"${stroke}/>`;
  }
  s += `<circle cx="${cx}" cy="${cy}" r="${Math.max(6, rf * 0.26).toFixed(2)}" fill="${C.viz}"${stroke}/>`;
  return s + '</g>';
}

// ---------------------------------------------------------------------------
// pairSVG — builds the full SVG string for a gear pair
// ---------------------------------------------------------------------------
export function pairSVG(gear, data) {
  const neutral = gear === 'N';
  const A = neutral ? 8 : data.drive, B = neutral ? 32 : data.output;
  const gap = neutral ? 36 : 0;
  const raA = M * A / 2 + 0.9 * M, raB = M * B / 2 + 0.9 * M;
  const a = M * (A + B) / 2 + gap;                 // centre distance
  const x0 = (VBW - (raA + a + raB)) / 2;          // centre the pair horizontally
  const cxA = x0 + raA, cxB = cxA + a;
  const offB = B % 2 === 0 ? 180 / B : 0;          // put a gap of B opposite a tooth of A
  const driveSec = neutral ? 60 / 80 : 60 / (data.rpm * B / A);
  const outSec = neutral ? null : 60 / data.rpm;
  const label = neutral
    ? 'Neutral: the drive gear turns, the output gear is pulled out of mesh and stopped'
    : `${data.name} gear: a ${A}-tooth drive gear turning a ${B}-tooth output gear at ${data.rpm} rpm`;
  return `<svg viewBox="0 0 ${VBW} ${VBH}" role="img" aria-label="${label}">`
    + `<line x1="${x0 - 16}" y1="${CY}" x2="${cxB + raB + 16}" y2="${CY}" stroke="#2F343B" stroke-width="1.5" stroke-dasharray="6 6"/>`
    + gearGroup(A, cxA, CY, 0, 'drive', driveSec)
    + gearGroup(B, cxB, CY, offB, 'output', outSec, neutral ? ';opacity:.45' : '')
    + [cxA, cxB].map(cx => `<path d="M${cx - 7} ${CY} H${cx + 7} M${cx} ${CY - 7} V${CY + 7}" stroke="#8A9099" stroke-width="1.5"/>`).join('')
    + `</svg>`;
}
