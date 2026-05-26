import { useMemo } from 'react';

const SPARKLE_COUNT = 18;

export default function SparkleLayer() {
  const sparkles = useMemo(() => (
    Array.from({ length: SPARKLE_COUNT }, (_, i) => ({
      id: i,
      left:  `${5 + (i * 5.2) % 90}%`,
      top:   `${10 + (i * 7.3) % 80}%`,
      delay: `${(i * 0.44) % 8}s`,
      dur:   `${6 + (i * 0.7) % 4}s`,
      size:  i % 3 === 0 ? '5px' : i % 3 === 1 ? '3px' : '4px',
    }))
  ), []);

  return (
    <div className="sparkle-layer">
      {sparkles.map((s) => (
        <span
          key={s.id}
          className="sparkle"
          style={{
            left:              s.left,
            top:               s.top,
            animationDelay:    s.delay,
            animationDuration: s.dur,
            width:             s.size,
            height:            s.size,
          }}
        />
      ))}
    </div>
  );
}
