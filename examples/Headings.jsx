// Headings, h1 to h6: a page's titles as lights, each a real heading element whose accessible name is its words.
// The level picks the element and the size (a CSS clamp per level); the lights follow the size the browser works out.
import React, { useState } from 'react';
import { SettleHeading } from 'settle-text/react';

const FACE = '"Space Grotesk", "Helvetica Neue", Arial, sans-serif';

export default function Headings() {
  return (
    <div>
      <SettleHeading level={1} text="Render text as light" font={FACE} />
      <SettleHeading level={2} font={FACE}>Getting started</SettleHeading>
      <SettleHeading level={3} font={FACE} color="cyan">Changing the words</SettleHeading>
      <SettleHeading level={4} font={FACE} color="amber">A smaller heading, finer dots</SettleHeading>
      <SettleHeading level={5} font={FACE} color="lime">Level five</SettleHeading>
      <SettleHeading level={6} font={FACE} color="violet">Level six</SettleHeading>
    </div>
  );
}

// a heading whose words change: the lights settle from the old title into the new one
export function ChangingHeading() {
  const [n, setN] = useState(0);
  const titles = ['Chapter one', 'Chapter two', 'Chapter three'];
  return (
    <div>
      <button type="button" onClick={() => setN((n + 1) % titles.length)}>next chapter</button>
      <SettleHeading level={2} font={FACE} text={titles[n]} wrap={false} />
    </div>
  );
}
