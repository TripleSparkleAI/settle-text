// Links that re-settle: a row of links whose words are lights. Each is exactly as wide as its words, and pointing at
// one, or reaching it with Tab, gives its lights a little heat so they shimmer and settle back.
import React from 'react';
import { SettleLink, SettleText } from 'settle-text/react';

const FACE = '"Space Grotesk", "Helvetica Neue", Arial, sans-serif';

export default function LinksThatSettle() {
  return (
    <nav aria-label="demo links" style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
      <SettleLink href="#docs" text="Docs" font={FACE} />
      <SettleLink href="#recipes" text="Recipes" font={FACE} color="cyan" />
      <SettleLink href="#demo" text="The demo" font={FACE} color="lime" />
    </nav>
  );
}

// hover on any component: the button is the control, the lights listen to it
export function HoverButton() {
  return (
    <button type="button" style={{ background: 'none', border: '1px solid #3a3346', padding: '6px 10px', cursor: 'pointer' }}>
      <SettleText text="Point at me" width="fit" size={28} color="amber" hover />
    </button>
  );
}
