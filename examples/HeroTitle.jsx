// A hero title: one line of code. The words come out of noise in about 1.5 s, keep flickering, and settle again every
// six to twelve seconds (settle-text 0.4.0's alive default).
import React from 'react';
import { SettleText } from 'settle-text/react';

export default function HeroTitle() {
  return (
    <SettleText
      text="Render text as light"
      font='"Space Grotesk", "Helvetica Neue", Arial, sans-serif'
      size={72}
      color="#ff2fa0"
      label="Render text as light"
    />
  );
}
