import { useEffect, useState } from 'react';
import { STAT_META } from '../utils/constants';

const DISPLAY_SECS = 4;

export default function RoundResult({ result, myName, onClose }) {
  const [countdown, setCountdown] = useState(DISPLAY_SECS);

  useEffect(() => {
    setCountdown(DISPLAY_SECS);
    const iv = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(iv); onClose(); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [onClose]);

  if (!result) return null;

  const { winner, isDraw, decidingStat, tieChain, cards, eliminated } = result;
  const meta    = STAT_META[decidingStat];
  const didIWin = winner === myName;
  const pct     = ((countdown - 1) / (DISPLAY_SECS - 1)) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#12121a] border border-[#1a1a2e] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl
        shadow-2xl overflow-hidden animate-result-in">

        {/* Result banner */}
        <div className={`relative px-5 py-4 text-center overflow-hidden ${
          isDraw     ? 'bg-gray-800/50'
          : didIWin  ? 'bg-green-900/40'
          :             'bg-red-900/30'
        }`}>
          {/* Glow blob for winner */}
          {!isDraw && didIWin && (
            <div className="absolute inset-0 bg-green-500/10 blur-2xl pointer-events-none" />
          )}
          <p className="text-4xl mb-1 relative">{isDraw ? '🤝' : didIWin ? '🏆' : '😔'}</p>
          <h2 className="text-xl font-bold text-white relative">
            {isDraw ? 'Draw — no one wins cards!' : `${winner} wins the round!`}
          </h2>
          {!isDraw && (
            <p className="text-gray-400 text-sm mt-0.5 relative">+{cards.length} cards collected</p>
          )}
        </div>

        {/* Deciding stat */}
        <div className="flex items-center justify-center gap-2 py-2.5 border-b border-[#1a1a2e] flex-wrap px-4">
          {tieChain.map((s, i) => (
            <span key={s} className="flex items-center gap-1 text-xs text-gray-600">
              <span className={STAT_META[s].color}>{STAT_META[s].label}</span>
              <span className="text-gray-700">→</span>
            </span>
          ))}
          <span className={`text-sm font-bold ${meta.color}`}>
            {meta.icon} {meta.label} decides!
          </span>
          {tieChain.length > 0 && (
            <span className="text-[10px] text-gray-600 bg-[#1a1a2e] px-2 py-0.5 rounded-full">
              tie-break
            </span>
          )}
        </div>

        {/* Card comparison — horizontal scroll on mobile */}
        <div className="px-4 py-4 overflow-x-auto">
          <div className="flex gap-3 justify-start sm:justify-center"
               style={{ minWidth: `${cards.length * 140}px` }}>
            {cards.map((c, idx) => {
              const isWinner = c.playerName === winner;
              const isMe     = c.playerName === myName;
              const delay    = `${idx * 0.08}s`;
              return (
                <div
                  key={c.playerName}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border min-w-[128px]
                    animate-slide-up
                    ${isWinner && !isDraw
                      ? 'bg-yellow-900/20 border-yellow-600/50 shadow-lg shadow-yellow-900/20'
                      : 'bg-[#1a1a2e] border-[#2a2a3e]'}`}
                  style={{ animationDelay: delay }}
                >
                  {/* Card image */}
                  <div className={`w-20 h-28 rounded-xl overflow-hidden shrink-0 ring-2 transition-all
                    ${isWinner && !isDraw ? 'ring-yellow-500/60' : 'ring-transparent'}`}>
                    <img src={c.card.image} alt={c.card.name}
                      className="w-full h-full object-cover" />
                  </div>

                  <p className="text-white text-xs font-medium text-center max-w-[110px] truncate">
                    {c.card.name}
                  </p>

                  {/* Stat value badge */}
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold
                    ${isWinner && !isDraw ? `${meta.bg} text-white shadow-md` : 'bg-[#2a2a3e] text-gray-300'}`}>
                    <span className="text-xs">{meta.icon}</span>
                    <span>{c.card.stats[decidingStat]}</span>
                  </div>

                  {/* Player label */}
                  <p className={`text-[11px] font-medium ${isMe ? 'text-purple-400' : 'text-gray-500'}`}>
                    {c.playerName}
                    {isMe     && ' (you)'}
                    {isWinner && !isDraw && ' 🏆'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Eliminated notice */}
        {eliminated?.length > 0 && (
          <div className="px-5 pb-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-900/30 rounded-xl px-4 py-2 text-center">
              ❌ {eliminated.join(', ')} {eliminated.length > 1 ? 'have been' : 'has been'} eliminated!
            </p>
          </div>
        )}

        {/* Countdown bar */}
        <div className="px-5 pb-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 h-1 bg-[#1a1a2e] rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-600 rounded-full transition-all duration-1000"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-gray-600 text-xs font-mono w-6 text-right">{countdown}</span>
          </div>
          <p className="text-gray-600 text-xs text-center">Next round starting...</p>
        </div>
      </div>
    </div>
  );
}
