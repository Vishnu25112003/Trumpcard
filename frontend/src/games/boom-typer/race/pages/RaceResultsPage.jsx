import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { usePlayer } from '../../../../shared/context/PlayerContext';
import { getSocket } from '../../../../shared/socket/socket';
import api from '../../../../shared/utils/api';
import { formatTime } from '../../../typing-game/shared/utils/typingMath';
import '../styles/race.css';

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function RaceResultsPage() {
  const { code } = useParams();
  const roomCode = code.toUpperCase();
  const { playerName } = usePlayer();
  const navigate = useNavigate();
  const location = useLocation();
  const [results, setResults] = useState(location.state?.results || []);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    api.get(`/typing/rooms/${roomCode}/state`).then(({ data }) => {
      if (!results.length && data.state?.results) setResults(data.state.results);
      setIsHost(data.room?.hostName === playerName);
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, playerName]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();
    const onRematch = () => navigate(`/boom-typer/race/lobby/${roomCode}`);
    socket.on('typing:rematch_ready', onRematch);
    return () => socket.off('typing:rematch_ready', onRematch);
  }, [roomCode, navigate]);

  const rematch = () => {
    getSocket().emit('typing:rematch', { roomCode, playerName });
    navigate(`/boom-typer/race/lobby/${roomCode}`);
  };

  return (
    <div className="bt-race-shell">
      <button className="bt-hub-exit" onClick={() => navigate('/boom-typer')}>← Boom Typer</button>
      <div className="bt-race-card wide">
        <div className="bt-race-eyebrow">Photo finish</div>
        <h2 className="bt-race-h">Results</h2>

        <div className="bt-results">
          <div className="bt-result-head">
            <span className="rank">#</span>
            <span className="name">Driver</span>
            <span className="stat">WPM</span>
            <span className="stat">Acc</span>
            <span className="stat">Time</span>
          </div>
          {results.map((r) => (
            <div key={r.playerId || r.name} className={`bt-result-row${r.name === playerName ? ' me' : ''}`}>
              <span className="rank">{MEDAL[r.rank] || `#${r.rank}`}</span>
              <span className="name">{r.name === playerName ? '★ ' : ''}{r.name}</span>
              <span className="stat">{r.wpm}</span>
              <span className="stat">{r.accuracy}%</span>
              <span className={`stat${r.dnf ? ' dnf' : ''}`}>
                {r.dnf ? `${Math.round((r.progress || 0) * 100)}%` : formatTime(r.finishMs)}
              </span>
            </div>
          ))}
          {!results.length && <div className="bt-race-wait">No results yet.</div>}
        </div>

        <div className="bt-btn-row">
          {isHost && <button className="bt-btn primary" onClick={rematch}>Rematch →</button>}
          <button className="bt-btn" onClick={() => navigate('/boom-typer')}>Back to Boom Typer</button>
        </div>
      </div>
    </div>
  );
}
