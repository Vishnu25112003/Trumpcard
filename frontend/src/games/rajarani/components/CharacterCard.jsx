import { characterInfo } from '../utils/rajaRaniConfig';

export default function CharacterCard({ character, hidden, viewed, compact }) {
  const info = characterInfo(character);
  return (
    <div className={`rr-card${hidden ? ' hidden' : ''}${viewed ? ' viewed' : ''}${compact ? ' compact' : ''}`}>
      <div className="rr-card-inner">
        <div className="rr-card-back">RR</div>
        <div className="rr-card-front" style={{ borderColor: `${info.color}88`, boxShadow: `0 0 22px ${info.color}33` }}>
          <div className="rr-card-icon">{info.icon}</div>
          <div className="rr-card-name">{info.label}</div>
          <div className="rr-card-title">{info.title}</div>
          <div className="rr-card-score">{info.score}</div>
        </div>
      </div>
    </div>
  );
}
