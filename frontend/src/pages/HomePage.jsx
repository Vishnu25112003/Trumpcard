import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import SparkleLayer from '../components/SparkleLayer';
import PlayingCard from '../components/PlayingCard';
import { STATS } from '../utils/gameData';

const DEMO_CARDS = [
  { name: 'Naruto',  suit: 'spade',   color: '#ff7a00', power: 95, strength: 85, speed: 92, defense: 80, intelligence: 70, popularity: 99 },
  { name: 'Goku',    suit: 'heart',   color: '#ff4455', power: 99, strength: 99, speed: 90, defense: 88, intelligence: 65, popularity: 98 },
  { name: 'Levi',    suit: 'diamond', color: '#5577ff', power: 90, strength: 88, speed: 97, defense: 85, intelligence: 92, popularity: 95 },
];

export default function HomePage() {
  const { playerName, saveName } = useGame();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (playerName) { navigate('/dashboard', { replace: true }); return; }
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
    navigate('/dashboard');
  };

  return (
    <>
      <div className="table-bg" />
      <SparkleLayer />

      <div className="center-screen" style={{ opacity: ready ? 1 : 0, transition: 'opacity 0.5s' }}>
        {/* Card stack logo */}
        <div style={{ position: 'relative', height: 120, width: 160, marginBottom: 8, flexShrink: 0 }}>
          {DEMO_CARDS.map((card, i) => (
            <div
              key={card.name}
              style={{
                position: 'absolute',
                left: '50%',
                top: 0,
                transform: `translateX(-50%) rotate(${(i - 1) * 10}deg) translateY(${i * -4}px)`,
                zIndex: i,
                opacity: 0.85 + i * 0.08,
              }}
            >
              <PlayingCard card={card} size="sm" faceUp={true} />
            </div>
          ))}
        </div>

        {/* Title */}
        <h1 className="splash-title">Anime Trumpcard</h1>
        <p className="splash-sub">Battle with your favourite characters</p>

        {/* Stat chips */}
        <div className="stat-chips">
          {STATS.map((s) => (
            <span key={s.key} className="chip">
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </span>
          ))}
        </div>

        {/* Form card */}
        <form onSubmit={handleSubmit} className="field-card stack" style={{ width: '100%', maxWidth: 380 }}>
          <div>
            <label className="field-label">Your Name</label>
            <input
              className="field-input"
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(''); }}
              placeholder="Enter your name..."
              maxLength={20}
              autoFocus
            />
            {error && (
              <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 6, marginLeft: 2 }}>{error}</p>
            )}
          </div>

          <button type="submit" className="btn btn-gold" style={{ width: '100%', marginTop: 4 }}>
            Take a Seat →
          </button>

          <p className="muted center" style={{ marginTop: 4 }}>
            No account needed · Up to 4 players · 52 cards
          </p>
        </form>
      </div>
    </>
  );
}
