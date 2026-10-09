// settle-text · hover and width "fit": the re-settle a pointer or focus gives the lights (how strong, how often, where
// it listens), the one-line width of a text, and SettleLink, the link built from both. The React half is read as
// source (react is a peer and node has no DOM); the demo exercises it in a browser.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { HOVER, hoverLevelOf, createHoverGate } from '../src/hover.js';
import { fitWidth, textGrid, TEXT } from '../src/index.js';

const ROOT = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const propsOf = (src, name) => src.match(new RegExp(`export function ${name}\\(\\{([\\s\\S]*?)\\}\\)`))[1];

test('hoverLevelOf: true is 0.6, a number is clamped to 0..1, anything else is off', () => {
  assert.equal(hoverLevelOf(true), 0.6);
  assert.equal(hoverLevelOf(0.3), 0.3);
  assert.equal(hoverLevelOf(4), 1);
  for (const off of [false, 0, -1, undefined, null, 'yes', NaN]) assert.equal(hoverLevelOf(off), 0, String(off));
});

test('the hover gate lets one wake through per 250 ms, and the next one after the gap', () => {
  const gate = createHoverGate(HOVER.gapMs);
  assert.equal(gate(1000), true);
  assert.equal(gate(1100), false);
  assert.equal(gate(1249), false);
  assert.equal(gate(1250), true);
  assert.equal(gate(1251), false);
});

test('the hover listens on links, buttons, summaries and labels, and a link\'s own hover is 0.7', () => {
  for (const sel of ['a[href]', 'button', '[role=button]', '[role=link]', 'summary', 'label']) assert.ok(HOVER.hosts.split(', ').includes(sel), sel);
  assert.equal(HOVER.link, 0.7);
});

test('fitWidth: the grid it makes draws one line at full size, for many sizes, ratios and both scripts', () => {
  for (const size of [14, 18, 24, 32, 56, 92]) {
    for (const ratio of [0.4, 1.3, 2.1, 5.7, 11]) {
      for (const text of ['Docs', '設定']) {
        const pitch = size / 20;
        const W = fitWidth(text, { ratio, size, pitch });
        const g = textGrid({ text, size, pitch, width: W });
        const glyph = g.wide ? TEXT.wide.glyph : TEXT.glyph;
        const need = ratio * Math.round(g.LH * glyph);
        assert.ok(g.innerW * 0.98 >= need - 1e-9, `${text} ${size}px ratio ${ratio}: ${g.innerW * 0.98} >= ${need}`);
        // and not much wider than it needs: within two lights and the one CSS px the width is rounded up to
        // (more lights than two when a light is under a px), textGrid's floor of 8 inner lights aside
        if (g.cols > 2 * g.MX + 8) assert.ok(g.innerW * 0.98 - need < 2 + 1 / g.P + 1e-9, `${text} ${size}px ratio ${ratio}: slack ${g.innerW * 0.98 - need}`);
      }
    }
  }
});

test('Lights: hover is off by default, read through hoverLevelOf, zero when frozen, on pointerenter and focusin of the enclosing control', () => {
  const src = read('react/Lights.jsx');
  assert.match(propsOf(src, 'Lights'), /hover = false,/);
  assert.match(src, /const hoverLevel = frozen \? 0 : hoverLevelOf\(hover\);/, 'nothing under reduced motion or still');
  assert.match(src, /closest\(HOVER\.hosts\)\) \|\| el;/, 'the enclosing link or button, else the box');
  assert.match(src, /addEventListener\('pointerenter', wake\)/);
  assert.match(src, /addEventListener\('focusin', wake\)/, 'keyboard focus wakes it too');
  assert.match(src, /removeEventListener\('focusin', wake\)/, 'and both are removed');
  assert.match(src, /if \(gate\(nowMs\(\)\)\) kick\(hoverLevel\);/, 'the same heat kick as a breath, gated');
});

test('every drawing component takes hover and hands it to Lights; SettleHeading and SettleSequence pass it through to SettleText', () => {
  for (const [file, name] of [['react/SettleText.jsx', 'SettleText'], ['react/SettleImage.jsx', 'SettleImage'], ['react/SettleVector.jsx', 'SettleVector']]) {
    const src = read(file);
    assert.match(propsOf(src, name), /hover = false,/, `${name} declares hover, off`);
    assert.match(src, /hover=\{hover\}/, `${name} hands it on`);
  }
  assert.match(read('react/SettleHeading.jsx'), /\{\.\.\.rest\}/);
  assert.match(read('react/SettleSequence.jsx'), /\{\.\.\.text\}/);
});

test('SettleText width="fit": one line, measured in the face and again when the font loads', () => {
  const src = read('react/SettleText.jsx');
  assert.match(src, /const fit = width === 'fit';/);
  assert.match(src, /fitWidth\(text, \{ ratio: measureRatio\(text, family, w\), size, pitch: P \}\)/);
  assert.match(src, /\[fit, text, family, w, size, P, fontTick\]/, 're-measured on the font tick');
  assert.match(src, /if \(fit\) wrap = false;/);
});

test('SettleLink: an <a class="settle-link"> holding one SettleText, hover 0.7, width fit, no wrap, named by its words', () => {
  assert.match(read('react/index.js'), /export \{ SettleLink \} from '\.\/SettleLink\.jsx';/);
  const src = read('react/SettleLink.jsx');
  const props = propsOf(src, 'SettleLink');
  assert.match(props, /hover = HOVER\.link,/);
  assert.match(props, /width = 'fit',/);
  assert.match(props, /wrap = false,/);
  for (const p of ['target', 'rel', 'onClick', 'id', 'title', 'download', "'aria-current': ariaCurrent", 'className', 'style']) assert.ok(props.includes(p), p);
  assert.match(src, /<a\s[\s\S]*href=\{href\}[\s\S]*className=\{`settle-link/);
  assert.match(src, /<SettleText defaultColor=\{PALETTE\.link\} \{\.\.\.rest\} text=\{text\} size=\{size\} width=\{width\} wrap=\{wrap\} hover=\{hover\} \/>/, 'the link colour is THE PALETTE\'s, and a caller\'s color still wins (it rides in rest, after it)');
  assert.doesNotMatch(src, /aria-label/, 'the name comes from the words (SettleText\'s hidden span), never a second copy');
  assert.match(src, /target === '_blank' \? 'noopener noreferrer'/, 'a new tab does not get a handle on this page');
});
