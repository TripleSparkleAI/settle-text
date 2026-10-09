// settle-text · THE ALIVE DEFAULT (src/alive.js, 0.4.0): the simmer, the re-settle schedule in every form a component
// takes, the old breathe prop folded in, the page's thinning and the conductor's cap, and the heat ramp.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ALIVE, resettleOf, resettleDelay, resettleLevel, thinFor, simmerFpsFor, weightOf, createConductor, createHeat, HEAT } from '../src/index.js';

const ROOT = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

test('THE SIMMER is warmer than 0.3.0\'s rest, so the lights keep flickering; a re-settle sweeps at 24 and the simmer at 12', () => {
  assert.equal(ALIVE.temperature, 0.6);
  assert.ok(ALIVE.temperature > HEAT.cold, 'warmer than the old exact cold');
  // an edge light (lean 1.1, two neighbours for, two against) flips about 1 time in 40 a sweep at the simmer
  const flip = (T) => (1 - Math.tanh(1.1 / T)) / 2;
  assert.ok(flip(ALIVE.temperature) > 0.02 && flip(ALIVE.temperature) < 0.03, `${flip(ALIVE.temperature)}`);
  assert.ok(flip(HEAT.cold) < 0.008, 'at 0.45 the same light flips 1 time in 130: nearly still');
  assert.equal(ALIVE.fps, 24);
  assert.equal(ALIVE.simmerFps, 12);
});

test('resettleOf: true is the default schedule; false, null, 0 and "off" are none', () => {
  const d = resettleOf(true);
  assert.deepEqual(d, { everyMs: 9000, jitter: 0.35, level: [0.4, 0.65], kind: 'heat' });
  assert.deepEqual(resettleOf(undefined), d, 'nothing given is the default: alive');
  for (const off of [false, null, 0, 'off']) assert.equal(resettleOf(off), null, String(off));
});

test('resettleOf: a number is an interval in ms; an object sets every, jitter, level and kind; a range of ms works too', () => {
  assert.equal(resettleOf(4000).everyMs, 4000);
  assert.equal(resettleOf(100).everyMs, ALIVE.minEveryMs, 'never faster than minEveryMs');
  const o = resettleOf({ every: 5000, jitter: 0.1, level: 0.8, kind: 'shake' });
  assert.deepEqual(o, { everyMs: 5000, jitter: 0.1, level: [0.8, 0.8], kind: 'shake' });
  assert.equal(resettleOf({ cool: 4000 }).coolMs, 4000, 'cool sets the re-settle\'s own cooling time');
  assert.equal(resettleOf({ cool: 50 }).coolMs, 200);
  assert.equal(resettleOf({}).coolMs, undefined, 'unset: the default (ALIVE.coolMs) applies');
  const r = resettleOf({ every: [3000, 5000] });
  assert.equal(r.everyMs, 4000);
  assert.ok(Math.abs(r.jitter - 0.25) < 1e-12, 'a range sets the jitter to half its width over its middle');
  assert.deepEqual(resettleOf({ level: [0.9, 0.2] }).level, [0.2, 0.9], 'a level range is ordered');
  assert.deepEqual(resettleOf({ level: 3 }).level, [1, 1], 'clamped to 1');
  assert.equal(resettleOf({ kind: 'nonsense' }).kind, 'heat');
  assert.equal(resettleOf({ kind: 'mix' }).kind, 'mix');
});

test('resettleOf: a function is asked for each wait, and null from it stops the schedule', () => {
  const s = resettleOf((n) => (n < 2 ? 2000 * (n + 1) : null));
  assert.equal(resettleDelay(s, () => 0.5, 0), 2000);
  assert.equal(resettleDelay(s, () => 0.5, 1), 4000);
  assert.equal(resettleDelay(s, () => 0.5, 2), null);
});

test('BREATHE FOLDS IN: 0.3.0\'s breathe reads as a schedule when resettle is not given; resettle wins when both are', () => {
  assert.equal(resettleOf(undefined, false), null, 'breathe={false} turns the schedule off');
  assert.deepEqual(resettleOf(undefined, true), resettleOf(true));
  const b = resettleOf(undefined, 4);
  assert.ok(Math.abs(b.everyMs - 4800) < 1e-9 && Math.abs(b.jitter - 1 / 6) < 1e-9, '4 s read as 4 to 5.6 s, as 0.3.0 did');
  assert.equal(resettleOf(undefined, { every: [3, 5], level: 0.5 }).everyMs, 4000, 'seconds become ms');
  assert.equal(resettleOf(undefined, { every: [3, 5], level: 0.5 }).level[0], 0.5);
  assert.equal(resettleOf(2000, false).everyMs, 2000, 'an explicit resettle beats breathe');
});

