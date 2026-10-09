// settle-text/react · Lights - the one place this package mounts settle-see. Every component (text, image, vector,
// background) builds a grid and a target and hands them here; this file owns the temperature, THE ALIVE DEFAULT
// (the simmer and the re-settle schedule), the colour modes, the off-screen pause, reduced motion, the still flag and
// the screen-reader text.
//
// <claudes_code_comments>
// ** Function List **
// Lights(props)  - one settle-see <Settle> on an exact grid with a transparent plate
//   cols, rows, cssH            the grid and its CSS height (the width is the box's)
//   spec                        the settle-see target spec (a draw function, bits, an image) or null while loading
//   colour                      a settle-see neon key or a hex (already resolved)
//   source                      { palette, paint }: a picture that keeps its own colours ('map' mode)
//   palette                     the colour mode: 'single' (default) | 'meaning' | 'duo' | a gradient (src/palette.js)
//   offColour                   the unlit neon for 'duo' (resolved)
//   dim                         how bright an unlit light is (0: only the lit lights are drawn)
//   glow                        the bloom (0 raw dots)
//   temperature                 the simmer: where the lights rest and keep flickering (0.6; 0.3.0 rested at 0.45)
//   settleTime                  ms from noise to the picture, and from a re-settle's peak back to the simmer
//   haze                        THE ACTIVE HAZE (0.6.0, src/haze.js): the re-settle rotation, true (every 8 to 15 s,
//                               the default) | false | ms | { every, jitter, level, ramp, cool, kind }
//   resettle                    the 0.5.0 schedule, read when haze is not given: true | false | ms | { every, jitter,
//                               level, kind } | (n) => ms
//   breathe                     0.3.0's idle breath, read as a resettle when resettle is not given
//   ambient                     THE AMBIENT SHIMMER (0.5.0, src/ambient.js): true (the 'gentle' preset) | false |
//                               'whisper' | 'gentle' | 'lively' | an effect name | [names] | { preset, every, jitter,
//                               resettleShare, effects, strength }; `shimmer` is its alias
//   onShimmer(info)             fired at each shimmer: { count, name, kind, strength }
//   rest                        true: cool to the temperature and stop drawing until the next re-settle (0.3.0's
//                               behaviour, the cheap one); default false, the alive simmer
//   intro                       the heat at mount, 0 to 1 (1: out of full noise; 0: the picture is there at once)
//   fps, simmerFps              sweeps a second while settling (24) and while simmering (12, thinned on a busy page)
//   paused                      the page's own pause
//   still                       the static flag: the lights are drawn as the picture once and the frames stop
//   onSettled(info)             fired once per target when the heat is cold and the lights agree with it
//   onResettle(info)            fired at each re-settle: { count, level, kind }
//   label, decorative           the words a screen reader hears (a visually hidden span); decorative hides all
//   onHandle                    settle-see's live handle (and null on unmount)
//   transition                  how a NEW target is shown (src/transition.js transitionOf)
//   hover                       true (0.6) or 0..1: a heat kick on pointerenter and focus of the enclosing control
//   perfLabel                   the name settle-see's meter shows
//   className, style, children  the outer box
//
// ** Technical Review **
// - THE PHYSICS is settle-see's: lean 1.1 toward the target, pull 0.3 to four neighbours, one Gibbs sweep a frame,
//   the pointer's sparkle off, the page quality ladder off. A transparent plate: only lit dots are drawn (unless
//   `dim` lights the rest faintly), so the component sits on any background the page gives its box.
// - THE ALIVE DEFAULT (0.4.0): the temperature is a wall-clock curve (src/heat.js) that rests at the SIMMER, warm
//   enough that the lights keep flickering, and settle-see's rest is OFF, so the field keeps sweeping at simmerFps.
//   On the schedule (src/alive.js) the heat ramps up over 300 ms, the words scatter a little, and they settle back
//   over settleTime at the full fps. `rest` brings back 0.3.0's resting picture: the same curve, settle-see's rest on,
//   zero frames between re-settles. A still settle always rests: settle-see's still sits at its own cold (0.3) and
//   would keep sweeping and flickering if rest were handed false (measured: the still card's canvas changed in 9 of
//   9 reads 300 ms apart until this was fixed).
// - THE AMBIENT SHIMMER (0.5.0): useAmbient (react/ambient.js) gives each settle its own deck and clock of small
//   effects, handed to settle-see as its weather and beforeStep hooks, and about 1 card in 10 is the full re-settle
//   (resettleNow below). While an effect plays the field sweeps at the settling rate (fps), so a glint moves
//   smoothly. A `resettle` given as an interval keeps THE ALIVE DEFAULT's own clock and the deck deals only the
//   small effects; `resettle={false}` takes the re-settle out; `ambient={false}` is 0.4.0's behaviour exactly.
//   The box says which deck it deals (data-settle-ambient: the preset, 'custom' or 'off') and its last shimmer
//   (data-settle-shimmer: '<count> <name>'), so a page or a measurement can read them.
// - THE ACTIVE HAZE (0.6.0): hazePlan decides which clock runs the full re-settle. By default ('haze') each piece
//   runs its own rotation (createHazeClock, a random phase, the interval +/- its jitter): on its turn fireResettle
//   ramps the heat over 600 ms to 0.9 to 1 and the haze settles back over 3 s, and the shimmer deck deals only small
//   effects. A caller who set resettle or breathe and no haze gets 0.5.0 exactly ('legacy'). haze={false} with no
//   resettle runs no full re-settle ('off'). The clock runs only while the box is on screen and not paused, skips its
//   turn in a hidden tab, and never runs frozen (still or reduced motion). The box says data-settle-haze and, after
//   each turn, data-settle-haze-turn.
// - THE PAGE THINS ITSELF: an alive settle on screen joins the page's conductor (react/defaults.js), weighted by its
//   lights (weightOf). The simmer rate and the re-settle interval follow the weighted crowd on screen (thinFor), at most maxConcurrent
//   re-settles run at once, and past 40 alive on screen each rests between its re-settles. Never static.
// - COST WHEN IT SHOULD BE NOTHING: off screen it is paused (an IntersectionObserver on the box) and leaves the
//   conductor; a hidden tab halts settle-see's ticker and skips the schedule. Under prefers-reduced-motion, and with
//   `still`, settle-see's still: the lights start AS the picture, are drawn once and rest; no kick, no schedule.
// - ONE SETTLED EVENT per target: onSettled fires when the heat is back at the simmer and the lights' overlap with
//   the target is at least 0.97 (settle-see's onStats, every 4 frames); in still mode it fires once at mount.
// - A NEW TARGET: the first target, and any target on a different grid, comes out of noise (kick at `intro`). On the
//   same grid a 'morph' hands the change to settle-see's own morph and wakes the field with a small heat
//   (transition.wake, 0.3); a 'cut' shows the new target snapped. Under reduced motion and still every change is a cut.
// - What this package does not expose from settle-see: films, audio, the pulse bus, the master beat, the drag box.
// </claudes_code_comments>

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Settle, toTarget } from 'settle-see/react';
import { TEXT, HEAT } from '../src/presets.js';
import { createHeat } from '../src/heat.js';
import { ALIVE, resettleOf, resettleDelay, resettleLevel, thinFor, simmerFpsFor, weightOf } from '../src/alive.js';
import { paletteOf, gradientStops, gradientPaint, GRADIENT_STOPS } from '../src/palette.js';
import { HOVER, hoverLevelOf, createHoverGate } from '../src/hover.js';
import { useReducedMotion, useOnScreen, nowMs } from './hooks.js';
import { CONDUCTOR, pick, useAliveCount, useSettleTextDefaults } from './defaults.js';
import { useAmbient, resettleMode } from './ambient.js';
import { hazePlan, hazeLevel, createHazeClock } from '../src/haze.js';

