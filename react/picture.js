// settle-text/react · picture - a picture or a vector into lights: load the source, draw it into a canvas that is
// exactly the grid (one pixel per light), read the bytes, and let src/raster.js decide which lights are lit and
// what colour each one keeps. Shared by SettleImage, SettleVector and SettleBackground.
//
// <claudes_code_comments>
// ** Function List **
// loadPicture(source)            - a URL, an <img>, an ImageBitmap, a canvas or an ImageData -> a drawable with a
//                                  width and a height (a promise)
// svgToDrawable(markup, long)    - an SVG string -> an <img> decoded from a data: URL, sized `long` px on its long
//                                  side from its viewBox (an svg with no size would decode at 300 x 150)
// loadVector(input, viewBox)     - markup, a path d, a list of paths or a URL -> { kind: 'drawable', img } or
//                                  { kind: 'path', d, viewBox }; the aspect comes with it
// rasterise(drawable, cols, rows, { fit }) - draw it into a cols x rows canvas with the fit and read the RGBA bytes
// pictureSpec(bytes, cols, rows, opts) - the settle-see target spec { bits } (and palette + paint for 'source'
//                                  colours) from the bytes: luminance for a picture, coverage for a vector
// usePicture(source, kind, opts) - the hook: loaded drawable, its aspect, an error word
//
// ** Technical Review **
// - The browser does the resampling: drawImage into a small canvas with imageSmoothingQuality 'high' averages the
//   source over each light, which is the right thing for both a photo and a logo. The pure sampler then reads
//   one pixel per light.
// - A cross-origin image taints the canvas and getImageData throws; the error is caught and reported through the
//   `error` field (the component renders nothing and says why in dev), never thrown into React.
// - A vector is lit by COVERAGE (alpha), a picture by BRIGHTNESS: a black logo on a transparent ground is lit; a
//   dark photo is dark. `colors: 'source'` keeps each light's own colour through settle-see's map mode.
// </claudes_code_comments>

import { useEffect, useMemo, useState } from 'react';
import { makeCanvas } from 'settle-see';
import { fitBox, sampleLights, sampleCoverage, sourcePaint, parseViewBox, svgKind } from '../src/raster.js';

const isImageData = (x) => typeof ImageData !== 'undefined' && x instanceof ImageData;
const sizeOf = (d) => ({ w: d.naturalWidth || d.videoWidth || d.width, h: d.naturalHeight || d.videoHeight || d.height });

export async function loadPicture(source) {
  if (!source) return null;
  if (typeof source === 'string') {
    const img = new Image();
    img.decoding = 'async';
    if (!/^data:/.test(source)) img.crossOrigin = 'anonymous';
    img.src = source;
    await img.decode();
    return img;
  }
  if (isImageData(source)) {
    const cv = makeCanvas(source.width, source.height);
    cv.getContext('2d').putImageData(source, 0, 0);
    return cv;
  }
  if (typeof source === 'object' && 'width' in source && 'height' in source) {
    if (typeof source.decode === 'function' && !source.complete) await source.decode();
    return source;
  }
  throw new Error('settle-text: an image needs a URL, an <img>, an ImageBitmap, a canvas or an ImageData');
}

export function svgToDrawable(markup, long = 1024) {
  let s = String(markup);
  const vb = parseViewBox(s) || [0, 0, 100, 100];
  if (!/\swidth\s*=/.test(s.slice(0, s.indexOf('>')))) {
    const k = long / Math.max(vb[2], vb[3]);
    s = s.replace(/<svg/i, `<svg width="${Math.round(vb[2] * k)}" height="${Math.round(vb[3] * k)}"`);
    if (!/viewBox/i.test(s)) s = s.replace(/<svg/i, `<svg viewBox="${vb.join(' ')}"`);
  }
  const img = new Image();
  img.decoding = 'async';
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  return img.decode().then(() => img);
}

