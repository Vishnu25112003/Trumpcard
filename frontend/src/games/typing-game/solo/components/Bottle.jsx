export default function Bottle({ bottle, locked, typed }) {
  const word = bottle.word;
  // typed is what the player has correctly typed of this word so far.
  const done = typed.slice(0, Math.min(typed.length, word.length));
  let wrongStart = -1;
  for (let i = 0; i < done.length; i++) {
    if (word[i] !== done[i]) { wrongStart = i; break; }
  }
  const correctPart = wrongStart === -1 ? done : done.slice(0, wrongStart);
  const wrongPart = wrongStart === -1 ? '' : done.slice(wrongStart);
  const pendingPart = word.slice(correctPart.length + wrongPart.length);

  return (
    <div
      className={`tg-bottle${locked ? ' locked' : ''}`}
      style={{ left: bottle.x, top: bottle.y }}
    >
      <div className="tg-bottle-word">
        {correctPart && <span className="done">{correctPart}</span>}
        {wrongPart && <span className="err">{wrongPart}</span>}
        {pendingPart && <span className="pend">{pendingPart}</span>}
      </div>
      <div className="tg-bottle-body" />
    </div>
  );
}
