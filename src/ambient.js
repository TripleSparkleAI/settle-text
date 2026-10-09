// settle-text · ambient - THE AMBIENT SHIMMER (settle-text 0.5.0, lane STXSHIMMER, the navigator 2026-10-07: "I want
// EACH PIECE OF TEXT to have its OWN shimmer schedule, where it does various effects: re-settle itself, and other,
// more subtle ones. A full re-settle happens only about 1 in 10 of these random shimmers", "usually more subtle",
// "have a range of these", "selectable as part of our package", "the 'ambient shimmer'"). Every alive component deals
// shimmers from its own deck, on its own random phase and its own period. Most cards are small, visible effects drawn
// with settle-see's own tools (the draw-only flash, the weather knobs, the field's lights); about 1 card in 10 is the
// full re-settle. Plain JavaScript: the library of effects, the presets, the deck and the clock. No DOM, no React.
//
// <claudes_code_comments>
// ** Function List **
// AMBIENT                      - the defaults: the gap between shimmers, its jitter, the re-settle share, the page cap
//                                (6 at once), the shortest gap on one piece, the deck's card weight
// AMBIENT_LIMITS               - the hard bounds every effect keeps (flash strength, heat, lean, soften, how many
//                                times one light may flash a second)
// AMBIENT_EFFECTS              - THE RANGE: 13 named effects from the faintest to the boldest, each { name, line,
//                                strength, ms, kind }; 'resettle' is the last and boldest
// AMBIENT_NAMES                - the names in that order
// AMBIENT_PRESETS              - 'whisper', 'gentle' (the default) and 'lively': which effects, how often, how strong
// ambientOf(prop, opts)        - an `ambient` prop (true | false | a preset | an effect name | a list of names |
//                                { preset, every, jitter, resettleShare, effects, strength }) -> one plain spec or null
// ambientPeriod(spec, rnd)     - this piece's own period: the preset's gap times 0.75 to 1.25, drawn once a mount
// shimmerDelay(spec, rnd, n, period) - the wait before shimmer n (the first lands anywhere in the first period)
// deckWeights(effects, share)  - whole-number weights so 'resettle' is `share` of every round of the deck
// createAmbientDeck(spec, rnd) - settle-see's createBag (THE DECK RULE) over the spec's effects and 'resettle'
// wordBoxes(target, w, h)      - the words of a text target: row bands of lit lights split at column gaps
// createShimmer(name, opts)    - one running effect: { name, kind, ms, weather(t), step(F, t), end(F) } for t in
//                                [0, 1]; end hands back anything the effect lent the field (a scatter's leans)
//
// ** Technical Review **
// - EVERY EFFECT IS A REAL SETTLE EFFECT, never a CSS animation: a 'flash' effect lights chosen lights with the
//   field's draw-only flash (F.flash, the one CLEARTEXT's crackle and FOOTERMINI's front use; it touches no p-bit and
//   fades by settle-see's flashDecay); a 'weather' effect moves the settle's own knobs for a moment (heat, lean,
//   soften) through settle-see's weather hook; a 'scatter' effect melts a region for a moment (its lights' leans turned down
//   through the field's per-light leans, then back up), and lets the
//   physics settle them back. 'resettle' is THE ALIVE DEFAULT's own re-settle (heat, scatter, cool), run by Lights.
// - THE DECK RULE (settle-see's deck.js): a piece's deck holds every chosen effect `cardWeight` times and the
//   re-settle as many times as makes it `resettleShare` of the round (0.1 by default), so a round of the deck deals
//   exactly that share, never the same card twice in a row unless nothing else is left, and a fresh order every round.
// - EACH PIECE ITS OWN SCHEDULE: the period is the preset's gap times 0.75 to 1.25, drawn once per mount, and the
//   first shimmer lands anywhere from 0.15 to 1 period after mount, so no two pieces move together; each later gap is
//   the period times 1 +/- jitter, never under AMBIENT.minGapMs.
// - THE LIMITS (WCAG 2.3.1, three flashes): a flash effect lights each light at most once per shimmer, at most
//   AMBIENT_LIMITS.flash, and the gap between two shimmers on one piece is at least 1.2 s, so no light flashes more
//   than once in any 1.2 s. The edge crackle here is CLEARTEXT's rim (settle-see createRim) flared through the same
//   flash, each rim light once a shimmer, rather than the weather crackle, whose per-frame chance could flare one
//   light four times in a second.
// - Every effect keeps the field awake while it runs: a weather effect moves the heat a little, a flash effect keeps
//   settle-see's flash alive, so a settle in rest mode (or the site's resting titles) draws the effect and then rests.
// </claudes_code_comments>

