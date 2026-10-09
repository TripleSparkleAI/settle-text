// settle-text/react · SettleText - words, in your font, as a live settle of lights. <SettleText text="What?" />
//
// <claudes_code_comments>
// ** Function List **
// SettleText(props) - the component
//   text         string, required     the words
//   font         string | { family, weight }  a CSS font family list (default DEFAULT_FONT, Inter, or the
//                                     SettleTextDefaults font); waits for document.fonts to load it
//   weight       number (700)         the face's weight (a wide script takes 400 unless you say otherwise)
//   size         number, CSS px (64)  the font size, as in CSS (a capital stands at the face's cap height, ~0.7 of it)
//   color        any CSS colour or a neon word (pink, rose, cyan, lime, violet, green ...); default HYPER PINK
//   background   any CSS colour behind the lights (default none: the lights sit on whatever is behind the box)
//   resolution   'auto' (default: the title tuning, ~3.75 px a light) | 'chunky' | 'low' | 'medium' | 'high' |
//                lights per em (8 / 12 / 20 / 32); 'ultra' is retired and reads as 'high'
//   pitch        CSS px per light; overrides resolution
//   glow         number (0.7)         the bloom; 0 for raw dots
//   align        'left' | 'center' | 'right' (default 'left')
//   wrap         bool (true)          break at spaces to fit the box; false shrinks the text to one line
//   width        number, CSS px | 'fit'  a fixed width; 'fit' is one line as wide as its words (re-measured when
//                                     the font loads); without it the text fills its container
//   temperature  number (0.6)         the simmer: how much the lights flicker between re-settles (0.45 calm, 0.8 wild)
//   settleTime   ms (1500)            from noise to words, and from a re-settle's peak back to the simmer
//   haze         true | false | ms | { every, jitter, level, ramp, cool, kind }   THE ACTIVE HAZE (0.6.0): the
//                                     re-settle rotation, every 8 to 15 s by default (src/haze.js)
//   resettle     true | false | ms | { every, jitter, level, kind } | (n) => ms   0.5.0's re-settle schedule, read
//                                     when haze is not given (every 9 s, jitter 0.35, level 0.4 to 0.65)
//   breathe      0.3.0's name for the schedule (seconds, or { every: [s, s], level }), read when resettle is unset
//   rest         bool (false)         cool and stop drawing between re-settles (0.3.0's resting picture)
//   intro        0..1 (1)             the heat at mount: 1 out of full noise, 0 the words there at once
//   fps, simmerFps  (24, 12)          sweeps a second while settling and while simmering
//   palette      'single' | 'meaning' | 'duo' | a gradient name | [colours] | { colors, direction }
//   offColor     the unlit neon for palette="duo"      dim  0..1 (0): how bright an unlit light is
//   paused       bool                 your own pause
//   still        bool (false)         THE STATIC FLAG: draw the words once as lights, no live settle, no frame work
//   onSettled    fn({ overlap, lights, still })  once per text
//   onResettle   fn({ count, level, kind })      at each re-settle
//   ambient      THE AMBIENT SHIMMER (0.5.0): true (the 'gentle' preset) | false | 'whisper' | 'gentle' | 'lively'
//                | an effect name | [names] | { preset, every, jitter, resettleShare, effects, strength }; `shimmer`
//                is the same prop under its first name. Each piece deals small effects from its own deck on its own
//                clock, a full re-settle about 1 card in 10 (src/ambient.js AMBIENT_EFFECTS lists the range)
//   onShimmer    fn({ count, name, kind, strength })  at each shimmer
//   transition   'morph' | 'cut' | { kind, duration, frames } (default 'morph')  how a NEW text is shown: 'morph'
//                settles the lights from the old words into the new ones on the same grid; 'cut' replaces
//                them at once; a text that needs a new grid (another line count, another width) settles fresh
//   duration     ms (1200)            how long a morph takes, at the engine's pace on any machine
//   hover        true | 0..1 (off)    re-settle on hover and on focus of the link or button the text sits in
//   label        string (= text)      the screen-reader text; decorative hides the whole thing
//   className, style                  the outer box
//
// ** Technical Review **
// - THE GRID: the letter box is 1.25 em and `resolution` lights per em (src/presets.js: the SETTLE site's measured
//   title tuning, lane SETTLEHEADINGLIVE); the box spans the container's width; a wrapped text takes 0.85 of a box
//   per extra line. The words are measured in the font (a canvas measureText), measured again once the font
//   loads, and drawn by settle-see's target painter at the largest size at which the widest line fits.
// - THE FONT: any family you can name in CSS. The hook asks document.fonts for it and never blocks on a face that
//   does not arrive; the words are drawn in the fallback face until it does, then re-drawn.
// </claudes_code_comments>

