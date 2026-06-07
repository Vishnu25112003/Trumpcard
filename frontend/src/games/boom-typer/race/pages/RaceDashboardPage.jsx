import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../../../../shared/context/PlayerContext';
import { useRace } from '../context/RaceContext';
import api from '../../../../shared/utils/api';
import '../styles/race.css';

const PLAYER_OPTIONS = [2, 3, 4, 5, 6];
const MODES = [
  { key: 'easy', label: 'Easy', sub: 'Short sprint' },
  { key: 'medium', label: 'Medium', sub: 'Standard' },
  { key: 'large', label: 'Large', sub: 'Endurance' },
];

export default function RaceDashboardPage() {
  const { playerName, saveName } = usePlayer();
  const { initRoom } = useRace();
  const navigate = useNavigate();

  const [nameDraft, setNameDraft] = useState('');
  const [tab, setTab] = useState('create'); // 'create' | 'join'
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [difficulty, setDifficulty] = useState('medium');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!playerName) {
    const submit = (e) => {
      e.preventDefault();
      const n = nameDraft.trim();
      if (n) saveName(n);
    };
    return (
      <div className="bt-race-shell">
        <button className="bt-hub-exit" onClick={() => navigate('/boom-typer')}>← Boom Typer</button>
        <form className="bt-race-card" onSubmit={submit}>
          <h2 className="bt-race-h">Driver name</h2>
          <p className="bt-race-sub">Pick a name your rivals will see on the track.</p>
          <input
            className="bt-race-input"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            placeholder="Your name"
            maxLength={16}
            autoFocus
          />
          <button className="bt-btn primary" type="submit" disabled={!nameDraft.trim()}>Continue →</button>
        </form>
      </div>
    );
  }

  const createRoom = async () => {
    setBusy(true); setError('');
    try {
      const { data } = await api.post('/typing/rooms/create', { playerName, maxPlayers, difficulty });
      initRoom({ roomCode: data.room.roomCode, maxPlayers: data.room.maxPlayers, difficulty: data.room.difficulty, isHost: true });
      navigate(`/boom-typer/race/lobby/${data.room.roomCode}`);
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
      navigate(`/boom-typer/race/lobby/${data.room.roomCode}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join room');
    } finally { setBusy(false); }
  };

  return (
    <div className="bt-race-shell">
      <button className="bt-hub-exit" onClick={() => navigate('/boom-typer')}>← Boom Typer</button>
      <div className="bt-race-card">
        <div className="bt-race-eyebrow">Friends Race</div>
        <h2 className="bt-race-h">Type to drive</h2>

        <div className="bt-tabs">
          <button className={tab === 'create' ? 'on' : ''} onClick={() => { setTab('create'); setError(''); }}>Create</button>
          <button className={tab === 'join' ? 'on' : ''} onClick={() => { setTab('join'); setError(''); }}>Join</button>
        </div>

        {tab === 'create' ? (
          <>
            <label className="bt-race-label">Race length</label>
            <div className="bt-opt-row">
              {MODES.map((m) => (
                <button
                  key={m.key}
                  className={`bt-opt${difficulty === m.key ? ' on' : ''}`}
                  onClick={() => setDifficulty(m.key)}
                >
                  <b>{m.label}</b><small>{m.sub}</small>
                </button>
              ))}
            </div>
            <label className="bt-race-label">Max players</label>
            <div className="bt-opt-row">
              {PLAYER_OPTIONS.map((n) => (
                <button key={n} className={`bt-opt mini${maxPlayers === n ? ' on' : ''}`} onClick={() => setMaxPlayers(n)}>{n}</button>
              ))}
            </div>
            <button className="bt-btn primary" onClick={createRoom} disabled={busy}>
              {busy ? 'Creating…' : 'Create room →'}
            </button>
          </>
        ) : (
          <>
            <label className="bt-race-label">Room code</label>
            <input
              className="bt-race-input code"
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
              maxLength={6}
              placeholder="XXXXXX"
            />
            <button className="bt-btn primary" onClick={joinRoom} disabled={busy}>
              {busy ? 'Joining…' : 'Join room →'}
            </button>
          </>
        )}
        {error && <p className="bt-race-err">{error}</p>}
      </div>
    </div>
  );
}
