// settle-text · haze - THE ACTIVE HAZE (settle-text 0.6.0, lane SETTLETEXTFONTS, the navigator 2026-10-09: "every
// piece of settle text should RESETTLE on a timer ... on a rotation, each text re-runs its settle (heat up, then
// settle back into the letters), so the text is alive"). Each piece keeps its own rotation clock: on its turn it
// heats into a haze and settles back into the same letters. Plain JavaScript: the defaults, the prop reader, the
// plan that says which clock a component runs, and the clock itself on injectable timers. No DOM, no React.
//
// <claudes_code_comments>
// ** Function List **
// HAZE                           - the defaults: the rotation (every 11.5 s +/- 30%, so 8 to 15 s), the heat a turn
//                                  climbs to, its ramp and its cooling, the shortest and longest interval
// hazeOf(prop)                   - a haze prop (true | false | ms | { every, jitter, level, ramp, cool, kind }) ->
//                                  one plain spec, or null for off
// hazePlan({ haze, resettle, breathe, frozen }) - which clock a component runs: { mode: 'haze', spec } (the
//                                  rotation), { mode: 'legacy' } (a caller who set resettle or breathe keeps 0.5.0's
//                                  meaning of those props) or { mode: 'off' } (no full re-settle at all)
// hazeDelay(spec, rnd, n, scale) - the wait before turn n: the first lands anywhere from 0.1 to 1 interval after
//                                  mount (a random phase), each later one is the interval +/- the jitter
// hazeLevel(spec, rnd)           - the heat of one turn, drawn from the spec's range
// createHazeClock(opts)          - the rotation on injectable timers: start() / stop(); a turn in a hidden tab is
//                                  skipped (no work, the next one is planned), a turn the caller refuses (the
//                                  page's cap is full) is asked again after a short wait
//
// ** Technical Review **
// - WHY A ROTATION AND NOT A DECK CARD: since 0.5.0 the full re-settle was 1 card in 10 of the ambient shimmer, so a
//   piece re-settled about every 35 s, and the navigator saw text that never re-settled. The haze gives the full
//   re-settle its own clock again, on every piece, while the shimmer deck keeps dealing the small effects.
// - THE DEFAULT, judged by watching (SETTLE/runs/settletextfonts/): every 11.5 s +/- 30% (8.05 to 14.95 s), the
//   first turn 0.8 to 14.95 s after mount, so a page of pieces mounted together never turns together. A turn ramps
//   the heat over 600 ms to a level of 0.9 to 1 (T peaks near 2.2 to 2.4, the mount's own heat, against the simmer's
//   0.6): the letters dissolve into a haze you can still read the shape of, then settle back over 3 s. Watched on
//   frame strips: at 0.7 to 0.85 with a 2.4 s cool the letters held and only the dark around them sparkled, which
//   did not read as a re-settle; at 0.4 to 0.65 (0.4.0's re-settle) they only frayed at the edges. The heat is
//   capped at the mount's, so a settled field never goes all the way back to noise: the haze is a breath, not a
//   reload.
// - THE PLAN: an explicit `haze` wins. With no `haze`, a caller who set `resettle` or `breathe` gets exactly what
//   0.5.0 gave those props (the 'legacy' mode), so no existing page changes under it. With neither, the haze runs.
//   `haze={false}` with no `resettle` is off: no rotation, and the shimmer deck deals no re-settle either.
//   Reduced motion and `still` are always off.
// - THE CLOCK never runs off screen (the React layer stops it when its IntersectionObserver says so) and never works
//   in a hidden tab (the turn is skipped and the next planned), so a hidden or scrolled-away piece costs nothing.
// </claudes_code_comments>

export const HAZE = Object.freeze({
  everyMs: 11500,
  jitter: 0.3,
  level: Object.freeze([0.9, 1]),
  rampMs: 600,
  coolMs: 3000,
  minEveryMs: 2000,
  maxEveryMs: 600000,
  firstFrom: 0.1,
  deferMs: Object.freeze([400, 1600]),
  kind: 'heat',
});

const OFF = new Set([false, null, 0, 'off', 'none']);
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

function levelOf(v) {
  if (Array.isArray(v) && v.length) {
    const lo = clamp(Number(v[0]), 0, 1);
    const hi = clamp(Number(v[1] ?? v[0]), 0, 1);
    if (Number.isFinite(lo) && Number.isFinite(hi)) return [Math.min(lo, hi), Math.max(lo, hi)];
  }
  const n = Number(v);
  return Number.isFinite(n) && v !== null && v !== undefined ? [clamp(n, 0, 1), clamp(n, 0, 1)] : [...HAZE.level];
}

