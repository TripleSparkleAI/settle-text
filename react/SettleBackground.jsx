// settle-text/react · SettleBackground - a full-bleed settle behind your content, from a picture, an SVG or words.
// <SettleBackground src="/moon.png" still><h1>Hello</h1></SettleBackground>
//
// <claudes_code_comments>
// ** Function List **
// SettleBackground(props) - the component
//   src | image  a picture (SettleImage's source)      svg | paths  a vector (SettleVector's)      text, font  words
//   fit          'cover' (default) | 'contain'
//   opacity      0..1 (1): the whole layer's opacity
//   still        bool (false): THE STATIC FLAG. Since 0.4.0 a background is ALIVE by default, like every component;
//                still={true} draws it once, settles once, then no frame work (THE CPU-LOVELY MODE)
//   resettle     the schedule, slower than a text's by default: every 11 to 17 s (BACKGROUND.resettle)
//   ambient      THE AMBIENT SHIMMER, the quietest preset by default ('whisper', BACKGROUND.ambient): a glint, a few
//                twinkles, a ripple or a breath now and then; the re-settles keep their own slower clock
//   resolution   'auto' (default) | 'chunky' | 'low' | 'medium' | 'high' | lights across, or pitch ('ultra' is retired: it reads as 'high')
//   color        default VIOLET (THE PALETTE's background colour)
//   colors, glow, threshold, dither, invert, temperature, settleTime, rest, intro, fps, simmerFps, palette,
//   offColor, dim, breathe, paused   as the source component
//   children     your content, drawn on top
//   className, style   the outer box (position: relative is set; give it a height or let the children size it)
//
// ** Technical Review **
// - Two layers: an absolute, overflow-hidden layer that holds one SettleImage, SettleVector or SettleText sized to
//   the box (useBoxSize), and the children above it. The layer is aria-hidden; a background says nothing.
// - ALIVE BY DEFAULT since 0.4.0 (0.3.0 made a background still): it simmers and re-settles on a slower schedule
//   than a text, every 11 to 17 s. `still` draws it once and stops the frames; `rest` keeps the re-settles and stops
//   the frames between them.
// </claudes_code_comments>

import React, { useRef } from 'react';
import { SettleImage } from './SettleImage.jsx';
import { SettleVector } from './SettleVector.jsx';
import { SettleText } from './SettleText.jsx';
import { useBoxSize } from './hooks.js';
import { PALETTE } from '../src/palette.js';

// a background is behind reading, so its schedule is slower than a text's: a re-settle every 11 to 17 s
export const BACKGROUND = Object.freeze({ resettle: Object.freeze({ every: [11000, 17000] }), ambient: 'whisper' });

export function SettleBackground({
  src,
  image,
  svg,
  paths,
  viewBox,
  text,
  font,
  weight,
  size,
  fit = 'cover',
  opacity = 1,
  still,
  resolution,
  pitch,
  color,
  colors,
  glow,
  threshold,
  dither,
  invert,
  temperature,
  settleTime,
  resettle = BACKGROUND.resettle,
  ambient = BACKGROUND.ambient,
  shimmer,
  onShimmer,
  breathe,
  rest,
  intro,
  fps,
  simmerFps,
  palette,
  offColor,
  dim,
  paused,
  children,
  className = '',
  style,
}) {
  const box = useRef(null);
  const { w, h } = useBoxSize(box);
  const common = { resolution, pitch, color, glow, temperature, settleTime, resettle, ambient, shimmer, onShimmer, breathe, rest, intro, fps, simmerFps, palette, offColor, dim, paused, still, decorative: true, width: w || null };
  let layer = null;
  if (w > 0 && h > 0) {
    const c = color ?? PALETTE.background;
    common.color = c;
    if (src || image) layer = <SettleImage src={src} image={image} height={h} fit={fit} colors={colors} threshold={threshold} dither={dither} invert={invert} {...common} />;
    else if (svg || paths) layer = <SettleVector svg={svg} paths={paths} viewBox={viewBox} height={h} fit={fit} colors={colors} threshold={threshold} dither={dither} invert={invert} {...common} />;
    else if (text) layer = <SettleText text={text} font={font} weight={weight} size={size ?? Math.max(24, Math.round(h / 3))} align="center" {...common} />;
  }
  return (
    <div ref={box} className={`settle-background${className ? ` ${className}` : ''}`} style={{ position: 'relative', ...style }}>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity, pointerEvents: 'none', zIndex: 0 }}>
        {layer}
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
}
