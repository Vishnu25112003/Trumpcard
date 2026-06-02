const VEHICLES = ['🚗', '🚙', '🏎️', '🚐', '🚚', '🛵', '🚌', '🚛', '🚜', '🏍️'];

export default function Track({ player, isMe, index, total }) {
  const progress = Math.max(0, Math.min(1, player.progress || 0));
  const vehicle = VEHICLES[index % VEHICLES.length];
  return (
    <div className={`tg-track${isMe ? ' me' : ''}`}>
      <div className="tg-track-head">
        <span className="tg-track-name">
          {isMe ? '★ ' : ''}{player.name}
          {player.finished && player.rank ? ` · #${player.rank}` : ''}
        </span>
        <span className="tg-track-stats">{Math.round(progress * 100)}%</span>
      </div>
      <div className="tg-track-rail">
        <div className="tg-track-fill" style={{ transform: `scaleX(${progress})` }} />
        <div className="tg-track-finish" />
        <div
          className="tg-vehicle"
          style={{ left: `calc(${progress * 100}% - ${progress > 0.95 ? 18 : 12}px)` }}
        >
          {vehicle}
        </div>
      </div>
    </div>
  );
}