const SR = { position: 'absolute', width: 1, height: 1, margin: -1, padding: 0, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 };
let nextId = 1;

export function Lights({
  cols,
  rows,
  cssH,
  spec,
  colour = '#ff2fa0',
  source,
  palette,
  offColour,
  dim,
  glow = TEXT.glow,
  temperature,
  settleTime,
  resettle,
  breathe,
  haze,
  rest,
  intro,
  paused = false,
  still,
  onSettled,
  onResettle,
  ambient,
  shimmer,
  onShimmer,
  label = '',
  decorative = false,
  onHandle,
  perfLabel = 'settle-text',
  className = '',
  style,
  children,
  lean = TEXT.lean,
  pull = TEXT.pull,
  fps,
  simmerFps,
  transition = null,
  hover = false,
}) {
  const ctx = useSettleTextDefaults();
  const reduced = useReducedMotion();
  const box = useRef(null);
  const handle = useRef(null);
  const id = useRef(0);
  if (!id.current) id.current = nextId++;
  const onScreen = useOnScreen(box);
  const frozen = !!pick(still, 'still', ctx, false) || reduced;
  const resting = !!pick(rest, 'rest', ctx, false);
  const T0 = Number(pick(temperature, 'temperature', ctx, resting ? HEAT.cold : ALIVE.temperature));
  const settleMs = Number(pick(settleTime, 'settleTime', ctx, HEAT.settleMs));
  const introLevel = Math.max(0, Math.min(1, Number(pick(intro, 'intro', ctx, 1))));
  const fpsHot = Number(pick(fps, 'fps', ctx, ALIVE.fps));
  const fpsSimmerBase = Number(pick(simmerFps, 'simmerFps', ctx, ALIVE.simmerFps));
  const dimLevel = Math.max(0, Math.min(1, Number(pick(dim, 'dim', ctx, 0))));
  const resettleProp = pick(resettle, 'resettle', ctx, undefined);
  const schedKey = typeof resettleProp === 'function' ? resettleProp : JSON.stringify(resettleProp ?? null) + JSON.stringify(breathe ?? null);
  const resettleSpec = useMemo(() => (frozen ? null : resettleOf(resettleProp, breathe)), [frozen, schedKey]);
  // THE AMBIENT SHIMMER: the prop (or its alias shimmer, or the provider's), and how the re-settle takes part in it
  const ambientProp = ambient !== undefined ? ambient : shimmer !== undefined ? shimmer : ctx.ambient !== undefined ? ctx.ambient : ctx.shimmer;
  // THE ACTIVE HAZE (0.6.0, src/haze.js): which clock runs the full re-settle. 'haze' is the rotation (the default);
  // 'legacy' keeps 0.5.0's meaning of a resettle or breathe prop the caller set; 'off' runs no full re-settle at all
  const hazeProp = pick(haze, 'haze', ctx, undefined);
  const hazeKey = JSON.stringify(hazeProp ?? null);
  const plan = useMemo(() => hazePlan({ haze: hazeProp, resettle: resettleProp, breathe, frozen }), [hazeKey, schedKey, frozen]);
  const legacy = plan.mode === 'legacy';
  const hazeSpec = plan.mode === 'haze' ? plan.spec : null;
  const rMode = legacy ? resettleMode(resettleProp, breathe) : hazeSpec ? 'clock' : false;

  // the page's conductor: an alive settle on screen is a member, and the count thins the simmer and the schedule
  const alive = !frozen && !resting && !paused && onScreen && !!spec;
  const weight = weightOf(cols * rows);
  useEffect(() => {
    if (!alive) return undefined;
    const me = id.current;
    CONDUCTOR.join(me, weight);
    return () => CONDUCTOR.leave(me);
  }, [alive, weight]);
  // the shimmer runs while the settle is on screen and moving (a resting settle shimmers too: the effect wakes it)
  const amb = useAmbient({
    ambient: frozen ? false : ambientProp,
    resettle: rMode,
    active: !frozen && !paused && onScreen && !!spec,
    handle,
    id: id.current,
    resettleNow: () => fireResettle(),
    onShimmer: (info) => {
      // the page can read each settle's own count (a measurement, a debugger); one attribute write a shimmer
      if (box.current) box.current.dataset.settleShimmer = `${info.count} ${info.name}`;
      onShimmer?.(info);
    },
  });
  // THE ALIVE DEFAULT's own clock (legacy mode only) runs when there is no shimmer, or when the caller set the
  // re-settle's interval; in haze mode the rotation below is the one clock
  const sched = !legacy || (amb.spec && rMode !== 'clock') ? null : resettleSpec;
  const count = useAliveCount();
  const thin = thinFor(alive ? count : 0);
  const simmer = simmerFpsFor(alive ? count : 0, fpsSimmerBase);
  const restNow = resting || (alive && thin.rest);

  // the temperature: a wall-clock curve settle-see reads as its schedule
  const heat = useRef(null);
  if (!heat.current || heat.current.cold !== T0 || heat.current.settleMs !== settleMs) {
    heat.current = Object.assign(createHeat({ cold: T0, settleMs }), { settleMs });
  }
  const schedule = useMemo(() => () => {
    const T = heat.current.T(nowMs());
    return { T, phase: T === heat.current.cold ? 'settled' : 'cooling' };
  }, []);

  // HOT: a kick runs the field at the full rate until it is back at the simmer, then the simmer rate takes over
  const [hot, setHot] = useState(true);
  const hotTimer = useRef(0);
  const kick = (level, rampMs = 0, coolMs = null) => {
    if (frozen || !(level > 0)) return;
    heat.current.kick(level, nowMs(), rampMs, coolMs);
    handle.current?.play();
    setHot(true);
    clearTimeout(hotTimer.current);
    hotTimer.current = setTimeout(() => setHot(false), (coolMs ?? settleMs) + rampMs + 150);
  };
  useEffect(() => () => clearTimeout(hotTimer.current), []);

  const items = useMemo(() => (spec ? [spec] : null), [spec]);
  const settledFor = useRef(null);
  const [tick, setTick] = useState(0);

  // A NEW TARGET: out of noise at the mount and on a new grid; on the same grid a morph or a cut (transition)
  const gridKey = `${cols}x${rows}`;
  const last = useRef({ spec: null, grid: '' });
  const sameGrid = !!last.current.spec && last.current.grid === gridKey;
  const morphing = !!(transition && transition.kind === 'morph' && sameGrid && !frozen);
  useEffect(() => {
    settledFor.current = null;
    if (!spec) return;
    const prev = last.current;
    last.current = { spec, grid: gridKey };
    const change = !!prev.spec && prev.spec !== spec && prev.grid === gridKey && !!transition;
    if (!change) {
      if (introLevel > 0) kick(introLevel);
      else if (handle.current && !frozen) {
        handle.current.show(toTarget(spec, cols, rows), { snap: true });
        kick(0.15);
      }
    } else if (transition.kind === 'cut' || frozen) {
      const h = handle.current;
      if (h) h.show(toTarget(spec, cols, rows), { snap: true });
    } else kick(transition.wake ?? 0.3);
    if (frozen && onSettled) {
      settledFor.current = spec;
      onSettled({ still: true, overlap: 1, lights: cols * rows });
    }
  }, [spec, frozen]);

  // ONE RE-SETTLE, from the clock below or dealt from the shimmer deck: the words heat up, scatter a little and
  // settle back. False when the conductor's re-settle cap is full (the caller tries again later)
  const hooks = useRef({});
  hooks.current = { onResettle, settleMs, everyScale: thin.everyScale };
  const done = useRef(0);
  function fireResettle(spec0 = resettleSpec ?? resettleOf(true), isHaze = false) {
    if (frozen || !spec0) return false;
    const level = isHaze ? hazeLevel(spec0, Math.random) : resettleLevel(spec0, Math.random);
    const cool = spec0.coolMs ?? ALIVE.coolMs;
    const ramp = isHaze ? spec0.rampMs : ALIVE.rampMs;
    const ms = cool + ramp;
    if (!CONDUCTOR.tryStart(id.current, nowMs(), ms)) return false;
    const n = done.current;
    const shake = spec0.kind === 'shake' || (spec0.kind === 'mix' && n % 3 === 2);
    if (shake && handle.current) {
      try {
        handle.current.shake(Math.min(0.6, level * 0.6));
      } catch {
        /* a field that cannot shake still re-settles by heat */
      }
      kick(level * 0.6, 0, cool);
    } else kick(level, ramp, cool);
    done.current = n + 1;
    if (isHaze && box.current) box.current.dataset.settleHazeTurn = String(n + 1);
    hooks.current.onResettle?.({ count: n + 1, level, kind: shake ? 'shake' : 'heat', haze: isHaze });
    return true;
  }

  // THE ACTIVE HAZE's rotation: on screen and not paused, one clock per piece on its own random phase; a hidden tab
  // skips its turns, and the IntersectionObserver (useOnScreen) stops the clock off screen
  useEffect(() => {
    if (!hazeSpec || !onScreen || paused || !spec) return undefined;
    const clock = createHazeClock({ spec: hazeSpec, fire: () => fireResettle(hazeSpec, true), scale: () => hooks.current.everyScale });
    clock.start();
    return () => clock.stop();
  }, [hazeSpec, onScreen, paused, spec, tick]);

  // THE RE-SETTLE CLOCK (0.4.0's schedule): on the cadence the component sets, when no shimmer deals the re-settle
  useEffect(() => {
    if (!sched || !onScreen || paused || !spec) return undefined;
    let tid = 0;
    let n = 0;
    let dead = false;
    const plan = () => {
      const d = resettleDelay(sched, Math.random, n, hooks.current.everyScale);
      if (d == null || dead) return;
      tid = setTimeout(fire, d);
    };
    const fire = () => {
      if (dead) return;
      if (typeof document !== 'undefined' && document.hidden) return plan();
      if (!fireResettle(sched)) {
        tid = setTimeout(fire, CONDUCTOR.deferMs(Math.random));
        return;
      }
      n += 1;
      plan();
    };
    plan();
    return () => {
      dead = true;
      clearTimeout(tid);
    };
  }, [sched, onScreen, paused, spec, tick]);

  // the hover re-settle: a heat kick when the pointer enters, or focus reaches, the control the lights sit in
  const hoverLevel = frozen ? 0 : hoverLevelOf(hover);
  useEffect(() => {
    const el = box.current;
    if (!(hoverLevel > 0) || !el) return undefined;
    const host = (el.parentElement && el.parentElement.closest && el.parentElement.closest(HOVER.hosts)) || el;
    const gate = createHoverGate(HOVER.gapMs);
    const wake = () => {
      if (gate(nowMs())) kick(hoverLevel);
    };
    host.addEventListener('pointerenter', wake);
    host.addEventListener('focusin', wake);
    return () => {
      host.removeEventListener('pointerenter', wake);
      host.removeEventListener('focusin', wake);
    };
  }, [hoverLevel]);

  const onStats = onSettled && !frozen
    ? (s) => {
        if (settledFor.current === spec || !spec) return;
        if (heat.current.isCold(nowMs()) && s.q >= 0.97) {
          settledFor.current = spec;
          onSettled({ still: false, overlap: s.q, lights: s.n });
        }
      }
    : undefined;

  // THE COLOUR MODE: a picture's own colours, a gradient (both settle-see's 'map'), the meaning code, two neons, one
  const mode = paletteOf(pick(palette, 'palette', ctx, undefined));
  const gradient = mode.mode === 'gradient' && !source;
  const gPalette = useMemo(() => (gradient ? gradientStops(mode.colours, GRADIENT_STOPS) : null), [gradient, gradient ? mode.colours.join(',') : '']);
  const gPaint = useMemo(() => (gradient && cols > 0 && rows > 0 ? gradientPaint(cols, rows, gPalette.length, mode.direction) : null), [gradient, cols, rows, gPalette, mode.direction]);
  const map = !!(source && source.palette && source.paint) || gradient;
  const colorMode = map ? 'map' : mode.mode === 'meaning' || mode.mode === 'duo' ? mode.mode : 'single';

  return (
    <span
      ref={box}
      className={`settle-text${className ? ` ${className}` : ''}`}
      style={{ display: 'block', position: 'relative', width: '100%', height: cssH ? `${cssH}px` : undefined, ...style }}
      aria-hidden={decorative || undefined}
      data-settle-text=""
      data-settle-alive={frozen ? 'still' : restNow ? 'rest' : 'alive'}
      data-settle-ambient={amb.spec ? amb.spec.preset || 'custom' : 'off'}
      data-settle-haze={hazeSpec ? 'on' : legacy ? 'legacy' : 'off'}
    >
      {!decorative && label && <span style={SR}>{label}</span>}
      {cols > 0 && rows > 0 && items && (
        <Settle
          decorative
          width="100%"
          height="100%"
          res={[cols, rows]}
          fit
          items={items}
          color={colorMode}
          neon={colour}
          off={colorMode === 'duo' ? offColour : undefined}
          palette={map ? (gradient ? gPalette : source.palette) : undefined}
          paint={map ? (gradient ? gPaint : source.paint) : undefined}
          dim={dimLevel}
          glow={glow}
          core
          background="transparent"
          schedule={frozen ? undefined : schedule}
          morph={morphing ? { frames: transition.frames, periodMs: transition.periodMs } : undefined}
          lean={lean}
          pull={pull}
          fps={hot || restNow || amb.shimmering ? fpsHot : simmer}
          sweeps={1}
          poke={false}
          quality={false}
          rest={restNow || frozen}
          restAfter={TEXT.restAfter}
          still={frozen || undefined}
          paused={paused || !onScreen}
          perfLabel={perfLabel}
          onStats={onStats}
          weather={amb.weather}
          beforeStep={amb.beforeStep}
          onHandle={(h) => {
            handle.current = h;
            onHandle?.(h);
            if (h) {
              setTick((t) => t + 1);
              if (introLevel <= 0 && spec && !frozen) h.show(toTarget(spec, cols, rows), { snap: true });
            }
          }}
        />
      )}
      {children}
    </span>
  );
}
