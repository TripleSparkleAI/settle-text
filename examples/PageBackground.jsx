// A page background: a full-bleed settle behind your content. `still` (the default) draws it once and settles
// once, then does no frame work at all: the CPU-lovely mode. Set still={false} for a live, breathing one.
import React from 'react';
import { SettleBackground } from 'settle-text/react';
import { LOGO } from './LogoFromSvg.jsx';

export default function PageBackground({ children }) {
  return (
    <SettleBackground svg={LOGO} fit="contain" opacity={0.35} color="violet" style={{ minHeight: 360, background: '#0a0810' }}>
      <div style={{ padding: '48px 32px', color: '#f3eefc', fontFamily: 'system-ui, sans-serif' }}>{children}</div>
    </SettleBackground>
  );
}

// a photo background, live: the lights re-settle every few seconds
export function LivePhotoBackground({ children, src = '/hero-hot.jpg' }) {
  return (
    <SettleBackground src={src} fit="cover" opacity={0.5} colors="source" dither still={false} breathe={6} resolution="medium" style={{ minHeight: 360, background: '#000' }}>
      <div style={{ padding: '48px 32px', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>{children}</div>
    </SettleBackground>
  );
}
