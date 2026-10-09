// settle-text · THE ACTIVE HAZE (src/haze.js, 0.6.0): the default rotation, every form of the haze prop, the plan
// that decides which clock a component runs, the random phase and the jitter, and the rotation itself on a fake
// clock: a hidden tab skips its turn, a full cap is asked again, stop() ends it. Then the wiring in Lights: the
// clock runs only on screen (the IntersectionObserver), never under reduced motion or still, and every component
// takes the prop.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { HAZE, hazeOf, hazePlan, hazeDelay, hazeLevel, createHazeClock } from '../src/index.js';

const ROOT = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

// a seeded random, so a statistical check is the same every run
const seeded = (seed = 7) => {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
};

// a fake clock: setTimer queues, advance(ms) runs everything due, in order
function fakeTimers() {
  let now = 0;
  let seq = 0;
  const q = new Map();
  return {
    setTimer: (f, ms) => {
      const id = ++seq;
      q.set(id, { at: now + ms, f });
      return id;
    },
    clearTimer: (id) => q.delete(id),
    advance(ms) {
      const end = now + ms;
      for (;;) {
        let next = null;
        for (const [id, t] of q) if (t.at <= end && (!next || t.at < next[1].at)) next = [id, t];
        if (!next) break;
        q.delete(next[0]);
        now = next[1].at;
        next[1].f();
      }
      now = end;
    },
    get pending() {
      return q.size;
    },
    get now() {
      return now;
    },
  };
}

test('THE DEFAULT is on: every 11.5 s +/- 30% (8 to 15 s), heated to 0.9 to 1 over 600 ms, cooled over 3 s', () => {
  const d = hazeOf(undefined);
  assert.deepEqual(d, { everyMs: 11500, jitter: 0.3, level: [0.9, 1], rampMs: 600, coolMs: 3000, kind: 'heat' });
  assert.deepEqual(hazeOf(true), d, 'true is the default');
  const lo = d.everyMs * (1 - d.jitter);
  const hi = d.everyMs * (1 + d.jitter);
  assert.ok(lo >= 8000 && hi <= 15000, `the rotation is ${lo} to ${hi} ms`);
  assert.equal(HAZE.everyMs, 11500);
});

test('hazeOf: false, null, 0, "off" and { on: false } are off; a number is an interval; an object sets every, jitter, level, ramp, cool and kind', () => {
  for (const off of [false, null, 0, 'off', 'none', { on: false }]) assert.equal(hazeOf(off), null, JSON.stringify(off));
  assert.equal(hazeOf(5000).everyMs, 5000);
  assert.equal(hazeOf(5000).jitter, HAZE.jitter, 'a number keeps the default jitter');
  assert.equal(hazeOf(100).everyMs, HAZE.minEveryMs, 'never faster than every 2 s');
  assert.equal(hazeOf(1e9).everyMs, HAZE.maxEveryMs);
  assert.equal(hazeOf(-1), null);
  const r = hazeOf({ every: [6000, 10000] });
  assert.equal(r.everyMs, 8000);
  assert.ok(Math.abs(r.jitter - 0.25) < 1e-12, 'a range sets the jitter to half its width over its middle');
  assert.equal(hazeOf({ every: 4000, jitter: 0 }).jitter, 0, 'jitter 0: an exact rotation');
  assert.equal(hazeOf({ jitter: 2 }).jitter, 0.9, 'the jitter is capped');
  assert.deepEqual(hazeOf({ level: 0.5 }).level, [0.5, 0.5]);
  assert.deepEqual(hazeOf({ level: [1, 0.2] }).level, [0.2, 1], 'a level range is ordered');
  assert.equal(hazeOf({ ramp: 0 }).rampMs, 0);
  assert.equal(hazeOf({ cool: 50 }).coolMs, 200);
  assert.equal(hazeOf({ kind: 'shake' }).kind, 'shake');
  assert.equal(hazeOf({ kind: 'nonsense' }).kind, 'heat');
});

