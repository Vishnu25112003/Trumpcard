export default function InningsBreak({ target, innings1Summary, battingRole, myRole, scores, onContinue, waiting }) {
  const inns1BatIsMe = innings1Summary?.battingRole === myRole;
  const myScore      = innings1Summary ? scores[myRole] : null;
  const oppScore     = innings1Summary ? scores[myRole === 'host' ? 'guest' : 'host'] : null;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
      padding: '32px 24px', textAlign: 'center', maxWidth: 380, margin: '0 auto',
    }}>
      <div style={{
        fontSize: 10, letterSpacing: '0.26em', textTransform: 'uppercase',
        color: 'var(--cyan)', fontWeight: 600,
      }}>
        Innings Break
      </div>

      <div style={{
        fontFamily: 'var(--font-brand)',
        fontSize: 'clamp(26px, 6vw, 40px)',
        background: 'linear-gradient(180deg, var(--gold-bright), var(--gold-deep))',
        WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
        lineHeight: 1,
      }}>
        Innings 1 Over
      </div>

      {/* Score summary */}
      <div style={{
        width: '100%', background: 'var(--surface-strong)', border: '1px solid var(--line-gold)',
        borderRadius: 16, padding: '18px 20px',
      }}>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 12, letterSpacing: '0.1em' }}>Final Score</div>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {['host', 'guest'].map(role => (
            <div key={role} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: innings1Summary?.battingRole === role ? 'var(--gold)' : 'var(--text-dim)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>
                {role === myRole ? 'You' : 'Opponent'}
                {innings1Summary?.battingRole === role ? ' 🏏' : ' ⚾'}
              </div>
              <div style={{ fontFamily: 'var(--font-brand)', fontSize: 30, color: 'var(--gold)', lineHeight: 1 }}>
                {scores[role]?.runs ?? 0}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                {scores[role]?.balls ?? 0}b · {scores[role]?.wickets ?? 0}W
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Target */}
      <div style={{
        padding: '14px 28px', background: 'rgba(94,236,255,0.1)',
        border: '1px solid rgba(94,236,255,0.3)', borderRadius: 12,
      }}>
        <div style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>Target</div>
        <div style={{ fontFamily: 'var(--font-brand)', fontSize: 36, color: 'var(--cyan)', lineHeight: 1 }}>{target + 1}</div>
        <div style={{ fontSize: 11, color: 'var(--text-soft)', marginTop: 4 }}>
          {innings1Summary?.battingRole !== myRole ? 'You need to chase' : 'Opponent needs to chase'}
        </div>
      </div>

      {waiting ? (
        <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>Waiting for opponent…</p>
      ) : (
        <button className="btn btn-gold" style={{ width: '100%', fontSize: 13 }} onClick={onContinue}>
          Start Innings 2 →
        </button>
      )}
    </div>
  );
}
