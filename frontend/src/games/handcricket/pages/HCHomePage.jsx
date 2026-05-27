import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../../../shared/context/PlayerContext';
import SparkleLayer from '../../../shared/components/SparkleLayer';

const DEMO_BALLS = [
  { label: '6', emoji: '🤙', color: 'var(--gold)' },
  { label: '4', emoji: '🖖', color: 'var(--cyan)' },
  { label: '1', emoji: '☝️', color: 'var(--green)' },
  { label: 'W', emoji: '✌️', color: 'var(--red)' },
];

export default function HCHomePage() {
  const { playerName, saveName } = usePlayer();
  const [input, setInput]   = useState('');
  const [error, setError]   = useState('');
  const [ready, setReady]   = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (playerName) { navigate('/hand-cricket/dashboard', { replace: true }); return; }
    const t = setTimeout(() => setReady(true), 50);
    return () => clearTimeout(t);
  }, [playerName, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = input.trim();
    if (!name)           { setError('Please enter your name'); return; }
    if (name.length < 2) { setError('Name must be at least 2 characters'); return; }
    if (name.length > 20){ setError('Name too long (max 20 characters)'); return; }
    saveName(name);
    navigate('/hand-cricket/dashboard');
  };

  return (
    <>
      <div className="table-bg" />
      <SparkleLayer />

      <div className="center-screen" style={{ opacity: ready ? 1 : 0, transition: 'opacity 0.5s' }}>
        {/* Ball row preview */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          {DEMO_BALLS.map((b) => (
            <div key={b.label} style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'var(--surface-strong)',
              border: `2px solid ${b.color}`,
              display: 'grid', placeItems: 'center',
              fontSize: 22,
              boxShadow: `0 0 14px ${b.color}55`,
            }}>
              {b.emoji}
            </div>
          ))}
        </div>

        <h1 className="splash-title" style={{ marginBottom: 8 }}>Hand Cricket</h1>
        <p className="splash-sub" style={{ marginBottom: 20 }}>Pick your number · Outsmart your opponent</p>

        {/* Feature chips */}
        <div className="stat-chips" style={{ marginBottom: 28 }}>
          {['1v1 Online', '7-sec timer', 'Over or Wicket mode', 'Super Over'].map(t => (
            <span key={t} className="chip" style={{ fontSize: 11 }}>{t}</span>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="field-card stack" style={{ width: '100%', maxWidth: 380 }}>
          <div>
            <label className="field-label">Your Name</label>
            <input
              className="field-input"
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(''); }}
              placeholder="Enter your name…"
              maxLength={20}
              autoFocus
            />
            {error && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 6 }}>{error}</p>}
          </div>
          <button type="submit" className="btn btn-gold" style={{ width: '100%', marginTop: 4 }}>
            Enter the Arena →
          </button>
          <p className="muted center" style={{ marginTop: 4 }}>No account needed · 1v1 only</p>
        </form>
      </div>
    </>
  );
}