test('THE PLAN: the haze by default; an explicit haze wins; resettle or breathe alone keep 0.5.0; haze off is off; reduced motion and still are off', () => {
  assert.equal(hazePlan({}).mode, 'haze', 'nothing given: the rotation runs');
  assert.deepEqual(hazePlan({}).spec, hazeOf(true));
  assert.equal(hazePlan({ haze: 4000 }).spec.everyMs, 4000);
  assert.equal(hazePlan({ haze: 4000, resettle: 2000 }).mode, 'haze', 'an explicit haze wins over resettle');
  assert.equal(hazePlan({ resettle: 2000 }).mode, 'legacy', 'a page that set resettle keeps what it had');
  assert.equal(hazePlan({ resettle: false }).mode, 'legacy');
  assert.equal(hazePlan({ breathe: 4 }).mode, 'legacy');
  assert.equal(hazePlan({ haze: false }).mode, 'off', 'the off switch: no rotation, no re-settle card');
  assert.equal(hazePlan({ haze: false, resettle: 3000 }).mode, 'legacy', 'haze off with a resettle: the resettle as 0.5.0 read it');
  assert.equal(hazePlan({ frozen: true }).mode, 'off', 'reduced motion and still: no haze');
  assert.equal(hazePlan({ frozen: true, haze: 3000 }).mode, 'off', 'not even an explicit one');
});

test('THE RANDOM PHASE: the first turn lands anywhere from 0.1 to 1 interval after mount; later turns are the interval +/- the jitter', () => {
  const spec = hazeOf(true);
  const rnd = seeded(11);
  const first = Array.from({ length: 2000 }, () => hazeDelay(spec, rnd, 0));
  const later = Array.from({ length: 2000 }, () => hazeDelay(spec, rnd, 3));
  const lo = spec.everyMs * (1 - spec.jitter);
  const hi = spec.everyMs * (1 + spec.jitter);
  assert.ok(Math.min(...first) >= 0.1 * lo - 1e-9 && Math.max(...first) <= hi + 1e-9, 'the first turn is inside its window');
  assert.ok(Math.min(...first) < 2000 && Math.max(...first) > 12000, 'and spread across it: pieces mounted together do not turn together');
  assert.ok(Math.min(...later) >= lo - 1e-9 && Math.max(...later) <= hi + 1e-9, `later turns are ${lo} to ${hi} ms`);
  assert.ok(Math.min(...later) < lo + 300 && Math.max(...later) > hi - 300, 'the jitter is used across its whole width');
  const mean = later.reduce((a, b) => a + b, 0) / later.length;
  assert.ok(Math.abs(mean - spec.everyMs) < 200, `centred on the interval: ${mean}`);
  assert.equal(hazeDelay(spec, () => 0.5, 3, 2), spec.everyMs * 2, 'the page\'s thinning stretches the interval');
  assert.equal(hazeDelay(hazeOf({ every: 4000, jitter: 0 }), Math.random, 5), 4000, 'jitter 0 is an exact rotation');
  assert.equal(hazeDelay(null), null);
  const l = Array.from({ length: 500 }, () => hazeLevel(spec, rnd));
  assert.ok(Math.min(...l) >= 0.9 && Math.max(...l) <= 1);
});

