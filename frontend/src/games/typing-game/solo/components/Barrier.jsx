import { SOLO_CONFIG } from '../soloConfig';

export default function Barrier({ hp, maxHp, top }) {
  const pct = Math.max(0, hp) / Math.max(1, maxHp);
  const levelClass = pct <= 0.2 ? ' crit' : pct <= 0.5 ? ' low' : '';
  return (
    <div className="tg-barrier" style={{ top, height: SOLO_CONFIG.ARENA.BARRIER_HEIGHT }}>
      <div style={{ fontSize: 11, letterSpacing: '0.18em', color: 'var(--gold)', fontWeight: 700 }}>
        HP {hp}/{maxHp}
      </div>
      <div className="tg-hp-bar">
        <div className={`tg-hp-fill${levelClass}`} style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  );
}
