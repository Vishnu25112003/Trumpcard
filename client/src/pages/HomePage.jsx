import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

const FLOATING_CARDS = [
  { emoji: '⚡', label: 'Speed',  top: '15%', left: '8%',  delay: '0s',    rotate: '-8deg' },
  { emoji: '💥', label: 'Power',  top: '20%', right: '7%', delay: '0.6s',  rotate: '6deg' },
  { emoji: '🧠', label: 'Intel',  top: '60%', left: '5%',  delay: '1.1s',  rotate: '-5deg' },
  { emoji: '🛡️', label: 'Defense',top: '65%', right: '6%', delay: '0.3s',  rotate: '9deg' },
  { emoji: '💪', label: 'Str',    top: '40%', left: '3%',  delay: '0.9s',  rotate: '-12deg' },
  { emoji: '⭐', label: 'Pop',    top: '38%', right: '4%', delay: '1.4s',  rotate: '7deg' },
];

export default function HomePage() {
  const { playerName, saveName } = useGame();
  const [input, setInput]   = useState('');
  const [error, setError]   = useState('');
  const [ready, setReady]   = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (playerName) { navigate('/dashboard', { replace: true }); return; }
    const t = setTimeout(() => setReady(true), 50);
    return () => clearTimeout(t);
  }, [playerName, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = input.trim();
    if (!name)          { setError('Please enter your name'); return; }
    if (name.length < 2){ setError('Name must be at least 2 characters'); return; }
    if (name.length > 20){ setError('Name too long (max 20 characters)'); return; }
    saveName(name);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 relative overflow-hidden">

      {/* ── Background gradients ─────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-[500px] h-[500px] bg-purple-700/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3
          w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4
          w-48 h-48 bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      {/* ── Floating stat cards (decorative) ─────────────────────────────── */}
      {FLOATING_CARDS.map((c) => (
        <div
          key={c.label}
          className="absolute hidden sm:flex flex-col items-center gap-1
            bg-[#12121a]/80 border border-[#1a1a2e] backdrop-blur-sm
            rounded-xl px-3 py-2.5 animate-float select-none pointer-events-none"
          style={{
            top:              c.top,
            left:             c.left,
            right:            c.right,
            animationDelay:   c.delay,
            transform:        `rotate(${c.rotate})`,
            opacity:          0.55,
          }}
        >
          <span className="text-xl">{c.emoji}</span>
          <span className="text-[10px] text-gray-500 uppercase tracking-wide">{c.label}</span>
        </div>
      ))}

      {/* ── Main card ────────────────────────────────────────────────────── */}
      <div className={`relative w-full max-w-sm transition-all duration-500
        ${ready ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

        {/* Logo + title */}
        <div className="text-center mb-10">
          <div className="relative inline-block mb-4">
            <span className="text-7xl animate-float" style={{ display: 'inline-block' }}>🃏</span>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2
              w-12 h-4 bg-purple-600/30 blur-md rounded-full" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Anime Trumpcard</h1>
          <p className="text-gray-500 mt-2 text-sm">Battle with your favourite characters</p>

          {/* Stat pills */}
          <div className="flex flex-wrap justify-center gap-1.5 mt-4">
            {['⚡ Speed', '💥 Power', '🧠 Intel', '🛡️ Defense', '💪 Strength', '⭐ Pop'].map((s) => (
              <span key={s}
                className="text-[11px] bg-[#12121a] border border-[#1a1a2e] text-gray-500 px-2.5 py-0.5 rounded-full">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(''); }}
              placeholder="Enter your name..."
              maxLength={20}
              autoFocus
              className="w-full bg-[#12121a] border border-[#1a1a2e] focus:border-purple-600
                text-white placeholder-gray-700 rounded-xl px-5 py-4 text-base outline-none
                transition-colors"
            />
            {error && (
              <p className="text-red-400 text-xs mt-2 ml-1 animate-slide-up">{error}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 active:scale-[0.98]
              text-white font-semibold py-4 rounded-xl transition-all text-base
              shadow-lg shadow-purple-900/30"
          >
            Let's Play →
          </button>
        </form>

        <p className="text-center text-gray-700 text-xs mt-6">
          No account needed · Up to 4 players · 52 cards
        </p>
      </div>
    </div>
  );
}
