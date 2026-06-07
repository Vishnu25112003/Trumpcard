import { carColor } from '../data/cars';

// Live standings. Finished players pin to the top in finish order; everyone
// else is sorted by % typed (descending) so overtakes swap ranks instantly.
// The local player's % uses the char-accurate local value for responsiveness.
export default function RankPanel({ players, localName, localProgress }) {
  const withProg = players.map((p) => ({
    ...p,
    liveProgress: p.name === localName ? localProgress : (p.progress || 0),
  }));
  withProg.sort((a, b) => {
    if (a.finished && b.finished) return (a.rank || 99) - (b.rank || 99);
    if (a.finished) return -1;
    if (b.finished) return 1;
    return (b.liveProgress || 0) - (a.liveProgress || 0);
  });

  return (
    <div className="bt-rank-panel">
      <div className="bt-rank-title">Standings</div>
      {withProg.map((p, i) => (
        <div key={p.name} className={`bt-rank-row${p.name === localName ? ' me' : ''}`}>
          <span className="pos">{i + 1}</span>
          <span className="dot" style={{ background: carColor(p.carId) }} />
          <span className="nm">{p.name === localName ? '★ ' : ''}{p.name}</span>
          <span className="pc">
            {p.finished ? `#${p.rank}` : `${Math.round((p.liveProgress || 0) * 100)}%`}
          </span>
        </div>
      ))}
    </div>
  );
}
