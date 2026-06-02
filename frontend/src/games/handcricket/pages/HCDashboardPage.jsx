import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../../../shared/context/PlayerContext';
import { useHC } from '../context/HCContext';
import api from '../../../shared/utils/api';
import SparkleLayer from '../../../shared/components/SparkleLayer';
import '../../../styles/hc-ui.css';

const OVERS_OPTIONS   = [1, 2, 3, 5, 7, 10];
const WICKETS_OPTIONS = [2, 3, 5, 10];

function TopBar({ playerName, onBack }) {
  return (
    <div className="top-bar">
      <div className="brand" style={{ cursor: 'pointer', minWidth: 0 }} onClick={onBack}>
        <div className="brand-mark" style={{ background: 'linear-gradient(135deg, var(--cyan), #2aa0c2)', color: '#0a3a4a' }}>🏏</div>
        <div className="brand-text">
          <div className="b1">The</div>
          <div className="b2" style={{ background: 'linear-gradient(180deg, var(--cyan), #2aa0c2)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Hand Cricket</div>
        </div>
      </div>
      <div className="hc-dash-user">
        <span className="hc-dash-user-label">
          Playing as <span className="hc-dash-user-name">{playerName}</span>
        </span>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>Change</button>
      </div>
    </div>
  );
}

export default function HCDashboardPage() {
  const { playerName, clearName } = usePlayer();
  const { initRoom } = useHC();
  const navigate = useNavigate();

  const [tab,        setTab]        = useState('create');
  const [wicketType, setWicketType] = useState('single');   // 'single' | 'custom'
  const [wickets,    setWickets]    = useState(3);
  const [overs,      setOvers]      = useState(5);
  const [creating,   setCreating]   = useState(false);
  const [createErr,  setCreateErr]  = useState('');
  const [code,       setCode]       = useState('');
  const [joining,    setJoining]    = useState(false);
  const [joinErr,    setJoinErr]    = useState('');

  const handleChangeName = () => { clearName(); navigate('/hand-cricket'); };

  const handleCreate = async () => {
    setCreating(true); setCreateErr('');
    try {
      const { data } = await api.post('/hc/rooms/create', {
        playerName,
        settings: {
          wicketType,
          wickets: wicketType === 'custom' ? wickets : 1,
          overs,
        },
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

      <div className="center-screen hc-dash-screen">
        <div className="field-card hc-dash-card" style={{ width: '100%', maxWidth: 420 }}>
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

              {/* Step 1 — Wicket type */}
              <div>
                <label className="field-label">Wicket Type</label>
                <div className="option-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <button
                    className={`opt${wicketType === 'single' ? ' active' : ''}`}
                    onClick={() => setWicketType('single')}
                  >
                    <span style={{ fontSize: 16 }}>🎯</span>
                    <span>Single Wicket</span>
                  </button>
                  <button
                    className={`opt${wicketType === 'custom' ? ' active' : ''}`}
                    onClick={() => setWicketType('custom')}
                  >
                    <span style={{ fontSize: 16 }}>⚙️</span>
                    <span>Custom Wickets</span>
                  </button>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6, letterSpacing: '0.04em' }}>
                  {wicketType === 'single'
                    ? '1 wicket per innings — out on any match'
                    : 'Choose how many wickets each team gets'}
                </p>
              </div>

              {/* Step 2 — Wicket count (custom only) */}
              {wicketType === 'custom' && (
                <div>
                  <label className="field-label">Wickets per Innings</label>
                  <div className="option-grid hc-wickets-grid">
                    {WICKETS_OPTIONS.map(w => (
                      <button key={w} className={`opt${wickets === w ? ' active' : ''}`} onClick={() => setWickets(w)}>
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3 — Overs (always shown) */}
              <div>
                <label className="field-label">Overs per Innings</label>
                <div className="option-grid hc-overs-grid">
                  {OVERS_OPTIONS.map(o => (
                    <button key={o} className={`opt${overs === o ? ' active' : ''}`} onClick={() => setOvers(o)}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary chip */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '8px 16px', borderRadius: 99,
                background: 'rgba(94,236,255,0.08)', border: '1px solid rgba(94,236,255,0.2)',
                fontSize: 12, color: 'var(--cyan)', fontFamily: 'var(--font-mono)',
              }}>
                <span>🏏</span>
                <span>
                  {overs} Over{overs > 1 ? 's' : ''} ·{' '}
                  {wicketType === 'single' ? '1 Wicket' : `${wickets} Wickets`} per innings
                </span>
              </div>

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

      <style>{`
        .opt {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          font-size: 12px;
        }
      `}</style>
    </>
  );
}
