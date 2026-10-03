// A neon sign: a serif face, a cyan neon word, a strong glow, more noise at rest so the tube hums, on a dark plate.
import React from 'react';
import { SettleText } from 'settle-text/react';

export default function NeonSign() {
  return (
    <SettleText
      text="OPEN ALL NIGHT"
      font='Georgia, "Times New Roman", serif'
      weight={400}
      size={56}
      color="cyan"
      glow={1.4}
      temperature={0.7}
      breathe={4}
      align="center"
      background="#07060a"
      style={{ padding: '24px 0' }}
      label="Open all night"
    />
  );
}
