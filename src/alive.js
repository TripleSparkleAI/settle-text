// settle-text · alive - THE ALIVE DEFAULT (settle-text 0.4.0, lane STXALIVE, the navigator 2026-10-06: "by default
// ALL text must be LIVE settles ... MOVING settles, like our hero ... animated settle, re-settle on a schedule that
// can be set and adjusted by the component"). Every component simmers at a warm temperature, so its lights keep
// flickering and re-agreeing, and on a schedule it heats up, scatters a little and settles back into the same words.
// Plain JavaScript: the schedule, the page-wide conductor that thins it, and the defaults. No DOM, no React.
//
// <claudes_code_comments>
// ** Function List **
// ALIVE                         - the defaults: the simmer temperature, the two sweep rates, the re-settle, the ramp,
//                                 the page-wide cap and the thinning steps
// resettleOf(resettle, breathe) - a resettle prop (true | false | ms | { every, jitter, level, kind } | fn) and the
//                                 0.3.0 breathe prop it replaces -> one plain schedule, or null for none
// resettleDelay(spec, rnd, n)   - the wait before re-settle n (the first one lands anywhere in the first interval,
//                                 so a page of settles never fires at once)
// resettleLevel(spec, rnd)      - the heat of one re-settle (a number, or a range drawn each time)
// thinFor(count)                - how a page thins itself when many settles are alive on screen at once:
//                                 { simmerScale, everyScale, rest }
// simmerFpsFor(count, base)     - the simmer sweep rate after thinning, never below ALIVE.minSimmerFps
// weightOf(lights)              - how much one settle counts toward the crowd: 1 per 16,000 lights, 1 to 4
// createConductor(opts)         - the page-wide conductor: join(id, weight) / leave (the live members on screen and
//                                 their weights; count is the weighted crowd), subscribe, tryStart (at most
//                                 maxConcurrent re-settles at once), running, deferMs, setMax; and since 0.5.0 THE
//                                 AMBIENT SHIMMER's channel: tryShimmer (at most maxShimmers small shimmers at once),
//                                 shimmering, setShimmerMax, and the page's tally (note, stats)
//
// ** Technical Review **
// - THE SIMMER is a temperature, not an animation: the lights rest at `temperature` (0.6) and keep sweeping, so a
//   light on a letter's edge (lean 1.1, two neighbours agreeing, two not) flips about 1 time in 40 a sweep and the
//   words' edges glitter while their bodies hold. At 0.45 (0.3.0's rest) the same light flips 1 time in 130.
// - THE RE-SETTLE is the hero's slot change made small: the heat climbs over ALIVE.rampMs (400 ms) to a level drawn
//   from [0.4, 0.65], so T peaks near 1.3 to 1.8, the words scatter but stay readable, and they cool back over
//   ALIVE.coolMs (2.8 s; a frame strip at the mount's 1.5 s showed the scatter for two frames and gone). Every 6 to
//   12 s by default (everyMs 9000 with a jitter of 0.35 either way). The `resettle` object's `cool` sets it per
//   component.
// - THE TWO RATES: a re-settle sweeps at `fps` (24), the simmer at `simmerFps` (12); the flicker reads the same at
//   half the frames and costs half the draws.
// - THE PAGE THINS ITSELF, never goes static: the conductor counts the alive settles on screen, each weighted by its
//   size (weightOf: a paragraph of prose in lights counts 2 to 3, a word 1), because the draw a frame grows with the
//   lights (measured on #/settletext at 1440: 0.33 ms a frame on a screen of labels, 1.29 on a screen of prose). Above 8 the simmer
//   slows and the re-settles spread out; above 24 (a page of prose in lights) the simmer drops to 4 sweeps a second;
//   above 40 a member rests between its re-settles (zero frames until the next). At most maxConcurrent (4)
//   re-settles run at once page-wide; one that finds the cap full waits 0.4 to 1.6 s and asks again.
// - THE AMBIENT SHIMMER (0.5.0, src/ambient.js) has its own channel on the same conductor: at most maxShimmers (6)
//   small shimmers run at once page-wide, and one that finds the channel full waits its turn (a card put back on its
//   deck, asked again in 0.3 to 1.4 s). A crowd never goes still: the cap spreads the shimmers out in time.
// </claudes_code_comments>

