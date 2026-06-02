export default function SearchPopup({ targetLabel, seats, eligibleIds, onPick, disabled }) {
  const eligible = seats.filter((seat) => eligibleIds.includes(seat.playerId));
  return (
    <div className="rr-search">
      <div className="rr-search-title">Find {targetLabel}</div>
      <div className="rr-search-grid">
        {eligible.map((seat) => (
          <button key={seat.playerId} className="opt" disabled={disabled} onClick={() => onPick(seat.playerId)}>
            <span className="player-avatar">{seat.name[0]?.toUpperCase()}</span>
            <span>{seat.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
