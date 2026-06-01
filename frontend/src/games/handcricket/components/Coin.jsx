import { useState, useRef, useEffect } from 'react';

function CoinFace({ side }) {
  return (
    <div className={`hc-coin-face ${side === 'tails' ? 'tails' : ''}`}>
      <svg width="74" height="74" viewBox="0 0 74 74" className="hc-coin-glyph">
        {side === 'heads' ? (
          <g fill="#7a5410">
            <rect x="22" y="26" width="6" height="30" rx="3" />
            <rect x="34" y="22" width="6" height="34" rx="3" />
            <rect x="46" y="26" width="6" height="30" rx="3" />
            <rect x="20" y="20" width="34" height="5"  rx="2.5" />
            <circle cx="37" cy="14" r="3.4" />
          </g>
        ) : (
          <g>
            <circle cx="37" cy="37" r="20" fill="none" stroke="#7a5410" strokeWidth="4.5" />
            <path d="M27,24 Q37,37 27,50" fill="none" stroke="#7a5410" strokeWidth="3" strokeLinecap="round" />
            <g stroke="#7a5410" strokeWidth="2.4" strokeLinecap="round">
              <path d="M24,28 l6,1" /><path d="M23,35 l6,0.5" />
              <path d="M23,42 l6,-0.5" /><path d="M24,48 l6,-1" />
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}

export default function Coin({
  winnerName = 'You',
  isChooser = true,
  onChoose,
  forcedFace,
  autoLaunchKey,
  interactive = true,
}) {
  const [phase, setPhase] = useState('ready');
  const [face, setFace]   = useState('heads');
  const [dragging, setDragging] = useState(false);

  const coinRef  = useRef(null);
  const rot      = useRef(0);
  const drag     = useRef(null);
  const rafRef   = useRef(null);
  const failSafe = useRef(null);

  const apply = (deg, y = 0) => {
    rot.current = deg;
    if (coinRef.current)
      coinRef.current.style.transform = `translateY(${y}px) rotateX(${deg}deg)`;
  };

  const onDown = (e) => {
    if (!interactive) return;
    if (phase !== 'ready') return;
    setDragging(true);
    drag.current = { y: e.clientY, start: rot.current, moved: 0 };
    if (coinRef.current) coinRef.current.style.animation = 'none';
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* Pointer capture is optional. */ }
  };

  const onMove = (e) => {
    if (!interactive) return;
    if (!drag.current || phase !== 'ready') return;
    e.preventDefault();
    const dy = drag.current.y - e.clientY;
    drag.current.moved = Math.max(drag.current.moved, Math.abs(dy));
    apply(drag.current.start + dy * 2.4);
  };

  const onUp = () => {
    if (!interactive) return;
    if (!drag.current) return;
    const power = drag.current.moved;
    drag.current = null;
    setDragging(false);
    launch(power);
  };

  const launch = (power = 0) => {
    if (phase !== 'ready') return;
    const startRot = rot.current;
    const landed = forcedFace || (Math.random() < 0.5 ? 'heads' : 'tails');
    const turns  = 5 + Math.floor(Math.random() * 2) + Math.min(4, Math.floor(power / 70));
    let final    = startRot + turns * 360;
    const want   = landed === 'tails' ? 180 : 0;
    final += ((want - (((final % 360) + 360) % 360)) + 360) % 360;

    setFace(landed);
    setPhase('spinning');

    const dur = 2000, t0 = performance.now();
    const easeOut = (x) => 1 - Math.pow(1 - x, 3);
    const tick = (now) => {
      const p    = Math.min(1, (now - t0) / dur);
      const e    = easeOut(p);
      const r    = startRot + (final - startRot) * e;
      const lift = -160 * Math.sin(Math.PI * p);
      const drop = 40 * e;
      apply(r, lift + drop);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else { apply(final, 40); setPhase('settled'); }
    };
    rafRef.current = requestAnimationFrame(tick);
    clearTimeout(failSafe.current);
    failSafe.current = setTimeout(() => {
      cancelAnimationFrame(rafRef.current);
      apply(final, 40);
      setPhase('settled');
    }, dur + 250);
  };

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    clearTimeout(failSafe.current);
  }, []);

  useEffect(() => {
    if (!autoLaunchKey || phase !== 'ready') return;
    const t = setTimeout(() => launch(120), 250);
    return () => clearTimeout(t);
  }, [autoLaunchKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="hc-coin-stage"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <div
        ref={coinRef}
        className={`hc-coin ${phase === 'ready' && !dragging ? 'bob' : ''}`}
        style={{ cursor: interactive && phase === 'ready' ? (dragging ? 'grabbing' : 'grab') : 'default' }}
      >
        <CoinFace side="heads" />
        <CoinFace side="tails" />
      </div>

      <div className="hc-coin-shadow" style={{ opacity: phase === 'ready' ? 0.5 : 0.32 }} />

      {phase === 'ready' && interactive && (
        <div className="hc-swipe-hint">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
          Swipe up to toss
        </div>
      )}

      {phase === 'spinning' && (
        <div className="hc-swipe-hint" style={{ animation: 'none' }}>Tossing…</div>
      )}

      {phase === 'settled' && (
        <div style={{ textAlign: 'center', marginTop: 26, animation: 'hcFadeUp 0.45s ease both' }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 13,
            letterSpacing: '0.28em', color: 'var(--cyan)',
            textTransform: 'uppercase', marginBottom: 8,
          }}>
            {face === 'heads' ? '✦ Heads' : '● Tails'}
          </div>
          <div style={{
            fontFamily: 'var(--font-brand)',
            fontSize: 'clamp(18px,4vw,24px)',
            background: 'linear-gradient(180deg,var(--gold-bright),var(--gold-deep))',
            WebkitBackgroundClip: 'text', backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {winnerName === 'You' ? 'You win the toss!' : `${winnerName} wins the toss!`}
          </div>
          {isChooser ? (
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 18 }}>
              <button
                className="btn btn-gold"
                style={{ fontSize: 13, padding: '13px 26px' }}
                onClick={() => onChoose?.('bat')}
              >
                🏏 Bat First
              </button>
              <button
                className="btn btn-ghost"
                style={{ fontSize: 13, padding: '13px 26px' }}
                onClick={() => onChoose?.('bowl')}
              >
                ⚾ Bowl First
              </button>
            </div>
          ) : (
            <p style={{ color: 'var(--text-soft)', fontSize: 14, marginTop: 14 }}>
              Waiting for {winnerName} to choose…
            </p>
          )}
        </div>
      )}
    </div>
  );
}
