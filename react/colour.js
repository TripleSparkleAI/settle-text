// settle-text/react · colour - any CSS colour a designer writes, resolved in the browser to what settle-see takes.
//
// <claudes_code_comments>
// ** Function List **
// resolveColour(css, fallback) - a neon word -> its settle-see key; a CSS colour of any kind -> '#rrggbb' (the
//                                browser's own parser through a 2d context's fillStyle); unknown -> the fallback
//
// ** Technical Review **
// - src/colour.js handles the common forms without a DOM. Everything else (hsl(), oklch(), lab(), the full CSS
//   name table, currentColor is not supported) goes through a canvas: setting fillStyle and reading it back gives
//   '#rrggbb' for an opaque colour and 'rgba(r, g, b, a)' for a translucent one; the alpha is dropped, the lights
//   carry their own.
// - The result is cached per string; a page with one colour asks the canvas once.
// </claudes_code_comments>

import { toSettleColour, parseColour } from '../src/colour.js';

const cache = new Map();
let ctx = null;

function browserColour(css) {
  if (typeof document === 'undefined') return null;
  try {
    if (!ctx) ctx = document.createElement('canvas').getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillStyle = css;
    const v = String(ctx.fillStyle);
    return parseColour(v);
  } catch {
    return null;
  }
}

export function resolveColour(css, fallback = '#ff2fa0') {
  if (css == null || css === '') return fallback;
  const key = String(css);
  if (cache.has(key)) return cache.get(key);
  const direct = toSettleColour(key);
  const out = direct ?? browserColour(key) ?? fallback;
  cache.set(key, out);
  return out;
}
