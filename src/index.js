// settle-text - render text, images and vectors as a live settle of lights. This is the pure half (no DOM, no
// React): the presets, the grid, the colour words, the picture sampler and the temperature curve. The React
// components are in settle-text/react.
//
// <claudes_code_comments>
// ** Function List **
// TEXT / RESOLUTIONS / IMAGE_RESOLUTIONS / AUTO / HEAT / BREATH / COLOUR - presets.js: the defaults and the ladders
// ALIVE / resettleOf / resettleDelay / resettleLevel / thinFor / simmerFpsFor / createConductor - alive.js: THE ALIVE
//   DEFAULT, the re-settle schedule and the page-wide thinning (0.4.0)
// NEON_RANGE / PALETTE / GRADIENTS / paletteOf / gradientStops / gradientPaint - palette.js: the colours and modes
// resolveResolution / textPitch / imagePitch - presets.js: a preset or a number -> CSS px per light
// wideScript / lightsPerBox / textGrid / wrapLines / textSpec / measureWith / fitWidth - layout.js: the grid, the
//   drawing and the width of one line
// HOVER / hoverLevelOf / createHoverGate - hover.js: the re-settle on hover and focus
// NEON_WORDS / parseColour / toSettleColour / isNeonKey - colour.js: a colour word -> what settle-see takes
// fitBox / sampleLights / ditherBits / thresholdBits / sourcePaint / parseViewBox / svgKind / litCount - raster.js
// createHeat / tauFor / breathOf / breathDelay - heat.js: the temperature over time
// TRANSITION / SEQUENCE / transitionOf / morphHow / intervalFor / sequenceAt / createSequencer - transition.js: how a
//   change of words is shown (a morph or a cut) and the clock a SettleSequence steps on
// HAZE / hazeOf / hazePlan / hazeDelay / hazeLevel / createHazeClock - haze.js: THE ACTIVE HAZE, each piece's own
//   re-settle rotation (0.6.0)
// FONTS / FONT_KINDS / DEFAULT_FONT_KEY / DEFAULT_FONT / fontOf - fonts.js: the eight faces the package ships (0.6.0)
// HEADING / headingLevel / headingCss / headingFontPx / headingSize / headingPitch / headingLights / headingElement /
//   headingText - heading.js: the six heading levels, their size scale and the lights each size gets
//
// ** Technical Review **
// - Everything here runs in node, so `npm test` covers it without a browser. The React layer adds only what needs
//   one: the font loading, the canvas the picture is drawn into, the observers that pause an off-screen settle.
// - The engine is settle-see (a dependency, never forked): every component mounts one settle-see <Settle> on an
//   exact grid with a transparent plate and hands it a target spec made here.
// </claudes_code_comments>

export { TEXT, RESOLUTIONS, IMAGE_RESOLUTIONS, RESOLUTION_BOUNDS, RETIRED_RESOLUTIONS, retiredResolution, AUTO, isAuto, HEAT, BREATH, COLOUR, resolveResolution, textPitch, imagePitch } from './presets.js';
export { AMBIENT, AMBIENT_LIMITS, AMBIENT_EFFECTS, AMBIENT_NAMES, AMBIENT_PRESETS, AMBIENT_DEFAULT_PRESET, ambientOf, ambientPeriod, shimmerDelay, deckWeights, createAmbientDeck, wordBoxes, createShimmer } from './ambient.js';
export { ALIVE, RESETTLE_KINDS, resettleOf, resettleDelay, resettleLevel, thinFor, simmerFpsFor, weightOf, createConductor } from './alive.js';
export { NEON_RANGE, PALETTE, GRADIENTS, GRADIENT_STOPS, DIRECTIONS, paletteOf, gradientStops, gradientPaint } from './palette.js';
export { wideScript, lightsPerBox, textGrid, wrapLines, textSpec, measureWith, fitWidth } from './layout.js';
export { HOVER, hoverLevelOf, createHoverGate } from './hover.js';
export { NEON_WORDS, NEON_HEX, CSS_NAMES, isNeonKey, neonKey, parseColour, toSettleColour } from './colour.js';
export { fitBox, luminance, luminances, coverages, thresholdBits, ditherBits, sampleLights, sampleCoverage, sourcePaint, litCount, parseViewBox, svgKind } from './raster.js';
export { createHeat, tauFor, breathOf, breathDelay } from './heat.js';
export { TRANSITION, SEQUENCE, transitionOf, morphHow, intervalFor, sequenceAt, createSequencer } from './transition.js';
export { HAZE, hazeOf, hazePlan, hazeDelay, hazeLevel, createHazeClock } from './haze.js';
export { FONTS, FONT_KINDS, DEFAULT_FONT_KEY, DEFAULT_FONT, fontOf } from './fonts.js';
export { HEADING, headingLevel, headingCss, headingFontPx, headingSize, headingPitch, headingLights, headingElement, headingText } from './heading.js';
