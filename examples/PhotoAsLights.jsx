// A photo as lights: dither keeps the tones (a grey becomes a density of dots), colors="source" keeps each
// light's own colour. Without colors every lit light wears the one `color`.
import React from 'react';
import { SettleImage } from 'settle-text/react';

export default function PhotoAsLights({ src = '/hero-hot.jpg' }) {
  return <SettleImage src={src} alt="a hot landscape, as lights" resolution="high" dither colors="source" glow={0.6} />;
}

// a line drawing is a clean two-tone cut: no dither, one colour, the ink lit
export function DrawingAsLights({ src = '/galileo-moon.png' }) {
  return <SettleImage src={src} alt="Galileo's drawing of the moon at first quarter, 1610" resolution="medium" color="ice" width={420} />;
}
