// settle-text · palette - THE PALETTE: each component's default neon, the neon range a maker picks from, and the
// colour modes beyond one colour (the hero's meaning code, two neons, a gradient across the lights). No DOM.
//
// <claudes_code_comments>
// ** Function List **
// NEON_RANGE                 - the neons a maker reaches for, by word: settle-see's ten plus the SETTLE site's HYPER
//                              PINK and settle-text's LASER GREEN, each a hex
// PALETTE                    - each component's default colour: text and heading HYPER PINK, link LASER GREEN,
//                              sequence CYAN, image HYPER PINK, vector LIME, background VIOLET
// GRADIENTS                  - named gradients over the range ('sunset', 'aurora', 'neon', 'ice', 'fire')
// paletteOf(palette)         - a palette prop -> { mode: 'single' | 'meaning' | 'duo' | 'gradient', colours, direction }
// gradientStops(colours, n)  - n evenly spaced '#rrggbb' stops through the colours (mixed in RGB)
// gradientPaint(cols, rows, n, direction) - settle-see's map paint: { hue: Uint8Array, gain: Float32Array }, every
//                              light's stop index by its column ('x'), row ('y') or both ('diagonal')
//
// ** Technical Review **
// - settle-see colours a field four ways: 'single' (one neon, the default), 'meaning' (the hero's SETTLE code: a lit
//   light that agrees with its lean in rose, one against it in orange heat, so a re-settle flares orange where the
//   lights disagree), 'duo' (lit in one neon, unlit in another, seen with `dim`), and 'map' (every light its own
//   colour from a palette and a paint). A gradient is the map mode with a paint made here: GRADIENT_STOPS stops,
//   indexed by position, gain 1.
// - The colours are the SETTLE site's neon range: the ten settle-see neons (their hexes, the same as settle-see's
//   palette.js), the HYPER PINK the site's headings wear and settle-text's own LASER GREEN. A CSS colour anywhere
//   still works: these are the words, not a fence.
// </claudes_code_comments>

export const NEON_RANGE = Object.freeze({
  pink: '#ff2fa0',
  rose: '#ff4f8b',
  red: '#ff3355',
  orange: '#ff5a1f',
  amber: '#ffb000',
  lime: '#9dff3a',
  green: '#30ff46',
  mint: '#3dffb5',
  cyan: '#22e6ff',
  ice: '#d6f3ff',
  indigo: '#5b5bff',
  violet: '#b26bff',
});

export const PALETTE = Object.freeze({
  text: NEON_RANGE.pink,
  heading: NEON_RANGE.pink,
  link: NEON_RANGE.green,
  sequence: NEON_RANGE.cyan,
  image: NEON_RANGE.pink,
  vector: NEON_RANGE.lime,
  background: NEON_RANGE.violet,
});

export const GRADIENTS = Object.freeze({
  sunset: Object.freeze([NEON_RANGE.pink, NEON_RANGE.orange, NEON_RANGE.amber]),
  aurora: Object.freeze([NEON_RANGE.green, NEON_RANGE.cyan, NEON_RANGE.violet]),
  neon: Object.freeze([NEON_RANGE.pink, NEON_RANGE.violet, NEON_RANGE.cyan, NEON_RANGE.lime]),
  ice: Object.freeze([NEON_RANGE.ice, NEON_RANGE.cyan, NEON_RANGE.indigo]),
  fire: Object.freeze([NEON_RANGE.red, NEON_RANGE.orange, NEON_RANGE.amber]),
});

export const GRADIENT_STOPS = 24;
export const DIRECTIONS = Object.freeze(['x', 'y', 'diagonal']);

const isHex = (c) => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c);

// a palette prop: undefined | 'single' -> one colour; 'meaning' | 'duo' -> settle-see's modes; a gradient name, an
// array of colours, or { colors, direction } -> a gradient
export function paletteOf(palette) {
  if (palette == null || palette === 'single' || palette === false) return { mode: 'single' };
  if (palette === 'meaning' || palette === 'duo') return { mode: palette };
  if (typeof palette === 'string' && palette in GRADIENTS) return { mode: 'gradient', colours: [...GRADIENTS[palette]], direction: 'x' };
  const colours = Array.isArray(palette) ? palette : palette && typeof palette === 'object' ? palette.colors ?? palette.colours : null;
  if (Array.isArray(colours) && colours.length) {
    const named = colours.map((c) => (typeof c === 'string' && c in NEON_RANGE ? NEON_RANGE[c] : c));
    const direction = DIRECTIONS.includes(palette.direction) ? palette.direction : 'x';
    return { mode: 'gradient', colours: named, direction };
  }
  return { mode: 'single' };
}

const rgbOf = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const hexOf = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

export function gradientStops(colours, n = GRADIENT_STOPS) {
  const cs = colours.filter(isHex);
  if (!cs.length) return [NEON_RANGE.pink];
  if (cs.length === 1) return [cs[0].toLowerCase()];
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1)) * (cs.length - 1);
    const k = Math.min(cs.length - 2, Math.floor(t));
    const f = t - k;
    const a = rgbOf(cs[k]);
    const b = rgbOf(cs[k + 1]);
    out.push(hexOf(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f));
  }
  return out;
}

export function gradientPaint(cols, rows, n = GRADIENT_STOPS, direction = 'x') {
  const N = Math.max(0, cols * rows);
  const hue = new Uint8Array(N);
  const gain = new Float32Array(N).fill(1);
  const k = Math.max(1, Math.min(255, n)) - 1;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const fx = cols > 1 ? x / (cols - 1) : 0;
      const fy = rows > 1 ? y / (rows - 1) : 0;
      const f = direction === 'y' ? fy : direction === 'diagonal' ? (fx + fy) / 2 : fx;
      hue[y * cols + x] = Math.round(f * k);
    }
  }
  return { hue, gain };
}
