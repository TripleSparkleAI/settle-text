// settle-text · colour words (src/colour.js): a CSS colour to a hex, a neon word to settle-see's key.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NEON_WORDS, isNeonKey, neonKey, parseColour, toSettleColour } from '../src/index.js';
import { NEON } from 'settle-see';

test('the ten colour words map onto settle-see\'s ten neon keys, one each', () => {
  assert.deepEqual(Object.keys(NEON_WORDS), ['rose', 'indigo', 'amber', 'cyan', 'orange', 'lime', 'violet', 'ice', 'mint', 'red']);
  assert.deepEqual(new Set(Object.values(NEON_WORDS)), new Set(Object.keys(NEON)), 'every settle-see key has a word');
  assert.equal(neonKey('cyan'), 'pull');
  assert.equal(neonKey('pull'), 'pull', 'a key passes through');
  assert.equal(isNeonKey('rose'), true);
  assert.equal(isNeonKey('yes'), true);
  assert.equal(isNeonKey('#ff2fa0'), false);
  assert.equal(isNeonKey('zzqx'), false);
});

test('parseColour: hex forms, rgb() and rgba(), a few CSS names; null for the rest', () => {
  assert.equal(parseColour('#ff2fa0'), '#ff2fa0');
  assert.equal(parseColour('#FF2FA0'), '#ff2fa0');
  assert.equal(parseColour('#ff2fa0cc'), '#ff2fa0', 'the alpha is dropped');
  assert.equal(parseColour('#f0a'), '#ff00aa');
  assert.equal(parseColour('rgb(255, 47, 160)'), '#ff2fa0');
  assert.equal(parseColour('rgba(255 47 160 / 0.5)'), '#ff2fa0');
  assert.equal(parseColour('white'), '#ffffff');
  assert.equal(parseColour('HotPink'), '#ff69b4');
  assert.equal(parseColour('oklch(70% 0.2 300)'), null, 'left to the browser');
  assert.equal(parseColour(''), null);
  assert.equal(parseColour(null), null);
  assert.equal(parseColour('#12'), null);
});

test('toSettleColour: a neon word becomes its key, a CSS colour its hex, an unknown word null', () => {
  assert.equal(toSettleColour('lime'), 'calm');
  assert.equal(toSettleColour('mem'), 'mem');
  assert.equal(toSettleColour('rgb(0,0,0)'), '#000000');
  assert.equal(toSettleColour('nonsense-word'), null);
});
