export const STATS = [
  { key: 'power',        label: 'Power',    icon: '💥', color: '#ff7e36' },
  { key: 'strength',     label: 'Strength', icon: '💪', color: '#f0d564' },
  { key: 'speed',        label: 'Speed',    icon: '⚡', color: '#ffd23f' },
  { key: 'defense',      label: 'Defense',  icon: '🛡',  color: '#5ee08a' },
  { key: 'intelligence', label: 'Intel',    icon: '🧠', color: '#7ab8ff' },
  { key: 'popularity',   label: 'Pop',      icon: '⭐', color: '#ff5d9e' },
];

const SUITS = ['spade', 'heart', 'diamond', 'club'];
export const SUIT_GLYPH = { spade: '♠', heart: '♥', diamond: '♦', club: '♣' };

// Get a stat value from either flat card (card.power) or MongoDB card (card.stats.power)
export function getStat(card, key) {
  if (card && card.stats) return card.stats[key] ?? 0;
  return card?.[key] ?? 0;
}

// Generate a portrait SVG data URL for a character
function shadeColor(hex, percent) {
  const h = hex.replace('#', '');
  const num = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  let r = (num >> 16) + percent;
  let g = ((num >> 8) & 0xff) + percent;
  let b = (num & 0xff) + percent;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

function escapeXML(s) {
  return String(s).replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
}

function rng(seed) {
  let s = seed >>> 0;
  return function() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function renderHair(style, color, accent) {
  switch (style) {
    case 0:
      return `<path d='M60 90 Q55 60 75 50 L80 70 L92 45 L98 70 L108 45 L116 72 L130 50 L132 70 Q145 60 140 90 Q145 95 138 100 L62 100 Q55 95 60 90 Z' fill='${color}'/>
        <path d='M70 65 L80 50 L78 70 Z M115 50 L125 65 L120 72 Z' fill='${accent}' opacity='0.5'/>`;
    case 1:
      return `<path d='M58 95 Q52 65 75 55 Q95 45 125 50 Q148 60 144 95 L150 160 Q140 165 135 130 L132 110 L68 110 L65 130 Q60 165 50 160 Z' fill='${color}'/>
        <path d='M75 70 L100 60 L125 70 L125 85 L75 85 Z' fill='${accent}' opacity='0.3'/>`;
    case 2:
      return `<path d='M58 100 Q55 70 80 58 Q100 50 120 58 Q145 70 142 100 L140 115 L60 115 Z' fill='${color}'/>
        <path d='M70 95 L100 70 L130 95' stroke='${accent}' stroke-width='1.5' fill='none' opacity='0.5'/>`;
    case 3:
      return `<path d='M58 95 Q55 60 100 55 Q145 60 142 95 L140 105 L60 105 Z' fill='${color}'/>
        <rect x='55' y='95' width='90' height='8' fill='${accent}'/>
        <circle cx='100' cy='99' r='3' fill='${shadeColor(accent, -30)}'/>`;
    default:
      return '';
  }
}

export function portraitURL(card) {
  const c = card.color || '#8a4a5a';
  const seed = String(card.name).split('').reduce((s, ch) => s + ch.charCodeAt(0), 0);
  const r = rng(seed);
  const initial = String(card.name).split(' ').map(w => w[0]).slice(0, 2).join('');
  const bgAngle = Math.floor(r() * 360);
  const hue1 = c;
  const hue2 = shadeColor(c, -30);
  const hue3 = shadeColor(c, 25);
  const eyeY = 60 + Math.floor(r() * 8);
  const hairStyle = Math.floor(r() * 4);
  const accent = ['#f0d564', '#ff6b6b', '#7ab8ff', '#5ee08a'][Math.floor(r() * 4)];
  const hair = renderHair(hairStyle, hue2, accent);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 260' preserveAspectRatio='xMidYMid slice'>
    <defs>
      <linearGradient id='bg' x1='0' y1='0' x2='1' y2='1' gradientTransform='rotate(${bgAngle} 0.5 0.5)'>
        <stop offset='0%' stop-color='${hue3}'/>
        <stop offset='60%' stop-color='${hue1}'/>
        <stop offset='100%' stop-color='${hue2}'/>
      </linearGradient>
      <radialGradient id='glow' cx='0.5' cy='0.35' r='0.7'>
        <stop offset='0%' stop-color='rgba(255,255,255,0.45)'/>
        <stop offset='100%' stop-color='rgba(255,255,255,0)'/>
      </radialGradient>
    </defs>
    <rect width='200' height='260' fill='url(#bg)'/>
    <rect width='200' height='260' fill='url(#glow)'/>
    <g fill='${accent}' opacity='0.7'>
      <circle cx='30' cy='40' r='1.5'/><circle cx='170' cy='30' r='2'/>
      <circle cx='160' cy='80' r='1'/><circle cx='40' cy='100' r='1.2'/>
      <circle cx='180' cy='200' r='1.5'/><circle cx='20' cy='180' r='1'/>
    </g>
    <path d='M40 260 L40 220 Q40 180 100 170 Q160 180 160 220 L160 260 Z' fill='${hue2}'/>
    <path d='M70 230 Q100 215 130 230 L130 260 L70 260 Z' fill='${shadeColor(hue2, -10)}'/>
    <path d='M80 200 L100 180 L120 200 L100 215 Z' fill='${accent}' opacity='0.5'/>
    <rect x='90' y='150' width='20' height='25' fill='#f3d6b0' rx='4'/>
    <ellipse cx='100' cy='110' rx='42' ry='50' fill='#f6dec1'/>
    <path d='M58 110 Q62 140 100 158 Q138 140 142 110 Q142 90 100 78 Q58 90 58 110 Z' fill='url(#glow)' opacity='0.6'/>
    ${hair}
    <ellipse cx='84' cy='${eyeY + 50}' rx='5' ry='7' fill='#fff'/>
    <ellipse cx='116' cy='${eyeY + 50}' rx='5' ry='7' fill='#fff'/>
    <ellipse cx='84' cy='${eyeY + 51}' rx='3' ry='5' fill='${shadeColor(hue1, -40)}'/>
    <ellipse cx='116' cy='${eyeY + 51}' rx='3' ry='5' fill='${shadeColor(hue1, -40)}'/>
    <circle cx='85' cy='${eyeY + 49}' r='1.2' fill='#fff'/>
    <circle cx='117' cy='${eyeY + 49}' r='1.2' fill='#fff'/>
    <path d='M100 115 L98 125 L102 125 Z' fill='${shadeColor('#f6dec1', -15)}' opacity='0.6'/>
    <path d='M93 135 Q100 140 107 135' stroke='${shadeColor(hue1, -50)}' stroke-width='1.5' fill='none' stroke-linecap='round'/>
    <ellipse cx='78' cy='128' rx='6' ry='3' fill='${accent}' opacity='0.25'/>
    <ellipse cx='122' cy='128' rx='6' ry='3' fill='${accent}' opacity='0.25'/>
    <text x='100' y='248' text-anchor='middle' font-family='monospace' font-size='9' fill='rgba(255,255,255,0.5)' font-weight='700'>${escapeXML(initial)}</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

const SUITS_CYCLE = ['spade', 'heart', 'diamond', 'club'];

export function getSuitGlyph(suit) {
  return SUIT_GLYPH[suit] || '♠';
}

// Assign a "suit" to a card based on its index for display purposes
export function getCardSuit(cardIndex) {
  return SUITS_CYCLE[cardIndex % 4];
}
