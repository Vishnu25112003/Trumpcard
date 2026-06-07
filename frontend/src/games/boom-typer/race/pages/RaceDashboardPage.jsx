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
  const [tab, setTab] = useState('create');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [difficulty, setDifficulty] = useState('medium');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!playerName) {
    const submit = (e) => { e.preventDefault(); const n = nameDraft.trim(); if (n) saveName(n); };
    return (
      <div className="ttd">
        <div className="menu-bg" /><div className="topglow" />
        <nav className="nav"><button className="btn-ghost" onClick={() => navigate('/boom-typer')}>← Boom Typer</button></nav>
        <div className="center">
          <form className="card" onSubmit={submit}>
            <p className="kicker">Friends Race</p>
            <h1 className="title" style={{ fontSize: 44 }}>Driver<br />Name</h1>
            <p className="field-label">Your name</p>
            <input className="text-input" value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} maxLength={16} placeholder="Your name" autoFocus />
            <button className="btn-primary" type="submit" disabled={!nameDraft.trim()}>Continue →</button>
          </form>
        </div>
      </div>
    );
  }

  const doCreate = async () => {
    setBusy(true); setError('');
    try {
      const { data } = await api.post('/typing/rooms/create', { playerName, maxPlayers, difficulty });
      initRoom({ roomCode: data.room.roomCode, maxPlayers: data.room.maxPlayers, difficulty: data.room.difficulty, isHost: true });
      navigate(`/boom-typer/race/lobby/${data.room.roomCode}`);
    } catch (err) { setError(err.response?.data?.error || 'Failed to create room'); } finally { setBusy(false); }
  };

  const doJoin = async () => {
    const roomCode = code.trim().toUpperCase();
    if (!roomCode) { setError('Enter a room code'); return; }
    setBusy(true); setError('');
    try {
      const { data } = await api.post('/typing/rooms/join', { roomCode, playerName });
      initRoom({ roomCode: data.room.roomCode, maxPlayers: data.room.maxPlayers, difficulty: data.room.difficulty, isHost: data.room.hostName === playerName });
      navigate(`/boom-typer/race/lobby/${data.room.roomCode}`);
    } catch (err) { setError(err.response?.data?.error || 'Failed to join room'); } finally { setBusy(false); }
  };

  return (
    <div className="ttd">
      <div className="menu-bg" /><div className="topglow" />
      <nav className="nav"><button className="btn-ghost" onClick={() => navigate('/boom-typer')}>← Boom Typer</button></nav>

      <div className="center">
        <div className="card">
          <p className="kicker">Friends Race</p>
          <h1 className="title">Type to<br />Drive</h1>

          <div className="tabs">
            <button className={`tab${tab === 'create' ? ' on' : ''}`} onClick={() => { setTab('create'); setError(''); }}>Create</button>
            <button className={`tab${tab === 'join' ? ' on' : ''}`} onClick={() => { setTab('join'); setError(''); }}>Join</button>
          </div>

          {tab === 'create' ? (
            <div>
              <p className="field-label">Race Length</p>
              <div className="seg">
                {MODES.map((m) => (
                  <div key={m.key} className={`seg-tile${difficulty === m.key ? ' on' : ''}`} onClick={() => setDifficulty(m.key)}>
                    <b>{m.label}</b><span>{m.sub}</span>
                  </div>
                ))}
              </div>
              <p className="field-label">Max Players</p>
              <div className="pills">
                {PLAYER_OPTIONS.map((n) => (
                  <div key={n} className={`pill${maxPlayers === n ? ' on' : ''}`} onClick={() => setMaxPlayers(n)}>{n}</div>
                ))}
              </div>
              {error && <p className="err-msg">{error}</p>}
              <button className="btn-primary" onClick={doCreate} disabled={busy}>{busy ? 'Creating…' : 'Create room →'}</button>
            </div>
          ) : (
            <div>
              <p className="field-label">Room Code</p>
              <input className="code-input" value={code} maxLength={6} placeholder="XXXXXX" spellCheck={false}
                onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }} />
              {error && <p className="err-msg">{error}</p>}
              <button className="btn-primary" onClick={doJoin} disabled={busy}>{busy ? 'Joining…' : 'Join room →'}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