import React, { useMemo, useRef } from 'react';
import { transitionOf } from '../src/transition.js';
import { makeCanvas } from 'settle-see';
import { Lights } from './Lights.jsx';
import { TEXT, textPitch } from '../src/presets.js';
import { PALETTE } from '../src/palette.js';
import { DEFAULT_FONT } from '../src/fonts.js';
import { pick, useSettleTextDefaults } from './defaults.js';
import { textGrid, wrapLines, textSpec, wideScript, fitWidth } from '../src/layout.js';
import { resolveColour } from './colour.js';
import { useBoxWidth, useFontReady, fontFamilyOf, fontWeightOf } from './hooks.js';

let measureCtx = null;
export function measureRatio(text, font, weight) {
  try {
    if (!measureCtx) measureCtx = makeCanvas(8, 8).getContext('2d');
    measureCtx.font = `${weight} 100px ${font}`;
    return measureCtx.measureText(text).width / 100;
  } catch {
    return 0.62 * String(text).length;
  }
}

export function SettleText({
  text = '',
  font: fontProp,
  weight,
  size = 64,
  color,
  background,
  resolution,
  pitch,
  glow,
  align = 'left',
  wrap = true,
  width = null,
  temperature,
  settleTime,
  resettle,
  haze,
  breathe,
  rest,
  intro,
  fps,
  simmerFps,
  palette,
  offColor,
  dim,
  paused,
  still,
  onSettled,
  onResettle,
  ambient,
  shimmer,
  onShimmer,
  label,
  decorative = false,
  className = '',
  style,
  onHandle,
  transition = 'morph',
  duration,
  hover = false,
  defaultColor = PALETTE.text,
}) {
  const ctx = useSettleTextDefaults();
  const font = pick(fontProp, 'font', ctx, DEFAULT_FONT);
  resolution = pick(resolution, 'resolution', ctx, 'auto');
  const outer = useRef(null);
  const tr = useMemo(() => transitionOf(transition, duration), [typeof transition === 'object' && transition ? JSON.stringify(transition) : transition, duration]);
  const family = fontFamilyOf(font);
  const wide = wideScript(text);
  const w = fontWeightOf(font, weight, wide ? TEXT.wide.weight : TEXT.weight);
  const fontTick = useFontReady(font, w);
  const P = textPitch({ size, resolution, pitch });
  // width="fit": one line, as wide as the words in the face, measured again once the font has loaded
  const fit = width === 'fit';
  const fitW = useMemo(() => (fit ? fitWidth(text, { ratio: measureRatio(text, family, w), size, pitch: P }) : null), [fit, text, family, w, size, P, fontTick]);
  const fixedW = fit ? fitW : width;
  const W = useBoxWidth(outer, fixedW);
  if (fit) wrap = false;
  const g1 = textGrid({ text, size, pitch: P, width: W });
  // the words' widths in the face, keyed by word; measured again when the font arrives
  const ratios = useMemo(() => {
    const out = { space: measureRatio(' ', family, w) };
    for (const piece of String(text).split(/\s+/).filter(Boolean)) if (!(piece in out)) out[piece] = measureRatio(piece, family, w);
    return out;
  }, [text, family, w, fontTick]);
  const lines = useMemo(() => {
    if (!wrap || !(W > 0)) return null;
    return wrapLines(text, { ratio: (t) => ratios[t] ?? measureRatio(t, family, w), spaceRatio: ratios.space, fontPx: g1.fontPx, maxW: g1.innerW * 0.98 });
  }, [wrap, text, W, g1.fontPx, g1.innerW, ratios, family, w]);
  const grid = useMemo(() => (lines ? textGrid({ text, size, pitch: P, width: W, lines: lines.length }) : g1), [g1.cols, g1.rows, g1.P, lines ? lines.length : 1]);
  const lineKey = lines ? lines.join('\n') : '';
  const spec = useMemo(() => (W > 0 ? textSpec(text, { grid, lines, align, font: family, weight: w }) : null), [text, grid, lineKey, align, family, w, fontTick]);
  const colour = resolveColour(pick(color, 'color', ctx, defaultColor), defaultColor);
  return (
    <Lights
      cols={grid.cols}
      rows={grid.rows}
      cssH={grid.cssH}
      spec={spec}
      colour={colour}
      glow={pick(glow, 'glow', ctx, wide ? TEXT.wide.glow : TEXT.glow)}
      temperature={temperature}
      settleTime={settleTime}
      resettle={resettle}
      haze={haze}
      breathe={breathe}
      rest={rest}
      intro={intro}
      fps={fps}
      simmerFps={simmerFps}
      palette={palette}
      offColour={offColor ? resolveColour(offColor, defaultColor) : undefined}
      dim={dim}
      paused={paused}
      still={still}
      onSettled={onSettled}
      onResettle={onResettle}
      ambient={ambient}
      shimmer={shimmer}
      onShimmer={onShimmer}
      label={label ?? text}
      decorative={decorative}
      onHandle={onHandle}
      perfLabel="settle-text"
      transition={tr}
      hover={hover}
      className={`settle-text--text${className ? ` ${className}` : ''}`}
      style={{ width: Number.isFinite(fixedW) && fixedW > 0 ? `${fixedW}px` : '100%', background: background || undefined, ...style }}
    >
      <span ref={outer} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden="true" />
    </Lights>
  );
}
