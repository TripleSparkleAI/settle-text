// Changing words: a toggle whose label morphs from one word to the other, and a sequence of greetings that settles
// each out of the last. Both keep one width, so the old words and the new share a grid and the lights move.
import React, { useState } from 'react';
import { SettleText, SettleSequence } from 'settle-text/react';

export default function ChangingWords() {
  const [playing, setPlaying] = useState(true);
  return (
    <div>
      <button type="button" onClick={() => setPlaying(!playing)} aria-pressed={playing}>
        {playing ? 'Pause' : 'Play'}
      </button>
      <SettleText text={playing ? 'PAUSE' : 'PLAY'} width={240} wrap={false} size={56} color="lime" duration={900} decorative />
    </div>
  );
}

export function Greetings() {
  return (
    <SettleSequence
      items={['HELLO', 'BONJOUR', 'HALLO', 'CIAO', 'HOLA']}
      interval={2200}
      size={56}
      width={360}
      wrap={false}
      align="center"
      color="cyan"
    />
  );
}

export function Countdown({ onDone }) {
  return <SettleSequence items={['3', '2', '1', 'GO']} interval={1000} loop={false} size={72} width={160} align="center" onDone={onDone} />;
}
