import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../../../shared/context/PlayerContext';
import SparkleLayer from '../../../shared/components/SparkleLayer';

export default function TypingHomePage() {
  const { playerName, saveName } = usePlayer();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (playerName) navigate('/typing-game/dashboard', { replace: true });
  }, [playerName, navigate]);

  const submit = (event) => {
    event.preventDefault();
    const name = input.trim();
    if (name.length < 2) { setError('Enter at least 2 characters'); return; }
    saveName(name);
    navigate('/typing-game/dashboard');
  };

  return (
    <>
      <div className="table-bg" />
      <SparkleLayer />
      <div className="center-screen">
        <h1 className="splash-title">Typing Game</h1>
        <p className="splash-sub">Solo defense · Friends race · Type faster</p>
        <div className="stat-chips" style={{ marginBottom: 28 }}>
          {['Solo Mode', 'Friends Mode', 'Room Code', 'WPM + Accuracy'].map((t) => (
            <span key={t} className="chip">{t}</span>
          ))}
        </div>
        <form onSubmit={submit} className="field-card stack" style={{ width: '100%', maxWidth: 380 }}>
          <div>
            <label className="field-label">Your Name</label>
            <input
              className="field-input"
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(''); }}
              maxLength={20}
              autoFocus
            />
            {error && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 6 }}>{error}</p>}
          </div>
          <button className="btn btn-gold" type="submit">Enter →</button>
        </form>
      </div>
    </>
  );
}
