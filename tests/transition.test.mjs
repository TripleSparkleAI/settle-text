// settle-text · transition and sequence (lane DOCKWORDS, 2026-10-04): a change of words is a morph by default
// (settle-see's own morph, wrapped), a cut on request, and SettleSequence steps through a list on a clock a test can
// drive. The clock tests use a fake timer: no real waiting.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { TRANSITION, SEQUENCE, transitionOf, morphHow, intervalFor, sequenceAt, createSequencer } from '../src/index.js';

const ROOT = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const strip = (t) => t.replace(/^\s*\/\/.*$/gm, '');

// a fake clock: setTimer queues, tick(ms) moves time and fires what is due, in order
function fakeClock() {
  let t = 0;
  let next = 1;
  const q = new Map();
  return {
    now: () => t,
    setTimer: (f, ms) => { const id = next++; q.set(id, { at: t + ms, f }); return id; },
    clearTimer: (id) => q.delete(id),
    tick(ms) {
      const end = t + ms;
      for (;;) {
        let best = null;
        for (const [id, x] of q) if (x.at <= end && (!best || x.at < best[1].at)) best = [id, x];
        if (!best) break;
        q.delete(best[0]);
        t = best[1].at;
        best[1].f();
      }
      t = end;
    },
    get pending() { return q.size; },
  };
}

test('transitionOf: morph by default, cut on request, a duration split over the movie frames', () => {
  assert.deepEqual(transitionOf(), { kind: 'morph', durationMs: 1200, frames: 4, periodMs: 300, wake: TRANSITION.wake });
  assert.equal(transitionOf('cut').kind, 'cut');
  assert.equal(transitionOf(false).kind, 'cut');
  assert.equal(transitionOf('none').kind, 'cut');
  assert.equal(transitionOf({ kind: 'cut' }).kind, 'cut');
  assert.equal(transitionOf('morph', 2000).periodMs, 500, 'two seconds over four frames is settle-see\'s own default pace');
  assert.equal(transitionOf({ duration: 900, frames: 6 }).periodMs, 150);
  assert.equal(transitionOf('morph', 5).durationMs, 100, 'a duration is floored at 100 ms');
  assert.equal(transitionOf('morph', NaN).durationMs, 1200, 'a nonsense duration keeps the default');
  assert.deepEqual(morphHow(transitionOf()), { frames: 4, periodMs: 300 });
  assert.equal(morphHow(transitionOf('cut')), false);
});

test('intervalFor: a number, a list (the last repeated) or a function, never under 50 ms', () => {
  assert.equal(intervalFor(), SEQUENCE.intervalMs);
  assert.equal(intervalFor(800, 3), 800);
  assert.equal(intervalFor([100, 200], 0), 100);
  assert.equal(intervalFor([100, 200], 5), 200);
  assert.equal(intervalFor((i) => 1000 + i * 10, 2), 1020);
  assert.equal(intervalFor(1, 0), 50);
  assert.equal(intervalFor('x', 0), SEQUENCE.intervalMs);
});

test('sequenceAt: the item that shows after a given time, looping or once', () => {
  assert.deepEqual(sequenceAt(3, 0, { interval: 1000 }), { index: 0, lap: 0, done: false });
  assert.deepEqual(sequenceAt(3, 1000, { interval: 1000 }), { index: 1, lap: 0, done: false });
  assert.deepEqual(sequenceAt(3, 3500, { interval: 1000 }), { index: 0, lap: 1, done: false });
  assert.deepEqual(sequenceAt(3, 9999, { interval: 1000, loop: false }), { index: 2, lap: 0, done: true });
  assert.deepEqual(sequenceAt(0, 10), { index: -1, lap: 0, done: true });
});

test('a looping sequence steps on its interval, wraps, counts laps and fires onStep each move', () => {
  const c = fakeClock();
  const steps = [];
  const s = createSequencer({ count: 3, interval: 1000, loop: true, onStep: (x) => steps.push(x), ...c }).start();
  assert.equal(s.index, 0);
  c.tick(999);
  assert.equal(steps.length, 0, 'nothing before the first interval, and no onStep at start');
  c.tick(1);
  assert.deepEqual(steps, [{ index: 1, lap: 0 }]);
  c.tick(2000);
  assert.deepEqual(steps.slice(1), [{ index: 2, lap: 0 }, { index: 0, lap: 1 }], 'wraps to the first and counts a lap');
  assert.equal(s.done, false);
  s.stop();
  c.tick(10000);
  assert.equal(steps.length, 3, 'stop() stops');
  assert.equal(c.pending, 0);
});

