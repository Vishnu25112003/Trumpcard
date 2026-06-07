import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { usePlayer } from '../../../../shared/context/PlayerContext';
import { getSocket } from '../../../../shared/socket/socket';
import api from '../../../../shared/utils/api';
import '../styles/race.css';

const MEDALS = ['🥇', '🥈', '🥉'];

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

  const doRematch = () => {
    getSocket().emit('typing:rematch', { roomCode, playerName });
    navigate(`/boom-typer/race/lobby/${roomCode}`);
  };

  return (
    <div className="ttd">
      <div className="menu-bg" /><div className="topglow" />
      <div className="center">
        <div className="card res-card">
          <p className="kicker">Photo Finish</p>
          <h1 className="title" style={{ fontSize: 48, marginBottom: 14 }}>Results</h1>

          <div className="restable">
            <div className="reshead">
              <span />
              <span>Driver</span>
              <span className="r">WPM</span>
              <span className="r">Acc</span>
              <span className="r">Done</span>
            </div>
            {results.map((c, i) => (
              <div key={c.playerId || c.name} className={`resrow${c.name === playerName ? ' me' : ''}`}>
                <span className="medal">{MEDALS[i] || <span style={{ color: '#5d655f' }}>{i + 1}</span>}</span>
                <span className="drv">{c.name === playerName ? <span style={{ color: '#f59e1b' }}>★</span> : null}{c.name}</span>
                <span className="num">{c.wpm}</span>
                <span className="num acc">{c.accuracy != null ? c.accuracy + '%' : '—'}</span>
                <span className="num win">{Math.round((c.progress || 0) * 100)}%</span>
              </div>
            ))}
            {!results.length && <p className="wait">No results yet.</p>}
          </div>

          <div className="res-actions">
            {isHost && <button className="btn-primary" onClick={doRematch}>Rematch →</button>}
            <button className="btn-secondary" onClick={() => navigate('/boom-typer/race')}>Back to Lobby</button>
          </div>
        </div>
      </div>
    </div>
  );
}
