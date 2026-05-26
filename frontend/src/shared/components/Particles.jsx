import { useEffect, useRef } from 'react';

const COLORS = [
  '#ffe585', '#f0c750', '#9a5cff', '#ff5d9e', '#5eecff', '#5ee08a', '#b884ff', '#ff7e36',
];

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

export default function Particles({ active, type = 'confetti', count = 60, onDone }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const doneRef   = useRef(false);

  useEffect(() => {
    if (!active) return;
    doneRef.current = false;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const W = canvas.width  = window.innerWidth;
    const H = canvas.height = window.innerHeight;

    const particles = Array.from({ length: count }, (_, i) => ({
      x:      randomBetween(W * 0.1, W * 0.9),
      y:      randomBetween(-40, -10),
      vx:     randomBetween(-3, 3),
      vy:     randomBetween(2, 6),
      rot:    randomBetween(0, Math.PI * 2),
      rotV:   randomBetween(-0.12, 0.12),
      size:   randomBetween(6, 14),
      color:  COLORS[i % COLORS.length],
      shape:  ['rect', 'circle', 'tri'][i % 3],
      alpha:  1,
      life:   randomBetween(0.006, 0.012),
    }));

    let allDone = false;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      allDone = true;

      for (const p of particles) {
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.15;   // gravity
        p.rot += p.rotV;
        p.alpha = Math.max(0, p.alpha - p.life);

        if (p.alpha > 0) {
          allDone = false;
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle   = p.color;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);

          if (p.shape === 'rect') {
            ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          } else if (p.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2.5, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.moveTo(0, -p.size / 2);
            ctx.lineTo(p.size / 2, p.size / 2);
            ctx.lineTo(-p.size / 2, p.size / 2);
            ctx.closePath();
            ctx.fill();
          }

          ctx.restore();
        }
      }

      if (allDone) {
        if (!doneRef.current) {
          doneRef.current = true;
          onDone?.();
        }
        return;
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [active, count, onDone]);

  if (!active) return null;

  return (
    <div className="particles">
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    </div>
  );
}
