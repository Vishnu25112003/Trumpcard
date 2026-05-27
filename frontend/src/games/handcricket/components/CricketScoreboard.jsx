const HAND_EMOJIS = { 1: '☝️', 2: '✌️', 3: '🤟', 4: '🖖', 5: '🖐️', 6: '🤙' };

export function BallReveal({ batsmanPick, bowlerPick, runs, isWicket, notes, batsmanName, bowlerName }) {
  const bothPicked = batsmanPick != null && bowlerPick != null;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
      padding: '20px 0', animation: 'pop-in 0.4s ease',
    }}>
      {/* Picks display */}
      {bothPicked && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <PickBubble label={batsmanName} pick={batsmanPick} role="bat" />
          <div style={{ fontFamily: 'var(--font-brand)', fontSize: 28, color: 'var(--text-dim)' }}>VS</div>
          <PickBubble label={bowlerName} pick={bowlerPick} role="bowl" />
        </div>
      )}

      {/* Result banner */}
      <div style={{
        padding: '10px 28px',
        borderRadius: 99,
        fontFamily: 'var(--font-display)',
        fontSize: 16,
        fontWeight: 700,
        letterSpacing: '0.12em',
        ...(isWicket
          ? { background: 'linear-gradient(135deg,#ff4d6d,#c22040)', color: 'white', boxShadow: '0 0 20px rgba(255,77,109,0.5)' }
          : notes === 'both-missed'
            ? { background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--text-dim)' }
            : { background: 'linear-gradient(135deg,var(--gold-bright),var(--gold-deep))', color: '#2a1450', boxShadow: '0 0 20px rgba(240,199,80,0.4)' }),
        animation: 'banner-in 0.4s 0.2s both',
      }}>
        {isWicket ? '🏏 OUT!' : notes === 'both-missed' ? 'No Ball (Both Missed)' : notes === 'batsman-miss' ? '— Miss (0 runs)' : notes === 'bowler-miss' ? `+${runs} run (Bowler missed)` : `+${runs} ${runs === 1 ? 'run' : 'runs'}`}
      </div>
    </div>
  );
}

function PickBubble({ label, pick, role }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: role === 'bat' ? 'linear-gradient(135deg, var(--gold-bright), var(--gold-deep))' : 'linear-gradient(135deg, var(--purple-bright), var(--purple))',
        display: 'grid', placeItems: 'center',
        fontSize: 30, margin: '0 auto 6px',
        boxShadow: role === 'bat' ? '0 0 20px rgba(240,199,80,0.4)' : '0 0 20px var(--purple-glow)',
        animation: 'pop-in 0.35s ease',
      }}>
        {HAND_EMOJIS[pick] || pick}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{pick}</div>
      <div style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 4 }}>{label}</div>
    </div>
  );
}

export function ScorePanel({ name, score, lives, isBatting, isMe, accent = 'var(--purple-bright)' }) {
  return (
    <div style={{
      background: 'var(--surface-strong)',
      border: `1px solid ${isBatting ? accent : 'var(--line)'}`,
      borderRadius: 16,
      padding: '14px 18px',
      minWidth: 120,
      boxShadow: isBatting ? `0 0 20px ${accent}55` : 'none',
      transition: 'all 0.2s',
    }}>
      <div style={{ fontSize: 10, letterSpacing: '0.18em', color: isBatting ? accent : 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 6, fontWeight: 600 }}>
        {isMe ? 'You' : name} {isBatting ? '🏏' : '⚾'}
      </div>
      <div style={{ fontFamily: 'var(--font-brand)', fontSize: 32, fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>
        {score.runs}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
        {score.balls} balls · {score.wickets}W
      </div>
      {lives != null && (
        <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{
              width: 10, height: 10, borderRadius: '50%',
              background: i <= lives ? 'var(--green)' : 'rgba(0,0,0,0.4)',
              border: `1px solid ${i <= lives ? 'var(--green)' : 'var(--line)'}`,
              boxShadow: i <= lives ? '0 0 6px var(--green)' : 'none',
            }} />
          ))}
        </div>
      )}
    </div>
  );
}
