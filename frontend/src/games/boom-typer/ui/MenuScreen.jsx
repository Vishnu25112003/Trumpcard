export default function MenuScreen({ onStart, onBack }) {
  return (
    <div className="bt-overlay">
      <div className="bt-panel">
        <div className="bt-kicker">Solo Survival</div>
        <h1>Boom Typer</h1>
        <p className="bt-subtitle">
          Type the first letter to lock a falling boom, finish the word to blast it,
          and stop any boom from touching the danger line.
        </p>

        <div className="bt-rules">
          <span>Free lock-on</span>
          <span>No lives</span>
          <span>Endless levels</span>
          <span>Power booms spawn extra words</span>
        </div>

        <div className="bt-actions">
          <button className="btn btn-gold" onClick={onStart}>Start Solo</button>
          <button className="btn btn-ghost" onClick={onBack}>Back to Hub</button>
        </div>
      </div>
    </div>
  );
}