test('resettleDelay: the first lands from a quarter of the way into the interval (a page never fires at once); later ones carry the jitter and the page\'s scale', () => {
  const s = resettleOf(true);
  assert.equal(resettleDelay(s, () => 0, 0), 9000 * 0.25);
  assert.equal(resettleDelay(s, () => 1, 0), 9000);
  assert.equal(resettleDelay(s, () => 0, 1), 9000 * 0.65);
  assert.equal(resettleDelay(s, () => 1, 1), 9000 * 1.35);
  assert.equal(resettleDelay(s, () => 0.5, 3, 2), 18000, 'the thinning stretches the interval');
  assert.equal(resettleDelay(null, () => 0.5, 0), null);
  // spread: twenty settles mounted together spread their first re-settle over three quarters of the interval
  let r = 1;
  const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
  const firsts = Array.from({ length: 20 }, () => resettleDelay(s, rnd, 0));
  assert.ok(Math.max(...firsts) - Math.min(...firsts) > 4000, 'not all at once');
});

test('resettleLevel draws inside the level range', () => {
  const s = resettleOf(true);
  assert.equal(resettleLevel(s, () => 0), 0.4);
  assert.equal(resettleLevel(s, () => 1), 0.65);
  // the peak temperature a default re-settle reaches: scattered but readable
  const peak = (lvl) => ALIVE.temperature + (HEAT.hot - ALIVE.temperature) * lvl;
  assert.ok(peak(0.4) > 1.3 && peak(0.65) < 1.8, `${peak(0.4)} to ${peak(0.65)}`);
});

test('THE PAGE THINS ITSELF, never static: more alive settles on screen slow the simmer and spread the re-settles; past 40 each rests between its re-settles', () => {
  assert.deepEqual(thinFor(0), { simmerScale: 1, everyScale: 1, rest: false });
  assert.deepEqual(thinFor(8), { simmerScale: 1, everyScale: 1, rest: false });
  assert.deepEqual(thinFor(12), { simmerScale: 0.75, everyScale: 1.25, rest: false });
  assert.deepEqual(thinFor(20), { simmerScale: 0.5, everyScale: 1.5, rest: false });
  assert.deepEqual(thinFor(40), { simmerScale: 0.34, everyScale: 2, rest: false });
  assert.deepEqual(thinFor(41), { simmerScale: 0.34, everyScale: 3, rest: true });
  assert.equal(simmerFpsFor(4), 12);
  assert.equal(simmerFpsFor(12), 9);
  assert.equal(simmerFpsFor(20), 6);
  assert.equal(simmerFpsFor(30), 4);
  assert.equal(simmerFpsFor(100), 4, 'never below the floor');
  assert.equal(simmerFpsFor(2, 2), 2, 'a slower base than the floor is kept');
  // monotone: a busier page never runs faster
  for (let n = 1; n < 60; n++) assert.ok(simmerFpsFor(n + 1) <= simmerFpsFor(n), `n ${n}`);
});

test('THE CONDUCTOR: members join and leave, at most maxConcurrent re-settles at once, one that finds the cap full is refused until one ends', () => {
  const c = createConductor({ maxConcurrent: 2 });
  const seen = [];
  c.subscribe((n) => seen.push(n));
  c.join('a');
  c.join('b');
  c.join('a');
  assert.equal(c.count, 2, 'a member joins once');
  assert.deepEqual(seen, [1, 2]);
  assert.equal(c.tryStart('a', 0, 1000), true);
  assert.equal(c.tryStart('b', 100, 1000), true);
  assert.equal(c.tryStart('c', 200, 1000), false, 'the third waits');
  assert.equal(c.running(500), 2);
  assert.equal(c.tryStart('c', 1001, 1000), true, 'after the first ends, it starts');
  c.leave('a');
  assert.equal(c.count, 1);
  c.setMax(5);
  assert.equal(c.maxConcurrent, 5);
  const d = c.deferMs(() => 0);
  assert.equal(d, ALIVE.deferMs[0]);
});

