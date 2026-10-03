// settle-text · raster - a picture's pixels to lights: the fit, the brightness threshold, the dither and the
// per-light colours a picture keeps. Plain JavaScript over an RGBA byte array, so node tests read every rule.
//
// <claudes_code_comments>
// ** Function List **
// fitBox(iw, ih, cols, rows, fit)      - where a picture of iw x ih lands in a cols x rows grid: 'contain' (whole
//                                        picture, centred) or 'cover' (fill the grid, centred crop); in grid cells
// luminance(r, g, b)                   - the brightness of a pixel, 0 to 1 (Rec. 709 weights)
// luminances(data, w, h)               - one brightness per light from RGBA bytes (w * h * 4)
// thresholdBits(lum, threshold, invert) - +1 where the light is brighter than the threshold, else -1 (invert flips)
// ditherBits(lum, w, h, threshold)     - Floyd-Steinberg error diffusion to +1 / -1, so a grey reads as a density
// sampleLights(data, w, h, opts)       - the pictures' call: luminances, then threshold or dither
// coverages / sampleCoverage(data, w, h, opts) - the vectors' call: lit where the ink covers the light (alpha),
//                                        whatever its colour, then threshold or dither
// sourcePaint(data, w, h, { levels })  - every light's own colour for settle-see's 'map' mode: a palette of
//                                        normalised colours (levels per channel, at most 256) and { hue, gain }
// litCount(bits)                       - how many lights are on (for tests and the readout)
// parseViewBox(markup)                 - the viewBox of an SVG string, or its width and height, as [x, y, w, h]
// svgKind(input)                       - 'markup' (an <svg ...> string), 'path' (a d string), 'url' or null
//
// ** Technical Review **
// - The components draw the picture into an offscreen canvas that is exactly cols x rows pixels (one pixel per
//   light, the browser doing the resampling with imageSmoothingQuality 'high'), then hand the bytes here. So this
//   file never resamples; it only decides, per light, lit or dark and which colour.
// - A dithered picture keeps tone: a 40% grey becomes about 40% of its lights lit, spread evenly. A thresholded
//   picture is a clean two-tone cut, right for logos and type. The default is a threshold at 0.5.
// - 'source' colours: each light's colour is its pixel's colour normalised so its brightest channel is full
//   (the hue), and its brightness is kept as the gain; the hue is quantised to `levels` per channel so the palette
//   fits settle-see's Uint8Array index (6 levels = 216 colours). A light that is off still has a hue, so a dithered
//   photo keeps its colour where its lights flicker.
// </claudes_code_comments>

export function fitBox(iw, ih, cols, rows, fit = 'contain') {
  if (!(iw > 0) || !(ih > 0) || !(cols > 0) || !(rows > 0)) return { x: 0, y: 0, w: 0, h: 0 };
  const k = fit === 'cover' ? Math.max(cols / iw, rows / ih) : Math.min(cols / iw, rows / ih);
  const w = iw * k;
  const h = ih * k;
  return { x: (cols - w) / 2, y: (rows - h) / 2, w, h };
}

export const luminance = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

export function luminances(data, w, h) {
  const n = w * h;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = data[4 * i + 3] / 255;
    out[i] = luminance(data[4 * i], data[4 * i + 1], data[4 * i + 2]) * a;
  }
  return out;
}

export function thresholdBits(lum, threshold = 0.5, invert = false) {
  const out = new Int8Array(lum.length);
  for (let i = 0; i < lum.length; i++) out[i] = lum[i] > threshold !== !!invert ? 1 : -1;
  return out;
}

export function ditherBits(lum, w, h, threshold = 0.5, invert = false) {
  const err = Float32Array.from(lum);
  const out = new Int8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const v = err[i];
      const on = v > threshold;
      out[i] = on !== !!invert ? 1 : -1;
      const e = v - (on ? 1 : 0);
      if (x + 1 < w) err[i + 1] += (e * 7) / 16;
      if (y + 1 < h) {
        if (x > 0) err[i + w - 1] += (e * 3) / 16;
        err[i + w] += (e * 5) / 16;
        if (x + 1 < w) err[i + w + 1] += (e * 1) / 16;
      }
    }
  }
  return out;
}

export function sampleLights(data, w, h, { threshold = 0.5, invert = false, dither = false } = {}) {
  const lum = luminances(data, w, h);
  return dither ? ditherBits(lum, w, h, threshold, invert) : thresholdBits(lum, threshold, invert);
}

// a vector drawing is lit where its ink COVERS the light (alpha), whatever colour the ink is: a black logo on a
// transparent ground is a lit logo. `coverage` is the share of the light the ink must cover (0.5 by default)
export function coverages(data, w, h) {
  const n = w * h;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = data[4 * i + 3] / 255;
  return out;
}

export function sampleCoverage(data, w, h, { threshold = 0.5, invert = false, dither = false } = {}) {
  const cov = coverages(data, w, h);
  return dither ? ditherBits(cov, w, h, threshold, invert) : thresholdBits(cov, threshold, invert);
}

export function sourcePaint(data, w, h, { levels = 6 } = {}) {
  const L = Math.max(2, Math.min(6, Math.round(levels)));
  const n = w * h;
  const hue = new Uint8Array(n);
  const gain = new Float32Array(n);
  const palette = [];
  const index = new Map();
  const q = (v) => Math.round((v / 255) * (L - 1));
  const hex = (v) => Math.round((v / (L - 1)) * 255).toString(16).padStart(2, '0');
  for (let i = 0; i < n; i++) {
    const r = data[4 * i];
    const g = data[4 * i + 1];
    const b = data[4 * i + 2];
    const a = data[4 * i + 3] / 255;
    const max = Math.max(r, g, b);
    gain[i] = (max / 255) * a;
    // the colour at full brightness: scale so the brightest channel is 255 (a black pixel keeps white as its hue)
    const k = max > 0 ? 255 / max : 1;
    const key = q(r * k) * L * L + q(g * k) * L + q(b * k);
    let p = index.get(key);
    if (p === undefined) {
      p = palette.length;
      index.set(key, p);
      palette.push('#' + hex(q(r * k)) + hex(q(g * k)) + hex(q(b * k)));
    }
    hue[i] = p;
  }
  return { palette, paint: { hue, gain } };
}

export function litCount(bits) {
  let n = 0;
  for (let i = 0; i < bits.length; i++) if (bits[i] > 0) n++;
  return n;
}

export function parseViewBox(markup) {
  const s = String(markup ?? '');
  const vb = s.match(/viewBox\s*=\s*["']\s*([-\d.eE]+)[\s,]+([-\d.eE]+)[\s,]+([-\d.eE]+)[\s,]+([-\d.eE]+)\s*["']/i);
  if (vb) return [+vb[1], +vb[2], +vb[3], +vb[4]];
  const w = s.match(/\swidth\s*=\s*["']\s*([\d.]+)/i);
  const h = s.match(/\sheight\s*=\s*["']\s*([\d.]+)/i);
  if (w && h) return [0, 0, +w[1], +h[1]];
  return null;
}

export function svgKind(input) {
  if (typeof input !== 'string') return null;
  const s = input.trim();
  if (!s) return null;
  if (/^<svg[\s>]/i.test(s) || /^<\?xml/i.test(s)) return 'markup';
  if (/^[MmZzLlHhVvCcSsQqTtAa][\s\d.,-]/.test(s)) return 'path';
  if (/^(https?:|data:|blob:|\/|\.\/|\.\.\/)/i.test(s) || /\.svg(\?|#|$)/i.test(s)) return 'url';
  return null;
}
