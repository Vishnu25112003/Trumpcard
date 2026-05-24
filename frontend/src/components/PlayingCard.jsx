import { useMemo } from 'react';
import { STATS, getStat, portraitURL, getSuitGlyph, getCardSuit } from '../utils/gameData';

// Corner decoration SVG
function CornerDeco({ position }) {
  return (
    <div className={`pc-corner-deco ${position}`}>
      <svg viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 2 L10 2 L2 10 Z" fill="currentColor" opacity="0.7" />
        <path d="M2 2 L2 8" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        <path d="M2 2 L8 2" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        <circle cx="2" cy="2" r="1.5" fill="currentColor" opacity="0.9" />
      </svg>
    </div>
  );
}

// Card back art
export function CardBackArt() {
  return (
    <div className="pc-back-art">
      <div className="pc-back-frame" />
      <div className="pc-back-emblem">
        <div className="ring">
          <span className="glyph">T</span>
        </div>
      </div>
    </div>
  );
}

// Standalone CardBack (for use outside of PlayingCard flip)
export function CardBack({ size = 'md' }) {
  return (
    <div className={`pc size-${size}`}>
      <CardBackArt />
    </div>
  );
}

// Left and right stat sets
const LEFT_STATS  = STATS.slice(0, 3);  // power, strength, speed
const RIGHT_STATS = STATS.slice(3);     // defense, intelligence, popularity

export default function PlayingCard({
  card,
  size = 'md',
  faceUp = true,
  interactive = false,
  selectedStat = null,
  winningStat = null,
  losingStat = null,
  onStatTap = null,
  shine = false,
  className = '',
  style = null,
}) {
  const imgSrc = card?.image || (card ? portraitURL(card) : null);
  const suitGlyph = card?.suit
    ? getSuitGlyph(card.suit)
    : getSuitGlyph(getCardSuit(0));

  const getStatClass = (key) => {
    const classes = ['pc-stat'];
    if (interactive && !selectedStat) classes.push('interactive');
    if (selectedStat === key) classes.push('selected');
    if (winningStat === key) classes.push('win');
    if (losingStat === key) classes.push('lose');
    return classes.join(' ');
  };

  const handleStatClick = (key) => {
    if (!interactive || selectedStat || !onStatTap) return;
    onStatTap(key);
  };

  const pcClass = [
    'pc',
    `size-${size}`,
    faceUp ? '' : 'flipped',
    shine ? 'shine' : '',
    className,
  ].filter(Boolean).join(' ');

  const renderStat = (statDef) => {
    const val = card ? getStat(card, statDef.key) : '?';
    return (
      <div
        key={statDef.key}
        className={getStatClass(statDef.key)}
        onClick={() => handleStatClick(statDef.key)}
        role={interactive && !selectedStat ? 'button' : undefined}
        tabIndex={interactive && !selectedStat ? 0 : undefined}
        onKeyDown={interactive && !selectedStat ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleStatClick(statDef.key); } : undefined}
      >
        <span className="pc-stat-icon">{statDef.icon}</span>
        <span className="pc-stat-val">{val}</span>
        <span className="pc-stat-label">{statDef.label}</span>
      </div>
    );
  };

  return (
    <div className={pcClass} style={style}>
      {/* Face */}
      <div className="pc-face">
        <CornerDeco position="tl" />
        <CornerDeco position="tr" />
        <CornerDeco position="bl" />
        <CornerDeco position="br" />

        <div className="pc-sparkles">
          <span /><span /><span /><span /><span />
        </div>

        <div className="pc-suit-top">{suitGlyph}</div>

        <div className="pc-face-inner">
          {/* Left stats */}
          <div className="pc-stat-col">
            {LEFT_STATS.map(renderStat)}
          </div>

          {/* Portrait */}
          <div className="pc-portrait">
            {imgSrc && <img src={imgSrc} alt={card?.name || 'Card'} draggable={false} />}
          </div>

          {/* Right stats */}
          <div className="pc-stat-col">
            {RIGHT_STATS.map(renderStat)}
          </div>
        </div>

        <div className="pc-name">{card?.name || ''}</div>
      </div>

      {/* Back */}
      <div className="pc-back">
        <CardBackArt />
      </div>
    </div>
  );
}

// Fan of card backs
export function FanOfCards({ count = 5, size = 'sm', maxAngle = 28, spacing = 18, yArc = 16, className = '' }) {
  const visible = Math.min(count, 9);
  const hidden = count - visible;
  const cards = useMemo(() => {
    if (visible <= 0) return [];
    if (visible === 1) return [{ angle: 0, x: 0, y: 0 }];
    const step = maxAngle / (visible - 1);
    return Array.from({ length: visible }, (_, i) => {
      const t = i - (visible - 1) / 2;
      const angle = t * step;
      const x = t * spacing;
      const norm = t / ((visible - 1) / 2 || 1);
      const y = (norm * norm) * yArc;
      return { angle, x, y };
    });
  }, [visible, maxAngle, spacing, yArc]);

  return (
    <div className={`fan ${className}`}>
      {cards.map((c, i) => (
        <div key={i} className="fan-card" style={{ transform: `translate(${c.x}px, ${c.y}px) rotate(${c.angle}deg)`, zIndex: i }}>
          <CardBack size={size} />
        </div>
      ))}
      {hidden > 0 && (
        <div style={{ position: 'absolute', bottom: -6, right: '46%', transform: 'translateX(50%)', background: 'rgba(0,0,0,0.65)', border: '1px solid var(--line-gold)', color: 'var(--gold)', padding: '2px 8px', borderRadius: 8, fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', fontWeight: 700 }}>
          +{hidden}
        </div>
      )}
    </div>
  );
}
