import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../../../shared/context/PlayerContext';
import { useHC } from '../context/HCContext';
import api from '../../../shared/utils/api';
import SparkleLayer from '../../../shared/components/SparkleLayer';

const OVERS_OPTIONS   = [2, 3, 5, 7, 10];
const WICKETS_OPTIONS = [1, 2, 3, 5];

function TopBar({ playerName, onBack }) {
  return (
    <div className="top-bar">
      <div className="brand" style={{ cursor: 'pointer' }} onClick={onBack}>
        <div className="brand-mark" style={{ background: 'linear-gradient(135deg, var(--cyan), #2aa0c2)', color: '#0a3a4a' }}>🏏</div>
        <div className="brand-text">
          <div className="b1">The</div>
          <div className="b2" style={{ background: 'linear-gradient(180deg, var(--cyan), #2aa0c2)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Hand Cricket</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>
          Playing as <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{playerName}</span>
        </span>
        <button className="btn btn-ghost btn-sm" onClick={() => { /* change name handled in HomePage */ onBack(); }}>
          Change
        </button>
      </div>
    </div>
  );
}

export default function HCDashboardPage() {
  const { playerName, clearName } = usePlayer();
  const { initRoom } = useHC();
  const navigate = useNavigate();

  const [tab,     setTab]     = useState('create');
  const [mode,    setMode]    = useState('overBased');
  const [overs,   setOvers]   = useState(5);
  const [wickets, setWickets] = useState(3);
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState('');
  const [code,    setCode]    = useState('');
  const [joining, setJoining] = useState(false);
  const [joinErr, setJoinErr] = useState('');

  const handleChangeName = () => { clearName(); navigate('/hand-cricket'); };

  const handleCreate = async () => {
    setCreating(true); setCreateErr('');
    try {
      const { data } = await api.post('/hc/rooms/create', {
        playerName,
        settings: { mode, overs, wickets },
      });
      if (!data.success) { setCreateErr(data.error || 'Failed to create room'); return; }
      initRoom({ role: 'host', roomCode: data.roomCode, settings: data.settings });
      navigate(`/hand-cricket/lobby/${data.roomCode}`);
    } catch (err) {
      setCreateErr(err.response?.data?.error || 'Network error');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { setJoinErr('Enter a room code'); return; }
    setJoining(true); setJoinErr('');
    try {
      const { data } = await api.get(`/hc/rooms/${trimmed}`);
      if (!data.success) { setJoinErr('Room not found'); setJoining(false); return; }
      if (data.room.status !== 'waiting') { setJoinErr('Room is no longer open'); setJoining(false); return; }
      initRoom({ role: 'guest', roomCode: trimmed, settings: data.room.settings });
      navigate(`/hand-cricket/lobby/${trimmed}`);
    } catch (err) {
      setJoinErr(err.response?.data?.error || 'Room not found');
    } finally {
      setJoining(false);
    }
  };

  return (
    <>
      <div className="table-bg" />
      <SparkleLayer />
      <TopBar playerName={playerName} onBack={handleChangeName} />

      <div className="center-screen" style={{ paddingTop: 96 }}>
        <div className="field-card" style={{ width: '100%', maxWidth: 420 }}>
          {/* Tabs */}
          <div className="tab-switch" style={{ marginBottom: 20 }}>
            <button className={tab === 'create' ? 'active' : ''} onClick={() => { setTab('create'); setCreateErr(''); }}>
              Create Room
            </button>
            <button className={tab === 'join' ? 'active' : ''} onClick={() => { setTab('join'); setJoinErr(''); }}>
              Join Room
            </button>
          </div>

          {tab === 'create' && (
            <div className="stack">
              {/* Mode */}
              <div>
                <label className="field-label">Game Mode</label>
                <div className="option-grid cols-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  {[
                    { value: 'overBased',   label: 'Over-Based' },
                    { value: 'wicketBased', label: 'Wicket-Based' },
                  ].map(m => (
                    <button key={m.value} className={`opt${mode === m.value ? ' active' : ''}`} onClick={() => setMode(m.value)}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Overs or Wickets */}
              {mode === 'overBased' ? (
                <div>
                  <label className="field-label">Overs</label>
                  <div className="option-grid cols-4" style={{ gridTemplateColumns: `repeat(${OVERS_OPTIONS.length}, 1fr)` }}>
                    {OVERS_OPTIONS.map(o => (
                      <button key={o} className={`opt${overs === o ? ' active' : ''}`} onClick={() => setOvers(o)}>
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="field-label">Wickets</label>
                  <div className="option-grid" style={{ gridTemplateColumns: `repeat(${WICKETS_OPTIONS.length}, 1fr)` }}>
                    {WICKETS_OPTIONS.map(w => (
                      <button key={w} className={`opt${wickets === w ? ' active' : ''}`} onClick={() => setWickets(w)}>
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {createErr && <p style={{ color: 'var(--red)', fontSize: 12 }}>{createErr}</p>}

              <button className="btn btn-gold" style={{ width: '100%' }} onClick={handleCreate} disabled={creating}>
                {creating ? 'Creating…' : 'Create Room →'}
              </button>
            </div>
          )}

          {tab === 'join' && (
            <div className="stack">
              <div>
                <label className="field-label">Room Code</label>
                <input
                  className="field-input code"
                  type="text"
                  value={code}
                  onChange={e => { setCode(e.target.value.toUpperCase()); setJoinErr(''); }}
                  placeholder="XXXXXX"
                  maxLength={6}
                  autoFocus
                />
                {joinErr && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 6 }}>{joinErr}</p>}
              </div>
              <button className="btn btn-gold" style={{ width: '100%' }} onClick={handleJoin} disabled={joining}>
                {joining ? 'Joining…' : 'Join Room →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
