// settle-text/react · SettleText - words, in your font, as a live settle of lights. <SettleText text="What?" />
//
// <claudes_code_comments>
// ** Function List **
// SettleText(props) - the component
//   text         string, required     the words
//   font         string | { family, weight }  a CSS font family list; waits for document.fonts to load it
//   weight       number (700)         the face's weight (a wide script takes 400 unless you say otherwise)
//   size         number, CSS px (64)  the font size: the capitals stand about this tall in lights
//   color        any CSS colour or a neon word (rose, cyan, lime, violet ...); default the HYPER PINK #ff2fa0
//   background   any CSS colour behind the lights (default none: the lights sit on whatever is behind the box)
//   resolution   'low' | 'medium' | 'high' | lights per em (default 'medium', 20 lights per em)
//   pitch        CSS px per light; overrides resolution
//   glow         number (0.7)         the bloom; 0 for raw dots
//   align        'left' | 'center' | 'right' (default 'left')
//   wrap         bool (true)          break at spaces to fit the box; false shrinks the text to one line
//   width        number, CSS px       a fixed width; without it the text fills its container
//   temperature  number (0.45)        how noisy the lights are at rest
//   settleTime   ms (1500)            from noise to words
//   breathe      true | false | seconds | { every: [s, s], level } (default true: every 7 to 11 s)
//   paused       bool                 your own pause
//   still        bool (false)         draw the words once as lights, no live settle, no frame work
//   onSettled    fn({ overlap, lights, still })  once per text
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
import { makeCanvas } from 'settle-see';
import { Lights } from './Lights.jsx';
import { TEXT, COLOUR, textPitch } from '../src/presets.js';
import { textGrid, wrapLines, textSpec, wideScript } from '../src/layout.js';
import { resolveColour } from './colour.js';
import { useBoxWidth, useFontReady, fontFamilyOf, fontWeightOf } from './hooks.js';

let measureCtx = null;
function measureRatio(text, font, weight) {
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
  font = 'sans-serif',
  weight,
  size = 64,
  color = COLOUR.text,
  background,
  resolution = 'medium',
  pitch,
  glow,
  align = 'left',
  wrap = true,
  width = null,
  temperature,
  settleTime,
  breathe = true,
  paused,
  still = false,
  onSettled,
  label,
  decorative = false,
  className = '',
  style,
  onHandle,
}) {
  const outer = useRef(null);
  const W = useBoxWidth(outer, width);
  const family = fontFamilyOf(font);
  const wide = wideScript(text);
  const w = fontWeightOf(font, weight, wide ? TEXT.wide.weight : TEXT.weight);
  const fontTick = useFontReady(font, w);
  const P = textPitch({ size, resolution, pitch });
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
  const colour = resolveColour(color, COLOUR.text);
  return (
    <Lights
      cols={grid.cols}
      rows={grid.rows}
      cssH={grid.cssH}
      spec={spec}
      colour={colour}
      glow={glow ?? (wide ? TEXT.wide.glow : TEXT.glow)}
      temperature={temperature}
      settleTime={settleTime}
      breathe={breathe}
      paused={paused}
      still={still}
      onSettled={onSettled}
      label={label ?? text}
      decorative={decorative}
      onHandle={onHandle}
      perfLabel="settle-text"
      className={`settle-text--text${className ? ` ${className}` : ''}`}
      style={{ width: Number.isFinite(width) && width > 0 ? `${width}px` : '100%', background: background || undefined, ...style }}
    >
      <span ref={outer} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden="true" />
    </Lights>
  );
}
