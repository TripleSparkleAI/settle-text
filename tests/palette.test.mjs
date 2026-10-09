// settle-text · THE PALETTE (src/palette.js, 0.4.0): each component's default neon, the neon words, the colour modes
// and the gradient paint settle-see's map mode draws.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NEON_RANGE, PALETTE, GRADIENTS, paletteOf, gradientStops, gradientPaint, GRADIENT_STOPS, toSettleColour } from '../src/index.js';

const ROOT = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const SEE = readFileSync(join(ROOT, '../settle-see/src/palette.js'), 'utf8');

test('THE PALETTE: each component has its own vivid default from the neon range', () => {
  assert.deepEqual(PALETTE, { text: '#ff2fa0', heading: '#ff2fa0', link: '#30ff46', sequence: '#22e6ff', image: '#ff2fa0', vector: '#9dff3a', background: '#b26bff' });
  for (const hex of Object.values(PALETTE)) assert.ok(Object.values(NEON_RANGE).includes(hex), hex);
  // a vivid neon: one channel at full, saturation high
  for (const [k, hex] of Object.entries(NEON_RANGE)) {
    if (k === 'ice') continue;
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    assert.ok(Math.max(...c) >= 0xf0, `${k} is bright`);
    assert.ok(Math.max(...c) - Math.min(...c) >= 0x90, `${k} is saturated`);
  }
});

test('THE NEON RANGE agrees with settle-see\'s ten neons, hex for hex', () => {
  const pairs = { rose: 'yes', indigo: 'no', amber: 'lean', cyan: 'pull', orange: 'heat', lime: 'calm', violet: 'mem', ice: 'held', mint: 'data', red: 'miss' };
  for (const [word, key] of Object.entries(pairs)) {
    const m = SEE.match(new RegExp(`key: '${key}', hex: '(#[0-9a-f]{6})'`));
    assert.ok(m, key);
    assert.equal(NEON_RANGE[word], m[1], word);
  }
});

test('the two new neon words win over CSS\'s pale pink and dark green', () => {
  assert.equal(toSettleColour('pink'), '#ff2fa0');
  assert.equal(toSettleColour('green'), '#30ff46');
  assert.equal(toSettleColour('rose'), 'yes', 'the ten old words still map to settle-see keys');
  assert.equal(toSettleColour('hotpink'), '#ff69b4', 'other CSS names are untouched');
});

test('paletteOf: single by default; meaning and duo are settle-see\'s modes; a gradient name, a list of colours or { colors, direction } is a gradient', () => {
  assert.deepEqual(paletteOf(undefined), { mode: 'single' });
  assert.deepEqual(paletteOf('single'), { mode: 'single' });
  assert.deepEqual(paletteOf('meaning'), { mode: 'meaning' });
  assert.deepEqual(paletteOf('duo'), { mode: 'duo' });
  assert.deepEqual(paletteOf('sunset'), { mode: 'gradient', colours: [...GRADIENTS.sunset], direction: 'x' });
  assert.deepEqual(paletteOf(['pink', '#00ff00']), { mode: 'gradient', colours: ['#ff2fa0', '#00ff00'], direction: 'x' });
  assert.deepEqual(paletteOf({ colors: ['cyan', 'violet'], direction: 'diagonal' }), { mode: 'gradient', colours: ['#22e6ff', '#b26bff'], direction: 'diagonal' });
  assert.deepEqual(paletteOf({ colors: ['cyan'], direction: 'sideways' }).direction, 'x');
  assert.deepEqual(paletteOf('no-such-gradient'), { mode: 'single' });
});

test('gradientStops runs evenly from the first colour to the last through the middle ones', () => {
  const s = gradientStops(['#ff0000', '#0000ff'], 5);
  assert.deepEqual(s, ['#ff0000', '#bf0040', '#800080', '#4000bf', '#0000ff']);
  const t = gradientStops(['#ff0000', '#00ff00', '#0000ff'], 3);
  assert.deepEqual(t, ['#ff0000', '#00ff00', '#0000ff']);
  assert.deepEqual(gradientStops(['#123456'], 4), ['#123456']);
  assert.equal(gradientStops(GRADIENTS.neon).length, GRADIENT_STOPS);
});

test('gradientPaint indexes every light by column, row or both, at gain 1', () => {
  const x = gradientPaint(5, 2, 5, 'x');
  assert.deepEqual([...x.hue], [0, 1, 2, 3, 4, 0, 1, 2, 3, 4]);
  assert.ok([...x.gain].every((g) => g === 1));
  const y = gradientPaint(2, 3, 3, 'y');
  assert.deepEqual([...y.hue], [0, 0, 1, 1, 2, 2]);
  const d = gradientPaint(3, 3, 5, 'diagonal');
  assert.equal(d.hue[0], 0);
  assert.equal(d.hue[8], 4);
  assert.equal(d.hue[2], d.hue[6], 'the two off corners meet in the middle');
});

test('Lights draws a gradient and a picture\'s own colours through settle-see\'s map mode, and meaning and duo by name', () => {
  const src = read('react/Lights.jsx');
  assert.match(src, /const colorMode = map \? 'map' : mode\.mode === 'meaning' \|\| mode\.mode === 'duo' \? mode\.mode : 'single';/);
  assert.match(src, /palette=\{map \? \(gradient \? gPalette : source\.palette\) : undefined\}/);
  assert.match(src, /off=\{colorMode === 'duo' \? offColour : undefined\}/);
  assert.match(src, /dim=\{dimLevel\}/);
  for (const f of ['SettleText.jsx', 'SettleImage.jsx', 'SettleVector.jsx']) assert.match(read(`react/${f}`), /palette=\{/, f);
});
