// settle-text · THE AMBIENT SHIMMER (src/ambient.js, react/ambient.js, 0.5.0): the range of effects, the presets and
// the prop's forms, THE DECK RULE's one-in-ten re-settle, each piece's own phase and period, the effects' limits
// (WCAG 2.3.1: no light flashes more than three times a second), the conductor's shimmer cap, and still, reduced
// motion and off screen meaning none.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { deckRng } from 'settle-see';
import {
  AMBIENT, AMBIENT_LIMITS, AMBIENT_EFFECTS, AMBIENT_NAMES, AMBIENT_PRESETS, AMBIENT_DEFAULT_PRESET, ambientOf, ambientPeriod,
  shimmerDelay, deckWeights, createAmbientDeck, wordBoxes, createShimmer, createConductor,
} from '../src/index.js';
import { resettleMode } from '../react/ambient.js';

const ROOT = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

// a text target: two lines, three words on the first and two on the second, on a 60 x 16 grid
function target() {
  const w = 60;
  const h = 16;
  const t = new Int8Array(w * h).fill(-1);
  const box = (x0, x1, y0, y1) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) t[y * w + x] = 1;
  };
  box(2, 12, 2, 6);
  box(17, 30, 2, 6);
  box(35, 50, 2, 6);
  box(2, 20, 9, 13);
  box(26, 44, 9, 13);
  return { w, h, t };
}

// a field that records what an effect does to it
function fakeField(w, h, t) {
  const s = Int8Array.from(t);
  const flashes = [];
  const F = { w, h, n: w * h, s, target: t, lean: 1.1, flashes, leans: null, lent: 0, flash(lights, a) { for (const i of lights) flashes.push({ i, a }); } };
  F.setLeans = (a) => {
    F.leans = a ? Float32Array.from(a) : null;
    if (a) F.lent++;
  };
  return F;
}

test('THE RANGE: 13 named effects, faintest first and the full re-settle last, each with a line, a default strength and a length', () => {
  assert.ok(AMBIENT_EFFECTS.length >= 12, `${AMBIENT_EFFECTS.length}`);
  assert.equal(new Set(AMBIENT_NAMES).size, AMBIENT_NAMES.length, 'names are unique');
  assert.equal(AMBIENT_NAMES.at(-1), 'resettle', 'the boldest is the full re-settle');
  assert.deepEqual(AMBIENT_NAMES.slice(0, 3), ['twinkle', 'glint', 'ripple'], 'the faintest come first');
  for (const e of AMBIENT_EFFECTS) {
    assert.match(e.name, /^[a-z]+$/);
    assert.ok(e.line.length > 20 && e.line.endsWith('.'), e.name);
    assert.ok(!/[–—]/.test(e.line), `${e.name}: no dashes`);
    assert.ok(e.strength > 0 && e.strength <= 1, e.name);
    assert.ok(e.ms >= 800 && e.ms <= 3500, e.name);
    assert.ok(['flash', 'weather', 'scatter', 'resettle'].includes(e.kind), e.name);
  }
  assert.ok(Object.isFrozen(AMBIENT_EFFECTS) && Object.isFrozen(AMBIENT_EFFECTS[0]), 'the list is read-only');
});

test('THE PRESETS: whisper, gentle (the default) and lively, each naming effects from the range; gentle leans subtle', () => {
  assert.deepEqual(Object.keys(AMBIENT_PRESETS), ['whisper', 'gentle', 'lively']);
  assert.equal(AMBIENT_DEFAULT_PRESET, 'gentle');
  for (const [name, p] of Object.entries(AMBIENT_PRESETS)) {
    for (const e of p.effects) assert.ok(AMBIENT_NAMES.includes(e) && e !== 'resettle', `${name}: ${e}`);
    assert.ok(p.resettleShare > 0 && p.resettleShare <= 0.15, name);
  }
  assert.ok(AMBIENT_PRESETS.whisper.everyMs > AMBIENT_PRESETS.gentle.everyMs && AMBIENT_PRESETS.gentle.everyMs > AMBIENT_PRESETS.lively.everyMs);
  assert.equal(AMBIENT_PRESETS.gentle.resettleShare, 0.1, 'a full re-settle about 1 in 10');
  // most of the default's cards are the faint half of the range
  const faint = AMBIENT_NAMES.slice(0, 6);
  assert.ok(AMBIENT_PRESETS.gentle.effects.filter((e) => faint.includes(e)).length >= 6);
});