import { createBag, createRim } from 'settle-see';

export const AMBIENT = Object.freeze({
  everyMs: 3500,
  jitter: 0.45,
  resettleShare: 0.1,
  maxConcurrent: 6,
  minGapMs: 1200,
  firstFrom: 0.15,
  cardWeight: 20,
  deferMs: Object.freeze([300, 1400]),
  maxEveryMs: 120000,
});

export const AMBIENT_LIMITS = Object.freeze({
  flash: 0.6,
  heat: [1, 1.4],
  lean: [0.6, 1],
  soften: [0.55, 0.9],
  flashesPerSecond: 3,
});

const E = (name, line, strength, ms, kind) => Object.freeze({ name, line, strength, ms, kind });

// THE RANGE, from the faintest to the boldest
export const AMBIENT_EFFECTS = Object.freeze([
  E('twinkle', 'A few lights blink brighter, here and there.', 0.4, 1000, 'flash'),
  E('glint', 'A thin bright band slides across the letters, left to right.', 0.5, 1100, 'flash'),
  E('ripple', 'A faint ring of light rolls out through the words.', 0.4, 1500, 'flash'),
  E('breath', 'The words warm a little and cool again: a soft breath.', 0.4, 2000, 'weather'),
  E('haze', 'The glow softens and smears for a moment, then sharpens.', 0.5, 1800, 'weather'),
  E('tilt', 'The letters loosen for a moment and pull back into shape.', 0.5, 1600, 'weather'),
  E('crackle', 'The edges crackle with bright points for about a second.', 0.5, 1100, 'flash'),
  E('sparks', 'A few sparks flicker just off the edges.', 0.5, 1000, 'flash'),
  E('glow', 'The whole piece brightens once, softly, and fades.', 0.4, 900, 'flash'),
  E('word', 'One word scatters and settles back while the rest hold.', 0.6, 1800, 'scatter'),
  E('flurry', 'A light flurry of noise across the piece, gone in a second.', 0.5, 1400, 'scatter'),
  E('line', 'One line scatters and settles back.', 0.6, 2000, 'scatter'),
  E('resettle', 'The full re-settle: the words heat up, scatter and settle back.', 1, 3200, 'resettle'),
]);

export const AMBIENT_NAMES = Object.freeze(AMBIENT_EFFECTS.map((e) => e.name));
const BY_NAME = Object.freeze(Object.fromEntries(AMBIENT_EFFECTS.map((e) => [e.name, e])));
const SUBTLE = AMBIENT_NAMES.filter((n) => n !== 'resettle');

export const AMBIENT_PRESETS = Object.freeze({
  whisper: Object.freeze({ effects: Object.freeze(['twinkle', 'glint', 'ripple', 'breath']), everyMs: 5000, resettleShare: 0.05, scale: 0.8 }),
  gentle: Object.freeze({ effects: Object.freeze(['twinkle', 'glint', 'ripple', 'breath', 'haze', 'tilt', 'crackle', 'glow', 'word']), everyMs: 3500, resettleShare: 0.1, scale: 1 }),
  lively: Object.freeze({ effects: Object.freeze([...SUBTLE]), everyMs: 2400, resettleShare: 0.12, scale: 1.2 }),
});
export const AMBIENT_DEFAULT_PRESET = 'gentle';

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const OFF = new Set([false, null, 0, 'off', 'none']);

