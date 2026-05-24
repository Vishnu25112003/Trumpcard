import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

const CONFETTI_COLORS = ['#7c3aed', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899'];
const CONFETTI_SHAPES = ['●', '■', '▲', '★', '♦'];

function Confetti() {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    setPieces(
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        left:   `${Math.random() * 100}%`,
        color:  CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        shape:  CONFETTI_SHAPES[i % CONFETTI_SHAPES.length],
        delay:  `${Math.random() * 1.2}s`,
        size:   `${10 + Math.random() * 14}px`,
        dur:    `${1.2 + Math.random() * 0.8}s`,
      }))
    );
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 animate-confetti"
          style={{
            left:             p.left,
            color:            p.color,
            fontSize:         p.size,
            animationDelay:   p.delay,
            animationDuration: p.dur,
            opacity:          0,
          }}
        >
          {p.shape}
        </span>
      ))}
    </div>
  );
}

export default function GameOver({ winner }) {
  const { playerName } = useGame();
  const navigate = useNavigate();
  const didIWin  = winner === playerName;

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0f] flex items-center justify-center px-4 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-96 h-96 rounded-full blur-3xl opacity-25 transition-all duration-1000
          ${didIWin ? 'bg-yellow-400' : 'bg-purple-700'}`}
        />
        <div className={`absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-10
          ${didIWin ? 'bg-green-400' : 'bg-red-700'}`}
        />
      </div>

      {/* Confetti only for winner */}
      {didIWin && <Confetti />}

      <div className="relative z-20 text-center space-y-6 max-w-sm w-full animate-pop-in">
        {/* Trophy / emoji */}
        <div className={`text-8xl ${didIWin ? 'animate-bounce' : ''}`}>
          {didIWin ? '🏆' : '🃏'}
        </div>

        {/* Title */}
        <div>
          <h1 className={`text-4xl font-bold tracking-tight ${didIWin ? 'text-yellow-400' : 'text-white'}`}>
            {didIWin ? 'You Win!' : 'Game Over'}
          </h1>
          {!didIWin && winner && (
            <p className="text-gray-400 mt-2 text-lg">
              <span className="text-purple-400 font-bold">{winner}</span> wins the game!
            </p>
          )}
          {didIWin && (
            <p className="text-gray-400 mt-2 text-sm">
              You collected all {winner ? '' : ''}the cards!
            </p>
          )}
        </div>

        {/* Stars row for winner */}
        {didIWin && (
          <div className="flex justify-center gap-1">
            {['⭐', '🌟', '✨', '🌟', '⭐'].map((s, i) => (
              <span
                key={i}
                className="text-2xl animate-float"
                style={{ animationDelay: `${i * 0.15}s` }}
              >{s}</span>
            ))}
          </div>
        )}

        {/* Score card */}
        <div className={`rounded-2xl border p-4 text-sm
          ${didIWin
            ? 'bg-yellow-900/20 border-yellow-700/40'
            : 'bg-[#12121a] border-[#1a1a2e]'}`}>
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Result</p>
          <p className={`font-bold text-base ${didIWin ? 'text-yellow-400' : 'text-gray-300'}`}>
            {didIWin ? '🥇 Champion' : `🥈 Runner-up`}
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/dashboard')}
            className={`w-full font-semibold py-4 rounded-xl transition-all active:scale-95
              ${didIWin
                ? 'bg-yellow-500 hover:bg-yellow-400 text-black'
                : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
          >
            Play Again
          </button>
          <button
            onClick={() => { navigate('/'); }}
            className="w-full bg-[#12121a] hover:bg-[#1a1a2e] border border-[#2a2a3e]
              text-gray-400 font-medium py-3 rounded-xl transition-colors text-sm active:scale-95"
          >
            Change Name
          </button>
        </div>
      </div>
    </div>
  );
}
