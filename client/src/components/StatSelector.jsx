import { STAT_ORDER, STAT_META } from '../utils/constants';

export default function StatSelector({ onSelect, disabled, selectedStat = null }) {
  return (
    <div className="w-full animate-slide-up">
      <p className="text-gray-500 text-[11px] text-center mb-3 uppercase tracking-widest">
        Choose a stat to battle
      </p>
      <div className="grid grid-cols-3 gap-2">
        {STAT_ORDER.map((stat) => {
          const meta       = STAT_META[stat];
          const isSelected = stat === selectedStat;
          const isPending  = selectedStat && !isSelected;
          return (
            <button
              key={stat}
              onClick={() => !disabled && !selectedStat && onSelect(stat)}
              disabled={disabled || !!selectedStat}
              className={`relative flex flex-col items-center gap-1 py-3 px-1.5 rounded-xl border
                font-medium transition-all duration-150 select-none
                ${disabled || isPending
                  ? 'opacity-30 cursor-not-allowed'
                  : isSelected
                    ? `${meta.bg} border-transparent text-white shadow-lg scale-105`
                    : `bg-[#12121a] border-[#2a2a3e] ${meta.color}
                       hover:border-gray-500 hover:scale-105 hover:bg-[#1a1a2e]
                       active:scale-95 cursor-pointer`
                }`}
            >
              <span className="text-lg leading-none">{meta.icon}</span>
              <span className="text-[11px] sm:text-xs text-center leading-tight">{meta.label}</span>
              {isSelected && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white rounded-full
                  flex items-center justify-center text-[9px] text-purple-700 font-black animate-pop-in">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
