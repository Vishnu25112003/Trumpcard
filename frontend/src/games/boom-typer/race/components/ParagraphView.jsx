import { memo } from 'react';

// Per-character paragraph render with correct / wrong / cursor highlighting.
// cursorIndex = index of the next expected char (== correctChars in strict mode).
// wrongAt (or null) marks the char the player just mistyped.
function ParagraphView({ paragraph, cursorIndex, wrongAt }) {
  if (!paragraph) return null;
  const chars = [];
  for (let i = 0; i < paragraph.length; i++) {
    let cls = 'ch-pending';
    if (i < cursorIndex) cls = 'ch-correct';
    else if (i === cursorIndex && wrongAt === i) cls = 'ch-wrong';
    else if (i === cursorIndex) cls = 'ch-cursor';
    chars.push(<span key={i} className={cls}>{paragraph[i]}</span>);
  }
  return <div className="bt-paragraph">{chars}</div>;
}

export default memo(ParagraphView);
