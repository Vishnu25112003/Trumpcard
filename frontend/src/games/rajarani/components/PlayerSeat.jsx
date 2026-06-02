import CharacterCard from './CharacterCard';
import { characterInfo } from '../utils/rajaRaniConfig';

export default function PlayerSeat({ seat, isMe, isSearcher, rajaId }) {
  const revealed = seat?.revealed || seat?.card;
  const info = characterInfo(seat?.card);
  return (
    <div className={`rr-seat${isMe ? ' me' : ''}${isSearcher ? ' searcher' : ''}${seat?.afk ? ' afk' : ''}`}>
      <div className="rr-seat-top">
        <div className="player-avatar">{seat?.name?.[0]?.toUpperCase() || '?'}</div>
        <div>
          <div className="name">{seat?.name}</div>
          <div className="rr-seat-sub">
            {seat?.playerId === rajaId ? 'Raja revealed' : seat?.viewed ? 'Viewed' : 'Waiting'}
          </div>
        </div>
      </div>
      <CharacterCard character={seat?.card} hidden={!revealed} compact />
      {seat?.revealed && <span className="badge" style={{ color: info.color, borderColor: `${info.color}66` }}>{info.label} · {seat.lockedScore}</span>}
      {isSearcher && <span className="badge badge-host">Searching</span>}
    </div>
  );
}
