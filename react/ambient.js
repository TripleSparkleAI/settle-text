// settle-text/react · ambient - useAmbient, THE AMBIENT SHIMMER's clock for one settle (settle-text 0.5.0, lane
// STXSHIMMER). Lights uses it for every package component, and the SETTLE site's own SettleText (its page titles)
// uses the same hook, so one piece of code deals every shimmer on a page.
//
// <claudes_code_comments>
// ** Function List **
// resettleMode(resettle, breathe) - how a settle re-settles under the shimmer: 'deck' (a card in the deck, the
//                                   default), 'clock' (the caller set an interval: THE ALIVE DEFAULT's own clock runs
//                                   and the deck deals only the small effects) or false (no re-settle at all)
// useAmbient(opts)                - the shimmer schedule of one settle; returns { spec, weather, beforeStep,
//                                   shimmering } to hand to settle-see's Settle component (weather and beforeStep) and to the
//                                   frame rate (shimmering: run at the settling rate while an effect plays)
//   ambient      the prop (src/ambient.js ambientOf); resettle the mode above
//   active       true while the settle is alive and on screen (false: no clock, no effect)
//   handle       a ref to settle-see's live handle (its field is what the effect acts on)
//   id           the settle's id on the page's conductor
//   resettleNow  () => bool: start the full re-settle now (false when the conductor's re-settle cap is full)
//   onShimmer    fn({ count, name, kind, strength }) at each shimmer
//
// ** Technical Review **
// - ONE CLOCK PER SETTLE: on becoming active the hook draws this piece's own period (ambientPeriod) and phase (the
//   first shimmer 0.15 to 1 period later), and builds its own deck (createAmbientDeck, settle-see's THE DECK RULE).
//   Each later shimmer starts the effect's length plus a gap of the period +/- jitter after the last one started, so a
//   piece never runs two shimmers at once and there are at least AMBIENT.minGapMs between them.
// - THE CROWD: a small effect asks the page conductor's shimmer channel (at most 6 at once); a re-settle asks the
//   re-settle cap (4). A card that finds its cap full goes back on top of the deck and is asked again in 0.3 to 1.4 s:
//   a crowd waits its turn, it never goes still.
// - THE EFFECT runs inside settle-see's own frame: weather(info) answers the knobs for this frame and beforeStep(F)
//   lights or flips the field's lights, both reading the effect's progress from the wall clock. When the effect ends
//   both return to neutral, so a settle with no shimmer playing pays one function call a frame. An effect that lent
//   the field something (a scatter's per-light leans) is handed end(F) on the frame after it ends, or at once when
//   the settle stops (off screen, unmounted).
// - A hidden tab skips its turn; going off screen (active false) stops the clock and drops a running effect.
// </claudes_code_comments>

import { useEffect, useMemo, useRef, useState } from 'react';
import { ambientOf, ambientPeriod, shimmerDelay, createAmbientDeck, createShimmer, AMBIENT } from '../src/ambient.js';
import { ALIVE } from '../src/alive.js';
import { CONDUCTOR } from './defaults.js';
import { nowMs } from './hooks.js';

export function resettleMode(resettle, breathe) {
  if (resettle === false || resettle === null || resettle === 0 || resettle === 'off') return false;
  if (resettle === undefined && breathe !== undefined && breathe !== true) return breathe === false || breathe === null ? false : 'clock';
  if (typeof resettle === 'number' || typeof resettle === 'function') return 'clock';
  if (resettle && typeof resettle === 'object' && (Array.isArray(resettle.every) || Number.isFinite(resettle.every))) return 'clock';
  return 'deck';
}

const deferOf = () => AMBIENT.deferMs[0] + (AMBIENT.deferMs[1] - AMBIENT.deferMs[0]) * Math.random();

export function useAmbient({ ambient, resettle = 'deck', active = false, handle, id, resettleNow, onShimmer }) {
  const key = (typeof ambient === 'object' && ambient ? JSON.stringify(ambient) : String(ambient)) + `|${resettle}`;
  const spec = useMemo(() => ambientOf(ambient, { resettle }), [key]);
  const cur = useRef(null);
  // an effect that has just ended: the next frame hands back what it lent the field (a scatter's leans)
  const ending = useRef(null);
  const [shimmering, setShimmering] = useState(false);
  const cb = useRef({});
  cb.current = { resettleNow, onShimmer };

  useEffect(() => {
    if (!spec || !active) return undefined;
    const rnd = Math.random;
    const deck = createAmbientDeck(spec, rnd);
    const period = ambientPeriod(spec, rnd);
    let n = 0;
    let count = 0;
    let tid = 0;
    let off = 0;
    let dead = false;
    const plan = (ms) => {
      if (!dead) tid = setTimeout(fire, ms);
    };
    const told = (name, kind, strength) => {
      count += 1;
      CONDUCTOR.note(name);
      cb.current.onShimmer?.({ count, name, kind, strength });
    };
    const fire = () => {
      if (dead) return;
      if (typeof document !== 'undefined' && document.hidden) return plan(shimmerDelay(spec, rnd, ++n, period));
      const card = deck.next();
      const now = nowMs();
      if (card === 'resettle') {
        if (!cb.current.resettleNow?.()) {
          deck.putBack(card);
          CONDUCTOR.note(card, true);
          return plan(deferOf());
        }
        told('resettle', 'resettle', 1);
        return plan(ALIVE.rampMs + ALIVE.coolMs + shimmerDelay(spec, rnd, ++n, period));
      }
      const F = handle.current?.field;
      if (!F || !F.w) {
        deck.putBack(card);
        return plan(deferOf());
      }
      const fx = createShimmer(card, { w: F.w, h: F.h, target: F.target, strength: spec.strength[card], rnd });
      if (!fx || !CONDUCTOR.tryShimmer(id, now, fx.ms)) {
        deck.putBack(card);
        CONDUCTOR.note(card, true);
        return plan(deferOf());
      }
      cur.current = { fx, start: now };
      handle.current?.play?.();
      setShimmering(true);
      clearTimeout(off);
      off = setTimeout(() => setShimmering(false), fx.ms + 120);
      told(card, fx.kind, fx.strength);
      plan(fx.ms + shimmerDelay(spec, rnd, ++n, period));
    };
    plan(shimmerDelay(spec, rnd, 0, period));
    return () => {
      dead = true;
      clearTimeout(tid);
      clearTimeout(off);
      if (cur.current) cur.current.fx.end?.(handle.current?.field);
      cur.current = null;
      ending.current = null;
      setShimmering(false);
    };
  }, [spec, active]);

  // read by settle-see once a frame: the running effect's knobs, then its touch on the field
  const hooks = useMemo(
    () => ({
      weather: () => {
        const c = cur.current;
        if (!c) return null;
        const t = (nowMs() - c.start) / c.fx.ms;
        if (t >= 1) {
          ending.current = c.fx;
          cur.current = null;
          return null;
        }
        return c.fx.weather(Math.max(0, t));
      },
      beforeStep: (F) => {
        if (ending.current) {
          ending.current.end?.(F);
          ending.current = null;
        }
        const c = cur.current;
        if (!c) return;
        c.fx.step(F, Math.max(0, Math.min(1, (nowMs() - c.start) / c.fx.ms)));
      },
    }),
    [],
  );

  return { spec, weather: hooks.weather, beforeStep: hooks.beforeStep, shimmering };
}
