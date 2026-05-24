import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import api from '../utils/api';

const CARDS_PER_PLAYER_OPTIONS = { 2: [10, 13, 17, 20, 26], 3: [10, 13, 17], 4: [10, 13] };

export default function DashboardPage() {
  const { playerName, clearName, setCurrentRoom } = useGame();
  const navigate = useNavigate();

  const [tab, setTab]                   = useState('create');
  const [totalPlayers, setTotalPlayers] = useState(2);
  const [cardsPerPlayer, setCardsPerPlayer] = useState(10);
  const [creating, setCreating]         = useState(false);
  const [createError, setCreateError]   = useState('');
  const [roomCode, setRoomCode]         = useState('');
  const [joining, setJoining]           = useState(false);
  const [joinError, setJoinError]       = useState('');

  const handlePlayerCountChange = (count) => {
    setTotalPlayers(count);
    setCardsPerPlayer(CARDS_PER_PLAYER_OPTIONS[count][0]);
  };

  const handleCreate = async () => {
    setCreating(true); setCreateError('');
    try {
      const res  = await api.post('/rooms/create', { createdBy: playerName, totalPlayers, cardsPerPlayer });
      const room = res.data.data;
      setCurrentRoom(room);
      navigate(`/lobby/${room.roomCode}`);
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Failed to create room');
    } finally { setCreating(false); }
  };

  const handleJoin = async () => {
    const code = roomCode.trim().toUpperCase();
    if (!code) { setJoinError('Enter a room code'); return; }
    setJoining(true); setJoinError('');
    try {
      const res  = await api.post('/rooms/join', { roomCode: code, playerName });
      const room = res.data.data;
      setCurrentRoom(room);
      navigate(`/lobby/${room.roomCode}`);
    } catch (err) {
      setJoinError(err.response?.data?.error || 'Failed to join room');
    } finally { setJoining(false); }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Header */}
      <header className="bg-[#12121a] border-b border-[#1a1a2e] px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🃏</span>
          <span className="text-white font-bold">Anime Trumpcard</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-gray-500 text-sm hidden sm:block">
            Playing as <span className="text-purple-400 font-medium">{playerName}</span>
          </span>
          <button
            onClick={() => { clearName(); navigate('/'); }}
            className="text-gray-600 hover:text-gray-300 text-xs border border-[#2a2a3e]
              hover:border-gray-600 px-3 py-1.5 rounded-lg transition-colors"
          >
            Change
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">

          {/* Greeting */}
          <div className="text-center mb-7 animate-fade-in">
            <h2 className="text-2xl font-bold text-white">
              Welcome, <span className="text-purple-400">{playerName}</span>!
            </h2>
            <p className="text-gray-500 mt-1 text-sm">Create a room or join one with a code</p>
          </div>

          {/* Tabs */}
          <div className="flex bg-[#12121a] border border-[#1a1a2e] rounded-xl p-1 mb-5 animate-slide-up">
            {[{ id: 'create', label: '+ Create Room' }, { id: 'join', label: '→ Join Room' }].map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${tab === t.id
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Create Room */}
          {tab === 'create' && (
            <div className="bg-[#12121a] border border-[#1a1a2e] rounded-2xl p-5 space-y-5 animate-slide-up">
              {/* Player count */}
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-widest mb-3">
                  Number of Players
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[2, 3, 4].map((n) => (
                    <button key={n} onClick={() => handlePlayerCountChange(n)}
                      className={`py-3 rounded-xl border text-sm font-semibold transition-all active:scale-95
                        ${totalPlayers === n
                          ? 'bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-900/30'
                          : 'bg-[#1a1a2e] border-[#2a2a3e] text-gray-400 hover:border-purple-800/50 hover:text-white'}`}>
                      {n} Players
                    </button>
                  ))}
                </div>
              </div>

              {/* Cards per player */}
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-widest mb-3">
                  Cards per Player
                </label>
                <div className="flex flex-wrap gap-2">
                  {CARDS_PER_PLAYER_OPTIONS[totalPlayers].map((n) => (
                    <button key={n} onClick={() => setCardsPerPlayer(n)}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all active:scale-95
                        ${cardsPerPlayer === n
                          ? 'bg-amber-500/20 border-amber-500/60 text-amber-400'
                          : 'bg-[#1a1a2e] border-[#2a2a3e] text-gray-400 hover:text-amber-400 hover:border-amber-800/40'}`}>
                      {n}
                    </button>
                  ))}
                </div>
                <p className="text-gray-700 text-xs mt-2">
                  {totalPlayers * cardsPerPlayer} / 52 cards used
                </p>
              </div>

              {createError && (
                <p className="text-red-400 text-xs bg-red-900/20 border border-red-900/30
                  px-4 py-2.5 rounded-lg animate-slide-up">
                  {createError}
                </p>
              )}

              <button onClick={handleCreate} disabled={creating}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900
                  text-white font-semibold py-3.5 rounded-xl transition-all active:scale-[0.98]
                  flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20">
                {creating
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</>
                  : 'Create Room'}
              </button>
            </div>
          )}

          {/* Join Room */}
          {tab === 'join' && (
            <div className="bg-[#12121a] border border-[#1a1a2e] rounded-2xl p-5 space-y-5 animate-slide-up">
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-widest mb-3">
                  Room Code
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => { setRoomCode(e.target.value.toUpperCase()); setJoinError(''); }}
                  placeholder="ANIME-XXXX"
                  maxLength={10}
                  className="w-full bg-[#1a1a2e] border border-[#2a2a3e] focus:border-purple-600
                    text-white placeholder-gray-700 rounded-xl px-4 py-3 text-base outline-none
                    transition-colors tracking-[0.2em] font-mono text-center"
                />
                {joinError && (
                  <p className="text-red-400 text-xs mt-2 bg-red-900/20 border border-red-900/30
                    px-3 py-2 rounded-lg animate-slide-up">
                    {joinError}
                  </p>
                )}
              </div>

              <button onClick={handleJoin} disabled={joining}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900
                  text-white font-semibold py-3.5 rounded-xl transition-all active:scale-[0.98]
                  flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20">
                {joining
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Joining...</>
                  : 'Join Room →'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
