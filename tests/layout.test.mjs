// settle-text · the grid, the wrap and the drawing spec (src/layout.js): pure, so node holds every rule.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wideScript, lightsPerBox, textGrid, wrapLines, textSpec, TEXT } from '../src/index.js';

// a canvas context that records what it was asked to draw; a glyph is 0.6 of the font size wide
function fakeCtx() {
  const calls = { fonts: [], fills: [] };
  const c = {
    textAlign: 'start',
    textBaseline: 'alphabetic',
    font: '',
    measureText(t) {
      const px = +/(\d+)px/.exec(this.font)[1];
      return { width: t.length * px * 0.6 };
    },
    fillText(t, x, y) {
      calls.fills.push({ t, x, y, font: this.font, align: this.textAlign });
    },
  };
  return new Proxy(c, {
    set(o, k, v) {
      if (k === 'font') calls.fonts.push(v);
      o[k] = v;
      return true;
    },
    get: (o, k) => (k === 'calls' ? calls : o[k]),
  });
}

test('THE GRID: the letter box is 1.25 em, the pitch divides it into lights, the margins and lines add rows', () => {
  // a 72 px title at the site's own 3.75 px pitch: box 90 px, 24 lights, the measured TITLE tuning
  const g = textGrid({ text: 'KANERVA', size: 72, pitch: 3.75, width: 600 });
  assert.equal(g.LH, 24);
  assert.ok(Math.abs(g.P - 3.75) < 1e-9, 'the pitch is kept exactly when the lights divide the box');
  assert.equal(g.MX, 1);
  assert.equal(g.MY, 1);
  assert.equal(g.cols, Math.floor(600 / 3.75));
  assert.equal(g.rows, 24 + 2);
  assert.equal(g.innerW, g.cols - 2);
  assert.ok(Math.abs(g.cssH - g.rows * g.P) < 1e-9);
  assert.equal(g.fontPx, Math.round(24 * TEXT.glyph));
  // a second line adds one line step, 0.85 of the box
  const two = textGrid({ text: 'KANERVA', size: 72, pitch: 3.75, width: 600, lines: 2 });
  assert.equal(two.rows, g.rows + Math.round(24 * TEXT.lineStep));
  assert.equal(two.LS, Math.round(24 * 0.85));
});

test('the light bounds: a tiny pitch cannot ask for more than the maximum, a huge pitch not fewer than the minimum', () => {
  assert.equal(lightsPerBox(72, 0.1, 'A'), TEXT.lights.max);
  assert.equal(lightsPerBox(72, 100, 'A'), TEXT.lights.min);
  // in between it is the box over the pitch
  assert.equal(lightsPerBox(72, 3.75, 'A'), 24);
  assert.equal(lightsPerBox(64, 3.2, 'A'), 25);
});

test('A WIDE SCRIPT takes 1.6 times the lights a box and a smaller glyph; Latin does not', () => {
  assert.equal(wideScript('KANERVA'), false);
  assert.equal(wideScript('定める'), true, 'kana and Han');
  assert.equal(wideScript('सेटल'), true, 'Devanagari');
  assert.equal(wideScript('中文'), true);
  const latin = textGrid({ text: 'SETTLE', size: 72, pitch: 3.75, width: 600 });
  const wide = textGrid({ text: '定める', size: 72, pitch: 3.75, width: 600 });
  assert.equal(wide.LH, Math.round(24 * 1.6));
  assert.ok(wide.P < latin.P, 'more lights in the same box means a finer pitch');
  assert.equal(wide.wide, true);
  assert.equal(wide.fontPx, Math.round(wide.LH * TEXT.wide.glyph));
});

test('a grid with no width still has a usable minimum (the margins plus eight lights), never zero columns', () => {
  const g = textGrid({ text: 'x', size: 40, pitch: 4, width: 0 });
  assert.equal(g.cols, 2 * g.MX + 8);
  assert.ok(g.rows > 0);
});

test('WRAP: breaks at spaces and after a hyphen inside a word; a piece wider than a line stands alone; one word never splits', () => {
  const ratio = (w) => 0.5 * w.length;
  // fontPx 10 -> a glyph is 5 wide; a line of 40 holds eight glyphs
  assert.deepEqual(wrapLines('one two three', { ratio, fontPx: 10, maxW: 40 }), ['one two', 'three']);
  assert.deepEqual(wrapLines('campagne-grootboek nu', { ratio, fontPx: 10, maxW: 50 }), ['campagne-', 'grootboek', 'nu']);
  assert.deepEqual(wrapLines('extraordinarily', { ratio, fontPx: 10, maxW: 20 }), ['extraordinarily'], 'a word wider than the line is not cut');
  assert.deepEqual(wrapLines('', { ratio, fontPx: 10, maxW: 20 }), ['']);
  assert.deepEqual(wrapLines('  a   b  ', { ratio, fontPx: 10, maxW: 400 }), ['a b'], 'runs of spaces are one space');
  // a hyphen at the end of a word does not open a break on nothing
  assert.deepEqual(wrapLines('well- made', { ratio, fontPx: 10, maxW: 400 }), ['well- made']);
});

test('THE SPEC draws every line at ONE font size, the largest at which the widest line fits, in the font and weight asked for', () => {
  const grid = textGrid({ text: 'What is a settle', size: 48, pitch: 3, width: 300, lines: 2 });
  const spec = textSpec('What is a settle', { grid, lines: ['What is', 'a settle'], align: 'left', font: '"Space Grotesk", sans-serif', weight: 700 });
  assert.equal(spec.text, 'What is a settle');
  assert.deepEqual(spec.lines, ['What is', 'a settle']);
  const c = fakeCtx();
  spec.draw(c);
  assert.equal(c.calls.fills.length, 2, 'two lines, two fills');
  const sizes = new Set(c.calls.fills.map((f) => +/(\d+)px/.exec(f.font)[1]));
  assert.equal(sizes.size, 1, 'one font size for both lines');
  for (const f of c.calls.fills) {
    assert.ok(f.font.startsWith('700 ') && f.font.endsWith('"Space Grotesk", sans-serif'), f.font);
    assert.equal(f.align, 'left');
  }
  // the lines sit one line step apart, inside the top margin
  assert.ok(Math.abs(c.calls.fills[1].y - c.calls.fills[0].y - grid.LS) < 1e-9);
  assert.equal(c.calls.fills[0].x, grid.MX);
  // the fitted size never exceeds the glyph fraction of the box
  const px = [...sizes][0];
  assert.ok(px <= Math.round(grid.LH * TEXT.glyph));
  // and a long line shrinks until it fits 0.98 of the inner width
  assert.ok(Math.max(...c.calls.fills.map((f) => f.t.length * px * 0.6)) <= grid.innerW * 0.98 + 1e-9);
});

test('align: centre draws at the middle column, right at the right margin', () => {
  const grid = textGrid({ text: 'Hi', size: 48, pitch: 3, width: 300 });
  const mid = fakeCtx();
  textSpec('Hi', { grid, align: 'center' }).draw(mid);
  assert.equal(mid.calls.fills[0].x, grid.cols / 2);
  assert.equal(mid.calls.fills[0].align, 'center');
  const right = fakeCtx();
  textSpec('Hi', { grid, align: 'right' }).draw(right);
  assert.equal(right.calls.fills[0].x, grid.cols - grid.MX);
});
