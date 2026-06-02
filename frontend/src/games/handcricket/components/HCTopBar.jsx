export default function HCTopBar({ modeLabel, phaseRole, onLeave }) {
  return (
    <div className="top-bar">
      <div className="brand">
        <div
          className="brand-mark"
          style={{ background: 'linear-gradient(135deg, var(--cyan), #2aa0c2)', color: '#0a3a4a' }}
        >
          🏏
        </div>
        <div className="brand-text">
          <div className="b1">{modeLabel}</div>
          <div
            className="b2"
            style={{
              background: 'linear-gradient(180deg, var(--cyan), #2aa0c2)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Hand Cricket
          </div>
        </div>
      </div>

      <div className="hc-top-actions">
        {phaseRole && (
          <div className="round-pill">
            {phaseRole === 'bat' ? '🏏 Batting' : '⚾ Bowling'}
          </div>
        )}
        <button
          className="btn btn-ghost btn-sm"
          onClick={onLeave}
          style={{ color: 'var(--text-dim)', fontSize: 11 }}
        >
          Leave
        </button>
      </div>
    </div>
  );
}