const base = () => ({ everyMs: HAZE.everyMs, jitter: HAZE.jitter, level: [...HAZE.level], rampMs: HAZE.rampMs, coolMs: HAZE.coolMs, kind: HAZE.kind });

export function hazeOf(prop) {
  if (OFF.has(prop)) return null;
  const out = base();
  if (prop === undefined || prop === true) return out;
  if (typeof prop === 'number') {
    if (!(prop > 0)) return null;
    out.everyMs = clamp(prop, HAZE.minEveryMs, HAZE.maxEveryMs);
    return out;
  }
  if (typeof prop === 'object') {
    if (prop.on === false) return null;
    if (Array.isArray(prop.every) && prop.every.length) {
      const lo = clamp(Number(prop.every[0]) || HAZE.everyMs, HAZE.minEveryMs, HAZE.maxEveryMs);
      const hi = clamp(Math.max(lo, Number(prop.every[1] ?? prop.every[0]) || lo), HAZE.minEveryMs, HAZE.maxEveryMs);
      out.everyMs = (lo + hi) / 2;
      out.jitter = out.everyMs > 0 ? (hi - lo) / 2 / out.everyMs : 0;
    } else if (Number.isFinite(prop.every) && prop.every > 0) out.everyMs = clamp(prop.every, HAZE.minEveryMs, HAZE.maxEveryMs);
    if (Number.isFinite(prop.jitter)) out.jitter = clamp(prop.jitter, 0, 0.9);
    if (prop.level !== undefined) out.level = levelOf(prop.level);
    if (Number.isFinite(prop.ramp) && prop.ramp >= 0) out.rampMs = clamp(prop.ramp, 0, 5000);
    if (Number.isFinite(prop.cool) && prop.cool > 0) out.coolMs = clamp(prop.cool, 200, 20000);
    if (prop.kind === 'shake' || prop.kind === 'heat' || prop.kind === 'mix') out.kind = prop.kind;
    return out;
  }
  return out;
}

export function hazePlan({ haze, resettle, breathe, frozen = false } = {}) {
  if (frozen) return { mode: 'off', spec: null };
  if (haze !== undefined) {
    const spec = hazeOf(haze);
    if (spec) return { mode: 'haze', spec };
    return resettle !== undefined || breathe !== undefined ? { mode: 'legacy', spec: null } : { mode: 'off', spec: null };
  }
  if (resettle !== undefined || breathe !== undefined) return { mode: 'legacy', spec: null };
  return { mode: 'haze', spec: hazeOf(true) };
}

export function hazeDelay(spec, rnd = Math.random, n = 0, scale = 1) {
  if (!spec) return null;
  const every = spec.everyMs * (Number.isFinite(scale) && scale > 0 ? scale : 1);
  const one = every * (1 + spec.jitter * (2 * rnd() - 1));
  if (n === 0) return Math.max(HAZE.minEveryMs / 4, one * (HAZE.firstFrom + (1 - HAZE.firstFrom) * rnd()));
  return Math.max(HAZE.minEveryMs, one);
}

export function hazeLevel(spec, rnd = Math.random) {
  const [lo, hi] = spec && spec.level ? spec.level : HAZE.level;
  return lo + (hi - lo) * rnd();
}

// the rotation on injectable timers. fire() starts one turn and returns true, or false when the page's cap is full
// (asked again after deferMs). isHidden() skips a turn in a hidden tab. scale() stretches the interval (the page's
// thinning). onTurn(n) is told each turn that ran.
export function createHazeClock({
  spec,
  fire,
  rnd = Math.random,
  setTimer = (f, ms) => setTimeout(f, ms),
  clearTimer = (id) => clearTimeout(id),
  isHidden = () => typeof document !== 'undefined' && !!document.hidden,
  scale = () => 1,
  onTurn,
} = {}) {
  let tid = null;
  let n = 0;
  let fired = 0;
  let live = false;
  const plan = (ms) => {
    if (live) tid = setTimer(turn, ms);
  };
  const next = () => plan(hazeDelay(spec, rnd, n, scale()));
  const turn = () => {
    tid = null;
    if (!live) return;
    if (isHidden()) {
      n += 1;
      return next();
    }
    if (!fire()) return plan(HAZE.deferMs[0] + (HAZE.deferMs[1] - HAZE.deferMs[0]) * rnd());
    n += 1;
    fired += 1;
    onTurn?.(fired);
    next();
  };
  return {
    start() {
      if (live || !spec) return;
      live = true;
      n = 0;
      next();
    },
    stop() {
      live = false;
      if (tid !== null) clearTimer(tid);
      tid = null;
    },
    get running() {
      return live;
    },
    get turns() {
      return fired;
    },
  };
}
