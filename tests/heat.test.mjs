// settle-text · the temperature curve and the breath (src/heat.js): hot at the kick, an exact cold at settleTime,
// a kick never cools, the breath prop forms.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHeat, tauFor, breathOf, breathDelay, HEAT, BREATH } from '../src/index.js';

test('a full kick reads hot, cools, and is EXACTLY cold by settleTime (so the engine can rest)', () => {
  const h = createHeat({ settleMs: 1500 });
  assert.equal(h.T(0), HEAT.cold, 'cold before any kick');
  h.kick(1, 1000);
  assert.ok(h.T(1000) > 2.3, `hot at the kick: ${h.T(1000)}`);
  assert.ok(h.T(1400) < h.T(1000), 'cooling');
  assert.notEqual(h.T(1000 + 1200), HEAT.cold, 'still a little warm before settleTime');
  assert.equal(h.isCold(1000 + 500), false);
  // once a read finds it cold the level is dropped, so the curve stays exactly cold until the next kick
  assert.equal(h.T(1000 + 1500), HEAT.cold, 'exactly cold at settleTime');
  assert.equal(h.isCold(1000 + 1500), true);
  assert.equal(h.T(1000 + 1200), HEAT.cold, 'a clock read earlier than the last cold read does not re-warm it');
});

test('the settle time scales the curve: a 3 s settle is still warm where a 1.5 s one is cold', () => {
  const fast = createHeat({ settleMs: 1500 });
  const slow = createHeat({ settleMs: 3000 });
  fast.kick(1, 0);
  slow.kick(1, 0);
  assert.equal(fast.T(1500), HEAT.cold);
  assert.ok(slow.T(1500) > HEAT.cold + 0.05);
  assert.equal(slow.T(3000), HEAT.cold);
  assert.ok(Math.abs(tauFor(1500) * 2 - tauFor(3000)) < 1e-9);
});

test('a kick never lowers the heat it finds, and a partial kick (a breath) is partial', () => {
  const h = createHeat();
  h.kick(1, 0);
  const before = h.T(100);
  h.kick(0.25, 100);
  assert.ok(h.T(100) >= before - 1e-9, 'a small kick on a hot field leaves it hot');
  const b = createHeat();
  b.kick(0.25, 0);
  const full = createHeat();
  full.kick(1, 0);
  assert.ok(b.T(0) < full.T(0), 'a breath is cooler than the intro');
  assert.ok(b.T(0) > HEAT.cold, 'but warmer than rest');
});

test('the cold is the temperature prop: a stiller cold and a noisier one', () => {
  assert.equal(createHeat({ cold: 0.3 }).T(0), 0.3);
  assert.equal(createHeat({ cold: 0.8 }).T(0), 0.8);
});

test('breathOf: true is the default breath, false and null are none, a number is seconds, an object sets the window and level', () => {
  assert.deepEqual(breathOf(true), BREATH);
  assert.equal(breathOf(false), null);
  assert.equal(breathOf(null), null);
  assert.deepEqual(breathOf(10), { minMs: 10000, spreadMs: 4000, level: BREATH.level });
  assert.deepEqual(breathOf({ every: [3, 5], level: 0.5 }), { minMs: 3000, spreadMs: 2000, level: 0.5 });
  assert.deepEqual(breathOf({ level: 2 }).level, 1, 'the level is clamped');
});

test('breathDelay lands inside the window', () => {
  assert.equal(breathDelay(() => 0), BREATH.minMs);
  assert.equal(breathDelay(() => 1), BREATH.minMs + BREATH.spreadMs);
  assert.equal(breathDelay(() => 0.5, { minMs: 1000, spreadMs: 1000 }), 1500);
});
