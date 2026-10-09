// settle-text · the heading range: six levels, a size scale that steps down and matches the SETTLE site's own
// headings, the lights each size gets (the site's title tuning), the element each level renders, and the React
// component's shape (read as source: react is a peer and node has no DOM).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { HEADING, headingLevel, headingCss, headingFontPx, headingSize, headingPitch, headingLights, headingElement, headingText } from '../src/heading.js';
import { lightsPerBox } from '../src/layout.js';
import * as pure from '../src/index.js';

const ROOT = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

test('six levels, and each level is no larger than the one above it at every viewport width', () => {
  assert.deepEqual(Object.keys(HEADING.levels), ['1', '2', '3', '4', '5', '6']);
  for (const vw of [320, 390, 768, 1024, 1440, 1920, 2560]) {
    const sizes = [1, 2, 3, 4, 5, 6].map((l) => headingFontPx(l, vw));
    for (let i = 1; i < 6; i++) assert.ok(sizes[i] < sizes[i - 1], `h${i + 1} < h${i} at ${vw}px: ${sizes.join(', ')}`);
  }
});

test('levels 1 to 3 are the SETTLE site\'s own headings: the page title, the thin title and the section heading', () => {
  assert.equal(headingCss(1), 'clamp(44px, 6.4vw, 92px)');
  assert.equal(headingCss(2), 'clamp(32px, 3.6vw, 52px)');
  assert.equal(headingCss(3), 'clamp(27px, 2.3vw, 40px)');
  assert.equal(headingCss(6), 'clamp(16px, 1.2vw, 20px)');
});

test('the clamp in px: the floor on a phone, the ceiling on a wide screen, the vw share between', () => {
  assert.equal(headingFontPx(1, 390), 44);
  assert.equal(headingFontPx(1, 2560), 92);
  assert.ok(Math.abs(headingFontPx(1, 1000) - 64) < 1e-9);
  assert.equal(headingFontPx(6, 390), 16);
});

test('headingLevel takes a number, a digit string or an h-name, and anything else is level 1', () => {
  assert.equal(headingLevel(3), 3);
  assert.equal(headingLevel('4'), 4);
  assert.equal(headingLevel('h5'), 5);
  assert.equal(headingLevel('H2'), 2);
  for (const bad of [0, 7, 2.5, 'big', null, undefined, NaN]) assert.equal(headingLevel(bad), 1, String(bad));
});

test('headingSize: a number is px, a CSS string passes through, nothing is the level\'s clamp, false leaves it to the stylesheet', () => {
  assert.equal(headingSize(40, 2), '40px');
  assert.equal(headingSize('3rem', 2), '3rem');
  assert.equal(headingSize(undefined, 2), headingCss(2));
  assert.equal(headingSize(null, 4), headingCss(4));
  assert.equal(headingSize(false, 2), undefined);
});

test('the lights follow the site\'s title tuning: a 3.75 px pitch, 24 to 48 lights a letter box', () => {
  assert.equal(HEADING.pitch, 3.75);
  assert.deepEqual({ ...HEADING.lights }, { min: 24, max: 48 });
  assert.equal(headingLights(72), 24); // a 90 px box at 3.75 px
  assert.equal(headingLights(92), 31); // the site's widest title: a 115 px box
  assert.equal(headingLights(16), 24); // the floor: a small heading gets finer dots, not fewer
  assert.equal(headingLights(400), 48); // the ceiling
  assert.ok(Math.abs(headingPitch(72) - 3.75) < 1e-9);
  assert.ok(headingPitch(16) < 1, 'an h6 on a phone is finer than a px a light');
});

test('a wide script gets 1.6 times the lights, as SettleText gives it', () => {
  assert.equal(headingLights(72, '設定'), Math.round(24 * 1.6));
  assert.equal(headingLights(72, 'Settle'), 24);
});

