import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../../../shared/context/PlayerContext';
import SparkleLayer from '../../../shared/components/SparkleLayer';

export default function RajaRaniHomePage() {
  const { playerName, saveName } = usePlayer();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (playerName) navigate('/rajarani/dashboard', { replace: true });
  }, [playerName, navigate]);

  const submit = (event) => {
    event.preventDefault();
    const name = input.trim();
    if (name.length < 2) {
      setError('Enter at least 2 characters');
      return;
    }
    saveName(name);
    navigate('/rajarani/dashboard');
  };

  return (
    <>
      <div className="table-bg" />
      <SparkleLayer />
      <div className="center-screen">
        <h1 className="splash-title">Raja Rani</h1>
        <p className="splash-sub">Secret cards · Royal chain · Find the thief</p>
        <div className="stat-chips" style={{ marginBottom: 28 }}>
          {['4-10 Players', 'Room Code', '10s Turns', 'Party Strategy'].map((text) => <span key={text} className="chip">{text}</span>)}
        </div>
        <form onSubmit={submit} className="field-card stack" style={{ width: '100%', maxWidth: 380 }}>
          <div>
            <label className="field-label">Your Name</label>
            <input className="field-input" value={input} onChange={(e) => { setInput(e.target.value); setError(''); }} maxLength={20} autoFocus />
            {error && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 6 }}>{error}</p>}
          </div>
          <button className="btn btn-gold" type="submit">Enter Court →</button>
        </form>
      </div>
    </>
  );
}
