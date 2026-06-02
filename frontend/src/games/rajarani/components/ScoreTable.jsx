import { characterInfo } from '../utils/rajaRaniConfig';

export default function ScoreTable({ chainOrder = [], secondsLeft }) {
  return (
    <div className="field-card rr-panel">
      <div className="rr-panel-head">
        <div>
          <h2>Royal Court</h2>
          <p>Cards in this match</p>
        </div>
        {secondsLeft != null && <div className="rr-count">{secondsLeft}s</div>}
      </div>
      <div className="rr-score-grid">
        {chainOrder.map((key, index) => {
          const info = characterInfo(key);
          return (
            <div key={key} className="rr-score-row">
              <span>{index + 1}</span>
              <strong style={{ color: info.color }}>{info.icon} {info.label}</strong>
              <em>{info.score}</em>
            </div>
          );
        })}
      </div>
    </div>
  );
}