test('ambientOf: true and nothing are gentle; false, null, 0, "off" are none; a preset, an effect name, a list, an object', () => {
  const g = ambientOf(true);
  assert.equal(g.preset, 'gentle');
  assert.deepEqual(ambientOf(undefined), g);
  for (const off of [false, null, 0, 'off', 'none']) assert.equal(ambientOf(off), null, String(off));
  assert.equal(ambientOf('whisper').preset, 'whisper');
  assert.equal(ambientOf('lively').effects.length, 12, 'lively deals every small effect');
  const one = ambientOf('glint');
  assert.deepEqual(one.effects, ['glint']);
  assert.equal(one.resettleShare, 0, 'one named effect deals only that effect');
  const only = ambientOf('resettle');
  assert.deepEqual(only.effects, []);
  assert.equal(only.resettleShare, 1);
  const list = ambientOf(['tilt', 'glint', 'nonsense']);
  assert.deepEqual(list.effects, ['glint', 'tilt'], 'unknown names are dropped and the order is the range\'s');
  assert.equal(list.resettleShare, 0);
  assert.equal(ambientOf(['glint', 'resettle']).resettleShare, AMBIENT.resettleShare);
  const o = ambientOf({ preset: 'whisper', every: 2000, jitter: 0.2, resettleShare: 0.2, strength: 0.5 });
  assert.equal(o.everyMs, 2000);
  assert.equal(o.jitter, 0.2);
  assert.equal(o.resettleShare, 0.2);
  assert.ok(Math.abs(o.strength.glint - 0.25) < 1e-12, 'a number scales every default strength');
  assert.equal(ambientOf({ effects: ['glint'], strength: { glint: 0.9 } }).strength.glint, 0.9, 'an object sets one');
  assert.equal(ambientOf({ effects: ['glint'], every: 2400 }).resettleShare, 0, 'an object\'s list deals no re-settle unless it names one');
  assert.equal(ambientOf({ effects: ['glint', 'resettle'] }).resettleShare, AMBIENT.resettleShare);
  assert.equal(ambientOf({ effects: ['resettle'] }).resettleShare, 1, 'a list of the re-settle alone deals only re-settles');
  assert.equal(ambientOf({ effects: ['glint'], resettleShare: 0.3 }).resettleShare, 0.3, 'an explicit share still wins');
  assert.equal(ambientOf({ every: 10 }).everyMs, AMBIENT.minGapMs, 'never closer than the shortest gap');
  const r = ambientOf({ every: [2000, 4000] });
  assert.equal(r.everyMs, 3000);
  assert.ok(Math.abs(r.jitter - 1 / 3) < 1e-12);
});

test('the re-settle\'s part: a clock the caller set leaves the deck to the small effects; resettle={false} takes it out', () => {
  assert.equal(ambientOf(true, { resettle: 'clock' }).resettleShare, 0);
  assert.equal(ambientOf(true, { resettle: false }).resettleShare, 0);
  assert.equal(ambientOf('resettle', { resettle: false }), null, 'nothing left to deal');
  assert.equal(resettleMode(undefined), 'deck');
  assert.equal(resettleMode(true), 'deck');
  assert.equal(resettleMode({ level: 0.7 }), 'deck', 'a strength without an interval is still dealt from the deck');
  for (const c of [4000, { every: 5000 }, { every: [3000, 5000] }, () => 1000]) assert.equal(resettleMode(c), 'clock');
  assert.equal(resettleMode(undefined, 3), 'clock', '0.3.0\'s breathe interval is a clock too');
  for (const off of [false, null, 0, 'off']) assert.equal(resettleMode(off), false);
});

