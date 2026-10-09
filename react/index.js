// settle-text/react - the four components, SettleSequence (a list of texts on a timer), SettleHeading (an h1 to h6
// drawn as a settle) and SettleLink (a link that re-settles on hover), and the pure half re-exported for convenience.
//   import { SettleText, SettleImage, SettleVector, SettleBackground, SettleSequence, SettleHeading, SettleLink } from 'settle-text/react';
export { SettleText } from './SettleText.jsx';
export { SettleImage } from './SettleImage.jsx';
export { SettleVector } from './SettleVector.jsx';
export { SettleBackground } from './SettleBackground.jsx';
export { SettleSequence } from './SettleSequence.jsx';
export { SettleHeading } from './SettleHeading.jsx';
export { SettleLink } from './SettleLink.jsx';
export { resolveColour } from './colour.js';
export { SettleTextDefaults, useSettleTextDefaults } from './defaults.js';
export { useAmbient, resettleMode } from './ambient.js';
export * from '../src/index.js';
