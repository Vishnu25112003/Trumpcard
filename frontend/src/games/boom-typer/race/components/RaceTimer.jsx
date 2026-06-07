import { useEffect, useState } from 'react';

// Visible countdown to the auto-scaled time limit. Display only — the server
// is authoritative and ends the race when this hits zero.
export default function RaceTimer({ startedAt, timeLimitSec }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);
  if (!startedAt || !timeLimitSec) return null;
  const left = Math.max(0, Math.ceil(timeLimitSec - (now - startedAt) / 1000));
  const m = Math.floor(left / 60);
  const s = left % 60;
  return (
    <div className={`bt-race-timer${left <= 10 ? ' warn' : ''}`}>
      <span className="lbl">Time</span>
      <span className="val">{m}:{String(s).padStart(2, '0')}</span>
    </div>
  );
}
