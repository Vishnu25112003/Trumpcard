import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlayer } from '../../../../shared/context/PlayerContext';
import { getSocket } from '../../../../shared/socket/socket';
import api from '../../../../shared/utils/api';
import { carLabel, carColor } from '../data/cars';
import '../styles/race.css';

const MODES = [
  { key: 'easy', label: 'Easy' },
  { key: 'medium', label: 'Medium' },
  { key: 'large', label: 'Large' },
];

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
    const onLobby = (next) => setRoom(next);
    const onCountdown = () => navigate(`/boom-typer/race/play/${roomCode}`);
    socket.on('typing:lobby_update', onLobby);
    socket.on('typing:countdown', onCountdown);
    api.get(`/typing/rooms/${roomCode}`).then(({ data }) => setRoom(data.room)).catch(() => {});
    if (!joined.current) { joined.current = true; socket.emit('typing:room:join', { roomCode, playerName }); }
    return () => { socket.off('typing:lobby_update', onLobby); socket.off('typing:countdown', onCountdown); };
  }, [roomCode, playerName, navigate]);

  const start = () => getSocket().emit('typing:start', { roomCode, playerName });
  const setMode = (difficulty) => getSocket().emit('typing:set_difficulty', { roomCode, playerName, difficulty });
  const leave = () => { getSocket().emit('typing:leave', { roomCode, playerName }); navigate('/boom-typer/race'); };
  const copyCode = () => navigator.clipboard?.writeText(roomCode).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1400); }).catch(() => {});

  const players = room?.players || [];
  const canStart = players.length >= 2;

  return (
    <div className="ttd">
      <div className="menu-bg" /><div className="topglow" />
      <nav className="nav"><button className="btn-ghost" onClick={leave}>← Leave</button></nav>

      <div className="center">
        <div className="card">
          <p className="kicker">Lobby</p>
          <button className="roomcode" onClick={copyCode} title="Click to copy">
            {roomCode} <span className="cp">{copied ? '✓ copied' : 'copy'}</span>
          </button>
          <p className="meta-line">{players.length}/{room?.maxPlayers || 6} drivers · waiting room</p>

          <div className="roster">
            {players.map((p) => (
              <div key={p.name} className={`roster-row${p.name === playerName ? ' me' : ''}`}>
                <span className="dot" style={{ background: carColor(p.carId) }} />
                <span className="nm">{p.name === playerName ? '★ ' : ''}{p.name}{p.isHost ? ' · host' : ''}</span>
                <span className="car">{carLabel(p.carId)}</span>
                <span className={`st${p.connected ? ' on' : ''}`}>{p.connected ? 'ready' : '…'}</span>
              </div>
            ))}
          </div>

          {isHost ? (
            <>
              <p className="field-label">Race Length</p>
              <div className="seg">
                {MODES.map((m) => (
                  <div key={m.key} className={`seg-tile${room?.difficulty === m.key ? ' on' : ''}`} onClick={() => setMode(m.key)}>
                    <b>{m.label}</b>
                  </div>
                ))}
              </div>
              <button className="btn-primary" onClick={start} disabled={!canStart}>
                {canStart ? 'Start race →' : 'Need at least 2 drivers'}
              </button>
            </>
          ) : (
            <p className="wait">Waiting for the host to start…</p>
          )}
        </div>
      </div>
    </div>
  );
}
