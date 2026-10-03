// settle-text - render text, images and vectors as a live settle of lights. This is the pure half (no DOM, no
// React): the presets, the grid, the colour words, the picture sampler and the temperature curve. The React
// components are in settle-text/react.
//
// <claudes_code_comments>
// ** Function List **
// TEXT / RESOLUTIONS / IMAGE_RESOLUTIONS / HEAT / BREATH / COLOUR - presets.js: the defaults and the ladders
// resolveResolution / textPitch / imagePitch - presets.js: a preset or a number -> CSS px per light
// wideScript / lightsPerBox / textGrid / wrapLines / textSpec / measureWith - layout.js: the grid and the drawing
// NEON_WORDS / parseColour / toSettleColour / isNeonKey - colour.js: a colour word -> what settle-see takes
// fitBox / sampleLights / ditherBits / thresholdBits / sourcePaint / parseViewBox / svgKind / litCount - raster.js
// createHeat / tauFor / breathOf / breathDelay - heat.js: the temperature over time
//
// ** Technical Review **
// - Everything here runs in node, so `npm test` covers it without a browser. The React layer adds only what needs
//   one: the font loading, the canvas the picture is drawn into, the observers that pause an off-screen settle.
// - The engine is settle-see (a dependency, never forked): every component mounts one settle-see <Settle> on an
//   exact grid with a transparent plate and hands it a target spec made here.
// </claudes_code_comments>

export { TEXT, RESOLUTIONS, IMAGE_RESOLUTIONS, RESOLUTION_BOUNDS, HEAT, BREATH, COLOUR, resolveResolution, textPitch, imagePitch } from './presets.js';
export { wideScript, lightsPerBox, textGrid, wrapLines, textSpec, measureWith } from './layout.js';
export { NEON_WORDS, CSS_NAMES, isNeonKey, neonKey, parseColour, toSettleColour } from './colour.js';
export { fitBox, luminance, luminances, coverages, thresholdBits, ditherBits, sampleLights, sampleCoverage, sourcePaint, litCount, parseViewBox, svgKind } from './raster.js';
export { createHeat, tauFor, breathOf, breathDelay } from './heat.js';