test('a once sequence stops on its last item and fires onDone exactly once', () => {
  const c = fakeClock();
  const steps = [];
  let done = 0;
  const s = createSequencer({ count: 3, interval: [500, 700], loop: false, onStep: (x) => steps.push(x.index), onDone: () => done++, ...c }).start();
  c.tick(500);
  assert.deepEqual(steps, [1]);
  c.tick(699);
  assert.deepEqual(steps, [1], 'the second wait is the list\'s second entry');
  c.tick(1);
  assert.deepEqual(steps, [1, 2]);
  assert.equal(done, 1);
  assert.equal(s.done, true);
  c.tick(60000);
  assert.deepEqual(steps, [1, 2], 'it stays on the last item');
  assert.equal(done, 1);
  assert.equal(s.start(), s, 'start on a finished sequence does nothing');
  assert.equal(c.pending, 0);
});

test('pause keeps the time left on the current item; resume spends only that', () => {
  const c = fakeClock();
  const steps = [];
  const s = createSequencer({ count: 2, interval: 1000, onStep: (x) => steps.push(x.index), ...c }).start();
  c.tick(600);
  s.pause();
  c.tick(5000);
  assert.deepEqual(steps, [], 'nothing moves while paused (off screen, a hidden tab, the page\'s own pause)');
  s.resume();
  c.tick(399);
  assert.deepEqual(steps, []);
  c.tick(1);
  assert.deepEqual(steps, [1], 'the 400 ms left, not a fresh second');
  // resume on a never-started sequence starts it; one item never steps
  const one = createSequencer({ count: 1, interval: 10, onStep: () => steps.push('x'), ...c }).resume();
  c.tick(1000);
  assert.equal(one.running, false);
  assert.ok(!steps.includes('x'));
});

test('goto jumps and re-arms the clock', () => {
  const c = fakeClock();
  const steps = [];
  const s = createSequencer({ count: 4, interval: 1000, onStep: (x) => steps.push(x.index), ...c }).start();
  c.tick(500);
  s.goto(2);
  assert.equal(s.index, 2);
  c.tick(999);
  assert.deepEqual(steps, []);
  c.tick(1);
  assert.deepEqual(steps, [3]);
  s.goto(-1);
  assert.equal(s.index, 3, 'a negative index wraps');
});

test('WRAP, NEVER FORK: the morph is settle-see\'s, handed through <Settle morph>; a cut is settle-see\'s snapped show', () => {
  const lights = strip(read('react/Lights.jsx'));
  assert.match(lights, /import \{ Settle, toTarget \} from 'settle-see\/react';/);
  assert.match(lights, /morph=\{morphing \? \{ frames: transition\.frames, periodMs: transition\.periodMs \} : undefined\}/);
  assert.match(lights, /const morphing = !!\(transition && transition\.kind === 'morph' && sameGrid && !frozen\);/, 'a morph only on the same grid, never under reduced motion');
  assert.match(lights, /h\.show\(toTarget\(spec, cols, rows\), \{ snap: true \}\)/, 'a cut snaps the lights to the new words');
  assert.match(lights, /else kick\(transition\.wake \?\? 0\.3\);/, 'a morph wakes the resting field with a small heat');
  // no copy of the morph engine anywhere in the package
  const all = [...readdirSync(join(ROOT, 'src')).map((f) => read(`src/${f}`)), ...readdirSync(join(ROOT, 'react')).map((f) => read(`react/${f}`))].join('\n');
  for (const name of ['morphFrames', 'createMorph', 'createTrueTime', 'agreementOn']) assert.ok(!all.includes(name), `${name} is settle-see's`);
});

test('SettleText takes transition (morph default) and duration; SettleSequence is exported and uses the sequencer', () => {
  const text = strip(read('react/SettleText.jsx'));
  assert.match(text, /transition = 'morph',/);
  assert.match(text, /transitionOf\(transition, duration\)/);
  assert.match(text, /transition=\{tr\}/);
  assert.match(read('react/index.js'), /export \{ SettleSequence \} from '\.\/SettleSequence\.jsx';/);
  const seq = strip(read('react/SettleSequence.jsx'));
  assert.match(seq, /createSequencer\(\{/);
  assert.match(seq, /const run = onScreen && !hidden && !paused;/, 'paused off screen, in a hidden tab and on request');
  assert.match(seq, /if \(run\) s\.resume\(\);\s*else s\.pause\(\);/);
  assert.match(seq, /<SettleText defaultColor=\{PALETTE\.sequence\} \{\.\.\.text\} text=\{words\}/, 'each step is a SettleText text change, so its transition shows it');
  assert.doesNotMatch(seq, /aria-live/, 'a looping sequence never talks over the page');
});
