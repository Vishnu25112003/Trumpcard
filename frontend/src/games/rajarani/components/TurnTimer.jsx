import { useEffect, useState } from 'react';

export default function TurnTimer({ deadline }) {
  const [left, setLeft] = useState(0);

  useEffect(() => {
    if (!deadline) return;
    const tick = () => setLeft(Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [deadline]);

  return <div className={`rr-timer${left <= 3 ? ' warn' : ''}`}>{left}s</div>;
}
