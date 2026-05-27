import { useState, useEffect } from 'react';

export default function CoinFlip({ winner, winnerName, onChoose, isChooser }) {
  const [flipping, setFlipping] = useState(true);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFlipping(false), 1800);
    const t2 = setTimeout(() => setShowResult(true), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
      {/* Coin */}
      <div style={{
        width: 100, height: 100, borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--gold-bright), var(--gold-deep))',
        boxShadow: '0 0 40px rgba(240,199,80,0.7)',
        display: 'grid', placeItems: 'center',
        fontSize: 44,
        animation: flipping ? 'coin-spin 1.8s ease-out' : 'none',
      }}>
        🪙
      </div>

      {showResult && (
        <div style={{ textAlign: 'center', animation: 'fade-up 0.4s ease' }}>
          <div style={{
            fontFamily: 'var(--font-brand)',
            fontSize: 'clamp(16px, 4vw, 22px)',
            color: 'var(--gold)',
            marginBottom: 6,
          }}>
            {winnerName} wins the toss!
          </div>

          {isChooser ? (
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
              <button className="btn btn-gold" style={{ fontSize: 13, padding: '13px 28px' }} onClick={() => onChoose('bat')}>
                🏏 Bat First
              </button>
              <button className="btn btn-ghost" style={{ fontSize: 13, padding: '13px 28px' }} onClick={() => onChoose('bowl')}>
                ⚾ Bowl First
              </button>
            </div>
          ) : (
            <p style={{ color: 'var(--text-soft)', fontSize: 14, marginTop: 12 }}>
              Waiting for {winnerName} to choose…
            </p>
          )}
        </div>
      )}

      <style>{`
        @keyframes coin-spin {
          0%   { transform: rotateY(0deg) scale(1); }
          25%  { transform: rotateY(360deg) scale(1.15); }
          50%  { transform: rotateY(720deg) scale(1.1); }
          75%  { transform: rotateY(1080deg) scale(1.05); }
          100% { transform: rotateY(1440deg) scale(1); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
