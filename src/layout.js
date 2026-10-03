// settle-text · layout - the grid a text settles on, the line wrap and the drawing spec. Plain JavaScript, no DOM.
//
// <claudes_code_comments>
// ** Function List **
// wideScript(text)             - true when the text holds kana, Han or Devanagari (a glyph needs more lights)
// lightsPerBox(size, pitch, text) - the letter box's height in lights: the box (1.25 em) over the pitch, clamped,
//                                times 1.6 for a wide script
// textGrid({ text, size, pitch, width, lines, margin }) - the grid: pitch P, box LH, line step LS, margins, cols x
//                                rows, the inner width, the CSS size and the glyph's font size in lights
// measureWith(ctx)             - a ratio function (text -> width / font size) over a canvas 2d context
// wrapLines(text, { ratio, spaceRatio, fontPx, maxW }) - the text broken at spaces, and after a hyphen inside a
//                                word, into lines that fit maxW; a piece wider than a line stands alone
// textSpec(text, { grid, lines, align, font, weight, scale, dx, dy }) - the settle-see target spec: a draw function
//                                that writes the lines into the grid, all at ONE font size, the largest that fits
//
// ** Technical Review **
// - THE GRID is the SETTLE site's (sites/settle-site/src/settleText.js, lanes CTPSETTLE and SETTLEHEADINGLIVE),
//   restated for a package: the letter box is `size * boxPerEm` CSS px tall and LH lights tall, so the pitch is the
//   box over LH. The grid spans the container's width (cols = width / P) plus a margin of lights on every side. A
//   wrapped text takes one line step (0.85 of the box) per extra line.
// - A wide script (kana, Han, Devanagari) takes 1.6 times the lights a box, a smaller glyph in the box and weight
//   400: measured on the site's titles, a bold kanji's strokes bridge at a title's pitch.
// - textSpec's draw runs inside settle-see's target painter (white on black, thresholded), so the words become a
//   grid of +1 and -1 lights; the font is the user's own, loaded by the React layer before the draw.
// </claudes_code_comments>

import { TEXT } from './presets.js';

export function wideScript(text = '') {
  return /[぀-ヿ㐀-䶿一-鿿豈-﫿ऀ-ॿ]/.test(String(text));
}

export function lightsPerBox(size, pitch, text = '') {
  const wide = wideScript(text);
  const k = wide ? TEXT.wide.lights : 1;
  const raw = ((Math.max(0.5, size) * TEXT.boxPerEm) / Math.max(0.5, pitch)) * k;
  const lo = Math.round(TEXT.lights.min * k);
  const hi = Math.round(TEXT.lights.max * k);
  return Math.max(lo, Math.min(hi, Math.round(raw)));
}

export function textGrid({ text = '', size = 64, pitch = 3.2, width = 0, lines = 1, margin = TEXT.margin } = {}) {
  const LH = lightsPerBox(size, pitch, text);
  const P = (Math.max(0.5, size) * TEXT.boxPerEm) / LH;
  const MX = Math.max(0, Math.round(margin?.x ?? TEXT.margin.x));
  const MY = Math.max(0, Math.round(margin?.y ?? TEXT.margin.y));
  const cols = Math.max(2 * MX + 8, Math.floor(Math.max(0, width) / P));
  const LS = Math.max(1, Math.round(LH * TEXT.lineStep));
  const n = Math.max(1, Math.round(lines));
  const rows = LH + (n - 1) * LS + 2 * MY;
  const wide = wideScript(text);
  const glyph = wide ? TEXT.wide.glyph : TEXT.glyph;
  return { P, LH, LS, MX, MY, cols, rows, lines: n, innerW: cols - 2 * MX, cssW: cols * P, cssH: rows * P, fontPx: Math.round(LH * glyph), wide };
}

// a ratio function over a canvas context: the text's width over its font size, in the font the context wears
export function measureWith(ctx, font, weight = TEXT.weight) {
  return (t) => {
    ctx.font = `${weight} 100px ${font}`;
    return ctx.measureText(t).width / 100;
  };
}

export function wrapLines(text = '', { ratio = (w) => 0.62 * w.length, fontPx = 10, maxW = Infinity, spaceRatio = null } = {}) {
  const words = String(text).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];
  const space = (spaceRatio ?? ratio(' ')) * fontPx;
  // a line may break after a space or after a hyphen inside a word; the hyphen stays on its line
  const pieces = [];
  for (const word of words) {
    const parts = word.split(/(?<=-)(?=[^-])/);
    parts.forEach((p, i) => pieces.push({ t: p, glue: i === 0 ? space : 0 }));
  }
  const lines = [];
  let line = '';
  let w = 0;
  for (const { t, glue } of pieces) {
    const ww = ratio(t) * fontPx;
    const join = line ? glue : 0;
    if (line && w + join + ww > maxW) {
      lines.push(line);
      line = t;
      w = ww;
    } else {
      line = line ? line + (join > 0 ? ' ' : '') + t : t;
      w += join + ww;
    }
  }
  lines.push(line);
  return lines;
}

export function textSpec(text, { grid, lines = null, align = 'left', font = 'sans-serif', weight = TEXT.weight, scale = null, dx = 0, dy = 0 }) {
  const { LH, MX, MY, cols, innerW, wide } = grid;
  const LS = grid.LS ?? Math.max(1, Math.round(LH * TEXT.lineStep));
  const rowsOf = Array.isArray(lines) && lines.length > 0 ? lines : [String(text)];
  const glyph = scale ?? (wide ? TEXT.wide.glyph : TEXT.glyph);
  const x = align === 'left' ? MX : align === 'right' ? cols - MX : cols / 2;
  return {
    note: String(text),
    text: String(text),
    lines: rowsOf.length > 1 ? rowsOf : undefined,
    grid: `${cols}x${grid.rows}`,
    align,
    font,
    weight,
    at: `${dx},${dy}`,
    draw: (c) => {
      c.textAlign = align === 'left' || align === 'right' ? align : 'center';
      c.textBaseline = 'middle';
      // one font size for every line: the largest at which the widest line fits between the margins
      let size = Math.round(LH * glyph);
      const widest = () => Math.max(...rowsOf.map((l) => c.measureText(l).width));
      do {
        c.font = `${weight} ${size}px ${font}`;
        size--;
      } while (widest() > innerW * 0.98 && size > 4);
      rowsOf.forEach((line, i) => c.fillText(line, x + dx, MY + dy + i * LS + LH / 2 + LH * 0.03));
    },
  };
}
