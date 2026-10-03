// settle-text · heat - the temperature over time: hot at the start, cooling to an exact cold so the picture rests,
// warmed again by a breath or a kick. Plain JavaScript; the React layer hands it to settle-see as the schedule.
//
// <claudes_code_comments>
// ** Function List **
// tauFor(settleMs)               - the cooling time constant for a settle time (the picture is cold at settleMs)
// createHeat({ cold, hot, settleMs, eps }) - the curve: T(now) and kick(level, now); T snaps to exactly `cold`
//                                   below eps, so settle-see's rest rule can stop the frames
// breathDelay(rnd, breath)       - the wait before the next idle breath, 7 to 11 s by default
// breathOf(breathe)              - a breathe prop (true | false | seconds | { every, level }) -> { minMs, spreadMs, level } | null
//
// ** Technical Review **
// - T(now) = cold + (hot - cold) * level * exp(-(now - t0) / tau). The excess drops under eps (0.01) at
//   tau * ln((hot - cold) * level / eps); for a full kick that is about 5.3 tau, so tau = settleMs / 5.3 puts the
//   exact cold at settleMs. A kick never lowers the heat it finds.
// - At the default cold (0.45) an unlit light far from the picture stays dark (its chance of flipping on is
//   about 0.0001 a sweep) and the picture's edges keep a faint waver until the rest. A lower cold is stiller, a
//   higher one noisier: the `temperature` prop of every component is this cold.
// </claudes_code_comments>

import { HEAT, BREATH } from './presets.js';

export const tauFor = (settleMs = HEAT.settleMs) => Math.max(40, settleMs) / 5.3;

export function createHeat({ cold = HEAT.cold, hot = HEAT.hot, settleMs = HEAT.settleMs, eps = HEAT.eps } = {}) {
  const tau = tauFor(settleMs);
  let level = 0;
  let t0 = 0;
  const excess = (now) => (level > 0 ? (hot - cold) * level * Math.exp(-Math.max(0, now - t0) / tau) : 0);
  return {
    cold,
    hot,
    tau,
    T(now) {
      const x = excess(now);
      if (x < eps) {
        level = 0;
        return cold;
      }
      return cold + x;
    },
    kick(lvl, now) {
      const have = excess(now) / (hot - cold);
      level = Math.max(have, Math.min(1, Math.max(0, lvl)));
      t0 = now;
    },
    isCold(now) {
      return excess(now) < eps;
    },
  };
}

export function breathOf(breathe) {
  if (breathe === false || breathe == null) return null;
  if (breathe === true) return { ...BREATH };
  if (typeof breathe === 'number' && breathe > 0) return { minMs: breathe * 1000, spreadMs: breathe * 400, level: BREATH.level };
  if (typeof breathe === 'object') {
    const every = Array.isArray(breathe.every) ? breathe.every : [BREATH.minMs / 1000, (BREATH.minMs + BREATH.spreadMs) / 1000];
    const minMs = Math.max(200, every[0] * 1000);
    const spreadMs = Math.max(0, (every[1] ?? every[0]) * 1000 - minMs);
    return { minMs, spreadMs, level: Math.max(0, Math.min(1, breathe.level ?? BREATH.level)) };
  }
  return { ...BREATH };
}

export function breathDelay(rnd = Math.random, breath = BREATH) {
  return breath.minMs + rnd() * breath.spreadMs;
}