export async function loadVector(input, viewBox) {
  if (Array.isArray(input)) return { kind: 'path', d: input.join(' '), viewBox: viewBox || [0, 0, 100, 100] };
  const kind = svgKind(input);
  if (kind === 'path') return { kind: 'path', d: input, viewBox: viewBox || [0, 0, 100, 100] };
  if (kind === 'markup') return { kind: 'drawable', img: await svgToDrawable(input), viewBox: viewBox || parseViewBox(input) };
  if (kind === 'url') {
    const text = await (await fetch(input)).text();
    if (svgKind(text) !== 'markup') throw new Error('settle-text: the URL did not return an SVG');
    return { kind: 'drawable', img: await svgToDrawable(text), viewBox: viewBox || parseViewBox(text) };
  }
  throw new Error('settle-text: a vector needs SVG markup, a path d string, a list of paths or a URL ending in .svg');
}

export function rasterise(drawable, cols, rows, { fit = 'contain' } = {}) {
  const cv = makeCanvas(cols, rows);
  const c = cv.getContext('2d', { willReadFrequently: true });
  c.clearRect(0, 0, cols, rows);
  const { w, h } = sizeOf(drawable);
  const box = fitBox(w, h, cols, rows, fit);
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = 'high';
  c.drawImage(drawable, box.x, box.y, box.w, box.h);
  return c.getImageData(0, 0, cols, rows).data;
}

export function pictureSpec(bytes, cols, rows, { mode = 'picture', threshold = 0.5, dither = false, invert = false, colors = null, note = 'a picture' } = {}) {
  const bits = mode === 'vector' ? sampleCoverage(bytes, cols, rows, { threshold, dither, invert }) : sampleLights(bytes, cols, rows, { threshold, dither, invert });
  const spec = { bits, note };
  if (colors === 'source') {
    const { palette, paint } = sourcePaint(bytes, cols, rows);
    return { spec, palette, paint };
  }
  return { spec, palette: null, paint: null };
}

// the hook: load once per source; aspect = w / h once known
export function usePicture(source, kind = 'picture', viewBox = null) {
  const key = typeof source === 'string' ? source : source ? 'object' : '';
  const [state, setState] = useState({ loaded: null, aspect: null, error: null });
  useEffect(() => {
    let live = true;
    setState({ loaded: null, aspect: null, error: null });
    if (!source) return undefined;
    const p = kind === 'vector' ? loadVector(source, viewBox) : loadPicture(source).then((img) => ({ kind: 'drawable', img }));
    p.then(
      (loaded) => {
        if (!live) return;
        const aspect = loaded.kind === 'path' ? loaded.viewBox[2] / loaded.viewBox[3] : (() => { const s = sizeOf(loaded.img); return s.w / s.h; })();
        setState({ loaded, aspect: Number.isFinite(aspect) && aspect > 0 ? aspect : 1, error: null });
      },
      (e) => live && setState({ loaded: null, aspect: null, error: String(e && e.message ? e.message : e) }),
    );
    return () => {
      live = false;
    };
  }, [key, source, kind, viewBox ? viewBox.join(',') : '']);
  return state;
}

// the memoised raster of a loaded picture at a grid
export function useRaster(loaded, cols, rows, opts) {
  const { fit = 'contain', mode = 'picture', threshold = 0.5, dither = false, invert = false, colors = null, note = 'a picture', stroke = 0 } = opts;
  return useMemo(() => {
    if (!loaded || !(cols > 0) || !(rows > 0)) return { spec: null, palette: null, paint: null, error: null };
    try {
      if (loaded.kind === 'path') {
        // settle-see draws a path itself (its own 'svg' spec: fill, or stroke in grid units)
        return { spec: { svg: loaded.d, viewBox: loaded.viewBox, stroke: stroke || undefined, invert: invert || undefined, note }, palette: null, paint: null, error: null };
      }
      const bytes = rasterise(loaded.img, cols, rows, { fit });
      return { ...pictureSpec(bytes, cols, rows, { mode, threshold, dither, invert, colors, note }), error: null };
    } catch (e) {
      return { spec: null, palette: null, paint: null, error: String(e && e.message ? e.message : e) };
    }
  }, [loaded, cols, rows, fit, mode, threshold, dither, invert, colors, note, stroke]);
}
