// settle-text/react · SettleVector - an SVG as lights. <SettleVector svg={markup} /> or paths={[d, ...]}
//
// <claudes_code_comments>
// ** Function List **
// SettleVector(props) - the component
//   svg           SVG markup ('<svg ...>...</svg>'), a path d string ('M10 90 L50 10 Z'), or a URL ending in .svg
//   paths         a list of path d strings (an alternative to svg)
//   viewBox       [x, y, w, h] for a path or a list of paths (default [0, 0, 100, 100]); markup carries its own
//   stroke        a stroke width in viewBox units for a path (default: the path is filled)
//   alt           the screen-reader words
//   resolution    'low' | 'medium' | 'high' | lights across (default 'medium')
//   pitch, width, height, fit, threshold, dither, invert, color, colors, glow, temperature, settleTime, breathe,
//   paused, still, onSettled, onError, label, decorative, className, style, onHandle  as SettleImage
//
// ** Technical Review **
// - Markup and URLs are decoded by the browser (an <img> from a data: URL, sized 1024 px on the long side from the
//   viewBox) and drawn into the grid's canvas, where a light is lit by COVERAGE: the ink's colour does not matter,
//   a black logo is a lit logo. `colors: 'source'` keeps the ink's colours instead.
// - A path d goes to settle-see's own svg target (filled, or stroked in viewBox units), which is sharpest for a
//   single shape; its aspect is the viewBox's.
// </claudes_code_comments>

import React, { useEffect, useMemo, useRef } from 'react';
import { Lights } from './Lights.jsx';
import { COLOUR, imagePitch } from '../src/presets.js';
import { resolveColour } from './colour.js';
import { useBoxWidth } from './hooks.js';
import { usePicture, useRaster } from './picture.js';

export function SettleVector({
  svg,
  paths,
  viewBox = null,
  stroke = 0,
  alt,
  resolution = 'medium',
  pitch,
  width = null,
  height = null,
  fit = 'contain',
  threshold = 0.5,
  dither = false,
  invert = false,
  color = COLOUR.text,
  colors = null,
  background,
  glow = COLOUR.glow,
  temperature,
  settleTime,
  breathe = true,
  paused,
  still = false,
  onSettled,
  onError,
  label,
  decorative = false,
  className = '',
  style,
  onHandle,
}) {
  const outer = useRef(null);
  const W = useBoxWidth(outer, width);
  const source = useMemo(() => paths ?? svg, [svg, Array.isArray(paths) ? paths.join('|') : paths]);
  const { loaded, aspect, error } = usePicture(source, 'vector', viewBox);
  const P = imagePitch({ width: W, resolution, pitch });
  const cols = W > 0 ? Math.max(4, Math.floor(W / P)) : 0;
  const rows = cols > 0 && (height > 0 ? Math.max(2, Math.round(height / P)) : aspect ? Math.max(2, Math.round(cols / aspect)) : 0);
  const { spec, palette, paint, error: rasterError } = useRaster(loaded, cols, rows || 0, { fit: height > 0 ? fit : 'contain', mode: 'vector', threshold, dither, invert, colors, note: alt || 'a drawing', stroke });
  const err = error || rasterError;
  useEffect(() => {
    if (!err) return;
    onError?.(err);
    if (typeof console !== 'undefined') console.warn('settle-text:', err);
  }, [err]);
  const colour = resolveColour(color, COLOUR.text);
  return (
    <Lights
      cols={cols}
      rows={rows || 0}
      cssH={rows ? rows * P : height || undefined}
      spec={spec}
      colour={colour}
      palette={colors === 'source' ? palette : undefined}
      paint={colors === 'source' ? paint : undefined}
      glow={glow}
      temperature={temperature}
      settleTime={settleTime}
      breathe={breathe}
      paused={paused}
      still={still}
      onSettled={onSettled}
      label={label ?? alt ?? ''}
      decorative={decorative || (!alt && !label)}
      onHandle={onHandle}
      perfLabel="settle-vector"
      className={`settle-text--vector${className ? ` ${className}` : ''}`}
      style={{ width: Number.isFinite(width) && width > 0 ? `${width}px` : '100%', background: background || undefined, ...style }}
    >
      <span ref={outer} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden="true" />
    </Lights>
  );
}
