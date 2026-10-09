// settle-text · heading - the six heading levels: a size scale, the lights each size gets, and the element each
// level renders. Pure (no DOM, no React); react/SettleHeading.jsx draws them.
//
// <claudes_code_comments>
// ** Function List **
// HEADING                     - the scale (a CSS clamp per level, 1 to 6) and the title tuning the lights follow
// headingLevel(level)         - 1..6 from a number, '3' or 'h3'; anything else -> 1
// headingCss(level)           - the level's font size as a CSS clamp: 'clamp(44px, 6.4vw, 92px)' for level 1
// headingFontPx(level, vw)    - the same clamp worked out in px for a viewport width (a server or a test has no CSS)
// headingSize(size, level)    - the font-size the heading element wears: a number -> px, a CSS string as given,
//                               null/undefined -> the level's clamp, false -> none (your stylesheet sets it)
// headingPitch(fontPx)        - CSS px per light for a heading at this font size: the letter box (1.25 em) over the
//                               title pitch (3.75 px), clamped to 24..48 lights a box
// headingLights(fontPx, text) - the letter box's height in lights at that pitch (1.6 times for a wide script)
// headingElement(level, as)   - { tag, role, ariaLevel }: h1..h6, or the element you name with role="heading"
// headingText(text, children) - the words: `text`, else string or number children joined
//
// ** Technical Review **
// - THE SCALE is the SETTLE site's own headings (SETTLE/settle-site/src/sensible): level 1 is the page title
//   (clamp(44px, 6.4vw, 92px)), level 2 the thin title (TITLE.thin, 32 / 3.6vw / 52), level 3 the section heading
//   (.settle-heading--h2, 27 / 2.3vw / 40). Levels 4 to 6 continue the same steps down to a 16 px floor at a phone
//   width, so the smallest heading is still a little larger than body text.
// - THE LIGHTS are the site's TITLE tuning (lane SETTLEHEADINGLIVE, measured from browser shots at 1440 and 390 in
//   five languages): a light is about 3.75 CSS px (the hero's pitch), and a letter box is never fewer than 24 lights
//   (a capital under that reads as blobs) nor more than 48. So a 92 px title is a 31-light box at 3.7 px a light,
//   and a 20 px h6 is a 24-light box at about 1 px a light: finer dots, the same legibility.
// - headingPitch returns the Latin pitch. SettleText multiplies the lights by 1.6 for kana, Han and Devanagari
//   itself (src/layout.js lightsPerBox), with the wide script's weight, glyph and glow, so a heading in Japanese
//   needs nothing extra.
// </claudes_code_comments>

import { TEXT } from './presets.js';
import { wideScript } from './layout.js';

export const HEADING = Object.freeze({
  levels: Object.freeze({
    1: Object.freeze({ min: 44, vw: 6.4, max: 92 }),
    2: Object.freeze({ min: 32, vw: 3.6, max: 52 }),
    3: Object.freeze({ min: 27, vw: 2.3, max: 40 }),
    4: Object.freeze({ min: 22, vw: 1.8, max: 30 }),
    5: Object.freeze({ min: 19, vw: 1.4, max: 24 }),
    6: Object.freeze({ min: 16, vw: 1.2, max: 20 }),
  }),
  pitch: 3.75,
  lights: Object.freeze({ min: 24, max: 48 }),
  glow: 0.7,
});

export function headingLevel(level = 1) {
  const n = typeof level === 'string' ? Number(level.replace(/^h/i, '')) : Number(level);
  return Number.isInteger(n) && n >= 1 && n <= 6 ? n : 1;
}

export function headingCss(level = 1) {
  const s = HEADING.levels[headingLevel(level)];
  return `clamp(${s.min}px, ${s.vw}vw, ${s.max}px)`;
}

export function headingFontPx(level = 1, viewportPx = 1440) {
  const s = HEADING.levels[headingLevel(level)];
  return Math.max(s.min, Math.min(s.max, (s.vw / 100) * Math.max(0, viewportPx)));
}

export function headingSize(size, level = 1) {
  if (size === false) return undefined;
  if (Number.isFinite(size) && size > 0) return `${size}px`;
  if (typeof size === 'string' && size.trim()) return size.trim();
  return headingCss(level);
}

function boxLights(fontPx) {
  const box = Math.max(0.5, fontPx) * TEXT.boxPerEm;
  return { box, n: Math.max(HEADING.lights.min, Math.min(HEADING.lights.max, Math.round(box / HEADING.pitch))) };
}

export function headingPitch(fontPx) {
  const { box, n } = boxLights(fontPx);
  return box / n;
}

export function headingLights(fontPx, text = '') {
  const { n } = boxLights(fontPx);
  return wideScript(text) ? Math.round(n * TEXT.wide.lights) : n;
}

export function headingElement(level = 1, as = null) {
  const n = headingLevel(level);
  if (!as) return { tag: `h${n}`, role: undefined, ariaLevel: undefined };
  const own = typeof as === 'string' && /^h[1-6]$/i.test(as);
  return { tag: as, role: own ? undefined : 'heading', ariaLevel: own ? undefined : n };
}

export function headingText(text, children) {
  if (text != null && text !== false) return String(text);
  const parts = Array.isArray(children) ? children.flat(Infinity) : [children];
  return parts.filter((c) => typeof c === 'string' || typeof c === 'number').join('');
}
