export default function ScorePanel({
  name,
  score,
  lives,
  isBatting,
  isMe,
  accent = 'var(--purple-bright)',
  flash,
}) {
  return (
    <div
      className="hc-score-panel"
      style={{
        background: 'var(--surface-strong)',
        border: `1px solid ${flash ? 'var(--red)' : isBatting ? accent : 'var(--line)'}`,
        borderRadius: 16,
        padding: '12px 16px',
        minWidth: 118,
        boxShadow: flash
          ? '0 0 22px rgba(255,77,109,0.5)'
          : isBatting
          ? `0 0 18px ${accent}55`
          : 'none',
        transition: 'all 0.25s',
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: '0.16em',
          color: isBatting ? accent : 'var(--text-dim)',
          textTransform: 'uppercase',
          marginBottom: 5,
          fontWeight: 600,
        }}
      >
        {isMe ? 'You' : name} {isBatting ? '🏏' : '⚾'}
      </div>

      <div
        style={{
          fontFamily: 'var(--font-brand)',
          fontSize: 28,
          fontWeight: 700,
          color: 'var(--gold)',
          lineHeight: 1,
        }}
      >
        {score.runs}
      </div>

      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
        {score.balls} balls · {score.wickets}W
      </div>

      {lives != null && (
        <div style={{ display: 'flex', gap: 4, marginTop: 7 }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                background: i <= lives ? 'var(--green)' : 'rgba(0,0,0,0.4)',
                border: `1px solid ${i <= lives ? 'var(--green)' : 'var(--line)'}`,
                boxShadow: i <= lives ? '0 0 6px var(--green)' : 'none',
                transition: 'all 0.3s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
