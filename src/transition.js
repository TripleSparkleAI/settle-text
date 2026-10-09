// settle-text · transition - how a change of words is shown, and the clock that steps through a list of words.
// Pure (no DOM, no React): the React layer hands transitionOf()'s answer to settle-see's morph and drives a
// SettleSequence with createSequencer().
//
// <claudes_code_comments>
// ** Function List **
// TRANSITION                          - the defaults: 'morph', 1200 ms, four movie frames, a small wake heat (0.3)
// SEQUENCE                            - the sequence defaults: 2500 ms a step, looping
// transitionOf(transition, duration)  - 'morph' | 'cut' | false | { kind, duration, frames } -> one plain object
//                                       { kind, durationMs, frames, periodMs, wake }
// morphHow(tr)                        - what settle-see's morph is given: { frames, periodMs }, or false for a cut
// intervalFor(interval, index)        - the wait in ms before leaving item `index`: a number, a list (one wait an
//                                       item, the last repeated) or a function (index) -> ms; clamped to >= 50
// sequenceAt(count, elapsedMs, opts)  - the pure question "which item shows after this much time": { index, lap, done }
// createSequencer(opts)               - a stepper on injectable timers: start / stop / pause / resume / goto, onStep
//
// ** Technical Review **
// - A MORPH is settle-see's own morph (settle-see/src/morph.js), never a copy: a short TRUE TIME movie from the
//   lights the field holds to the new words, each light switching at its own seeded moment, sooner on the left. The
//   movie has `frames` frames, one every periodMs = durationMs / frames, so `duration` is the time the movie takes
//   at the engine's pace on any machine. The morph needs the same grid on both sides: when the new words need a
//   different grid (a wrapped text that gains a line, a box that changed width) the change is a fresh settle out of
//   noise, as at mount.
// - A CUT puts the new words in the lights at once (settle-see's show with snap): no movie, no noise.
// - Under prefers-reduced-motion every transition is a cut, and settle-see's still draws it once.
// - THE SEQUENCER is a plain timer loop, so a test drives it with a fake clock: setTimer and clearTimer default to
//   setTimeout and clearTimeout and are injectable. pause() keeps the time left on the current item and resume()
//   spends only that; a once sequence stops on its last item and fires onDone; a looping one wraps and counts laps.
//   onStep fires on every move to an item after the first ({ index, lap }; the React layer adds the item), never at
//   start.
// </claudes_code_comments>

export const TRANSITION = Object.freeze({ kind: 'morph', durationMs: 1200, frames: 4, wake: 0.3 });
export const SEQUENCE = Object.freeze({ intervalMs: 2500, loop: true, minMs: 50 });

export function transitionOf(transition = 'morph', duration = null) {
  let kind = TRANSITION.kind;
  let durationMs = TRANSITION.durationMs;
  let frames = TRANSITION.frames;
  if (transition === false || transition === 'cut' || transition === 'none') kind = 'cut';
  else if (transition && typeof transition === 'object') {
    if (transition.kind === 'cut') kind = 'cut';
    if (Number.isFinite(transition.duration) && transition.duration > 0) durationMs = transition.duration;
    if (Number.isFinite(transition.frames) && transition.frames >= 2) frames = Math.round(transition.frames);
  }
  if (Number.isFinite(duration) && duration > 0) durationMs = duration;
  durationMs = Math.max(100, durationMs);
  return { kind, durationMs, frames, periodMs: Math.max(25, Math.round(durationMs / frames)), wake: TRANSITION.wake };
}

export function morphHow(tr) {
  return tr && tr.kind === 'morph' ? { frames: tr.frames, periodMs: tr.periodMs } : false;
}

export function intervalFor(interval = SEQUENCE.intervalMs, index = 0) {
  let ms;
  if (typeof interval === 'function') ms = interval(index);
  else if (Array.isArray(interval)) ms = interval.length ? interval[Math.min(index, interval.length - 1)] : SEQUENCE.intervalMs;
  else ms = interval;
  ms = Number(ms);
  if (!Number.isFinite(ms)) ms = SEQUENCE.intervalMs;
  return Math.max(SEQUENCE.minMs, ms);
}

export function sequenceAt(count, elapsedMs, { interval = SEQUENCE.intervalMs, loop = SEQUENCE.loop } = {}) {
  if (!(count > 0)) return { index: -1, lap: 0, done: true };
  let t = Math.max(0, elapsedMs);
  let index = 0;
  let lap = 0;
  for (let guard = 0; guard < 1e6; guard++) {
    const wait = intervalFor(interval, index);
    if (t < wait) return { index, lap, done: false };
    if (!loop && index === count - 1) return { index, lap, done: true };
    t -= wait;
    index += 1;
    if (index >= count) { index = 0; lap += 1; }
  }
  return { index, lap, done: false };
}

export function createSequencer({
  count = 0,
  interval = SEQUENCE.intervalMs,
  loop = SEQUENCE.loop,
  onStep,
  onDone,
  now = () => Date.now(),
  setTimer = (f, ms) => setTimeout(f, ms),
  clearTimer = (id) => clearTimeout(id),
} = {}) {
  let index = 0;
  let lap = 0;
  let id = null;
  let due = 0; // when the current item is left (now() time)
  let left = null; // ms left on the current item while paused
  let running = false;
  let done = false;

  const arm = (ms) => {
    if (id != null) clearTimer(id);
    due = now() + ms;
    id = setTimer(advance, ms);
  };
  function advance() {
    id = null;
    if (!running) return;
    if (!loop && index >= count - 1) {
      done = true;
      running = false;
      onDone?.({ index, lap });
      return;
    }
    index += 1;
    if (index >= count) { index = 0; lap += 1; }
    onStep?.({ index, lap });
    if (!loop && index >= count - 1) {
      done = true;
      running = false;
      onDone?.({ index, lap });
      return;
    }
    arm(intervalFor(interval, index));
  }

  return {
    get index() { return index; },
    get lap() { return lap; },
    get done() { return done; },
    get running() { return running; },
    start() {
      if (count < 2 || done) return this;
      running = true;
      left = null;
      arm(intervalFor(interval, index));
      return this;
    },
    stop() {
      running = false;
      left = null;
      if (id != null) clearTimer(id);
      id = null;
      return this;
    },
    pause() {
      if (!running) return this;
      left = Math.max(0, due - now());
      running = false;
      if (id != null) clearTimer(id);
      id = null;
      return this;
    },
    resume() {
      if (running || done || count < 2) return this;
      running = true;
      arm(left ?? intervalFor(interval, index));
      left = null;
      return this;
    },
    goto(i) {
      if (!(count > 0)) return this;
      index = ((Math.round(i) % count) + count) % count;
      done = false;
      if (running) arm(intervalFor(interval, index));
      return this;
    },
  };
}
