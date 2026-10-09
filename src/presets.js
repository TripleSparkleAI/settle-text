// settle-text · presets - the defaults every component starts from, and the two resolution ladders.
//
// <claudes_code_comments>
// ** Function List **
// TEXT                 - the text defaults: the letter box per em, the light bounds, the glow, the wide-script values,
//                        the margins, the physics (lean, pull, fps, rest) and the glyph fraction
// RESOLUTIONS          - text: lights per em for 'chunky' | 'low' | 'medium' | 'high' (8 / 12 / 20 / 32)
// IMAGE_RESOLUTIONS    - images, vectors, backgrounds: lights across (40 / 64 / 128 / 256)
// RETIRED_RESOLUTIONS  - preset names that are gone and what they now mean ('ultra' -> 'high', 0.5.0)
// AUTO / isAuto        - 'auto', the 0.4.0 default: the hero's pitch (text: the title tuning, ~3.75 px a light;
//                        pictures: ~3 px a light, 96 to 384 across)
// HEAT / BREATH        - the temperature curve (cold, hot, the time to settle) and the idle breath
// COLOUR               - the default colour (the HYPER PINK the SETTLE site's headings wear) and the default glow
// resolveResolution(r, table, bounds) - a preset name or a number -> a clamped number; a retired name is read as its
//                        replacement with a one-time console warning outside a production build
// textPitch({ size, resolution, pitch }) - CSS px per light for text: pitch wins, else size / lights-per-em
// imagePitch({ width, resolution, pitch }) - CSS px per light for a picture: pitch wins, else width / lights-across
//
// ** Technical Review **
// - The numbers are the SETTLE site's measured title tuning (SETTLE/settle-site/src/sensible/SettleHeading.jsx TITLE,
//   lane SETTLEHEADINGLIVE, 2026-10-04, from browser shots at 1440 and 390 in five languages): the letter box is
//   1.25 em of the font size (the glyphs stand 0.8 of the box, so a glyph's em is the font size itself), the lights
//   come from a 3.75 px pitch clamped between 24 and 48 a box, the glow is 0.7, and kana, Han and Devanagari take 1.6
//   times the lights at weight 400 with a smaller glyph and less glow.
// - 'medium' is that tuning restated as lights per em: a 72 px title at a 3.75 px pitch is a 90 px box of 24 lights,
//   19.2 lights per em, rounded to 20. 'low' halves the detail (a 6 px pitch at 72 px), 'high' adds half again.
// - 'auto' (0.4.0, lane STXALIVE) is the default: measured against the hero's 3.75 px pitch, 'medium' drew a 96 px
//   title at 4.8 px a light and a 600 px picture at 4.7, both coarser than the hero; 'auto' holds text at the title
//   tuning and pictures near 3 px. Below 72 px 'auto' and 'medium' agree within a light (19.2 against 20 per em).
// - 'ultra' (48 lights per em, 384 across) is RETIRED in 0.5.0 (the navigator, 2026-10-07: "we don't need ultra
//   mode for the resolution"): 'high' is the top of both ladders. A caller passing 'ultra' gets 'high' and, outside
//   a production build, one console warning per page; never an error. 'auto' keeps its own bounds (up to 38.4 per
//   em and 384 across), which are the hero's pitch and not a preset.
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

export const RESOLUTIONS = { chunky: 8, low: 12, medium: 20, high: 32 };
export const IMAGE_RESOLUTIONS = { chunky: 40, low: 64, medium: 128, high: 256 };
export const RETIRED_RESOLUTIONS = Object.freeze({ ultra: 'high' });
// 'auto' (the 0.4.0 default): the hero's pitch. Text takes the site's title tuning, about 3.75 px a light and 24 to
// 48 lights a 1.25 em letter box (19.2 to 38.4 lights per em); a picture takes about 3 px a light, 96 to 384 across
export const AUTO = { textPitch: 3.75, perEm: [19.2, 38.4], imagePitch: 3, across: [96, 384] };
export const RESOLUTION_BOUNDS = { text: [6, 64], image: [8, 640] };

export const HEAT = { cold: 0.45, hot: 2.4, settleMs: 1500, eps: 0.01 };
export const BREATH = { minMs: 7000, spreadMs: 4000, level: 0.25 };

export const COLOUR = { text: '#ff2fa0', glow: 0.7 };

export const isAuto = (r) => r == null || r === 'auto';

// outside a production build, one warning per retired name per page (a bundler replaces process.env.NODE_ENV; in a
// browser with no such replacement the reference throws and the build counts as a dev one)
const isProduction = () => {
  try {
    return process.env.NODE_ENV === 'production';
  } catch {
    return false;
  }
};
const warned = new Set();
export function retiredResolution(r) {
  const to = typeof r === 'string' ? RETIRED_RESOLUTIONS[r] : undefined;
  if (!to) return r;
  if (!warned.has(r) && !isProduction() && typeof console !== 'undefined') {
    warned.add(r);
    console.warn(`settle-text: resolution '${r}' is retired since 0.5.0; drawing '${to}' instead.`);
  }
  return to;
}

export function resolveResolution(r, table = RESOLUTIONS, bounds = RESOLUTION_BOUNDS.text) {
  const [lo, hi] = bounds;
  r = retiredResolution(r);
  let n = typeof r === 'string' ? table[r] : Number(r);
  if (!Number.isFinite(n) || n <= 0) n = table.medium;
  return Math.max(lo, Math.min(hi, n));
}

// CSS px per light for text: an explicit pitch wins; else the em divided by the lights per em
export function textPitch({ size = 64, resolution = 'auto', pitch = null } = {}) {
  if (Number.isFinite(pitch) && pitch > 0) return pitch;
  if (isAuto(resolution)) {
    const s = Math.max(0.5, size);
    const perEm = Math.max(AUTO.perEm[0], Math.min(AUTO.perEm[1], s / AUTO.textPitch));
    return s / perEm;
  }
  const perEm = resolveResolution(resolution, RESOLUTIONS, RESOLUTION_BOUNDS.text);
  return Math.max(0.5, size) / perEm;
}

// CSS px per light for a picture: an explicit pitch wins; else the width divided by the lights across
export function imagePitch({ width = 480, resolution = 'auto', pitch = null } = {}) {
  if (Number.isFinite(pitch) && pitch > 0) return pitch;
  if (isAuto(resolution)) {
    const w = Math.max(1, width);
    return w / Math.max(AUTO.across[0], Math.min(AUTO.across[1], Math.round(w / AUTO.imagePitch)));
  }
  const across = resolveResolution(resolution, IMAGE_RESOLUTIONS, RESOLUTION_BOUNDS.image);
  return Math.max(1, width) / across;
}
