const SH_FINGERS = [
  { id: 'index',  cx: 64,  w: 24, tipY: 40, wig:  3.0 },
  { id: 'middle', cx: 92,  w: 26, tipY: 22, wig: -2.0 },
  { id: 'ring',   cx: 120, w: 25, tipY: 36, wig:  2.4 },
  { id: 'pinky',  cx: 146, w: 21, tipY: 58, wig: -3.0 },
];
const SH_BASE  = 150;
const SH_KNUCK = 104;

export const SH_POSE = {
  0: { fingers: [], thumb: 'tuck' },
  1: { fingers: ['index'], thumb: 'tuck' },
  2: { fingers: ['index', 'middle'], thumb: 'tuck' },
  3: { fingers: ['index', 'middle', 'ring'], thumb: 'tuck' },
  4: { fingers: ['index', 'middle', 'ring', 'pinky'], thumb: 'tuck' },
  5: { fingers: ['index', 'middle', 'ring', 'pinky'], thumb: 'out' },
  6: { fingers: [], thumb: 'up' },
};

const SH_TONES = {
  gold:   { fill: 'url(#shGold)',   stroke: '#a9781a', crease: 'rgba(120,80,10,0.32)' },
  purple: { fill: 'url(#shPurple)', stroke: '#3f1486', crease: 'rgba(255,255,255,0.20)' },
  teal:   { fill: 'url(#shTeal)',   stroke: '#0c5563', crease: 'rgba(255,255,255,0.20)' },
};

export function SideHand({ value = 0, side = 'left', tone = 'gold', size = 200, active = false, reveal = false }) {
  const pose = SH_POSE[value || 0] || SH_POSE[0];
  const t    = SH_TONES[tone] || SH_TONES.gold;
  const flip = side === 'right';

  return (
    <span
      className={`side-hand-wrap ${side}`}
      style={{ display: 'inline-block', transform: flip ? 'scaleX(-1)' : 'none' }}
    >
      <svg
        className={`side-hand ${active ? 'is-active' : ''} ${reveal ? 'is-reveal' : ''}`}
        width={size} height={size * 1.28}
        viewBox="0 0 210 270"
        style={{ overflow: 'visible', display: 'block' }}
      >
        {/* curled knuckle bumps */}
        {SH_FINGERS.map((f) =>
          pose.fingers.includes(f.id) ? null : (
            <rect
              key={`c-${f.id}`}
              x={f.cx - f.w / 2} y={SH_KNUCK}
              width={f.w} height={SH_BASE - SH_KNUCK + 6}
              rx={f.w / 2}
              fill={t.fill} stroke={t.stroke} strokeWidth="3"
            />
          )
        )}

        {/* extended fingers */}
        {SH_FINGERS.map((f, i) =>
          pose.fingers.includes(f.id) ? (
            <rect
              key={`e-${f.id}`}
              className="sh-finger"
              x={f.cx - f.w / 2} y={f.tipY}
              width={f.w} height={SH_BASE - f.tipY}
              rx={f.w / 2}
              fill={t.fill} stroke={t.stroke} strokeWidth="3"
              style={{
                transformOrigin: 'center bottom',
                transformBox: 'fill-box',
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ) : null
        )}

        {/* thumb */}
        <g
          className={`sh-thumb thumb-${pose.thumb}`}
          style={{ transformOrigin: '44px 168px', transformBox: 'view-box' }}
        >
          <rect x="28" y="108" width="25" height="70" rx="12.5"
            fill={t.fill} stroke={t.stroke} strokeWidth="3" />
        </g>

        {/* palm */}
        <path
          d="M44,138 Q40,120 56,118 L150,118 Q168,120 164,140 L164,182 Q164,224 110,224 L96,224 Q44,224 44,182 Z"
          fill={t.fill} stroke={t.stroke} strokeWidth="3.5" strokeLinejoin="round"
        />
        <path
          d="M44,138 Q40,120 56,118 L150,118 Q168,120 164,140 L164,182 Q164,224 110,224 L96,224 Q44,224 44,182 Z"
          fill="url(#shShade)" opacity="0.85"
        />

        {/* forearm / cuff */}
        <path
          d="M70,214 L140,214 Q150,214 150,236 L150,272 L60,272 L60,236 Q60,214 70,214 Z"
          fill={t.fill} stroke={t.stroke} strokeWidth="3.5" strokeLinejoin="round"
        />
        <path d="M62,232 L148,232" stroke={t.crease} strokeWidth="3" strokeLinecap="round" opacity="0.7" />

        {/* palm creases */}
        <path d="M62,168 Q104,184 150,170" fill="none" stroke={t.crease} strokeWidth="2.4" strokeLinecap="round" />
        <path d="M72,196 Q104,206 134,198" fill="none" stroke={t.crease} strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function SideHandDefs() {
  const grads = [
    ['shGold',   '#ffe89a', '#f0c750', '#cf9a2c'],
    ['shPurple', '#c9a3ff', '#9a5cff', '#6b2cd4'],
    ['shTeal',   '#7fe3ef', '#2bb6cc', '#0c8298'],
  ];
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        {grads.map(([id, a, b, c]) => (
          <linearGradient key={id} id={id} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" stopColor={a} />
            <stop offset="0.55" stopColor={b} />
            <stop offset="1" stopColor={c} />
          </linearGradient>
        ))}
        <radialGradient id="shShade" cx="0.42" cy="0.3" r="0.85">
          <stop offset="0" stopColor="rgba(255,255,255,0.30)" />
          <stop offset="0.55" stopColor="rgba(255,255,255,0)" />
          <stop offset="1" stopColor="rgba(0,0,0,0.20)" />
        </radialGradient>
      </defs>
    </svg>
  );
}