export const ALIVE = Object.freeze({
  temperature: 0.6,
  fps: 24,
  simmerFps: 12,
  minSimmerFps: 4,
  resettle: Object.freeze({ everyMs: 9000, jitter: 0.35, level: Object.freeze([0.4, 0.65]), kind: 'heat' }),
  rampMs: 400,
  coolMs: 2800,
  maxConcurrent: 4,
  deferMs: Object.freeze([400, 1600]),
  minEveryMs: 600,
  // a settle counts on the page by its size: one member per 16,000 lights (a 64 px line across a 960 px column is
  // about 14,400), at least 1 and at most 4, so a screen of big prose blocks thins as a crowd of small words does
  lightsPerMember: 16000,
  maxWeight: 4,
  // the thinning steps: up to `count` alive settles on screen, the simmer runs at `simmer` of its rate and the
  // re-settles come `every` times as far apart; past the last row a member rests between its re-settles
  thin: Object.freeze([
    Object.freeze({ count: 8, simmer: 1, every: 1 }),
    Object.freeze({ count: 16, simmer: 0.75, every: 1.25 }),
    Object.freeze({ count: 24, simmer: 0.5, every: 1.5 }),
    Object.freeze({ count: 40, simmer: 0.34, every: 2 }),
  ]),
});

export const RESETTLE_KINDS = Object.freeze(['heat', 'shake', 'mix']);

const clamp01 = (x) => Math.max(0, Math.min(1, x));

function levelOf(v, fallback = ALIVE.resettle.level) {
  if (Array.isArray(v) && v.length) {
    const lo = clamp01(Number(v[0]));
    const hi = clamp01(Number(v[1] ?? v[0]));
    return Number.isFinite(lo) && Number.isFinite(hi) ? [Math.min(lo, hi), Math.max(lo, hi)] : [...fallback];
  }
  const n = Number(v);
  return Number.isFinite(n) ? [clamp01(n), clamp01(n)] : [...fallback];
}

// the 0.3.0 breathe prop (seconds, or { every: [s, s], level }) as a 0.4.0 resettle object
function fromBreathe(breathe) {
  if (breathe === false || breathe === null) return false;
  // 0.3.0 read a number of seconds as a wait from n to 1.4 n
  if (typeof breathe === 'number' && breathe > 0) return { every: [breathe * 1000, breathe * 1400] };
  if (breathe && typeof breathe === 'object') {
    const every = Array.isArray(breathe.every) ? breathe.every.map((s) => s * 1000) : undefined;
    return { every, level: breathe.level };
  }
  return true;
}

export function resettleOf(resettle, breathe) {
  let r = resettle;
  if (r === undefined) r = breathe === undefined || breathe === true ? true : fromBreathe(breathe);
  if (r === false || r === null || r === 0 || r === 'off') return null;
  const d = ALIVE.resettle;
  if (typeof r === 'function') return { fn: r, everyMs: d.everyMs, jitter: 0, level: [...d.level], kind: d.kind };
  if (r === true) return { everyMs: d.everyMs, jitter: d.jitter, level: [...d.level], kind: d.kind };
  if (typeof r === 'number') {
    if (!(r > 0)) return null;
    return { everyMs: Math.max(ALIVE.minEveryMs, r), jitter: d.jitter, level: [...d.level], kind: d.kind };
  }
  if (typeof r === 'object') {
    let everyMs = d.everyMs;
    let jitter = Number.isFinite(r.jitter) ? Math.max(0, Math.min(0.95, r.jitter)) : d.jitter;
    if (Array.isArray(r.every) && r.every.length) {
      const lo = Math.max(ALIVE.minEveryMs, Number(r.every[0]) || d.everyMs);
      const hi = Math.max(lo, Number(r.every[1] ?? r.every[0]) || lo);
      everyMs = (lo + hi) / 2;
      jitter = everyMs > 0 ? (hi - lo) / 2 / everyMs : 0;
    } else if (Number.isFinite(r.every) && r.every > 0) everyMs = Math.max(ALIVE.minEveryMs, r.every);
    const kind = RESETTLE_KINDS.includes(r.kind) ? r.kind : d.kind;
    const out = { everyMs, jitter, level: levelOf(r.level), kind };
    if (Number.isFinite(r.cool) && r.cool > 0) out.coolMs = Math.max(200, r.cool);
    return out;
  }
  return { everyMs: d.everyMs, jitter: d.jitter, level: [...d.level], kind: d.kind };
}

// the wait before re-settle n (0 is the first): a function schedule is asked; otherwise everyMs with its jitter, and
// the first lands anywhere from a quarter of the way through the interval, so twenty settles that mount together
// do not re-settle together. `scale` stretches the interval (the page's thinning). null means no more re-settles.
export function resettleDelay(spec, rnd = Math.random, n = 0, scale = 1) {
  if (!spec) return null;
  if (spec.fn) {
    const v = Number(spec.fn(n));
    return Number.isFinite(v) && v > 0 ? Math.max(ALIVE.minEveryMs, v) * scale : null;
  }
  const base = spec.everyMs * scale;
  if (n === 0) return Math.max(ALIVE.minEveryMs, base * (0.25 + 0.75 * rnd()));
  return Math.max(ALIVE.minEveryMs, base * (1 + spec.jitter * (2 * rnd() - 1)));
}

