// settle-text/react · Lights - the one place this package mounts settle-see. Every component (text, image, vector,
// background) builds a grid and a target and hands them here; this file owns the temperature, the breath, the
// off-screen pause, reduced motion, the still mode and the screen-reader text.
//
// <claudes_code_comments>
// ** Function List **
// Lights(props)  - one settle-see <Settle> on an exact grid with a transparent plate
//   cols, rows, cssH            the grid and its CSS height (the width is the box's)
//   spec                        the settle-see target spec (a draw function, bits, an image) or null while loading
//   colour                      a settle-see neon key or a hex (already resolved)
//   palette, paint              per-light colours ('map' mode) for a picture that keeps its own colours
//   glow                        the bloom (0 raw dots)
//   temperature                 the cold the lights rest at (0.3 frozen, 0.45 a faint waver, 0.8 restless)
//   settleTime                  ms from noise to the picture
//   breathe                     the idle re-settle: true, false, seconds, or { every: [s, s], level }
//   paused                      the page's own pause
//   still                       no live settle: the lights are drawn as the picture once and the frames stop
//   onSettled(info)             fired once per target when the heat is cold and the lights agree with it
//   label, decorative           the words a screen reader hears (a visually hidden span); decorative hides all
//   onHandle                    settle-see's live handle (and null on unmount)
//   perfLabel                   the name settle-see's meter shows
//   className, style, children  the outer box
//
// ** Technical Review **
// - THE PHYSICS is settle-see's: lean 1.1 toward the target, pull 0.3 to four neighbours, one Gibbs sweep a frame
//   at 24 fps, the pointer's sparkle off (a picture of words is not a toy), the page quality ladder off (a grid of
//   a few thousand lights needs none). A transparent plate: only lit dots are drawn, so the component sits on any
//   background the page gives its box.
// - THE TEMPERATURE is a wall-clock function (src/heat.js) handed to settle-see as its schedule. The mount and every
//   new target kick it hot; it cools to an exact cold and settle-see's rest rule (rest, restAfter) stops the sweeps
//   and the drawing. A breath or a page ripple warms it and wakes it.
// - COST: a settled picture does no work. Off screen it is paused (an IntersectionObserver on the box). Under
//   prefers-reduced-motion, and in still mode, settle-see's still: the lights start AS the picture, are drawn once,
//   and rest; no kick, no breath, no frames.
// - ONE SETTLED EVENT per target: onSettled fires when the heat is cold and the lights' overlap with the target is
//   at least 0.97 (settle-see's onStats, every 4 frames); in still mode it fires once at mount.
// - What this package does not expose from settle-see: films, audio, the pulse bus, the master beat, the drag box.
//   Their defaults stay as settle-see sets them; a page ripple still passes through these lights, which is fine.
// </claudes_code_comments>

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Settle } from 'settle-see/react';
import { TEXT, HEAT } from '../src/presets.js';
import { createHeat, breathOf, breathDelay } from '../src/heat.js';
import { useReducedMotion, useOnScreen, nowMs } from './hooks.js';

const SR = { position: 'absolute', width: 1, height: 1, margin: -1, padding: 0, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 };

export function Lights({
  cols,
  rows,
  cssH,
  spec,
  colour = '#ff2fa0',
  palette,
  paint,
  glow = TEXT.glow,
  temperature = HEAT.cold,
  settleTime = HEAT.settleMs,
  breathe = true,
  paused = false,
  still = false,
  onSettled,
  label = '',
  decorative = false,
  onHandle,
  perfLabel = 'settle-text',
  className = '',
  style,
  children,
  lean = TEXT.lean,
  pull = TEXT.pull,
  fps = TEXT.fps,
}) {
  const reduced = useReducedMotion();
  const box = useRef(null);
  const handle = useRef(null);
  const onScreen = useOnScreen(box);
  const frozen = still || reduced;
  const breath = useMemo(() => (frozen ? null : breathOf(breathe)), [frozen, JSON.stringify(breathe)]);

  // the temperature: a wall-clock curve settle-see reads as its schedule
  const heat = useRef(null);
  if (!heat.current || heat.current.cold !== temperature || heat.current.settleMs !== settleTime) {
    heat.current = Object.assign(createHeat({ cold: temperature, settleMs: settleTime }), { settleMs: settleTime });
  }
  const schedule = useMemo(() => () => {
    const T = heat.current.T(nowMs());
    return { T, phase: T === heat.current.cold ? 'settled' : 'cooling' };
  }, []);
  const kick = (level) => {
    if (frozen || !(level > 0)) return;
    heat.current.kick(level, nowMs());
    handle.current?.play();
  };

  const items = useMemo(() => (spec ? [spec] : null), [spec]);
  const settledFor = useRef(null);
  const [tick, setTick] = useState(0);

  // the intro: out of noise at the mount and whenever the target changes
  useEffect(() => {
    settledFor.current = null;
    if (!spec) return;
    kick(1);
    if (frozen && onSettled) {
      settledFor.current = spec;
      onSettled({ still: true, overlap: 1, lights: cols * rows });
    }
  }, [spec, frozen]);

  // the idle breath
  useEffect(() => {
    if (!breath || !onScreen || paused || !spec) return undefined;
    let id = 0;
    const next = () => {
      id = setTimeout(() => {
        if (typeof document === 'undefined' || !document.hidden) kick(breath.level);
        next();
      }, breathDelay(Math.random, breath));
    };
    next();
    return () => clearTimeout(id);
  }, [breath, onScreen, paused, spec, tick]);

  const onStats = onSettled && !frozen
    ? (s) => {
        if (settledFor.current === spec || !spec) return;
        if (heat.current.isCold(nowMs()) && s.q >= 0.97) {
          settledFor.current = spec;
          onSettled({ still: false, overlap: s.q, lights: s.n });
        }
      }
    : undefined;

  const map = !!(palette && paint);
  return (
    <span
      ref={box}
      className={`settle-text${className ? ` ${className}` : ''}`}
      style={{ display: 'block', position: 'relative', width: '100%', height: cssH ? `${cssH}px` : undefined, ...style }}
      aria-hidden={decorative || undefined}
      data-settle-text=""
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
          color={map ? 'map' : 'single'}
          neon={colour}
          palette={map ? palette : undefined}
          paint={map ? paint : undefined}
          dim={0}
          glow={glow}
          core
          background="transparent"
          schedule={frozen ? undefined : schedule}
          lean={lean}
          pull={pull}
          fps={fps}
          sweeps={1}
          poke={false}
          quality={false}
          rest
          restAfter={TEXT.restAfter}
          still={frozen || undefined}
          paused={paused || !onScreen}
          perfLabel={perfLabel}
          onStats={onStats}
          onHandle={(h) => {
            handle.current = h;
            onHandle?.(h);
            if (h) setTick((t) => t + 1);
          }}
        />
      )}
      {children}
    </span>
  );
}
