const HAND_EMOJIS = { 1: '☝️', 2: '✌️', 3: '🤟', 4: '🖖', 5: '🖐️', 6: '🤙' };

export default function HandPicker({ onPick, picked, disabled, timer }) {
  const urgent = timer <= 3;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* Timer bar */}
      <div style={{
        width: '100%', maxWidth: 320, height: 6,
        background: 'rgba(0,0,0,0.4)',
        borderRadius: 99,
        overflow: 'hidden',
        border: '1px solid var(--line)',
      }}>
        <div style={{
          height: '100%',
          width: `${(timer / 7) * 100}%`,
          background: urgent
            ? 'linear-gradient(90deg, var(--red), #ff8c69)'
            : 'linear-gradient(90deg, var(--cyan), var(--purple-bright))',
          borderRadius: 99,
          transition: 'width 0.25s linear, background 0.3s',
          boxShadow: urgent ? '0 0 10px var(--red)' : '0 0 10px var(--cyan)',
        }} />
      </div>

      <div style={{
        fontSize: 13, fontFamily: 'var(--font-mono)',
        color: urgent ? 'var(--red)' : 'var(--text-dim)',
        letterSpacing: '0.1em',
        transition: 'color 0.3s',
      }}>
        {picked != null ? `You picked ${picked}` : timer > 0 ? `${timer}s to pick` : 'Time up!'}
      </div>

      {/* Number grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10,
        width: '100%',
        maxWidth: 300,
      }}>
        {[1, 2, 3, 4, 5, 6].map((n) => {
          const isSelected = picked === n;
          const isDisabled = disabled || picked != null;
          return (
            <button
              key={n}
              disabled={isDisabled}
              onClick={() => !isDisabled && onPick(n)}
              style={{
                padding: '18px 0',
                borderRadius: 14,
                border: `2px solid ${isSelected ? 'var(--gold)' : urgent ? 'rgba(255,77,109,0.4)' : 'var(--line-strong)'}`,
                background: isSelected
                  ? 'linear-gradient(135deg, var(--gold-bright), var(--gold-deep))'
                  : 'var(--surface)',
                color: isSelected ? '#2a1450' : 'var(--text)',
                fontSize: 28,
                fontWeight: 700,
                cursor: isDisabled ? 'default' : 'pointer',
                opacity: isDisabled && !isSelected ? 0.45 : 1,
                transition: 'all 0.18s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                boxShadow: isSelected ? '0 0 20px rgba(240,199,80,0.5)' : urgent ? '0 0 8px rgba(255,77,109,0.15)' : 'none',
                transform: isSelected ? 'scale(1.05)' : 'none',
              }}
              onMouseEnter={e => { if (!isDisabled) e.currentTarget.style.transform = 'translateY(-3px) scale(1.04)'; }}
              onMouseLeave={e => { if (!isDisabled && !isSelected) e.currentTarget.style.transform = 'none'; }}
            >
              <span style={{ fontSize: 22, lineHeight: 1 }}>{HAND_EMOJIS[n]}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, lineHeight: 1 }}>{n}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
