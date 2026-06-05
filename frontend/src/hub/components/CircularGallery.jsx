import { useEffect, useRef, useState } from 'react';

/* ------------------------------------------------------------------
   Default game items used when no `items` prop is passed.
   Unsplash URLs are stable CDN links with consistent parameters.
------------------------------------------------------------------ */
const DEFAULT_ITEMS = [
  {
    common: 'Anime Trumpcard',
    binomial: 'Strategy · 2–4 Players',
    path: '/trumpcard',
    accent: '#f6d35a',
    photo: {
      url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=900&auto=format&fit=crop&q=80',
      text: 'Esports gaming arena with neon lighting',
      pos: '50% 50%',
    },
  },
  {
    common: 'Hand Cricket',
    binomial: '1v1 Duel · 2 Players',
    path: '/hand-cricket',
    accent: '#58c8ff',
    photo: {
      url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=900&auto=format&fit=crop&q=80',
      text: 'Cricket match in action',
      pos: '50% 35%',
    },
  },
  {
    common: 'Raja Rani',
    binomial: 'Party Game · 4–10 Players',
    path: '/rajarani',
    accent: '#ff72c8',
    photo: {
      url: 'https://images.unsplash.com/photo-1529157669938-ce1f9a7a7d0d?w=900&auto=format&fit=crop&q=80',
      text: 'Chess strategy board',
      pos: '50% 40%',
    },
  },
  {
    common: 'Boom Typer',
    binomial: 'Solo Survival · Endless',
    path: '/boom-typer',
    accent: '#46e0a0',
    photo: {
      url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=900&auto=format&fit=crop&q=80',
      text: 'RGB mechanical gaming keyboard',
      pos: '50% 50%',
    },
  },
];

/* ------------------------------------------------------------------
   CircularGallery  —  3-D rotating carousel of game cards.
   Props:
     items         array of { common, binomial, path, accent, photo }
     radius        px distance from centre to each card face   (360)
     perspective   px camera distance                         (2200)
     speed         rotation degrees added per animation frame (0.012)
     onPlay        ({ path, ...item }) => void  called on card click
------------------------------------------------------------------ */
export function CircularGallery({
  items = DEFAULT_ITEMS,
  radius = 360,
  perspective = 2200,
  speed = 0.012,
  onPlay,
}) {
  const rafRef = useRef(null);
  const rotRef = useRef(0);
  const pausedRef = useRef(false);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const tick = () => {
      if (!pausedRef.current) {
        rotRef.current += speed;
        setRotation(rotRef.current);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [speed]);

  const step = 360 / items.length;

  return (
    <div
      style={{ position: 'relative', width: '100%', height: '100%', perspective }}
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      {/* Rotating ring */}
      <div style={{
        position: 'relative', width: '100%', height: '100%',
        transformStyle: 'preserve-3d',
        transform: `rotateY(${rotation}deg)`,
      }}>
        {items.map((item, i) => {
          const itemAngle = i * step;
          const rel = (itemAngle + (rotation % 360) + 360) % 360;
          const norm = rel > 180 ? 360 - rel : rel;
          const isFront = norm < 48;
          const opacity = Math.max(0.15, 1 - norm / 155);

          return (
            <div
              key={item.path || i}
              style={{
                position: 'absolute',
                width: 252, height: 354,
                left: '50%', top: '50%',
                marginLeft: -126, marginTop: -177,
                transform: `rotateY(${itemAngle}deg) translateZ(${radius}px)`,
                opacity,
                transition: 'opacity 0.22s linear',
                cursor: 'pointer',
              }}
              onClick={() => onPlay?.(item)}
            >
              <Card item={item} isFront={isFront} onPlay={onPlay} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Card({ item, isFront, onPlay }) {
  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      borderRadius: 18, overflow: 'hidden', background: '#08031a',
      border: `1.5px solid ${isFront ? item.accent + '55' : 'rgba(100,66,220,0.15)'}`,
      boxShadow: isFront
        ? `0 22px 52px -10px rgba(0,0,0,0.9), 0 0 30px -8px ${item.accent}44`
        : '0 10px 28px -10px rgba(0,0,0,0.5)',
      transition: 'box-shadow 0.32s, border-color 0.32s',
    }}>
      {/* Photo */}
      <img
        src={item.photo.url}
        alt={item.photo.text}
        loading="lazy"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          objectPosition: item.photo.pos || 'center',
        }}
      />

      {/* Tinted gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(180deg, ${item.accent}1a 0%, rgba(6,2,18,0.85) 58%, rgba(0,0,0,0.97) 100%)`,
      }} />

      {/* Live badge */}
      <div style={{
        position: 'absolute', top: 12, left: 12, zIndex: 3,
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '4px 10px', borderRadius: 999,
        background: 'rgba(56,220,147,0.12)',
        border: '1px solid rgba(56,220,147,0.28)',
        fontSize: 9, fontWeight: 700, letterSpacing: '0.16em',
        color: '#38dc93', fontFamily: "'Chakra Petch',sans-serif",
        whiteSpace: 'nowrap',
      }}>
        <span style={{
          width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
          background: '#38dc93', boxShadow: '0 0 7px #38dc93',
          display: 'inline-block',
          animation: 'pp-pulse 2s infinite',
        }} />
        LIVE
      </div>

      {/* Bottom: title + tagline + Play button */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, width: '100%',
        padding: '0 16px 16px', zIndex: 3,
      }}>
        <h2 style={{
          fontFamily: "'Orbitron',sans-serif",
          fontSize: isFront ? 17 : 15,
          fontWeight: 800, margin: '0 0 4px', lineHeight: 1.2,
          color: item.accent,
          textShadow: `0 0 18px ${item.accent}55`,
        }}>
          {item.common}
        </h2>
        <p style={{
          fontSize: 11, margin: '0 0 12px',
          color: 'rgba(208,192,238,0.7)',
          fontFamily: "'Chakra Petch',sans-serif",
          letterSpacing: '0.06em',
        }}>
          {item.binomial}
        </p>
        {isFront && (
          <button
            onClick={e => { e.stopPropagation(); onPlay?.(item); }}
            style={{
              padding: '9px 20px', borderRadius: 10, border: 'none',
              fontFamily: "'Chakra Petch',sans-serif",
              fontWeight: 700, fontSize: 12,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: '#2a1604', cursor: 'pointer',
              background: 'linear-gradient(180deg,#fbe6a0,#f6d35a 55%,#ecb838)',
              boxShadow: '0 8px 22px -8px rgba(246,211,90,0.75), inset 0 1px 0 rgba(255,255,255,0.5)',
              transition: 'transform 0.18s, box-shadow 0.18s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 26px -8px rgba(246,211,90,0.9), inset 0 1px 0 rgba(255,255,255,0.5)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '0 8px 22px -8px rgba(246,211,90,0.75), inset 0 1px 0 rgba(255,255,255,0.5)';
            }}
          >
            Play Now →
          </button>
        )}
      </div>
    </div>
  );
}
