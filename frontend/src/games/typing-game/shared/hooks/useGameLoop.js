import { useEffect, useRef } from 'react';

// requestAnimationFrame loop. Callback receives (dtMs, totalMs).
// Pauses cleanly when `active` is false; resumes timestamp seamlessly.
export function useGameLoop(callback, active = true) {
  const cbRef = useRef(callback);
  const activeRef = useRef(active);
  useEffect(() => { cbRef.current = callback; }, [callback]);
  useEffect(() => { activeRef.current = active; }, [active]);

  useEffect(() => {
    let rafId = null;
    let last = null;
    let total = 0;

    const tick = (ts) => {
      if (!activeRef.current) {
        last = null;
        rafId = requestAnimationFrame(tick);
        return;
      }
      if (last == null) last = ts;
      const dt = ts - last;
      last = ts;
      total += dt;
      cbRef.current?.(dt, total);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => { if (rafId) cancelAnimationFrame(rafId); };
  }, []);
}
