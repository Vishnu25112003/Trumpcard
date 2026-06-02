export default function ProgressLeaderboard({ players, myName }) {
  const sorted = [...players].sort((a, b) => {
    if (a.finished && b.finished) return (a.rank || 0) - (b.rank || 0);
    if (a.finished) return -1;
    if (b.finished) return 1;
    return (b.progress || 0) - (a.progress || 0);
  });
  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {sorted.map((p, i) => {
        const isMe = p.name === myName;
        const progress = Math.max(0, Math.min(1, p.progress || 0));
        return (
          <div key={p.name} className={`tg-leaderboard-row${isMe ? ' me' : ''}`}>
            <div className="rank">#{p.rank || i + 1}</div>
            <div>
              <div style={{ fontSize: 12, color: 'white', marginBottom: 4, fontWeight: 600 }}>
                {isMe ? '★ ' : ''}{p.name}{p.finished ? ' ✓' : ''}
              </div>
              <div className="bar">
                <div className="bar-fill" style={{ transform: `scaleX(${progress})` }} />
              </div>
            </div>
            <div className="stat">{Math.round(progress * 100)}%</div>
          </div>
        );
      })}
    </div>
  );
}