test('THE SEAM: the pitch a heading hands SettleText makes SettleText\'s own letter box the heading\'s lights, at every size, Latin and wide', () => {
  for (const px of [16, 20, 27, 40, 52, 72, 92, 140, 400]) {
    assert.equal(lightsPerBox(px, headingPitch(px), 'Settle'), headingLights(px, 'Settle'), `Latin at ${px}px`);
    assert.equal(lightsPerBox(px, headingPitch(px), 'セトル'), headingLights(px, 'セトル'), `kana at ${px}px`);
  }
});

test('headingElement: the level\'s own element, an h-name passes through, any other element carries role and level', () => {
  assert.deepEqual(headingElement(2), { tag: 'h2', role: undefined, ariaLevel: undefined });
  assert.deepEqual(headingElement(2, 'h1'), { tag: 'h1', role: undefined, ariaLevel: undefined });
  assert.deepEqual(headingElement(3, 'div'), { tag: 'div', role: 'heading', ariaLevel: 3 });
  assert.deepEqual(headingElement('h9'), { tag: 'h1', role: undefined, ariaLevel: undefined });
});

test('headingText: the text prop wins; string and number children are joined; elements are dropped', () => {
  assert.equal(headingText('A', 'B'), 'A');
  assert.equal(headingText(undefined, 'Hello'), 'Hello');
  assert.equal(headingText(undefined, ['Chapter ', 3, ['.', ' ', 'Light']]), 'Chapter 3. Light');
  assert.equal(headingText(undefined, [{ type: 'b' }, 'x']), 'x');
  assert.equal(headingText(0, 'x'), '0');
});

test('the pure entry point exports the heading half', () => {
  for (const k of ['headingLevel', 'headingCss', 'headingFontPx', 'headingSize', 'headingPitch', 'headingLights', 'headingElement', 'headingText']) assert.equal(typeof pure[k], 'function', k);
  assert.equal(pure.HEADING, HEADING);
});

test('SettleHeading: exported from settle-text/react, built on SettleText, never mounting settle-see itself', () => {
  assert.match(read('react/index.js'), /export \{ SettleHeading \} from '\.\/SettleHeading\.jsx';/);
  const src = read('react/SettleHeading.jsx');
  assert.match(src, /import \{ SettleText \} from '\.\/SettleText\.jsx';/);
  assert.doesNotMatch(src, /<Settle\b/);
  assert.doesNotMatch(src, /from 'settle-see/);
});

test('SettleHeading: a real heading element with the words as its accessible name, the canvas left to SettleText', () => {
  const src = read('react/SettleHeading.jsx');
  assert.match(src, /headingElement\(n, as\)/, 'the element comes from the level, or `as` with role and level');
  assert.match(src, /role=\{role\}/);
  assert.match(src, /aria-level=\{ariaLevel\}/);
  assert.match(src, /label=\{label \?\? words\}/, 'the hidden span carries the words');
  assert.match(src, /aria-hidden=\{decorative \|\| undefined\}/, 'a decorative heading leaves the outline whole');
});

test('SettleHeading: the size is CSS, read back as px; the plain words stand in before the first measurement', () => {
  const src = read('react/SettleHeading.jsx');
  assert.match(src, /fontSize: headingSize\(size, n\)/);
  assert.match(src, /getComputedStyle\(el\)\.fontSize/);
  assert.match(src, /new ResizeObserver\(read\)/);
  assert.match(src, /\{live \? \([\s\S]*<SettleText[\s\S]*\) : \(\s*words\s*\)\}/, 'plain words until measured');
  assert.match(src, /headingPitch\(px\)/, 'the lights follow the measured size');
});

test('SettleHeading: wraps by default and passes the transition through, so a new text morphs', () => {
  const src = read('react/SettleHeading.jsx');
  assert.match(src, /wrap = true,/);
  assert.match(src, /\{\.\.\.rest\}/, 'every other SettleText prop (transition, duration, color, align ...) passes through');
  assert.doesNotMatch(src.match(/export function SettleHeading\(\{([\s\S]*?)\}\)/)[1], /\btransition\b|\bduration\b/, 'not swallowed by the heading');
});
