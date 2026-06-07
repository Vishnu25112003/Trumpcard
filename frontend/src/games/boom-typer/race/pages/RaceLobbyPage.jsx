import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlayer } from '../../../../shared/context/PlayerContext';
import { getSocket } from '../../../../shared/socket/socket';
import api from '../../../../shared/utils/api';
import { carLabel, carColor } from '../data/cars';
import '../styles/race.css';

const MODE_LABEL = { easy: 'Easy', medium: 'Medium', large: 'Large' };

export default function RaceLobbyPage() {
  const { code } = useParams();
  const roomCode = code.toUpperCase();
  const { playerName } = usePlayer();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [copied, setCopied] = useState(false);
  const joined = useRef(false);

  const isHost = room?.hostName === playerName || room?.players?.find((p) => p.name === playerName)?.isHost;

  useEffect(() => {
    if (!playerName) { navigate('/boom-typer/race'); return undefined; }
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const onLobby = (nextRoom) => setRoom(nextRoom);
    const onCountdown = () => navigate(`/boom-typer/race/play/${roomCode}`);
    const onError = () => {};

    socket.on('typing:lobby_update', onLobby);
    socket.on('typing:countdown', onCountdown);
    socket.on('typing:error', onError);

    api.get(`/typing/rooms/${roomCode}`).then(({ data }) => setRoom(data.room)).catch(() => {});

    if (!joined.current) {
      joined.current = true;
      socket.emit('typing:room:join', { roomCode, playerName });
    }

    return () => {
      socket.off('typing:lobby_update', onLobby);
      socket.off('typing:countdown', onCountdown);
      socket.off('typing:error', onError);
    };
  }, [roomCode, playerName, navigate]);

  const start = () => getSocket().emit('typing:start', { roomCode, playerName });
  const setMode = (difficulty) => getSocket().emit('typing:set_difficulty', { roomCode, playerName, difficulty });
  const leave = () => {
    getSocket().emit('typing:leave', { roomCode, playerName });
    navigate('/boom-typer/race');
  };
  const copyCode = () => {
    navigator.clipboard?.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    }).catch(() => {});
  };

  const players = room?.players || [];
  const canStart = players.length >= 2;

  return (
    <div className="bt-race-shell">
      <button className="bt-hub-exit" onClick={leave}>← Leave</button>
      <div className="bt-race-card wide">
        <div className="bt-race-eyebrow">Lobby</div>
        <button className="bt-roomcode" onClick={copyCode} title="Click to copy">
          {roomCode} <span className="copy">{copied ? '✓ copied' : 'copy'}</span>
        </button>
        <div className="bt-race-meta">{MODE_LABEL[room?.difficulty] || 'Medium'} race · {players.length}/{room?.maxPlayers || 6} drivers</div>

        <div className="bt-roster">
          {players.map((p) => (
            <div key={p.name} className={`bt-roster-row${p.name === playerName ? ' me' : ''}`}>
              <span className="dot" style={{ background: carColor(p.carId) }} />
              <span className="nm">{p.name === playerName ? '★ ' : ''}{p.name}{p.isHost ? ' (host)' : ''}</span>
              <span className="car">{carLabel(p.carId)}</span>
              <span className={`status${p.connected ? ' on' : ''}`}>{p.connected ? 'ready' : '…'}</span>
            </div>
          ))}
        </div>

        {isHost ? (
          <>
            <label className="bt-race-label">Race length</label>
            <div className="bt-opt-row">
              {['easy', 'medium', 'large'].map((m) => (
                <button key={m} className={`bt-opt${room?.difficulty === m ? ' on' : ''}`} onClick={() => setMode(m)}>
                  <b>{MODE_LABEL[m]}</b>
                </button>
              ))}
            </div>
            <button className="bt-btn primary" onClick={start} disabled={!canStart}>
              {canStart ? 'Start race →' : 'Need at least 2 drivers'}
            </button>
          </>
        ) : (
          <div className="bt-race-wait">Waiting for the host to start…</div>
        )}
      </div>
    </div>
  );
}
