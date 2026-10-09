// settle-text · the presets (src/presets.js): the measured defaults, the two ladders, the pitch arithmetic.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TEXT, RESOLUTIONS, IMAGE_RESOLUTIONS, RETIRED_RESOLUTIONS, HEAT, BREATH, COLOUR, resolveResolution, textPitch, imagePitch, RESOLUTION_BOUNDS, isAuto } from '../src/index.js';

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

test('THE TEXT LADDER is lights per em: chunky 8, low 12, medium 20, high 32 (high is the top since 0.5.0); medium is the title tuning restated', () => {
  assert.deepEqual(RESOLUTIONS, { chunky: 8, low: 12, medium: 20, high: 32 });
  assert.ok(Math.abs(textPitch({ size: 72, resolution: 'chunky' }) - 9) < 1e-9);
  assert.ok(Math.abs(textPitch({ size: 96, resolution: 'high' }) - 3) < 1e-9);
  // a 72 px title at medium: 72 / 20 = 3.6 px a light, within a tenth of the site's 3.75; its 90 px box is 25 lights
  assert.ok(Math.abs(textPitch({ size: 72, resolution: 'medium' }) - 3.6) < 1e-9);
  assert.ok(Math.abs(textPitch({ size: 72, resolution: 'low' }) - 6) < 1e-9);
  assert.ok(Math.abs(textPitch({ size: 72, resolution: 'high' }) - 2.25) < 1e-9);
  // a number is lights per em too
  assert.ok(Math.abs(textPitch({ size: 100, resolution: 25 }) - 4) < 1e-9);
  // an explicit pitch wins over everything
  assert.equal(textPitch({ size: 100, resolution: 'high', pitch: 5 }), 5);
});

test('THE IMAGE LADDER is lights across: chunky 40, low 64, medium 128, high 256 (a 960 px picture at medium is a 7.5 px pitch)', () => {
  assert.deepEqual(IMAGE_RESOLUTIONS, { chunky: 40, low: 64, medium: 128, high: 256 });
  assert.equal(imagePitch({ width: 960, resolution: 'chunky' }), 24);
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

test('AUTO, THE 0.4.0 DEFAULT: text at the hero\'s pitch (the title tuning), pictures near 3 px a light', () => {
  // the default resolution is 'auto', and undefined reads as 'auto'
  assert.equal(textPitch({ size: 96 }), textPitch({ size: 96, resolution: 'auto' }));
  // a 96 px title: 'medium' drew it at 4.8 px a light, coarser than the hero's 3.75; 'auto' holds 3.75
  assert.ok(Math.abs(textPitch({ size: 96, resolution: 'medium' }) - 4.8) < 1e-9);
  assert.ok(Math.abs(textPitch({ size: 96, resolution: 'auto' }) - 3.75) < 1e-9);
  // the clamps are the title tuning's 24 to 48 lights a 1.25 em box: 19.2 to 38.4 lights per em
  assert.ok(Math.abs(textPitch({ size: 28 }) - 28 / 19.2) < 1e-9, 'a small size keeps 19.2 per em, about medium');
  assert.ok(Math.abs(textPitch({ size: 300 }) - 300 / 38.4) < 1e-9, 'a huge size stops at 38.4 per em');
  // below 72 px auto and medium agree within a light a box
  for (const size of [24, 40, 64, 72]) assert.ok(Math.abs(size / textPitch({ size }) - 20) <= 1, `${size} px`);
  // pictures: about 3 px a light, 96 to 384 across
  assert.equal(imagePitch({ width: 600 }), 3);
  assert.ok(imagePitch({ width: 600, resolution: 'medium' }) > 4.6, 'medium at 600 px is 4.7 px a light, the coarse case');
  assert.equal(imagePitch({ width: 200 }), 200 / 96, 'a small picture keeps 96 across');
  assert.equal(imagePitch({ width: 1600 }), 1600 / 384, 'a wide one stops at 384 across');
  assert.ok(isAuto('auto') && isAuto(undefined) && isAuto(null) && !isAuto('medium'));
});

test('ULTRA IS RETIRED (0.5.0): \'ultra\' reads as \'high\' on both ladders, with one console warning per page, never an error', () => {
  assert.deepEqual(RETIRED_RESOLUTIONS, { ultra: 'high' });
  assert.ok(!('ultra' in RESOLUTIONS) && !('ultra' in IMAGE_RESOLUTIONS), 'no ultra on either ladder');
  const warn = console.warn;
  const said = [];
  console.warn = (m) => said.push(String(m));
  try {
    assert.equal(textPitch({ size: 96, resolution: 'ultra' }), textPitch({ size: 96, resolution: 'high' }));
    assert.equal(imagePitch({ width: 960, resolution: 'ultra' }), imagePitch({ width: 960, resolution: 'high' }));
    assert.equal(resolveResolution('ultra'), 32);
  } finally {
    console.warn = warn;
  }
  assert.equal(said.length, 1, 'warned once, however often it is asked');
  assert.match(said[0], /'ultra' is retired since 0\.5\.0; drawing 'high'/);
});
