export default function HUD({ level, cleared, goal, liveBoomCount, maxBooms }) {
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
    </div>
  );
}
