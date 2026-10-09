// settle-text/react · defaults - SettleTextDefaults (one place to set the live props for a whole subtree) and the
// page's one conductor, which thins the alive default when many settles are on screen at once.
//
// <claudes_code_comments>
// ** Function List **
// SettleTextDefaults({ value, children }) - a provider: every settle-text component inside it takes these values
//                               for any prop it was not given (temperature, resettle, rest, still, palette, dim,
//                               resolution, glow, simmerFps, fps, settleTime, intro, maxConcurrent, and since
//                               0.5.0 ambient (THE AMBIENT SHIMMER; shimmer is its alias) and maxShimmers)
// useSettleTextDefaults()    - the merged defaults in effect here ({} outside any provider)
// pick(prop, key, ctx, fallback) - prop ?? ctx[key] ?? fallback
// CONDUCTOR                  - the page's one conductor (src/alive.js createConductor): who is alive on screen, how
//                              many re-settles run at once, and how many ambient shimmers (src/ambient.js); its tally
//                              is readable as globalThis.__settleTextAmbient() for a measurement
// useAliveCount(on)          - the number of alive settles on screen, quantised to the thinning steps so a component
//                              re-renders only when its simmer rate would change
//
// ** Technical Review **
// - A provider nests: an inner one overrides only the keys it names. `maxConcurrent` on any provider sets the page
//   conductor's cap (the cap is page-wide, so the outermost value set last wins).
// - The conductor is module state, one per page, shared by every copy of the components on it.
// </claudes_code_comments>

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ALIVE, createConductor, thinFor } from '../src/alive.js';
import { AMBIENT } from '../src/ambient.js';

const Ctx = createContext({});

export const CONDUCTOR = createConductor({ maxConcurrent: ALIVE.maxConcurrent, maxShimmers: AMBIENT.maxConcurrent });
// the page's tally of shimmers, for a measurement (settle-see's meter is globalThis.__settlePerfs the same way)
if (typeof globalThis !== 'undefined') globalThis.__settleTextAmbient = () => CONDUCTOR.stats();

export function SettleTextDefaults({ value = {}, children }) {
  const outer = useContext(Ctx);
  const key = JSON.stringify(value, (k, v) => (typeof v === 'function' ? String(v) : v));
  const merged = useMemo(() => ({ ...outer, ...value }), [outer, key]);
  useEffect(() => {
    if (Number.isFinite(value.maxConcurrent) && value.maxConcurrent > 0) CONDUCTOR.setMax(value.maxConcurrent);
    if (Number.isFinite(value.maxShimmers) && value.maxShimmers > 0) CONDUCTOR.setShimmerMax(value.maxShimmers);
  }, [value.maxConcurrent, value.maxShimmers]);
  return React.createElement(Ctx.Provider, { value: merged }, children);
}

export const useSettleTextDefaults = () => useContext(Ctx);

export const pick = (prop, key, ctx, fallback) => (prop !== undefined ? prop : ctx && ctx[key] !== undefined ? ctx[key] : fallback);

// the thinning step a count falls in, so a component re-renders only when its rate would change
const stepOf = (n) => {
  const t = thinFor(n);
  return `${t.simmerScale}|${t.everyScale}|${t.rest}`;
};

export function useAliveCount() {
  const [n, setN] = useState(CONDUCTOR.count);
  useEffect(() => {
    let last = stepOf(CONDUCTOR.count);
    setN(CONDUCTOR.count);
    return CONDUCTOR.subscribe((count) => {
      const s = stepOf(count);
      if (s !== last) {
        last = s;
        setN(count);
      }
    });
  }, []);
  return n;
}