export function resettleLevel(spec, rnd = Math.random) {
  const [lo, hi] = spec && spec.level ? spec.level : ALIVE.resettle.level;
  return lo + (hi - lo) * rnd();
}

export function thinFor(count = 0) {
  for (const row of ALIVE.thin) if (count <= row.count) return { simmerScale: row.simmer, everyScale: row.every, rest: false };
  const last = ALIVE.thin[ALIVE.thin.length - 1];
  return { simmerScale: last.simmer, everyScale: last.every * 1.5, rest: true };
}

export function simmerFpsFor(count = 0, base = ALIVE.simmerFps) {
  const b = Number.isFinite(base) && base > 0 ? base : ALIVE.simmerFps;
  return Math.max(Math.min(b, ALIVE.minSimmerFps), Math.round(b * thinFor(count).simmerScale));
}

// how much one settle counts toward the page's crowd: its lights over ALIVE.lightsPerMember, 1 to ALIVE.maxWeight
export function weightOf(lights = 0) {
  const w = Number(lights) / ALIVE.lightsPerMember;
  return Number.isFinite(w) ? Math.max(1, Math.min(ALIVE.maxWeight, w)) : 1;
}

export function createConductor({ maxConcurrent = ALIVE.maxConcurrent, deferMs = ALIVE.deferMs, maxShimmers = 6 } = {}) {
  let max = Math.max(1, Math.round(maxConcurrent));
  let smax = Math.max(1, Math.round(maxShimmers));
  const members = new Map();
  const running = new Map();
  const shimmers = new Map();
  const tally = { dealt: 0, resettles: 0, deferred: 0, peak: 0, byName: {} };
  const listeners = new Set();
  const total = () => {
    let t = 0;
    for (const w of members.values()) t += w;
    return Math.round(t);
  };
  const emit = () => {
    const n = total();
    for (const f of listeners) f(n);
  };
  const prune = (now) => {
    for (const [id, until] of running) if (until <= now) running.delete(id);
    for (const [id, until] of shimmers) if (until <= now) shimmers.delete(id);
  };
  return {
    get maxConcurrent() {
      return max;
    },
    setMax(n) {
      if (Number.isFinite(n) && n >= 1) max = Math.round(n);
    },
    get count() {
      return total();
    },
    get members() {
      return members.size;
    },
    join(id, weight = 1) {
      const w = Math.max(1, Number(weight) || 1);
      if (members.get(id) === w) return;
      members.set(id, w);
      emit();
    },
    leave(id) {
      running.delete(id);
      shimmers.delete(id);
      if (!members.delete(id)) return;
      emit();
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    // a re-settle asks to start: true when fewer than maxConcurrent are running (it then counts until now + ms)
    tryStart(id, now, ms) {
      prune(now);
      if (running.has(id)) return true;
      if (running.size >= max) return false;
      running.set(id, now + Math.max(0, ms));
      return true;
    },
    running(now) {
      prune(now);
      return running.size;
    },
    // THE AMBIENT SHIMMER's channel: a small shimmer asks to start; true when fewer than maxShimmers are running
    get maxShimmers() {
      return smax;
    },
    setShimmerMax(n) {
      if (Number.isFinite(n) && n >= 1) smax = Math.round(n);
    },
    tryShimmer(id, now, ms) {
      prune(now);
      if (shimmers.has(id)) return false;
      if (shimmers.size >= smax) return false;
      shimmers.set(id, now + Math.max(0, ms));
      if (shimmers.size > tally.peak) tally.peak = shimmers.size;
      return true;
    },
    shimmering(now) {
      prune(now);
      return shimmers.size;
    },
    // the page's tally of what the shimmers dealt (a measurement reads it; nothing in the components depends on it)
    note(name, deferred = false) {
      if (deferred) {
        tally.deferred++;
        return;
      }
      tally.dealt++;
      if (name === 'resettle') tally.resettles++;
      tally.byName[name] = (tally.byName[name] || 0) + 1;
    },
    stats() {
      return { ...tally, byName: { ...tally.byName }, maxShimmers: smax, maxConcurrent: max, members: members.size, count: total() };
    },
    deferMs(rnd = Math.random) {
      return deferMs[0] + (deferMs[1] - deferMs[0]) * rnd();
    },
  };
}
