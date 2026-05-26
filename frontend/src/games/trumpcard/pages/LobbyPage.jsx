import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../../../shared/context/GameContext';
import { getSocket } from '../../../shared/socket/socket';
import api from '../../../shared/utils/api';
import SparkleLayer from '../../../shared/components/SparkleLayer';

const AVATAR_CLASSES = ['', 'p2', 'p3', 'p4'];

function TopBar() {
  return (
    <div className="top-bar">
      <div className="brand">
        <div className="brand-mark">T</div>
        <div className="brand-text">
          <div className="b1">Game</div>
          <div className="b2">Lobby</div>
        </div>
      </div>
    </div>
  );
}

export default function LobbyPage() {
  const { roomCode } = useParams();
  const { playerName, setCurrentRoom } = useGame();
  const navigate = useNavigate();

  const [room, setRoom]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError]       = useState('');
  const [copied, setCopied]     = useState(false);

  const isCreator = room?.createdBy === playerName;
  const isFull    = room && room.players.length >= room.totalPlayers;

  const fetchRoom = useCallback(async () => {
    try {
      const res = await api.get(`/rooms/${roomCode}`);
      const room = res.data.data;
      setRoom(room);
      setCurrentRoom(room);
      if (room.status !== 'waiting') {
        navigate(`/trumpcard/game/${roomCode}`, { replace: true });
      }
    } catch {
      setError('Room not found');
    } finally {
      setLoading(false);
    }
  }, [roomCode, setCurrentRoom, navigate]);

  useEffect(() => {
    if (!playerName) { navigate('/trumpcard'); return; }
    fetchRoom();

    const socket = getSocket();
    if (!socket.connected) socket.connect();
    socket.emit('join_room', { roomCode, playerName });

    socket.on('room_updated', (data) => {
      if (data.status === 'playing') {
        navigate(`/trumpcard/game/${roomCode}`, { replace: true });
        return;
      }
      setRoom((prev) => prev ? { ...prev, players: data.players, status: data.status } : prev);
    });
    socket.on('game_started', (data) => {
      navigate(`/trumpcard/game/${roomCode}`, { state: { gameState: data.gameState } });
    });
    socket.on('error_message', (msg) => setError(msg));

    return () => {
      socket.off('room_updated');
      socket.off('game_started');
      socket.off('error_message');
    };
  }, [roomCode, playerName, navigate, fetchRoom]);

  const handleStartGame = () => {
    if (!isFull) return;
    setStarting(true);
    getSocket().emit('start_game', { roomCode });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Loading / error states
  if (loading) {
    return (
      <>
        <div className="table-bg" />
        <div className="center-screen">
          <div style={{ width: 40, height: 40, border: '2px solid var(--purple-bright)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="table-bg" />
        <div className="center-screen">
          <p style={{ color: 'var(--red)', marginBottom: 12 }}>{error}</p>
          <button className="btn btn-ghost" onClick={() => navigate('/trumpcard/dashboard')}>← Back</button>
        </div>
      </>
    );
  }

  const emptyCount = room ? Math.max(0, room.totalPlayers - room.players.length) : 0;

  return (
    <>
      <div className="table-bg" />
      <SparkleLayer />
      <TopBar />

      <div className="center-screen" style={{ justifyContent: 'flex-start', paddingTop: 100, gap: 0 }}>

        {/* Room code display */}
        <div className="code-display" onClick={copyCode} style={{ marginBottom: 12 }}>
          <div className="label">Room Code</div>
          <div className="code">{roomCode}</div>
          <div className="sub">{copied ? '✓ Copied!' : 'Tap to copy'}</div>
        </div>

        {/* Mini stats */}
        <div className="mini-stats" style={{ marginBottom: 12, gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="mini-stat">
            <div className="v">{room?.totalPlayers}</div>
            <div className="l">Players</div>
          </div>
          <div className="mini-stat">
            <div className="v">{room?.cardsPerPlayer}</div>
            <div className="l">Cards Each</div>
          </div>
          <div className="mini-stat">
            <div className="v">{room?.players.length}/{room?.totalPlayers}</div>
            <div className="l">Joined</div>
          </div>
          <div className="mini-stat">
            <div className="v">{!room?.matchDuration ? '∞' : `${room.matchDuration / 60}m`}</div>
            <div className="l">Duration</div>
          </div>
        </div>

        {/* Player slots */}
        <div className="stack" style={{ width: '100%', maxWidth: 420, marginBottom: 14 }}>
          {room?.players.map((p, i) => (
            <div key={p.name} className="player-row">
              <div className={`player-avatar ${AVATAR_CLASSES[i] || ''}`}>
                {p.name[0].toUpperCase()}
              </div>
              <span className="name">
                {p.name}
                {p.name === playerName && <span className="you">(you)</span>}
              </span>
              {p.name === room.createdBy && (
                <span className="badge badge-host">Host</span>
              )}
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 2s ease-in-out infinite', flexShrink: 0 }} />
            </div>
          ))}

          {Array(emptyCount).fill(null).map((_, i) => (
            <div key={`empty-${i}`} className="player-row waiting">
              <div className="player-avatar empty">?</div>
              <span className="name" style={{ color: 'var(--text-dim)' }}>Waiting for player...</span>
            </div>
          ))}
        </div>

        {/* Start / waiting */}
        {isCreator ? (
          <button
            className={`btn ${isFull ? 'btn-gold' : 'btn-ghost'}`}
            style={{ width: '100%', maxWidth: 420 }}
            onClick={handleStartGame}
            disabled={!isFull || starting}
          >
            {starting ? (
              <>
                <span style={{ width: 14, height: 14, border: '2px solid rgba(42,20,80,0.3)', borderTopColor: '#2a1450', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                Starting...
              </>
            ) : isFull ? '⚔️ Start Game' : `Waiting for ${emptyCount} more player${emptyCount !== 1 ? 's' : ''}...`}
          </button>
        ) : (
          <div style={{ width: '100%', maxWidth: 420, padding: '16px', background: 'var(--surface-strong)', border: '1px solid var(--line)', borderRadius: 14, textAlign: 'center' }}>
            {isFull
              ? <p style={{ color: 'var(--green)', fontSize: 13, fontWeight: 600 }}>All players joined! Waiting for host...</p>
              : <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>
                  Waiting for {emptyCount} more player{emptyCount !== 1 ? 's' : ''}...
                </p>
            }
          </div>
        )}

        {/* Leave button */}
        <button
          className="btn btn-ghost btn-sm"
          style={{ marginTop: 12 }}
          onClick={() => { getSocket().disconnect(); navigate('/trumpcard/dashboard'); }}
        >
          Leave Lobby
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </>
  );
}
