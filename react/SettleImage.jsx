// settle-text/react · SettleImage - a picture as lights. <SettleImage src="/moon.png" dither colors="source" />
//
// <claudes_code_comments>
// ** Function List **
// SettleImage(props) - the component
//   src | image   a URL, an <img>, an ImageBitmap, a canvas or an ImageData
//   alt           the screen-reader words (required for a picture that means something; '' for decoration)
//   resolution    'auto' (default: about 3 px a light, 96 to 384 across) | 'chunky' | 'low' | 'medium' | 'high' |
//                 lights across (40 / 64 / 128 / 256); 'ultra' is retired and reads as 'high'
//   pitch         CSS px per light; overrides resolution
//   width, height CSS px; without a width the picture fills its container, without a height it keeps its aspect
//   fit           'contain' (default) | 'cover' (when a height is given)
//   threshold     0..1 (0.5): a light brighter than this is lit
//   dither        bool (false): Floyd-Steinberg, so greys become densities (a photo)
//   invert        bool (false): dark becomes lit
//   color         one colour for every lit light (any CSS colour or neon word; default the HYPER PINK)
//   palette       'single' | 'meaning' | 'duo' | a gradient (as SettleText); offColor, dim as SettleText
//   colors        'source': every light keeps its own pixel's colour (ignores color)
//   glow, temperature, settleTime, resettle, breathe, rest, intro, fps, simmerFps, paused, still, onSettled,
//   onResettle, label, decorative, className, style, onHandle, hover   as SettleText: ALIVE by default (a warm
//                 simmer and a re-settle every 6 to 12 s); still={true} is the static flag
//
// ** Technical Review **
// - The picture is loaded once (react/picture.js), drawn into a canvas the exact size of the grid, and sampled one
//   pixel per light. The grid is `resolution` lights across (an image's resolution is a width, where a text's is a
//   height), the rows following the picture's aspect unless a height is given.
// - A cross-origin image with no CORS header taints the canvas: the component renders nothing and reports the
//   error through onError (and in the console in development); it never throws.
// </claudes_code_comments>

import React, { useEffect, useRef } from 'react';
import { Lights } from './Lights.jsx';
import { COLOUR, imagePitch } from '../src/presets.js';
import { PALETTE } from '../src/palette.js';
import { pick, useSettleTextDefaults } from './defaults.js';
import { resolveColour } from './colour.js';
import { useBoxWidth } from './hooks.js';
import { usePicture, useRaster } from './picture.js';

export function SettleImage({
  src,
  image,
  alt,
  resolution,
  pitch,
  width = null,
  height = null,
  fit = 'contain',
  threshold = 0.5,
  dither = false,
  invert = false,
  color,
  colors = null,
  background,
  glow,
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
  onError,
  label,
  decorative = false,
  className = '',
  style,
  onHandle,
  hover = false,
}) {
  const ctx = useSettleTextDefaults();
  resolution = pick(resolution, 'resolution', ctx, 'auto');
  const outer = useRef(null);
  const W = useBoxWidth(outer, width);
  const { loaded, aspect, error } = usePicture(src ?? image, 'picture');
  const P = imagePitch({ width: W, resolution, pitch });
  const cols = W > 0 ? Math.max(4, Math.floor(W / P)) : 0;
  const rows = cols > 0 && (height > 0 ? Math.max(2, Math.round(height / P)) : aspect ? Math.max(2, Math.round(cols / aspect)) : 0);
  const { spec, palette: srcPalette, paint, error: rasterError } = useRaster(loaded, cols, rows || 0, { fit: height > 0 ? fit : 'contain', mode: 'picture', threshold, dither, invert, colors, note: alt || 'a picture' });
  const err = error || rasterError;
  useEffect(() => {
    if (!err) return;
    onError?.(err);
    if (typeof console !== 'undefined') console.warn('settle-text:', err);
  }, [err]);
  const colourMode = palette;
  const colour = resolveColour(pick(color, 'color', ctx, PALETTE.image), PALETTE.image);
  return (
    <Lights
      cols={cols}
      rows={rows || 0}
      cssH={rows ? rows * P : height || undefined}
      spec={spec}
      colour={colour}
      source={colors === 'source' && srcPalette && paint ? { palette: srcPalette, paint } : undefined}
      palette={colourMode}
      offColour={offColor ? resolveColour(offColor, PALETTE.image) : undefined}
      dim={dim}
      glow={pick(glow, 'glow', ctx, COLOUR.glow)}
      temperature={temperature}
      settleTime={settleTime}
      resettle={resettle}
      haze={haze}
      breathe={breathe}
      rest={rest}
      intro={intro}
      fps={fps}
      simmerFps={simmerFps}
      paused={paused}
      still={still}
      onSettled={onSettled}
      onResettle={onResettle}
      ambient={ambient}
      shimmer={shimmer}
      onShimmer={onShimmer}
      label={label ?? alt ?? ''}
      decorative={decorative || (!alt && !label)}
      onHandle={onHandle}
      hover={hover}
      perfLabel="settle-image"
      className={`settle-text--image${className ? ` ${className}` : ''}`}
      style={{ width: Number.isFinite(width) && width > 0 ? `${width}px` : '100%', background: background || undefined, ...style }}
    >
      <span ref={outer} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden="true" />
    </Lights>
  );
}
