import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { getSocket } from '../socket/socket';
import api from '../utils/api';

export default function LobbyPage() {
  const { roomCode } = useParams();
  const { playerName, setCurrentRoom } = useGame();
  const navigate = useNavigate();

  const [room, setRoom]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError]     = useState('');
  const [copied, setCopied]   = useState(false);

  const isCreator = room?.createdBy === playerName;
  const isFull    = room && room.players.length >= room.totalPlayers;

  const fetchRoom = useCallback(async () => {
    try {
      const res = await api.get(`/rooms/${roomCode}`);
      const room = res.data.data;
      setRoom(room);
      setCurrentRoom(room);
      // If game already started (e.g. host refreshed mid-transition), go straight to game
      if (room.status !== 'waiting') {
        navigate(`/game/${roomCode}`, { replace: true });
      }
    } catch {
      setError('Room not found');
    } finally {
      setLoading(false);
    }
  }, [roomCode, setCurrentRoom, navigate]);

  useEffect(() => {
    if (!playerName) { navigate('/'); return; }
    fetchRoom();

    const socket = getSocket();
    if (!socket.connected) socket.connect();
    socket.emit('join_room', { roomCode, playerName });

    socket.on('room_updated', (data) => {
      if (data.status === 'playing') {
        navigate(`/game/${roomCode}`, { replace: true });
        return;
      }
      setRoom((prev) => prev ? { ...prev, players: data.players, status: data.status } : prev);
    });
    socket.on('game_started', (data) => {
      navigate(`/game/${roomCode}`, { state: { gameState: data.gameState } });
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

  // ── loading / error ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-red-400">{error}</p>
          <button onClick={() => navigate('/dashboard')}
            className="text-purple-400 hover:text-purple-300 text-sm">← Back</button>
        </div>
      </div>
    );
  }

  const emptyCount = room ? Math.max(0, room.totalPlayers - room.players.length) : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Header */}
      <header className="bg-[#12121a] border-b border-[#1a1a2e] px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🃏</span>
          <span className="text-white font-bold">Game Lobby</span>
        </div>
        <button
          onClick={() => { getSocket().disconnect(); navigate('/dashboard'); }}
          className="text-gray-600 hover:text-gray-300 text-xs border border-[#2a2a3e]
            hover:border-gray-600 px-3 py-1.5 rounded-lg transition-colors"
        >
          Leave
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm space-y-5">

          {/* Room code card */}
          <div className="bg-[#12121a] border border-[#1a1a2e] rounded-2xl p-5 text-center animate-fade-in">
            <p className="text-gray-600 text-[11px] uppercase tracking-widest mb-2">Room Code</p>
            <button
              onClick={copyCode}
              className="group flex items-center justify-center gap-3 mx-auto"
              title="Click to copy"
            >
              <span className="text-3xl font-bold text-white tracking-[0.15em] font-mono">
                {roomCode}
              </span>
              <span className={`transition-all text-lg ${copied ? 'text-green-400 scale-125' : 'text-gray-600 group-hover:text-purple-400'}`}>
                {copied ? '✓' : '⧉'}
              </span>
            </button>
            <p className="text-gray-700 text-xs mt-2">
              {copied ? 'Copied!' : 'Tap code to copy'}
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 animate-slide-up" style={{ animationDelay: '0.05s' }}>
            {[
              { val: room?.totalPlayers,   label: 'Players',    color: 'text-purple-400' },
              { val: room?.cardsPerPlayer, label: 'Cards Each', color: 'text-amber-400'  },
              { val: `${room?.players.length}/${room?.totalPlayers}`, label: 'Joined', color: 'text-green-400' },
            ].map((s) => (
              <div key={s.label} className="bg-[#12121a] border border-[#1a1a2e] rounded-xl p-3 text-center">
                <p className={`font-bold text-xl ${s.color}`}>{s.val}</p>
                <p className="text-gray-600 text-[11px] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Player slots */}
          <div className="bg-[#12121a] border border-[#1a1a2e] rounded-2xl p-4 space-y-2.5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <p className="text-gray-600 text-[11px] uppercase tracking-widest mb-3">Players</p>

            {room?.players.map((p, i) => (
              <div key={p.name}
                className="flex items-center gap-3 bg-[#1a1a2e] rounded-xl px-4 py-3 animate-player-join"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="w-9 h-9 rounded-full bg-purple-600/25 border border-purple-600/40
                  flex items-center justify-center text-sm font-bold text-purple-300 shrink-0">
                  {p.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {p.name}
                    {p.name === playerName && <span className="text-purple-400 text-xs ml-1.5">(you)</span>}
                  </p>
                </div>
                {p.name === room.createdBy && (
                  <span className="shrink-0 text-[11px] text-amber-400 bg-amber-900/20
                    border border-amber-900/30 px-2 py-0.5 rounded-full">
                    Host
                  </span>
                )}
                <span className="w-2 h-2 rounded-full bg-green-400 shrink-0 animate-pulse" />
              </div>
            ))}

            {/* Empty slots */}
            {Array(emptyCount).fill(null).map((_, i) => (
              <div key={`empty-${i}`}
                className="flex items-center gap-3 bg-[#1a1a2e]/40 border border-dashed
                  border-[#2a2a3e] rounded-xl px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-[#2a2a3e] flex items-center justify-center shrink-0">
                  <span className="text-gray-600 text-lg">?</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-gray-700 rounded-full animate-pulse" />
                  <p className="text-gray-600 text-sm">Waiting for player...</p>
                </div>
              </div>
            ))}
          </div>

          {/* Start / waiting button */}
          {isCreator ? (
            <button
              onClick={handleStartGame}
              disabled={!isFull || starting}
              className={`w-full py-4 rounded-xl font-bold text-base transition-all active:scale-[0.98]
                animate-slide-up
                ${isFull
                  ? 'bg-green-600 hover:bg-green-500 text-white shadow-xl shadow-green-900/30 animate-glow-pulse'
                  : 'bg-[#12121a] border border-[#2a2a3e] text-gray-600 cursor-not-allowed'}`}
              style={{ animationDelay: '0.15s' }}
            >
              {starting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Starting...
                </span>
              ) : isFull ? '⚔️ Start Game' : (
                `Waiting for ${emptyCount} more player${emptyCount > 1 ? 's' : ''}...`
              )}
            </button>
          ) : (
            <div className="w-full py-4 rounded-xl bg-[#12121a] border border-[#1a1a2e] text-center animate-slide-up"
              style={{ animationDelay: '0.15s' }}>
              {isFull
                ? <p className="text-green-400 text-sm font-medium">All players joined! Waiting for host...</p>
                : <p className="text-gray-500 text-sm">
                    Waiting for {emptyCount} more player{emptyCount > 1 ? 's' : ''}...
                  </p>
              }
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