test('THE DECK RULE: about 1 card in 10 is the full re-settle, exactly so in every round, never twice in a row', () => {
  const spec = ambientOf(true);
  const { items, weights } = deckWeights(spec.effects, spec.resettleShare);
  const round = weights.reduce((a, b) => a + b, 0);
  const share = weights[items.indexOf('resettle')] / round;
  assert.ok(Math.abs(share - 0.1) < 0.005, `${share}`);
  const deck = createAmbientDeck(spec, deckRng(7));
  let resettles = 0;
  let prev = null;
  const N = round * 10;
  for (let i = 0; i < N; i++) {
    const c = deck.next();
    if (c === 'resettle') {
      resettles++;
      assert.notEqual(prev, 'resettle', 'never two re-settles in a row');
    }
    prev = c;
  }
  assert.ok(Math.abs(resettles / N - 0.1) < 0.005, `${resettles} of ${N}`);
  // a list without the re-settle deals none; a deck of one effect deals that effect every time
  const d2 = createAmbientDeck(ambientOf('glint'), deckRng(3));
  for (let i = 0; i < 20; i++) assert.equal(d2.next(), 'glint');
});

test('EACH PIECE ITS OWN SCHEDULE: its own period (0.75 to 1.25 of the gap) and its own phase, so no two move together', () => {
  const spec = ambientOf(true);
  const rnd = deckRng(11);
  const pieces = Array.from({ length: 24 }, () => {
    const period = ambientPeriod(spec, rnd);
    return { period, first: shimmerDelay(spec, rnd, 0, period) };
  });
  for (const p of pieces) {
    assert.ok(p.period >= spec.everyMs * 0.75 && p.period <= spec.everyMs * 1.25);
    assert.ok(p.first >= AMBIENT.minGapMs / 2 && p.first <= p.period);
  }
  assert.equal(new Set(pieces.map((p) => p.first.toFixed(3))).size, 24, 'every piece starts at its own moment');
  assert.equal(new Set(pieces.map((p) => p.period.toFixed(3))).size, 24, 'and keeps its own period');
  const firsts = pieces.map((p) => p.first).sort((a, b) => a - b);
  assert.ok(firsts.at(-1) - firsts[0] > spec.everyMs * 0.5, 'the first shimmers spread over most of a period');
  // later gaps: the period +/- jitter, never under the shortest gap
  for (let n = 1; n < 200; n++) assert.ok(shimmerDelay(spec, rnd, n, 1000) >= AMBIENT.minGapMs);
});

test('wordBoxes finds the words of a text target, line by line', () => {
  const { w, h, t } = target();
  const boxes = wordBoxes(t, w, h);
  assert.equal(boxes.length, 5);
  assert.deepEqual(boxes[0], { x0: 2, x1: 12, y0: 2, y1: 6 });
  assert.deepEqual(boxes[4], { x0: 26, x1: 44, y0: 9, y1: 13 });
});

test('every small effect does something visible, and each lights a light at most once, inside the limits', () => {
  const { w, h, t } = target();
  for (const name of AMBIENT_NAMES.filter((n) => n !== 'resettle')) {
    const F = fakeField(w, h, t);
    const fx = createShimmer(name, { w, h, target: t, rnd: deckRng(5) });
    assert.equal(fx.name, name);
    let moved = 0;
    for (let f = 0; f <= 30; f++) {
      const u = f / 30;
      const wx = fx.weather(u);
      if (wx) {
        if (wx.heat !== undefined) assert.ok(wx.heat >= AMBIENT_LIMITS.heat[0] && wx.heat <= AMBIENT_LIMITS.heat[1], `${name} heat ${wx.heat}`);
        if (wx.lean !== undefined) assert.ok(wx.lean >= AMBIENT_LIMITS.lean[0] && wx.lean <= 1, `${name} lean`);
        if (wx.soften !== undefined) assert.ok(wx.soften <= AMBIENT_LIMITS.soften[1], `${name} soften`);
        if ((wx.heat ?? 1) > 1.05 || (wx.lean ?? 1) < 0.95 || (wx.soften ?? 0.55) > 0.6) moved++;
      }
      fx.step(F, u);
    }
    const lit = new Set(F.flashes.map((x) => x.i));
    assert.equal(lit.size, F.flashes.length, `${name}: no light flashed twice in one shimmer`);
    for (const x of F.flashes) assert.ok(x.a > 0 && x.a <= AMBIENT_LIMITS.flash, `${name}: flash ${x.a}`);
    assert.ok(F.flashes.length > 0 || moved > 0 || F.lent > 0, `${name} must show`);
    if (fx.kind === 'flash') assert.ok(F.flashes.length > 0, `${name} flashes`);
    if (fx.kind === 'weather') assert.ok(moved > 0, `${name} moves a knob`);
    if (fx.kind === 'scatter') {
      assert.ok(F.lent > 5, `${name} melts its region for several frames`);
      assert.equal(F.leans, null, `${name} hands the leans back when it ends`);
    }
  }
});

