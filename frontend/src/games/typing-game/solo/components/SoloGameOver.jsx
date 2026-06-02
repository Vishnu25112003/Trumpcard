export default function SoloGameOver({ stats, onRetry, onExit }) {
  const { score, elapsedSec, wpm, accuracy, destroyed, phase } = stats;
  const minutes = Math.floor(elapsedSec / 60);
  const seconds = elapsedSec % 60;
  return (
    <div className="tg-overlay">
      <div className="tg-overlay-card">
        <h2 style={{
          fontFamily: 'var(--font-brand)',
          fontSize: 28,
          margin: 0,
          background: 'linear-gradient(180deg, var(--gold-bright), var(--gold))',
          WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>Game Over</h2>
        <p style={{ color: 'var(--text-soft)', margin: '8px 0 0', fontSize: 13 }}>
          Bottles broke through the barrier. Try again!
        </p>
        <div className="tg-stat-grid">
          <div className="tg-stat"><div className="v">{score}</div><div className="l">Score</div></div>
          <div className="tg-stat"><div className="v">{destroyed}</div><div className="l">Bottles</div></div>
          <div className="tg-stat"><div className="v">{minutes}:{String(seconds).padStart(2, '0')}</div><div className="l">Time</div></div>
          <div className="tg-stat"><div className="v">{wpm}</div><div className="l">WPM</div></div>
          <div className="tg-stat"><div className="v">{accuracy}%</div><div className="l">Accuracy</div></div>
          <div className="tg-stat"><div className="v">{phase + 1}</div><div className="l">Phase</div></div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-gold" onClick={onRetry}>Retry →</button>
          <button className="btn btn-ghost" onClick={onExit}>Back to Hub</button>
        </div>
      </div>
    </div>
  );
}