test('THE CLOCK on a fake clock: turns on its rotation, skips a hidden tab, asks again when the cap is full, and stop() ends it', () => {
  const T = fakeTimers();
  let hidden = false;
  let full = false;
  const fired = [];
  const told = [];
  const spec = hazeOf({ every: 10000, jitter: 0 });
  const clock = createHazeClock({ spec, rnd: () => 0.5, setTimer: T.setTimer, clearTimer: T.clearTimer, isHidden: () => hidden, fire: () => (full ? false : (fired.push(T.now), true)), onTurn: (n) => told.push(n) });
  assert.equal(clock.running, false);
  clock.start();
  assert.equal(clock.running, true);
  T.advance(5500 - 1);
  assert.equal(fired.length, 0, 'the first turn waits for its phase: 0.1 + 0.9 x 0.5 of 10 s');
  T.advance(1);
  assert.deepEqual(fired, [5500]);
  T.advance(10000);
  assert.deepEqual(fired, [5500, 15500], 'then every 10 s');
  hidden = true;
  T.advance(10000);
  assert.equal(fired.length, 2, 'a hidden tab skips its turn: no work');
  hidden = false;
  T.advance(10000);
  assert.deepEqual(fired, [5500, 15500, 35500], 'and the rotation carries on when the tab comes back');
  full = true;
  T.advance(10000);
  assert.equal(fired.length, 3, 'the page\'s cap is full');
  full = false;
  T.advance(HAZE.deferMs[1]);
  assert.equal(fired.length, 4, 'asked again within 0.4 to 1.6 s');
  assert.deepEqual(told, [1, 2, 3, 4], 'onTurn counts the turns that ran');
  assert.equal(clock.turns, 4);
  clock.stop();
  assert.equal(T.pending, 0, 'stop() clears the timer');
  T.advance(100000);
  assert.equal(fired.length, 4, 'nothing after stop: off screen is free');
  const none = createHazeClock({ spec: null, setTimer: T.setTimer, clearTimer: T.clearTimer, fire: () => true });
  none.start();
  assert.equal(none.running, false, 'no spec, no clock');
});

test('LIGHTS: the haze clock runs only on screen and unpaused, the plan knows reduced motion and still, and the box says its mode', () => {
  const lights = read('react/Lights.jsx');
  assert.match(lights, /const frozen = !!pick\(still, 'still', ctx, false\) \|\| reduced;/, 'reduced motion is frozen');
  assert.match(lights, /hazePlan\(\{ haze: hazeProp, resettle: resettleProp, breathe, frozen \}\)/, 'the plan is told when the settle is frozen');
  assert.match(lights, /const hazeProp = pick\(haze, 'haze', ctx, undefined\);/, 'SettleTextDefaults can set the haze');
  assert.match(lights, /if \(!hazeSpec \|\| !onScreen \|\| paused \|\| !spec\) return undefined;/, 'no rotation off screen or paused');
  assert.match(lights, /createHazeClock\(\{ spec: hazeSpec, fire: \(\) => fireResettle\(hazeSpec, true\)/, 'every turn asks the page\'s cap through fireResettle');
  assert.match(lights, /return \(\) => clock\.stop\(\);/, 'leaving the screen stops the clock');
  assert.match(lights, /const rMode = legacy \? resettleMode\(resettleProp, breathe\) : hazeSpec \? 'clock' : false;/, 'with the haze on, the shimmer deck deals no re-settle');
  assert.match(lights, /data-settle-haze=\{hazeSpec \? 'on' : legacy \? 'legacy' : 'off'\}/);
  // the off-screen signal is an IntersectionObserver
  assert.match(read('react/hooks.js'), /new IntersectionObserver\(/);
  assert.match(lights, /const onScreen = useOnScreen\(box\);/);
});

test('EVERY COMPONENT takes the haze: text, image, vector and background pass it to Lights; heading, link and sequence pass it through', () => {
  for (const f of ['SettleText.jsx', 'SettleImage.jsx', 'SettleVector.jsx']) {
    const src = read(`react/${f}`);
    assert.match(src, /^ {2}haze,$/m, `${f} takes haze`);
    assert.match(src, /haze=\{haze\}/, `${f} hands it to Lights`);
  }
  assert.match(read('react/SettleBackground.jsx'), /settleTime, resettle, haze, ambient,/, 'the background hands it to its layer');
  for (const f of ['SettleHeading.jsx', 'SettleLink.jsx']) assert.match(read(`react/${f}`), /\.\.\.rest/, `${f} spreads the rest of its props onto SettleText`);
});