test('glint sweeps left to right; word melts one word only; line one line only; the leans always come back', () => {
  const { w, h, t } = target();
  const F = fakeField(w, h, t);
  const g = createShimmer('glint', { w, h, target: t });
  const means = [];
  for (let f = 0; f <= 20; f++) {
    const before = F.flashes.length;
    g.step(F, f / 20);
    const now = F.flashes.slice(before).map((x) => x.i % w);
    if (now.length) means.push(now.reduce((a, b) => a + b, 0) / now.length);
  }
  assert.ok(means.length >= 5);
  for (let i = 1; i < means.length; i++) assert.ok(means[i] >= means[i - 1] - 1, 'the band moves rightwards');
  const boxes = wordBoxes(t, w, h);
  // the melted lights: those whose lean is not the plain lean * target at the hold
  const melted = (F) => [...F.leans.keys()].filter((i) => Math.abs(F.leans[i] - F.lean * t[i]) > 1e-6);
  const W = fakeField(w, h, t);
  const wd = createShimmer('word', { w, h, target: t, rnd: deckRng(9) });
  wd.step(W, 0);
  wd.step(W, 0.3);
  const m = melted(W);
  assert.ok(m.length > 0);
  for (const i of m) {
    const k = W.leans[i] / (W.lean * t[i]);
    assert.ok(k >= 0 && k < 0.3, 'at the hold a melted light barely leans toward the words, so it scatters (and never inverts)');
  }
  const inside = boxes.filter((b) => m.every((i) => { const x = i % w; const y = (i - x) / w; return x >= b.x0 - 1 && x <= b.x1 + 1 && y >= b.y0 - 1 && y <= b.y1 + 1; }));
  assert.equal(inside.length, 1, 'every melted light sits in one word and its one-light margin');
  wd.step(W, 0.95);
  assert.equal(W.leans, null, 'back to the plain leans by the end');
  const L = fakeField(w, h, t);
  const ln = createShimmer('line', { w, h, target: t, rnd: deckRng(4) });
  ln.step(L, 0.3);
  const rows = new Set(melted(L).map((i) => Math.floor(i / w)));
  assert.ok([...rows].every((y) => y >= 1 && y <= 7) || [...rows].every((y) => y >= 8 && y <= 14), 'one line');
  // a dropped effect hands the leans back too
  const D = fakeField(w, h, t);
  const dr = createShimmer('flurry', { w, h, target: t, rnd: deckRng(2) });
  dr.step(D, 0.2);
  assert.ok(D.leans);
  dr.end(D);
  assert.equal(D.leans, null);
});

