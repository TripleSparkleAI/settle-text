// settle-text · the presets (src/presets.js): the measured defaults, the two ladders, the pitch arithmetic.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TEXT, RESOLUTIONS, IMAGE_RESOLUTIONS, HEAT, BREATH, COLOUR, resolveResolution, textPitch, imagePitch, RESOLUTION_BOUNDS } from '../src/index.js';

test('the defaults are the SETTLE site\'s measured title tuning: box 1.25 em, glow 0.7, wide scripts 1.6x at weight 400', () => {
  assert.equal(TEXT.boxPerEm, 1.25);
  assert.equal(TEXT.glow, 0.7);
  assert.equal(TEXT.wide.lights, 1.6);
  assert.equal(TEXT.wide.weight, 400);
  assert.equal(TEXT.wide.glyph, 0.72);
  assert.equal(TEXT.wide.glow, 0.5);
  assert.equal(TEXT.glyph, 0.8);
  assert.deepEqual(TEXT.margin, { x: 1, y: 1 });
  assert.equal(TEXT.lean, 1.1);
  assert.equal(TEXT.pull, 0.3);
  assert.equal(TEXT.fps, 24);
  assert.equal(COLOUR.text, '#ff2fa0', 'the HYPER PINK');
  assert.equal(HEAT.cold, 0.45);
  assert.equal(HEAT.settleMs, 1500);
  assert.deepEqual(BREATH, { minMs: 7000, spreadMs: 4000, level: 0.25 });
});

test('THE TEXT LADDER is lights per em: low 12, medium 20, high 32; medium is the title tuning restated', () => {
  assert.deepEqual(RESOLUTIONS, { low: 12, medium: 20, high: 32 });
  // a 72 px title at medium: 72 / 20 = 3.6 px a light, within a tenth of the site's 3.75; its 90 px box is 25 lights
  assert.ok(Math.abs(textPitch({ size: 72, resolution: 'medium' }) - 3.6) < 1e-9);
  assert.ok(Math.abs(textPitch({ size: 72, resolution: 'low' }) - 6) < 1e-9);
  assert.ok(Math.abs(textPitch({ size: 72, resolution: 'high' }) - 2.25) < 1e-9);
  // a number is lights per em too
  assert.ok(Math.abs(textPitch({ size: 100, resolution: 25 }) - 4) < 1e-9);
  // an explicit pitch wins over everything
  assert.equal(textPitch({ size: 100, resolution: 'high', pitch: 5 }), 5);
});

test('THE IMAGE LADDER is lights across: low 64, medium 128, high 256 (a 960 px picture at medium is a 7.5 px pitch)', () => {
  assert.deepEqual(IMAGE_RESOLUTIONS, { low: 64, medium: 128, high: 256 });
  assert.equal(imagePitch({ width: 960, resolution: 'medium' }), 7.5);
  assert.equal(imagePitch({ width: 960, resolution: 'low' }), 15);
  assert.equal(imagePitch({ width: 960, resolution: 'high' }), 3.75);
  assert.equal(imagePitch({ width: 480, resolution: 240 }), 2);
  assert.equal(imagePitch({ width: 480, pitch: 7 }), 7);
});

test('resolveResolution: a name, a number, a clamp, and medium for nonsense (never NaN)', () => {
  assert.equal(resolveResolution('high'), 32);
  assert.equal(resolveResolution(40), 40);
  assert.equal(resolveResolution(1000), RESOLUTION_BOUNDS.text[1]);
  assert.equal(resolveResolution(1), RESOLUTION_BOUNDS.text[0]);
  assert.equal(resolveResolution('zzqx'), 20);
  assert.equal(resolveResolution(NaN), 20);
  assert.equal(resolveResolution(-3, IMAGE_RESOLUTIONS, RESOLUTION_BOUNDS.image), 128);
});
