export default function HUD({ level, cleared, goal, liveBoomCount, maxBooms, lockedWord, lockedTypedIndex = 0 }) {
  const typed = lockedWord ? lockedWord.slice(0, lockedTypedIndex) : '';
  const remaining = lockedWord ? lockedWord.slice(lockedTypedIndex) : 'none';

  return (
    <div className="bt-hud">
      <div className="bt-hud-item">
        <span>Level</span>
        <strong>{level}</strong>
      </div>
      <div className="bt-hud-item">
        <span>Cleared</span>
        <strong>{cleared}/{goal}</strong>
      </div>
      <div className="bt-hud-item">
        <span>Booms</span>
        <strong>{liveBoomCount}/{maxBooms}</strong>
      </div>
      <div className="bt-hud-item bt-hud-target">
        <span>Target</span>
        <strong>
          {lockedWord ? (
            <>
              <mark>{typed}</mark>{remaining}
            </>
          ) : remaining}
        </strong>
      </div>
    </div>
  );
}
