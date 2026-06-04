export default function GameOverScreen({ finalLevel, onRetry, onBack }) {
  return (
    <div className="bt-overlay">
      <div className="bt-panel bt-panel-danger">
        <div className="bt-kicker">Game Over</div>
        <h1>Level {finalLevel}</h1>
        <p className="bt-subtitle">
          A boom crossed the danger line. Retry starts a fresh solo run from level 1.
        </p>
        <div className="bt-actions">
          <button className="btn btn-gold" onClick={onRetry}>Retry</button>
          <button className="btn btn-ghost" onClick={onBack}>Back to Hub</button>
        </div>
      </div>
    </div>
  );
}