test('WCAG 2.3.1: over a minute of shimmers on one piece, no light flashes more than 3 times in any second', () => {
  const { w, h, t } = target();
  const spec = ambientOf('lively');
  const rnd = deckRng(21);
  const deck = createAmbientDeck(spec, rnd);
  const period = ambientPeriod(spec, rnd);
  const onsets = new Map();
  let clock = shimmerDelay(spec, rnd, 0, period);
  let n = 0;
  const fps = 24;
  while (clock < 60000) {
    const card = deck.next();
    if (card === 'resettle') {
      clock += 3200 + shimmerDelay(spec, rnd, ++n, period);
      continue;
    }
    const fx = createShimmer(card, { w, h, target: t, strength: 1, rnd });
    const F = fakeField(w, h, t);
    const frames = Math.ceil((fx.ms / 1000) * fps);
    for (let f = 0; f <= frames; f++) {
      const before = F.flashes.length;
      fx.step(F, f / frames);
      for (const x of F.flashes.slice(before)) {
        if (!onsets.has(x.i)) onsets.set(x.i, []);
        onsets.get(x.i).push(clock + (f / fps) * 1000);
      }
    }
    clock += fx.ms + shimmerDelay(spec, rnd, ++n, period);
  }
  assert.ok(onsets.size > 0);
  let worst = 0;
  for (const times of onsets.values()) {
    for (let i = 0; i < times.length; i++) {
      let k = 0;
      for (let j = i; j < times.length && times[j] - times[i] < 1000; j++) k++;
      worst = Math.max(worst, k);
    }
  }
  assert.ok(worst <= AMBIENT_LIMITS.flashesPerSecond, `a light flashed ${worst} times in a second`);
  assert.ok(worst <= 1, 'in fact once at most: each light once a shimmer and 1.2 s or more between shimmers');
});

test('THE CROWD: the conductor runs at most 6 shimmers at once; the rest wait their turn, and the tally counts them', () => {
  const C = createConductor({ maxShimmers: AMBIENT.maxConcurrent });
  assert.equal(C.maxShimmers, 6);
  for (let i = 1; i <= 6; i++) assert.equal(C.tryShimmer(i, 0, 1000), true);
  assert.equal(C.tryShimmer(7, 10, 1000), false, 'the seventh waits');
  assert.equal(C.shimmering(10), 6);
  assert.equal(C.tryShimmer(7, 1001, 1000), true, 'its turn comes when one ends');
  C.join(3, 1);
  C.leave(3);
  assert.equal(C.shimmering(1001), 1, 'leaving the page frees its slot');
  assert.equal(C.tryShimmer(7, 1002, 500), false, 'one piece runs one shimmer at a time');
  C.note('glint');
  C.note('resettle');
  C.note('glint', true);
  const s = C.stats();
  assert.equal(s.dealt, 2);
  assert.equal(s.resettles, 1);
  assert.equal(s.deferred, 1);
  assert.equal(s.byName.glint, 1);
  assert.ok(s.peak >= 6);
  C.setShimmerMax(2);
  assert.equal(C.maxShimmers, 2);
  // the re-settle cap is its own channel
  assert.equal(C.tryStart(1, 0, 100), true);
});

test('still, reduced motion and off screen mean no shimmer; a hidden tab skips its turn (Lights and useAmbient)', () => {
  const lights = read('react/Lights.jsx');
  assert.match(lights, /ambient: frozen \? false : ambientProp/, 'still and reduced motion (frozen) hand the hook no shimmer');
  assert.match(lights, /active: !frozen && !paused && onScreen && !!spec/, 'off screen and paused stop the clock');
  assert.match(lights, /weather=\{amb\.weather\}/);
  assert.match(lights, /beforeStep=\{amb\.beforeStep\}/);
  assert.match(lights, /const sched = !legacy \|\| \(amb\.spec && rMode !== 'clock'\) \? null : resettleSpec;/, 'the 0.4.0 clock steps aside for the deck, and for the haze (0.6.0)');
  const hook = read('react/ambient.js');
  assert.match(hook, /if \(!spec \|\| !active\) return undefined;/);
  assert.match(hook, /document\.hidden\) return plan\(/, 'a hidden tab skips its turn');
  assert.match(hook, /CONDUCTOR\.tryShimmer\(id, now, fx\.ms\)/, 'every small shimmer asks the page first');
  assert.match(hook, /deck\.putBack\(card\)/, 'a card that must wait goes back on top of its deck');
  assert.equal(ambientOf(false), null);
});