function strengthsOf(effects, scale, given) {
  const out = {};
  for (const n of effects) {
    const base = BY_NAME[n].strength;
    let s = base * scale;
    if (typeof given === 'number' && Number.isFinite(given)) s = base * given;
    else if (given && typeof given === 'object' && Number.isFinite(given[n])) s = given[n];
    out[n] = clamp(s, 0, 1);
  }
  return out;
}

function namesOf(list) {
  const seen = new Set();
  for (const n of list) if (typeof n === 'string' && BY_NAME[n] && n !== 'resettle') seen.add(n);
  return AMBIENT_NAMES.filter((n) => seen.has(n));
}

// an `ambient` prop -> { preset, everyMs, jitter, resettleShare, effects, strength } or null (no shimmer at all)
// opts.resettle: false takes the re-settle out of the deck; 'clock' leaves it to THE ALIVE DEFAULT's own clock
export function ambientOf(prop, opts = {}) {
  let p = prop;
  if (p === undefined || p === true) p = AMBIENT_DEFAULT_PRESET;
  if (OFF.has(p)) return null;
  let preset = AMBIENT_PRESETS[AMBIENT_DEFAULT_PRESET];
  let presetName = AMBIENT_DEFAULT_PRESET;
  let effects = null;
  let share = null;
  let every = null;
  let jitter = AMBIENT.jitter;
  let strength;
  if (typeof p === 'string') {
    if (AMBIENT_PRESETS[p]) { preset = AMBIENT_PRESETS[p]; presetName = p; }
    else if (BY_NAME[p]) { presetName = null; effects = p === 'resettle' ? [] : [p]; share = p === 'resettle' ? 1 : 0; }
    else return ambientOf(true, opts);
  } else if (Array.isArray(p)) {
    presetName = null;
    effects = namesOf(p);
    share = p.includes('resettle') ? (effects.length ? AMBIENT.resettleShare : 1) : 0;
  } else if (typeof p === 'object') {
    if (typeof p.preset === 'string' && AMBIENT_PRESETS[p.preset]) { preset = AMBIENT_PRESETS[p.preset]; presetName = p.preset; }
    if (typeof p.effects === 'string' && AMBIENT_PRESETS[p.effects]) { preset = AMBIENT_PRESETS[p.effects]; presetName = p.effects; }
    else if (typeof p.effects === 'string' && BY_NAME[p.effects]) {
      effects = namesOf([p.effects]);
      presetName = null;
      share = p.effects === 'resettle' ? 1 : 0;
    } else if (Array.isArray(p.effects)) {
      // a list deals the re-settle only when it names it, as the list form of the prop does
      effects = namesOf(p.effects);
      presetName = null;
      share = p.effects.includes('resettle') ? (effects.length ? AMBIENT.resettleShare : 1) : 0;
    }
    if (Number.isFinite(p.resettleShare)) share = clamp(p.resettleShare, 0, 1);
    if (Array.isArray(p.every) && p.every.length) {
      const lo = Math.max(AMBIENT.minGapMs, Number(p.every[0]) || AMBIENT.everyMs);
      const hi = Math.max(lo, Number(p.every[1] ?? p.every[0]) || lo);
      every = (lo + hi) / 2;
      jitter = every > 0 ? (hi - lo) / 2 / every : 0;
    } else if (Number.isFinite(p.every) && p.every > 0) every = p.every;
    if (Number.isFinite(p.jitter)) jitter = clamp(p.jitter, 0, 0.9);
    strength = p.strength;
  } else return ambientOf(true, opts);
  if (!effects) effects = [...preset.effects];
  if (share == null) share = preset.resettleShare;
  if (opts.resettle === false || opts.resettle === 'clock') share = effects.length ? 0 : share;
  if (opts.resettle === false && !effects.length) return null;
  const everyMs = clamp(every ?? preset.everyMs, AMBIENT.minGapMs, AMBIENT.maxEveryMs);
  if (!effects.length && !(share > 0)) return null;
  return {
    preset: presetName,
    everyMs,
    jitter: clamp(jitter, 0, 0.9),
    resettleShare: effects.length ? share : 1,
    effects,
    strength: strengthsOf(effects, preset.scale ?? 1, strength),
  };
}

