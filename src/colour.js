// settle-text · colour - a user's colour word to a hex, and the neon names a designer may use. No DOM.
//
// <claudes_code_comments>
// ** Function List **
// NEON_WORDS         - the ten neon colour words -> settle-see's neon keys (rose -> yes, cyan -> pull, ...)
// NEON_HEX           - two more neon words with no settle-see key: pink (the HYPER PINK) and green (LASER GREEN)
// CSS_NAMES          - a small table of CSS colour names (black, white, the primaries, the greys and a few more)
// isNeonKey(word)    - true for a settle-see neon key or one of the colour words above
// neonKey(word)      - the settle-see key for a colour word ('rose' -> 'yes'), or the word itself when it is a key
// parseColour(css)   - '#rgb', '#rrggbb', '#rrggbbaa', rgb()/rgba() and a CSS name -> '#rrggbb'; anything else -> null
// toSettleColour(css) - what to hand settle-see's `neon` option: a hex for a CSS colour, a neon key for a neon word;
//                      null when the word is unknown (the React layer then asks the browser to resolve it)
//
// ** Technical Review **
// - settle-see's `neon` option accepts a hex or one of its ten keys (yes no lean pull heat calm mem held data miss).
//   A designer should not need those keys, so the colour words (rose indigo amber cyan orange lime violet ice mint
//   red) map onto them here; the hexes stay in settle-see, typed once.
// - parseColour is deliberately small: the browser resolves every other CSS colour (hsl(), oklch(), the full name
//   table) through a canvas in react/colour.js. This file is what the node tests reach.
// </claudes_code_comments>

export const NEON_WORDS = {
  rose: 'yes',
  indigo: 'no',
  amber: 'lean',
  cyan: 'pull',
  orange: 'heat',
  lime: 'calm',
  violet: 'mem',
  ice: 'held',
  mint: 'data',
  red: 'miss',
};
const NEON_KEYS = new Set(Object.values(NEON_WORDS));
// two neon words with no settle-see key (0.4.0): the SETTLE site's HYPER PINK and settle-text's LASER GREEN. They win
// over CSS's own pink and green, which are pale and dark, because this is a library of neons
export const NEON_HEX = { pink: '#ff2fa0', green: '#30ff46' };

export const CSS_NAMES = {
  black: '#000000',
  white: '#ffffff',
  silver: '#c0c0c0',
  gray: '#808080',
  grey: '#808080',
  maroon: '#800000',
  purple: '#800080',
  fuchsia: '#ff00ff',
  magenta: '#ff00ff',
  green: '#008000',
  olive: '#808000',
  yellow: '#ffff00',
  navy: '#000080',
  blue: '#0000ff',
  teal: '#008080',
  aqua: '#00ffff',
  gold: '#ffd700',
  pink: '#ffc0cb',
  hotpink: '#ff69b4',
  tomato: '#ff6347',
  coral: '#ff7f50',
  salmon: '#fa8072',
  crimson: '#dc143c',
  tan: '#d2b48c',
  khaki: '#f0e68c',
  ivory: '#fffff0',
};

export const isNeonKey = (w) => typeof w === 'string' && (NEON_KEYS.has(w) || w in NEON_WORDS || w in NEON_HEX);
export const neonKey = (w) => (typeof w === 'string' && w in NEON_WORDS ? NEON_WORDS[w] : w);

const hex2 = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');

export function parseColour(css) {
  if (typeof css !== 'string') return null;
  const s = css.trim().toLowerCase();
  if (!s) return null;
  let m = s.match(/^#([0-9a-f]{3,4})$/);
  if (m) return '#' + m[1].slice(0, 3).split('').map((c) => c + c).join('');
  m = s.match(/^#([0-9a-f]{6})(?:[0-9a-f]{2})?$/);
  if (m) return '#' + m[1];
  m = s.match(/^rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)/);
  if (m) return '#' + hex2(+m[1]) + hex2(+m[2]) + hex2(+m[3]);
  if (s in CSS_NAMES) return CSS_NAMES[s];
  return null;
}

export function toSettleColour(css) {
  if (typeof css === 'string' && css in NEON_HEX) return NEON_HEX[css];
  if (isNeonKey(css)) return neonKey(css);
  return parseColour(css);
}
