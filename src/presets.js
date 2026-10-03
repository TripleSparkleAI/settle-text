// settle-text · presets - the defaults every component starts from, and the two resolution ladders.
//
// <claudes_code_comments>
// ** Function List **
// TEXT                 - the text defaults: the letter box per em, the light bounds, the glow, the wide-script values,
//                        the margins, the physics (lean, pull, fps, rest) and the glyph fraction
// RESOLUTIONS          - text: lights per em for 'low' | 'medium' | 'high'
// IMAGE_RESOLUTIONS    - images, vectors, backgrounds: lights across for 'low' | 'medium' | 'high' (64 / 128 / 256)
// HEAT / BREATH        - the temperature curve (cold, hot, the time to settle) and the idle breath
// COLOUR               - the default colour (the HYPER PINK the SETTLE site's headings wear) and the default glow
// resolveResolution(r, table, bounds) - a preset name or a number -> a clamped number
// textPitch({ size, resolution, pitch }) - CSS px per light for text: pitch wins, else size / lights-per-em
// imagePitch({ width, resolution, pitch }) - CSS px per light for a picture: pitch wins, else width / lights-across
//
// ** Technical Review **
// - The numbers are the SETTLE site's measured title tuning (sites/settle-site/src/sensible/SettleHeading.jsx TITLE,
//   lane SETTLEHEADINGLIVE, 2026-10-04, from browser shots at 1440 and 390 in five languages): the letter box is
//   1.25 em of the font size (the glyphs stand 0.8 of the box, so the capitals are about 1.0 em of lights), the lights
//   come from a 3.75 px pitch clamped between 24 and 48 a box, the glow is 0.7, and kana, Han and Devanagari take 1.6
//   times the lights at weight 400 with a smaller glyph and less glow.
// - 'medium' is that tuning restated as lights per em: a 72 px title at a 3.75 px pitch is a 90 px box of 24 lights,
//   19.2 lights per em, rounded to 20. 'low' halves the detail (a 6 px pitch at 72 px), 'high' adds half again.
// - The clamps are wider than the site's (12 to 96 a box) because a package is used at more sizes than a page title;
//   the cost grows with the square of the lights, so the README says what each preset costs.
// </claudes_code_comments>

export const TEXT = {
  boxPerEm: 1.25,
  lights: { min: 12, max: 96 },
  glyph: 0.8,
  glow: 0.7,
  wide: { lights: 1.6, weight: 400, glyph: 0.72, glow: 0.5 },
  margin: { x: 1, y: 1 },
  lineStep: 0.85,
  lean: 1.1,
  pull: 0.3,
  fps: 24,
  restAfter: 12,
  weight: 700,
};

export const RESOLUTIONS = { low: 12, medium: 20, high: 32 };
export const IMAGE_RESOLUTIONS = { low: 64, medium: 128, high: 256 };
export const RESOLUTION_BOUNDS = { text: [6, 64], image: [8, 640] };

export const HEAT = { cold: 0.45, hot: 2.4, settleMs: 1500, eps: 0.01 };
export const BREATH = { minMs: 7000, spreadMs: 4000, level: 0.25 };

export const COLOUR = { text: '#ff2fa0', glow: 0.7 };

export function resolveResolution(r, table = RESOLUTIONS, bounds = RESOLUTION_BOUNDS.text) {
  const [lo, hi] = bounds;
  let n = typeof r === 'string' ? table[r] : Number(r);
  if (!Number.isFinite(n) || n <= 0) n = table.medium;
  return Math.max(lo, Math.min(hi, n));
}

// CSS px per light for text: an explicit pitch wins; else the em divided by the lights per em
export function textPitch({ size = 64, resolution = 'medium', pitch = null } = {}) {
  if (Number.isFinite(pitch) && pitch > 0) return pitch;
  const perEm = resolveResolution(resolution, RESOLUTIONS, RESOLUTION_BOUNDS.text);
  return Math.max(0.5, size) / perEm;
}

// CSS px per light for a picture: an explicit pitch wins; else the width divided by the lights across
export function imagePitch({ width = 480, resolution = 'medium', pitch = null } = {}) {
  if (Number.isFinite(pitch) && pitch > 0) return pitch;
  const across = resolveResolution(resolution, IMAGE_RESOLUTIONS, RESOLUTION_BOUNDS.image);
  return Math.max(1, width) / across;
}
