import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../../../shared/context/PlayerContext';
import { useRajaRani } from '../context/RajaRaniContext';
import api from '../../../shared/utils/api';
import SparkleLayer from '../../../shared/components/SparkleLayer';

const PLAYER_OPTIONS = [4, 5, 6, 7, 8, 9, 10];

export default function RajaRaniDashboardPage() {
  const { playerName, clearName } = usePlayer();
  const { initRoom } = useRajaRani();
  const [tab, setTab] = useState('create');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const createRoom = async () => {
    setBusy(true); setError('');
    try {
      const { data } = await api.post('/rajarani/rooms/create', { playerName, maxPlayers });
      initRoom({ roomCode: data.room.roomCode, maxPlayers: data.room.maxPlayers, isHost: true });
      navigate(`/rajarani/lobby/${data.room.roomCode}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create room');
    } finally {
      setBusy(false);
    }
  };

  const joinRoom = async () => {
    const roomCode = code.trim().toUpperCase();
    if (!roomCode) { setError('Enter a room code'); return; }
    setBusy(true); setError('');
    try {
      const { data } = await api.post('/rajarani/rooms/join', { roomCode, playerName });
      initRoom({ roomCode: data.room.roomCode, maxPlayers: data.room.maxPlayers, isHost: data.room.hostName === playerName });
      navigate(`/rajarani/lobby/${data.room.roomCode}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join room');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="table-bg" />
      <SparkleLayer />
      <div className="top-bar">
        <div className="brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <div className="brand-mark">👑</div>
          <div className="brand-text"><div className="b1">The</div><div className="b2">Raja Rani</div></div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => { clearName(); navigate('/rajarani'); }}>Change Name</button>
      </div>
      <div className="center-screen" style={{ paddingTop: 96 }}>
        <div className="field-card stack" style={{ width: '100%', maxWidth: 440 }}>
          <div className="tab-switch">
            <button className={tab === 'create' ? 'active' : ''} onClick={() => { setTab('create'); setError(''); }}>Create Room</button>
            <button className={tab === 'join' ? 'active' : ''} onClick={() => { setTab('join'); setError(''); }}>Join Room</button>
          </div>
          {tab === 'create' ? (
            <>
              <label className="field-label">Max Players</label>
              <div className="option-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {PLAYER_OPTIONS.map((n) => <button key={n} className={`opt${maxPlayers === n ? ' active' : ''}`} onClick={() => setMaxPlayers(n)}>{n}</button>)}
              </div>
              <button className="btn btn-gold" onClick={createRoom} disabled={busy}>{busy ? 'Creating...' : 'Create Room →'}</button>
            </>
          ) : (
            <>
              <label className="field-label">Room Code</label>
              <input className="field-input code" value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }} maxLength={6} placeholder="XXXXXX" />
              <button className="btn btn-gold" onClick={joinRoom} disabled={busy}>{busy ? 'Joining...' : 'Join Room →'}</button>
            </>
          )}
          {error && <p style={{ color: 'var(--red)', fontSize: 12 }}>{error}</p>}
        </div>
      </div>
    </>
  );
}
