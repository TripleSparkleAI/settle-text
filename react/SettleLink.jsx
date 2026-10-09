// settle-text/react · SettleLink - a link whose words are a settle of lights, re-settling when pointed at or focused.
//   <SettleLink href="/docs" text="Docs" size={24} />
//
// <claudes_code_comments>
// ** Function List **
// SettleLink(props) - the component
//   href, text       the link and its words (the words are the link's accessible name)
//   hover            true | 0..1 (0.7): the re-settle on pointer enter and on keyboard focus; false turns it off
//   width            'fit' (default): one line as wide as the words; a number of CSS px; null fills the container
//   wrap             bool (false)
//   size             CSS px (24): the font size of the words
//   target, rel, onClick, id, title, download, aria-current, className, style   on the <a>
//   color            default LASER GREEN #30ff46 (THE PALETTE's link colour)
//   ...              every other SettleText prop (font, weight, glow, resolution, align, transition, resettle, ...)
//
// ** Technical Review **
// - An <a class="settle-link">, inline-block, so a row of them sits like a row of words. Inside it one SettleText:
//   its visually hidden span carries the words and its canvas is aria-hidden, so the link is named by its text.
// - The hover is SettleText's own (react/Lights.jsx): the lights listen on the nearest enclosing link, so pointing at
//   the link or tabbing to it gives them a heat kick; reduced motion and still mode draw the words once and never
//   kick.
// - width 'fit' measures the words in the face at `size` (and again when the font loads), so the link is exactly as
//   wide as its words plus a light of margin each side.
// </claudes_code_comments>

import React from 'react';
import { SettleText } from './SettleText.jsx';
import { HOVER } from '../src/hover.js';
import { PALETTE } from '../src/palette.js';

export function SettleLink({
  href,
  text = '',
  hover = HOVER.link,
  width = 'fit',
  wrap = false,
  size = 24,
  target,
  rel,
  onClick,
  id,
  title,
  download,
  'aria-current': ariaCurrent,
  className = '',
  style,
  ...rest
}) {
  return (
    <a
      href={href}
      target={target}
      rel={rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined)}
      onClick={onClick}
      id={id}
      title={title}
      download={download}
      aria-current={ariaCurrent}
      className={`settle-link${className ? ` ${className}` : ''}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
      data-settle-link=""
    >
      <SettleText defaultColor={PALETTE.link} {...rest} text={text} size={size} width={width} wrap={wrap} hover={hover} />
    </a>
  );
}
