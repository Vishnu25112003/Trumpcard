import ScorePanel from './ScorePanel';

function HCConfetti() {
  const colors = ['#f0c750', '#9a5cff', '#ff5d9e', '#5eecff', '#5ee08a'];
  return (
    <div className="particles">
      {Array.from({ length: 70 }, (_, i) => i).map((i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${(i * 137.508) % 100}%`,
            top: '-12px',
            background: colors[i % colors.length],
            animation: `hcConfetti ${2.4 + (i % 5) * 0.4}s linear ${(i % 11) * 0.2}s infinite`,
            transform: `rotate(${(i * 53) % 360}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export default function HCGameOver({
  won,
  myName,
  oppName,
  myScore,
  oppScore,
  reason,
  onRematch,
  onExit,
}) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        padding: '20px 24px',
        textAlign: 'center',
      }}
    >
      {won && <HCConfetti />}

      <div
        style={{
          fontSize: 76,
          filter: `drop-shadow(0 0 30px ${won ? 'rgba(240,199,80,0.7)' : 'rgba(255,77,109,0.5)'})`,
        }}
      >
        {won ? '🏆' : '😔'}
      </div>

      <div
        style={{
          fontFamily: 'var(--font-brand)',
          fontSize: 'clamp(24px,6vw,42px)',
          background: won
            ? 'linear-gradient(180deg, var(--gold-bright), var(--gold-deep))'
            : 'linear-gradient(180deg, var(--text), var(--text-dim))',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {won ? 'You Win!' : 'You Lose'}
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <ScorePanel name={myName}  score={myScore}  isMe        accent="var(--purple-bright)" />
        <ScorePanel name={oppName} score={oppScore} isMe={false} accent="var(--pink)" />
      </div>

      <div
        style={{
          fontSize: 12,
          color: 'var(--text-dim)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {reason || '✅ Match Complete'}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
        <button
          className="btn btn-gold"
          style={{ fontSize: 13, padding: '13px 28px' }}
          onClick={onRematch}
        >
          Rematch ↩
        </button>
        <button
          className="btn btn-ghost"
          style={{ fontSize: 13, padding: '13px 24px' }}
          onClick={onExit}
        >
          Exit
        </button>
      </div>
    </div>
  );
}
