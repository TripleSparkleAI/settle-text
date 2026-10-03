// A logo from an SVG: give it the markup (or a path, or a URL ending in .svg). The ink's colour does not matter:
// a light is lit wherever the drawing covers it. `colors="source"` would keep the ink's own colours instead.
import React from 'react';
import { SettleVector } from 'settle-text/react';

export const LOGO = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <circle cx="60" cy="60" r="52" fill="none" stroke="#000" stroke-width="9"/>
  <path d="M66 18 L40 66 H60 L54 102 L82 52 H62 Z" fill="#000"/>
</svg>`;

export default function LogoFromSvg() {
  return <SettleVector svg={LOGO} width={260} color="lime" glow={0.9} alt="a bolt in a ring" />;
}

// the same mark as a single path, stroked in viewBox units
export function LogoFromPath() {
  return <SettleVector paths={['M66 18 L40 66 H60 L54 102 L82 52 H62 Z']} viewBox={[0, 0, 120, 120]} width={160} color="amber" alt="a bolt" />;
}
