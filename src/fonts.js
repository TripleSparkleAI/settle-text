// settle-text · fonts - THE FACES (settle-text 0.6.0, lane SETTLETEXTFONTS, the navigator 2026-10-09: "the font
// choice is bad", wanting "future sci-fi fonts" and "simple, clean, Helvetica-like free fonts"). Eight free faces
// that read well as settle lights, four clean and four sci-fi, shipped in the package's fonts/ folder with their
// licences. Plain JavaScript: the list, the default, and a lookup. No DOM.
//
// <claudes_code_comments>
// ** Function List **
// FONTS                - the eight faces: key, name, kind ('clean' or 'scifi'), the CSS family stack, the weight a
//                        settle draws them at, the weights in the file, the file, the licence and its file, upstream
// FONT_KINDS           - the two kinds in the order the list gives them
// DEFAULT_FONT_KEY     - 'inter', the face every component draws in when no font is given
// DEFAULT_FONT         - its CSS family stack, with Helvetica and Arial after it for a page that loads no faces
// fontOf(keyOrName)    - a key ('orbitron') or a name ('Orbitron') -> { family, weight } for the `font` prop, or null
//
// ** Technical Review **
// - THE CHOICE, judged from the lights rather than the type specimen (SETTLE/runs/settletextfonts/README.md): 13
//   free candidates drawn as settle-text at 88, 40 and 22 px. Inter reads best at prose size (open counters, wide
//   spacing, so the letters stay apart as dots), so it is the default. Michroma's thin strokes broke into sparse
//   dots, Syncopate's unicase made prose hard to read, Rajdhani was too condensed at 22 px, Chakra Petch duplicated
//   Oxanium, and Instrument Sans set its letters close enough that their dots merged.
// - LICENCES: all eight are SIL Open Font License 1.1, which allows bundling and redistribution with software. Each
//   folder holds the woff2, OFL.txt and a README.md with the source URL, the date fetched and the sha256
//   (THE PROVENANCE RULE). tests/fonts.test.mjs refuses a face whose file, licence or README is missing.
// - LOADING: fonts/fonts.css declares one @font-face per file with font-display: swap; a page imports it once
//   (`import 'settle-text/fonts.css'`). A browser downloads a face only when a glyph is drawn in it. Without the
//   import the default stack falls back to Helvetica Neue, Helvetica, then Arial, which also read cleanly.
// - Weights: the variable faces are drawn at the package's 700; Audiowide has one weight and is drawn at 400, so a
//   canvas never fakes a bold for it.
// </claudes_code_comments>

const stack = (name, kind) => `"${name}", ${kind === 'clean' ? '"Helvetica Neue", Helvetica, Arial' : '"Helvetica Neue", Arial'}, sans-serif`;

const F = (key, name, kind, weight, weights, file, upstream) =>
  Object.freeze({
    key,
    name,
    kind,
    family: stack(name, kind),
    weight,
    weights,
    file: `fonts/${key}/${file}`,
    licence: 'OFL-1.1',
    licenceFile: `fonts/${key}/OFL.txt`,
    readme: `fonts/${key}/README.md`,
    upstream,
  });

export const FONTS = Object.freeze([
  F('inter', 'Inter', 'clean', 700, '100 900', 'inter-100-900.woff2', 'https://github.com/rsms/inter'),
  F('geist', 'Geist', 'clean', 700, '100 900', 'geist-100-900.woff2', 'https://github.com/vercel/geist-font'),
  F('archivo', 'Archivo', 'clean', 700, '100 900', 'archivo-100-900.woff2', 'https://github.com/Omnibus-Type/Archivo'),
  F('space-grotesk', 'Space Grotesk', 'clean', 700, '300 700', 'space-grotesk-300-700.woff2', 'https://github.com/floriankarsten/space-grotesk'),
  F('orbitron', 'Orbitron', 'scifi', 700, '400 900', 'orbitron-400-900.woff2', 'https://github.com/theleagueof/orbitron'),
  F('exo-2', 'Exo 2', 'scifi', 700, '100 900', 'exo-2-100-900.woff2', 'https://github.com/googlefonts/Exo-2.0'),
  F('oxanium', 'Oxanium', 'scifi', 700, '200 800', 'oxanium-200-800.woff2', 'https://github.com/sevmeyer/oxanium'),
  F('audiowide', 'Audiowide', 'scifi', 400, '400', 'audiowide-400.woff2', 'https://fonts.google.com/specimen/Audiowide'),
]);

export const FONT_KINDS = Object.freeze(['clean', 'scifi']);
export const DEFAULT_FONT_KEY = 'inter';
export const DEFAULT_FONT = FONTS.find((f) => f.key === DEFAULT_FONT_KEY).family;

export function fontOf(keyOrName) {
  if (typeof keyOrName !== 'string') return null;
  const k = keyOrName.trim().toLowerCase();
  const f = FONTS.find((x) => x.key === k || x.name.toLowerCase() === k);
  return f ? { family: f.family, weight: f.weight } : null;
}
