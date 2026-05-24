import LivesIndicator from './LivesIndicator';

export default function PlayerInfo({ players, currentPlayer, myName }) {
  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      {players.map((p) => {
        const isMe      = p.name === myName;
        const isCurrent = p.name === currentPlayer && !p.isEliminated;
        const isElim    = p.isEliminated;

        return (
          <div
            key={p.name}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all
              ${isElim
                ? 'bg-[#12121a]/50 border-[#1a1a2e] opacity-40'
                : isCurrent
                  ? 'bg-purple-900/30 border-purple-600/60 shadow-md shadow-purple-900/20'
                  : 'bg-[#12121a] border-[#1a1a2e]'
              }`}
          >
            {/* Avatar */}
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
              ${isElim ? 'bg-gray-800 text-gray-600' : 'bg-purple-600/30 border border-purple-600/50 text-purple-300'}`}
            >
              {isElim ? '✕' : p.name[0].toUpperCase()}
            </div>

            {/* Info */}
            <div className="min-w-0">
              <p className={`text-xs font-medium truncate max-w-[80px]
                ${isElim ? 'text-gray-600 line-through' : isCurrent ? 'text-white' : 'text-gray-300'}`}
              >
                {p.name}{isMe && <span className="text-purple-400 ml-1">(you)</span>}
              </p>
              {!isElim && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-500">{p.cardCount}🃏</span>
                  <LivesIndicator lives={p.lives} max={3} size="sm" />
                </div>
              )}
            </div>

            {/* Active turn pulse */}
            {isCurrent && (
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}