test('A RE-SETTLE COOLS SLOWER THAN A MOUNT: coolMs gives one kick its own time, and the next kick goes back', () => {
  const h = createHeat({ cold: 0.6, settleMs: 1500 });
  h.kick(0.5, 0, 0, ALIVE.coolMs);
  assert.ok(h.T(1500) > 0.6 + 0.01, 'still warm at the mount\'s settle time');
  assert.equal(h.T(ALIVE.coolMs), 0.6, 'cold at its own');
  h.kick(0.5, 10000);
  assert.equal(h.T(11500), 0.6, 'a plain kick cools over settleMs again');
  assert.ok(ALIVE.coolMs > HEAT.settleMs);
});

test('A BIG SETTLE COUNTS FOR MORE: the crowd is weighted by lights, 1 per 16,000, from 1 to 4', () => {
  assert.equal(weightOf(0), 1);
  assert.equal(weightOf(5400), 1, 'a word counts one');
  assert.equal(weightOf(32000), 2);
  assert.equal(weightOf(45000), 45000 / 16000, 'a paragraph of prose counts nearly three');
  assert.equal(weightOf(1e6), 4, 'never more than four');
  assert.equal(weightOf(NaN), 1);
  const c = createConductor();
  c.join('word', weightOf(5000));
  c.join('para', weightOf(48000));
  assert.equal(c.count, 4, 'one word and one paragraph are a crowd of four');
  assert.equal(c.members, 2);
  c.join('para', weightOf(16000));
  assert.equal(c.count, 2, 'a re-join with a new size replaces the weight');
  c.leave('para');
  assert.equal(c.count, 1);
});

test('THE RAMP: a re-settle climbs over rampMs from the heat it finds to its level, then cools; never exactly cold mid-ramp', () => {
  const h = createHeat({ cold: 0.6, settleMs: 1500 });
  h.kick(0.5, 1000, 300);
  assert.equal(h.T(1000), 0.6, 'the ramp starts at the simmer');
  assert.equal(h.isCold(1000), false, 'a ramp is not cold, even at its first instant');
  const peak = 0.6 + (HEAT.hot - 0.6) * 0.5;
  assert.ok(Math.abs(h.T(1150) - (0.6 + (peak - 0.6) / 2)) < 1e-9, 'halfway up at half the ramp');
  assert.ok(Math.abs(h.T(1300) - peak) < 1e-9, 'the peak at the end of the ramp');
  assert.ok(h.T(1600) < peak, 'then it cools');
  assert.equal(h.T(1300 + 1500), 0.6, 'and is back at the simmer a settleTime after the peak');
  // a kick with no ramp is still a jump (the mount, a hover)
  const j = createHeat({ cold: 0.6 });
  j.kick(1, 0);
  assert.ok(j.T(0) > 2.3);
});

test('Lights runs the schedule through the conductor, joins it only while alive on screen, and keeps the off-screen and hidden-tab pauses', () => {
  const src = read('react/Lights.jsx');
  assert.match(src, /const alive = !frozen && !resting && !paused && onScreen && !!spec;/);
  assert.match(src, /CONDUCTOR\.join\(me, weight\);\s*return \(\) => CONDUCTOR\.leave\(me\);/, 'joined with its weight');
  assert.match(src, /const weight = weightOf\(cols \* rows\);/);
  assert.match(src, /if \(!sched \|\| !onScreen \|\| paused \|\| !spec\) return undefined;/, 'no schedule off screen or paused');
  assert.match(src, /document\.hidden\) return plan\(\);/, 'a hidden tab skips the re-settle');
  assert.match(src, /CONDUCTOR\.tryStart\(id\.current, nowMs\(\), ms\)/, 'every re-settle asks the page first (the clock and the shimmer deck share one fireResettle)');
  assert.match(src, /const ramp = isHaze \? spec0\.rampMs : ALIVE\.rampMs;/, 'a re-settle ramps over ALIVE.rampMs, a haze turn over its own ramp (0.6.0)');
  assert.match(src, /kick\(level, ramp, cool\)/, 'a heat re-settle ramps, and cools over its own time');
  assert.match(src, /fps=\{hot \|\| restNow \|\| amb\.shimmering \? fpsHot : simmer\}/, 'full rate while hot or while a shimmer plays, the thinned simmer otherwise');
  assert.match(src, /data-settle-alive=\{frozen \? 'still' : restNow \? 'rest' : 'alive'\}/, 'the state is readable from the page');
});
