// settle-text · pictures to lights (src/raster.js) against small known inputs: the fit, the threshold, the dither's
// densities, the vector's coverage, the source colours, the SVG classifier.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fitBox, luminance, sampleLights, sampleCoverage, ditherBits, sourcePaint, litCount, parseViewBox, svgKind } from '../src/index.js';

// RGBA bytes for a w x h picture from a function (x, y) -> [r, g, b, a]
const bytes = (w, h, f) => {
  const d = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) d.set(f(x, y), 4 * (y * w + x));
  return d;
};
const grey = (v, a = 255) => [v, v, v, a];

test('fitBox: contain keeps the whole picture centred, cover fills the grid, nonsense gives an empty box', () => {
  assert.deepEqual(fitBox(200, 100, 100, 100, 'contain'), { x: 0, y: 25, w: 100, h: 50 });
  assert.deepEqual(fitBox(200, 100, 100, 100, 'cover'), { x: -50, y: 0, w: 200, h: 100 });
  assert.deepEqual(fitBox(100, 200, 50, 50, 'contain'), { x: 12.5, y: 0, w: 25, h: 50 });
  assert.deepEqual(fitBox(0, 10, 4, 4), { x: 0, y: 0, w: 0, h: 0 });
});

test('a diagonal: the lit lights are exactly the bright pixels, invert swaps them, the threshold moves the cut', () => {
  const d = bytes(4, 4, (x, y) => grey(x === y ? 255 : 0));
  const bits = sampleLights(d, 4, 4);
  assert.deepEqual([...bits], [1, -1, -1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, -1, -1, 1]);
  assert.equal(litCount(bits), 4);
  assert.equal(litCount(sampleLights(d, 4, 4, { invert: true })), 12);
  // a mid grey: lit above a low threshold, dark above a high one
  const mid = bytes(2, 1, () => grey(128));
  assert.equal(litCount(sampleLights(mid, 2, 1, { threshold: 0.3 })), 2);
  assert.equal(litCount(sampleLights(mid, 2, 1, { threshold: 0.7 })), 0);
  // alpha dims a pixel: a white pixel at a quarter opacity is dark at 0.5
  const faint = bytes(1, 1, () => grey(255, 64));
  assert.equal(litCount(sampleLights(faint, 1, 1)), 0);
  assert.ok(Math.abs(luminance(255, 255, 255) - 1) < 1e-9);
  assert.ok(Math.abs(luminance(0, 255, 0) - 0.7152) < 1e-9, 'green carries most of the brightness');
});

test('DITHER keeps tone: a flat 40% grey lights about 40% of its lights, spread, where a threshold would light none', () => {
  const w = 40;
  const h = 40;
  const d = bytes(w, h, () => grey(102)); // 0.4
  assert.equal(litCount(sampleLights(d, w, h)), 0, 'the threshold cut sees a grey below 0.5 as dark');
  const bits = sampleLights(d, w, h, { dither: true });
  const share = litCount(bits) / (w * h);
  assert.ok(share > 0.36 && share < 0.44, `dithered share ${share}`);
  // spread, not clumped: every row has some lit lights
  for (let y = 0; y < h; y++) {
    let n = 0;
    for (let x = 0; x < w; x++) if (bits[y * w + x] > 0) n++;
    assert.ok(n >= 8 && n <= 24, `row ${y}: ${n}`);
  }
  // pure black and pure white stay pure under dither
  assert.equal(litCount(ditherBits(new Float32Array(16).fill(0), 4, 4)), 0);
  assert.equal(litCount(ditherBits(new Float32Array(16).fill(1), 4, 4)), 16);
});

test('A VECTOR IS LIT BY COVERAGE: a black shape on a transparent ground is lit, a transparent pixel is not', () => {
  const d = bytes(3, 1, (x) => (x === 1 ? [0, 0, 0, 255] : [255, 255, 255, 0]));
  assert.deepEqual([...sampleCoverage(d, 3, 1)], [-1, 1, -1]);
  // the same bytes read as a picture are the opposite (black is dark); that is why vectors do not use it
  assert.deepEqual([...sampleLights(d, 3, 1)], [-1, -1, -1]);
  // half-covered edge pixels follow the threshold
  const edge = bytes(2, 1, (x) => [0, 0, 0, x === 0 ? 200 : 60]);
  assert.deepEqual([...sampleCoverage(edge, 2, 1)], [1, -1]);
});

test('SOURCE COLOURS: each light keeps its own hue at full brightness with the brightness as its gain; the palette is small', () => {
  const d = bytes(3, 1, (x) => [[255, 0, 0, 255], [0, 128, 0, 255], [40, 40, 40, 255]][x]);
  const { palette, paint } = sourcePaint(d, 3, 1);
  assert.equal(paint.hue.length, 3);
  assert.equal(palette[paint.hue[0]], '#ff0000');
  assert.equal(palette[paint.hue[1]], '#00ff00', 'a dark green keeps its hue at full brightness');
  assert.ok(Math.abs(paint.gain[0] - 1) < 1e-6);
  assert.ok(Math.abs(paint.gain[1] - 128 / 255) < 1e-6, 'and its brightness as the gain');
  assert.equal(palette[paint.hue[2]], '#ffffff', 'a grey is white at a low gain');
  assert.ok(Math.abs(paint.gain[2] - 40 / 255) < 1e-6);
  // a photo of many colours quantises to at most 216 palette entries (6 levels a channel), inside a Uint8 index
  const many = bytes(64, 64, (x, y) => [x * 4, y * 4, (x * y) % 256, 255]);
  const big = sourcePaint(many, 64, 64);
  assert.ok(big.palette.length > 20 && big.palette.length <= 216, `${big.palette.length} colours`);
  assert.ok(big.paint.hue instanceof Uint8Array);
  assert.ok(big.paint.gain instanceof Float32Array);
});

test('parseViewBox reads a viewBox, falls back to width and height, and gives null for neither', () => {
  assert.deepEqual(parseViewBox('<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>'), [0, 0, 24, 24]);
  assert.deepEqual(parseViewBox('<svg viewBox="-5,-5,110,60">'), [-5, -5, 110, 60]);
  assert.deepEqual(parseViewBox('<svg width="300" height="150">'), [0, 0, 300, 150]);
  assert.equal(parseViewBox('<svg>'), null);
});

test('svgKind tells markup from a path from a URL, and refuses plain words', () => {
  assert.equal(svgKind('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>'), 'markup');
  assert.equal(svgKind('<?xml version="1.0"?><svg></svg>'), 'markup');
  assert.equal(svgKind('M10 90 L50 10 L90 90 Z'), 'path');
  assert.equal(svgKind('m 0,0 l 10,10'), 'path');
  assert.equal(svgKind('/logos/mark.svg'), 'url');
  assert.equal(svgKind('https://example.com/a.svg?v=2'), 'url');
  assert.equal(svgKind('./mark.svg'), 'url');
  assert.equal(svgKind('hello there'), null);
  assert.equal(svgKind(''), null);
  assert.equal(svgKind(null), null);
});
