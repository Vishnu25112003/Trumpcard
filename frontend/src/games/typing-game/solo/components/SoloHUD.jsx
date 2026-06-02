export default function SoloHUD({ score, phase, elapsedSec, wpm, onPause, paused, onExit }) {
  const minutes = Math.floor(elapsedSec / 60);
  const seconds = elapsedSec % 60;
  return (
    <div className="tg-solo-hud">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div className="tg-hud-pill">Score <span className="v">{score}</span></div>
        <div className="tg-hud-pill">Phase <span className="v">{phase + 1}</span></div>
        <div className="tg-hud-pill">Time <span className="v">{minutes}:{String(seconds).padStart(2, '0')}</span></div>
        <div className="tg-hud-pill">WPM <span className="v">{wpm}</span></div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-ghost btn-sm" onClick={onPause}>{paused ? 'Resume' : 'Pause'}</button>
        <button className="btn btn-ghost btn-sm" onClick={onExit}>Exit</button>
      </div>
    </div>
  );
}