export const ambientPeriod = (spec, rnd = Math.random) => (spec ? spec.everyMs * (0.75 + 0.5 * rnd()) : null);

export function shimmerDelay(spec, rnd = Math.random, n = 0, period = spec ? spec.everyMs : 0) {
  if (!spec) return null;
  if (n === 0) return Math.max(AMBIENT.minGapMs / 2, period * (AMBIENT.firstFrom + (1 - AMBIENT.firstFrom) * rnd()));
  return Math.max(AMBIENT.minGapMs, period * (1 + spec.jitter * (2 * rnd() - 1)));
}

// THE DECK: every effect `cardWeight` times, the re-settle as many times as makes it `share` of a round
export function deckWeights(effects, share = AMBIENT.resettleShare, k = AMBIENT.cardWeight) {
  const n = effects.length;
  if (!n) return { items: ['resettle'], weights: [1] };
  if (!(share > 0)) return { items: [...effects], weights: effects.map(() => k) };
  const s = Math.min(share, 0.9);
  const r = Math.max(1, Math.round((n * k * s) / (1 - s)));
  return { items: [...effects, 'resettle'], weights: [...effects.map(() => k), r] };
}

export function createAmbientDeck(spec, random = Math.random) {
  if (!spec) return null;
  const { items, weights } = deckWeights(spec.effects, spec.resettleShare);
  return createBag(items, { weights, random });
}

// the words of a text target: bands of rows that hold lit lights, each split where a run of dark columns is at least
// a quarter of the band's height (two lights at least); each box { x0, x1, y0, y1 } in lights, inclusive
export function wordBoxes(t, w, h) {
  const bands = [];
  let y = 0;
  while (y < h) {
    let lit = false;
    for (let x = 0; x < w && !lit; x++) if (t[y * w + x] > 0) lit = true;
    if (!lit) { y++; continue; }
    const y0 = y;
    while (y < h) {
      let any = false;
      for (let x = 0; x < w && !any; x++) if (t[y * w + x] > 0) any = true;
      if (!any) break;
      y++;
    }
    bands.push([y0, y - 1]);
  }
  const boxes = [];
  for (const [y0, y1] of bands) {
    const gap = Math.max(2, Math.round((y1 - y0 + 1) * 0.25));
    let x0 = -1;
    let dark = 0;
    for (let x = 0; x <= w; x++) {
      let lit = false;
      if (x < w) for (let yy = y0; yy <= y1 && !lit; yy++) if (t[yy * w + x] > 0) lit = true;
      if (lit) {
        if (x0 < 0) x0 = x;
        dark = 0;
      } else if (x0 >= 0) {
        dark++;
        if (dark >= gap || x === w) {
          boxes.push({ x0, x1: x - dark, y0, y1 });
          x0 = -1;
          dark = 0;
        }
      }
    }
  }
  return boxes;
}

const litOf = (t, n) => {
  const out = [];
  for (let i = 0; i < n; i++) if (t[i] > 0) out.push(i);
  return out;
};
const env = (t) => Math.sin(Math.PI * clamp(t, 0, 1));
const level = (lo, span, s) => Math.min(AMBIENT_LIMITS.flash, lo + span * s);
const heatOf = (x) => clamp(x, AMBIENT_LIMITS.heat[0], AMBIENT_LIMITS.heat[1]);

