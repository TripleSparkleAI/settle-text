// settle-text/react · SettleBackground - a full-bleed settle behind your content, from a picture, an SVG or words.
// <SettleBackground src="/moon.png" still><h1>Hello</h1></SettleBackground>
//
// <claudes_code_comments>
// ** Function List **
// SettleBackground(props) - the component
//   src | image  a picture (SettleImage's source)      svg | paths  a vector (SettleVector's)      text, font  words
//   fit          'cover' (default) | 'contain'
//   opacity      0..1 (1): the whole layer's opacity
//   still        bool (true): draw once, settle once, then no frame work (THE CPU-LOVELY MODE); false for a live one
//   resolution   'low' | 'medium' (default) | 'high' | lights across, or pitch
//   color, colors, glow, threshold, dither, invert, temperature, settleTime, breathe (default false), paused
//   children     your content, drawn on top
//   className, style   the outer box (position: relative is set; give it a height or let the children size it)
//
// ** Technical Review **
// - Two layers: an absolute, overflow-hidden layer that holds one SettleImage, SettleVector or SettleText sized to
//   the box (useBoxSize), and the children above it. The layer is aria-hidden; a background says nothing.
// - `still` is the default here because a background is behind reading: in still mode the lights are drawn once
//   as the picture and the frames stop. A live background (still={false}) with breathe on re-settles now and then.
// </claudes_code_comments>

import React, { useRef } from 'react';
import { SettleImage } from './SettleImage.jsx';
import { SettleVector } from './SettleVector.jsx';
import { SettleText } from './SettleText.jsx';
import { useBoxSize } from './hooks.js';

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
  still = true,
  resolution = 'medium',
  pitch,
  color,
  colors,
  glow,
  threshold,
  dither,
  invert,
  temperature,
  settleTime,
  breathe = false,
  paused,
  children,
  className = '',
  style,
}) {
  const box = useRef(null);
  const { w, h } = useBoxSize(box);
  const common = { resolution, pitch, color, glow, temperature, settleTime, breathe, paused, still, decorative: true, width: w || null };
  let layer = null;
  if (w > 0 && h > 0) {
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
