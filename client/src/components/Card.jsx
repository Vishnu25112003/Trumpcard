import { useEffect, useRef, useState } from 'react';
import { STAT_ORDER, STAT_META } from '../utils/constants';

const LEFT_STATS  = STAT_ORDER.slice(0, 3); // power, speed, intelligence
const RIGHT_STATS = STAT_ORDER.slice(3);    // strength, defense, popularity

export default function Card({
  card,
  highlightStat = null,
  selectedStat  = null,
  onSelectStat  = null,   // when provided, stat rows become clickable buttons
  size          = 'normal',
}) {
  const [animKey, setAnimKey] = useState(0);
  const prevName = useRef(null);

  useEffect(() => {
    if (card?.name && card.name !== prevName.current) {
      prevName.current = card.name;
      setAnimKey((k) => k + 1);
    }
  }, [card?.name]);

  if (!card) return <CardSkeleton size={size} />;

  const isCompact   = size === 'compact';
  const interactive = !!onSelectStat;

  // ── compact (admin / result preview) keeps original vertical layout ────────
  if (isCompact) {
    return (
      <div
        key={animKey}
        className="w-32 sm:w-36 bg-[#12121a] border border-[#1a1a2e] rounded-2xl overflow-hidden
          flex flex-col shadow-xl shadow-black/40 animate-deal-in"
      >
        <div className="relative overflow-hidden bg-[#1a1a2e] h-36 shrink-0">
          <img src={card.image} alt={card.name} className="w-full h-full object-cover" draggable={false} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#12121a] via-transparent to-transparent" />
          <span className="absolute top-1.5 left-1.5 text-[9px] bg-purple-600/70 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide">
            {card.category}
          </span>
        </div>
        <div className="px-2.5 pt-2 pb-0.5">
          <h3 className="text-xs font-bold text-white truncate">{card.name}</h3>
        </div>
        <div className="px-2.5 pb-2.5 space-y-1 flex-1">
          {STAT_ORDER.map((stat) => {
            const meta = STAT_META[stat];
            const hl   = stat === highlightStat || stat === selectedStat;
            return (
              <div key={stat} className={`flex items-center gap-1 rounded-md transition-all
                ${hl ? 'bg-white/[0.06] px-1 -mx-1 py-0.5 animate-stat-pop' : ''}`}>
                <span className={`text-[9px] w-14 shrink-0 ${meta.color} ${hl ? 'font-bold' : 'opacity-80'}`}>
                  {stat.slice(0, 3).toUpperCase()}
                </span>
                <div className="flex-1 h-1 bg-[#1a1a2e] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${hl ? meta.bg : 'bg-gray-600'}`}
                       style={{ width: `${Math.max(2, card.stats[stat])}%` }} />
                </div>
                <span className={`text-[9px] w-5 text-right font-mono shrink-0 ${hl ? 'text-white font-bold' : 'text-gray-500'}`}>
                  {card.stats[stat]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── normal (game page) — 2-column interactive stats ───────────────────────
  const renderStatBtn = (stat) => {
    const meta       = STAT_META[stat];
    const isSelected = stat === selectedStat;
    const isHighlit  = stat === highlightStat && !interactive;
    const isPending  = selectedStat && !isSelected;
    const clickable  = interactive && !selectedStat;

    return (
      <button
        key={stat}
        type="button"
        onClick={() => clickable && onSelectStat(stat)}
        disabled={!clickable}
        className={`relative flex items-center gap-1.5 rounded-xl px-2 py-2 border w-full
          text-left transition-all duration-150 select-none
          ${isSelected
            ? `${meta.bg} border-transparent text-white shadow-lg scale-[1.03] animate-stat-pop`
            : isPending
              ? 'bg-[#1a1a2e] border-[#1a1a2e] opacity-25 cursor-not-allowed'
              : clickable
                ? `bg-[#1a1a2e] border-[#2a2a3e] ${meta.color}
                   hover:bg-[#2a2a3e] hover:border-current hover:scale-[1.03]
                   active:scale-95 cursor-pointer`
                : `bg-[#1a1a2e] border-[#1a1a2e]
                   ${isHighlit ? meta.color : 'text-gray-500'}`
          }`}
      >
        <span className="text-sm shrink-0 leading-none">{meta.icon}</span>
        <span className={`flex-1 text-[10px] leading-none truncate font-medium
          ${isSelected ? 'text-white' : 'opacity-75'}`}>
          {meta.label}
        </span>
        <span className={`shrink-0 font-bold font-mono text-sm
          ${isSelected ? 'text-white' : ''}`}>
          {card.stats[stat]}
        </span>

        {isSelected && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white rounded-full
            flex items-center justify-center text-[9px] text-purple-700 font-black animate-pop-in">
            ✓
          </span>
        )}
      </button>
    );
  };

  return (
    <div
      key={animKey}
      className="w-52 sm:w-60 bg-[#12121a] border border-[#1a1a2e] rounded-2xl overflow-hidden
        flex flex-col shadow-xl shadow-black/40 animate-deal-in"
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-[#1a1a2e] h-52 sm:h-56 shrink-0">
        <img src={card.image} alt={card.name} className="w-full h-full object-cover" draggable={false} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#12121a] via-transparent to-transparent" />
        <span className="absolute top-2 left-2 text-[10px] bg-purple-600/70 text-white
          px-1.5 py-0.5 rounded-full backdrop-blur-sm uppercase tracking-wide">
          {card.category}
        </span>
      </div>

      {/* Name + hint */}
      <div className="px-3 pt-2.5 pb-1.5">
        <h3 className="text-sm font-bold text-white truncate leading-tight">{card.name}</h3>
        {interactive && !selectedStat && (
          <p className="text-[10px] text-purple-400/60 mt-0.5">Tap a stat to battle</p>
        )}
      </div>

      {/* Stats — left 3 / right 3 */}
      <div className="px-2 pb-3 flex gap-1.5">
        <div className="flex-1 flex flex-col gap-1">
          {LEFT_STATS.map(renderStatBtn)}
        </div>
        <div className="flex-1 flex flex-col gap-1">
          {RIGHT_STATS.map(renderStatBtn)}
        </div>
      </div>
    </div>
  );
}

// ── Card back ──────────────────────────────────────────────────────────────────
export function CardBack({ size = 'normal' }) {
  const isCompact = size === 'compact';
  const imgH  = isCompact ? 'h-36' : 'h-52 sm:h-56';
  const cardW = isCompact ? 'w-32 sm:w-36' : 'w-52 sm:w-60';
  return (
    <div className={`${cardW} bg-[#12121a] border border-purple-900/40 rounded-2xl overflow-hidden
      flex flex-col shadow-xl shadow-black/40 animate-deal-in`}>
      <div className={`${imgH} bg-gradient-to-br from-[#1a0a2e] to-[#12121a] flex items-center justify-center shrink-0`}>
        <div className="text-center opacity-40">
          <div className="text-5xl mb-2">🃏</div>
          <div className="w-16 h-0.5 bg-purple-800/50 rounded mx-auto" />
        </div>
      </div>
      <div className="px-3 pt-2.5 pb-3 space-y-1.5 flex-1">
        <div className="h-2.5 bg-[#1a1a2e] rounded w-3/4 mb-3" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-1.5">
            <div className="h-7 bg-[#1a1a2e] rounded-xl flex-1" />
            <div className="h-7 bg-[#1a1a2e] rounded-xl flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function CardSkeleton({ size }) {
  const isCompact = size === 'compact';
  const imgH  = isCompact ? 'h-36' : 'h-52 sm:h-56';
  const cardW = isCompact ? 'w-32 sm:w-36' : 'w-52 sm:w-60';
  return (
    <div className={`${cardW} bg-[#12121a] border border-[#1a1a2e] rounded-2xl overflow-hidden animate-pulse`}>
      <div className={`${imgH} bg-[#1a1a2e]`} />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-[#1a1a2e] rounded w-3/4" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-2">
            <div className="h-7 bg-[#1a1a2e] rounded-xl flex-1" />
            <div className="h-7 bg-[#1a1a2e] rounded-xl flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