// one running effect. opts: { w, h, target (Int8Array, lit > 0), strength (0..1, the effect's default when
// unset), rnd }. weather(t) answers settle-see's weather knobs for this frame (or null); step(F, t) acts on the field
// (F.flash, F.s) once a frame. t runs from 0 to 1 over ms.
export function createShimmer(name, { w = 0, h = 0, target = null, strength, rnd = Math.random } = {}) {
  const def = BY_NAME[name];
  if (!def) return null;
  const s = clamp(Number.isFinite(strength) ? strength : def.strength, 0, 1);
  const n = w * h;
  const t0 = target && target.length === n ? target : new Int8Array(n);
  const flashed = new Set();
  // flash each light at most once a shimmer (THE LIMITS)
  const once = (F, list, a) => {
    const fresh = [];
    for (const i of list) if (!flashed.has(i)) { flashed.add(i); fresh.push(i); }
    if (fresh.length && a > 0) F.flash(fresh, Math.min(AMBIENT_LIMITS.flash, a));
    return fresh.length;
  };
  // a weather that keeps a resting field awake: the heat moves a hair while the effect runs
  const awake = (t) => ({ heat: 1 + 0.02 * env(t) });
  const base = { name, kind: def.kind, ms: def.ms, strength: s, weather: awake, step: () => 0, end: () => {}, get flashed() { return flashed.size; } };
  if (!n) return base;
  const lit = litOf(t0, n);

  if (name === 'twinkle') {
    const k = clamp(Math.round(lit.length * 0.03 * s), Math.min(4, lit.length), 64);
    const picks = [];
    for (let j = 0; j < k; j++) picks.push({ i: lit[Math.floor(rnd() * lit.length)], at: 0.75 * rnd() });
    const a = level(0.25, 0.4, s);
    return { ...base, step: (F, t) => once(F, picks.filter((p) => p.at <= t).map((p) => p.i), a) };
  }
  if (name === 'glint') {
    const bw = Math.max(3, Math.round(w * 0.06));
    const slant = 0.35;
    const a = level(0.3, 0.55, s);
    // the band's leading edge sweeps from off the left to off the right; each frame lights every lit light the edge
    // crossed since the last frame (so a slow frame rate leaves no gaps), and the flash's own fade is the band's tail
    let last = -bw - h * slant;
    return {
      ...base,
      step: (F, t) => {
        const cx = -bw - h * slant + (w + 2 * bw + h * slant) * t;
        const hits = [];
        for (const i of lit) {
          const x = i % w;
          const y = (i - x) / w;
          const at = x - (h - 1 - y) * slant;
          if (at >= last - bw / 2 && at <= cx + bw / 2) hits.push(i);
        }
        last = cx;
        return once(F, hits, a);
      },
    };
  }
  if (name === 'ripple') {
    const o = lit.length ? lit[Math.floor(rnd() * lit.length)] : 0;
    const ox = o % w;
    const oy = (o - ox) / w;
    const far = Math.max(Math.hypot(ox, oy), Math.hypot(w - ox, oy), Math.hypot(ox, h - oy), Math.hypot(w - ox, h - oy));
    const a = level(0.22, 0.45, s);
    let lastR = 0;
    return {
      ...base,
      step: (F, t) => {
        const R = far * t;
        const hits = [];
        for (const i of lit) {
          const x = i % w;
          const y = (i - x) / w;
          const d = Math.hypot(x - ox, y - oy);
          if (d >= lastR - 1.5 && d <= R + 1.5) hits.push(i);
        }
        lastR = R;
        return once(F, hits, a);
      },
    };
  }
  if (name === 'breath') return { ...base, weather: (t) => ({ heat: heatOf(1 + 0.9 * s * env(t)) }) };
  if (name === 'haze') {
    return { ...base, weather: (t) => ({ heat: heatOf(1 + 0.08 * env(t)), soften: clamp(0.55 + 0.4 * s * env(t), AMBIENT_LIMITS.soften[0], AMBIENT_LIMITS.soften[1]) }) };
  }
  if (name === 'tilt') return { ...base, weather: (t) => ({ heat: 1 + 0.03 * env(t), lean: clamp(1 - 0.6 * s * env(t), AMBIENT_LIMITS.lean[0], AMBIENT_LIMITS.lean[1]) }) };
  if (name === 'crackle' || name === 'sparks') {
    const rim = createRim();
    rim.update(t0, w, h);
    const pool = name === 'crackle' ? [...rim.inner, ...rim.outer.filter(() => rnd() < 0.3)] : [...rim.outer, ...rim.far];
    // a shuffled pool, dealt a slice a frame, so each rim light flares at most once a shimmer
    for (let j = pool.length - 1; j > 0; j--) {
      const k = Math.floor(rnd() * (j + 1));
      [pool[j], pool[k]] = [pool[k], pool[j]];
    }
    const share = name === 'crackle' ? 0.12 + 0.3 * s : 0.05 + 0.15 * s;
    const total = Math.round(pool.length * share);
    const a = name === 'crackle' ? level(0.3, 0.45, s) : level(0.25, 0.4, s);
    let dealt = 0;
    return {
      ...base,
      step: (F, t) => {
        const upTo = Math.min(total, Math.round(total * clamp(t / 0.9, 0, 1)));
        const slice = pool.slice(dealt, upTo);
        dealt = Math.max(dealt, upTo);
        return once(F, slice, a * (0.55 + 0.45 * rnd()));
      },
    };
  }
  if (name === 'glow') return { ...base, step: (F) => once(F, lit, level(0.15, 0.35, s)) };
  if (name === 'word' || name === 'line' || name === 'flurry') {
    // THE LOCAL MELT: the region (a word, a line, or the whole piece for a flurry) is chosen once; its lights' lean
    // toward the words is turned down (to a tenth for a word or a line at the default strength, so they scatter; to
    // a half for a flurry, so the piece fizzes), held, then turned back up, through the field's own per-light leans (F.setLeans), and the
    // settle brings the lights home as the lean returns. A flip alone would not show: at the simmer the next sweep
    // undoes it before it is drawn. The leans are handed back (setLeans(null)) when the effect ends or is dropped.
    const DIP = name === 'flurry' ? 0.75 - 0.5 * s : 0.4 - 0.5 * s;
    const DOWN = 0.12;
    const HOLD = name === 'flurry' ? 0.25 : 0.32;
    const BACK = 0.85;
    const factor = (t) => {
      if (t < DOWN) return 1 + (DIP - 1) * (t / DOWN);
      if (t < HOLD) return DIP;
      if (t < BACK) return DIP + (1 - DIP) * ((t - HOLD) / (BACK - HOLD));
      return 1;
    };
    let mask = null;
    let buf = null;
    let set = false;
    const end = (F) => {
      if (set && F && F.setLeans) F.setLeans(null);
      set = false;
    };
    return {
      ...base,
      factor,
      weather: (t) => ({ heat: heatOf(1 + 0.06 * env(t)) }),
      end,
      step: (F, t) => {
        if (!mask) {
          mask = new Uint8Array(n);
          let x0 = 0;
          let x1 = w - 1;
          let y0 = 0;
          let y1 = h - 1;
          if (name !== 'flurry') {
            const boxes = wordBoxes(t0, w, h);
            if (!boxes.length) return 0;
            if (name === 'word') ({ x0, x1, y0, y1 } = boxes[Math.floor(rnd() * boxes.length)]);
            else {
              const rows = [...new Set(boxes.map((b) => `${b.y0},${b.y1}`))];
              [y0, y1] = rows[Math.floor(rnd() * rows.length)].split(',').map(Number);
            }
          }
          // a light's margin around the box, so the scatter has room to spill
          for (let y = Math.max(0, y0 - 1); y <= Math.min(h - 1, y1 + 1); y++) for (let x = Math.max(0, x0 - 1); x <= Math.min(w - 1, x1 + 1); x++) mask[y * w + x] = 1;
        }
        if (!F || !F.setLeans) return 0;
        const f = factor(t);
        if (f >= 1) {
          end(F);
          return 0;
        }
        if (!buf) buf = new Float32Array(n);
        const lean = Number.isFinite(F.lean) ? F.lean : 1.1;
        const tg = F.target && F.target.length === n ? F.target : t0;
        let melted = 0;
        for (let i = 0; i < n; i++) {
          const k = mask[i] ? f : 1;
          buf[i] = lean * tg[i] * k;
          if (mask[i]) melted++;
        }
        F.setLeans(buf);
        set = true;
        return melted;
      },
    };
  }
  return base;
}
