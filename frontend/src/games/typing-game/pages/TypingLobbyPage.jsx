import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlayer } from '../../../shared/context/PlayerContext';
import { useTyping } from '../context/TypingContext';
import { getSocket } from '../../../shared/socket/socket';
import api from '../../../shared/utils/api';
import SparkleLayer from '../../../shared/components/SparkleLayer';
import '../styles/typing.css';

const DIFF_OPTIONS = ['easy', 'medium', 'hard'];

export default function TypingLobbyPage() {
  const { code } = useParams();
  const { playerName } = usePlayer();
  const { isHost, initRoom } = useTyping();
  const [room, setRoom] = useState(null);
  const [copied, setCopied] = useState(false);
  const joined = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!playerName) { navigate('/typing-game'); return; }
    const roomCode = code.toUpperCase();
    const sameName = (a, b) => a?.trim().toLowerCase() === b?.trim().toLowerCase();
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    socket.on('typing:lobby_update', (nextRoom) => {
      setRoom(nextRoom);
      initRoom({
        roomCode: nextRoom.roomCode,
        maxPlayers: nextRoom.maxPlayers,
        difficulty: nextRoom.difficulty,
        isHost: sameName(nextRoom.hostName, playerName),
      });
    });
    socket.on('typing:countdown', () => navigate(`/typing-game/race/${code}`));
    socket.on('typing:rematch_ready', (payload) => {
      setRoom(payload.room);
    });
    socket.on('typing:error', (payload) => alert(payload?.message || 'Error'));

    api.get(`/typing/rooms/${roomCode}`)
      .then(({ data }) => {
        if (!data.success) return;
        setRoom(data.room);
        initRoom({
          roomCode: data.room.roomCode,
          maxPlayers: data.room.maxPlayers,
          difficulty: data.room.difficulty,
          isHost: sameName(data.room.hostName, playerName),
        });
        if (data.room.status === 'active') navigate(`/typing-game/race/${roomCode}`);
      })
      .catch((err) => {
        alert(err.response?.data?.error || 'Room not found');
        navigate('/typing-game/dashboard');
      });

    if (!joined.current) {
      joined.current = true;
      socket.emit('typing:room:join', { roomCode, playerName });
    }

    return () => {
      socket.off('typing:lobby_update');
      socket.off('typing:countdown');
      socket.off('typing:rematch_ready');
      socket.off('typing:error');
    };
  }, [code, playerName, navigate, initRoom]);

  const start = () => getSocket().emit('typing:start', { roomCode: code.toUpperCase(), playerName });
  const setDifficulty = (difficulty) =>
    getSocket().emit('typing:set_difficulty', { roomCode: code.toUpperCase(), playerName, difficulty });

  const copy = () => navigator.clipboard.writeText(code).then(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  });

  const players = room?.players || [];
  const connectedCount = players.filter((p) => p.connected).length;
  const host = room?.hostName?.trim().toLowerCase() === playerName?.trim().toLowerCase() || isHost;
  const difficulty = room?.difficulty || 'medium';

  return (
    <>
      <div className="table-bg" />
      <SparkleLayer />
      <div className="center-screen">
        <div className="code-display" onClick={copy} style={{ cursor: 'pointer' }}>
          <div className="label">Room Code</div>
          <div className="code">{code}</div>
          <div className="sub">{copied ? 'Copied' : 'Tap to copy'}</div>
        </div>
        <div className="mini-stats">
          <div className="mini-stat"><div className="v">{connectedCount}</div><div className="l">Ready</div></div>
          <div className="mini-stat"><div className="v">{room?.maxPlayers || 8}</div><div className="l">Max</div></div>
          <div className="mini-stat"><div className="v" style={{ textTransform: 'capitalize', fontSize: 16 }}>{difficulty}</div><div className="l">Difficulty</div></div>
        </div>
        <div style={{ width: '100%', maxWidth: 520, display: 'grid', gap: 8 }}>
          {players.map((p) => (
            <div key={p.name} className={`player-row${p.connected ? '' : ' waiting'}`}>
              <div className="player-avatar">{p.name[0]?.toUpperCase()}</div>
              <div className="name">{p.name}</div>
              <span className="badge">{p.isHost ? 'Host' : p.connected ? 'Ready' : 'Offline'}</span>
            </div>
          ))}
        </div>
        {host && (
          <div style={{ width: '100%', maxWidth: 520, marginTop: 14 }}>
            <label className="field-label">Difficulty (Host)</label>
            <div className="option-grid cols-3">
              {DIFF_OPTIONS.map((d) => (
                <button
                  key={d}
                  className={`opt${difficulty === d ? ' active' : ''}`}
                  onClick={() => setDifficulty(d)}
                  style={{ textTransform: 'capitalize' }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}
        {host ? (
          <button
            className="btn btn-gold"
            disabled={connectedCount < 1}
            onClick={start}
            style={{ marginTop: 18 }}
          >
            Start Race →
          </button>
        ) : (
          <p className="muted center" style={{ marginTop: 16 }}>Waiting for host to start...</p>
        )}
      </div>
    </>
  );
}
