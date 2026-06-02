import { memo } from 'react';

// Per-character render with correct / wrong / cursor highlighting.
// cursorIndex = the index of the NEXT expected character.
// In strict mode, cursorIndex always equals correctChars count.
// If `wrongAt` is non-null, that index is rendered as a "wrong" attempt.
function ParagraphView({ paragraph, cursorIndex, wrongAt }) {
  if (!paragraph) return null;
  const chars = [];
  for (let i = 0; i < paragraph.length; i++) {
    const ch = paragraph[i];
    let cls = 'ch-pending';
    if (i < cursorIndex) cls = 'ch-correct';
    else if (i === cursorIndex && wrongAt === i) cls = 'ch-wrong';
    else if (i === cursorIndex) cls = 'ch-cursor';
    chars.push(<span key={i} className={cls}>{ch === ' ' ? ' ' : ch}</span>);
  }
  return <div className="tg-paragraph">{chars}</div>;
}

export default memo(ParagraphView);
