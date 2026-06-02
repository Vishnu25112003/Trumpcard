import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../../../shared/context/PlayerContext';
import { useTyping } from '../context/TypingContext';
import api from '../../../shared/utils/api';
import SparkleLayer from '../../../shared/components/SparkleLayer';
import '../styles/typing.css';

const PLAYER_OPTIONS = [2, 3, 4, 6, 8, 10, 12];
const DIFF_OPTIONS = ['easy', 'medium', 'hard'];

export default function TypingDashboardPage() {
  const { playerName, clearName } = usePlayer();
  const { initRoom } = useTyping();
  const [mode, setMode] = useState('select'); // 'select' | 'create' | 'join'
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [difficulty, setDifficulty] = useState('medium');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const goSolo = () => navigate('/typing-game/solo');

  const createRoom = async () => {
    setBusy(true); setError('');
    try {
      const { data } = await api.post('/typing/rooms/create', { playerName, maxPlayers, difficulty });
      initRoom({
        roomCode: data.room.roomCode,
        maxPlayers: data.room.maxPlayers,
        difficulty: data.room.difficulty,
        isHost: true,
      });
      navigate(`/typing-game/lobby/${data.room.roomCode}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create room');
    } finally { setBusy(false); }
  };

  const joinRoom = async () => {
    const roomCode = code.trim().toUpperCase();
    if (!roomCode) { setError('Enter a room code'); return; }
    setBusy(true); setError('');
    try {
      const { data } = await api.post('/typing/rooms/join', { roomCode, playerName });
      initRoom({
        roomCode: data.room.roomCode,
        maxPlayers: data.room.maxPlayers,
        difficulty: data.room.difficulty,
        isHost: data.room.hostName === playerName,
      });
      navigate(`/typing-game/lobby/${data.room.roomCode}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join room');
    } finally { setBusy(false); }
  };

  return (
    <>
      <div className="table-bg" />
      <SparkleLayer />
      <div className="top-bar">
        <div className="brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <div className="brand-mark">⌨️</div>
          <div className="brand-text"><div className="b1">The</div><div className="b2">Typing Game</div></div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => { clearName(); navigate('/typing-game'); }}>
          Change Name
        </button>
      </div>
      <div className="center-screen" style={{ paddingTop: 96 }}>
        {mode === 'select' && (
          <div className="tg-mode-grid">
            <button className="tg-mode-card" onClick={goSolo}>
              <div className="tg-mode-icon">🍾</div>
              <div className="tg-mode-title">Solo Mode</div>
              <div className="tg-mode-desc">
                Defend the barrier from falling word bottles. Type fast to shoot them down before they break through. Difficulty ramps every 30 seconds — survive as long as you can.
              </div>
              <div style={{ marginTop: 8 }}><span className="chip">Single Player</span> <span className="chip">No Internet</span></div>
            </button>
            <button className="tg-mode-card" onClick={() => { setMode('create'); setError(''); }}>
              <div className="tg-mode-icon">🏁</div>
              <div className="tg-mode-title">Friends Mode</div>
              <div className="tg-mode-desc">
                Race friends to the end of a shared paragraph. Vehicles advance with each correct character. Fastest typer wins — accuracy, WPM, and ranking on the results screen.
              </div>
              <div style={{ marginTop: 8 }}><span className="chip">Room Code</span> <span className="chip">Unlimited Players</span></div>
            </button>
          </div>
        )}

        {(mode === 'create' || mode === 'join') && (
          <div className="field-card stack" style={{ width: '100%', maxWidth: 440 }}>
            <div className="tab-switch">
              <button className={mode === 'create' ? 'active' : ''} onClick={() => { setMode('create'); setError(''); }}>Create Room</button>
              <button className={mode === 'join' ? 'active' : ''} onClick={() => { setMode('join'); setError(''); }}>Join Room</button>
            </div>
            {mode === 'create' ? (
              <>
                <label className="field-label">Max Players</label>
                <div className="option-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                  {PLAYER_OPTIONS.map((n) => (
                    <button key={n} className={`opt${maxPlayers === n ? ' active' : ''}`} onClick={() => setMaxPlayers(n)}>{n}</button>
                  ))}
                </div>
                <label className="field-label">Difficulty</label>
                <div className="option-grid cols-3">
                  {DIFF_OPTIONS.map((d) => (
                    <button key={d} className={`opt${difficulty === d ? ' active' : ''}`} onClick={() => setDifficulty(d)} style={{ textTransform: 'capitalize' }}>{d}</button>
                  ))}
                </div>
                <button className="btn btn-gold" onClick={createRoom} disabled={busy}>
                  {busy ? 'Creating...' : 'Create Room →'}
                </button>
              </>
            ) : (
              <>
                <label className="field-label">Room Code</label>
                <input
                  className="field-input code"
                  value={code}
                  onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
                  maxLength={6}
                  placeholder="XXXXXX"
                />
                <button className="btn btn-gold" onClick={joinRoom} disabled={busy}>
                  {busy ? 'Joining...' : 'Join Room →'}
                </button>
              </>
            )}
            {error && <p style={{ color: 'var(--red)', fontSize: 12 }}>{error}</p>}
            <button className="btn btn-ghost btn-sm" onClick={() => setMode('select')} style={{ alignSelf: 'flex-start' }}>← Modes</button>
          </div>
        )}
      </div>
    </>
  );
}
