export default function NumberStrip({ onPick, picked, disabled, timer }) {
  const urgent = timer <= 3 && picked == null;

  return (
    <div className="hc-numstrip">
      <div className="hc-timerbar">
        <div
          className="hc-timerbar-fill"
          style={{
            width: `${(timer / 7) * 100}%`,
            background: urgent
              ? 'linear-gradient(90deg,var(--red),#ff8c69)'
              : 'linear-gradient(90deg,var(--cyan),var(--purple-bright))',
            boxShadow: urgent ? '0 0 10px var(--red)' : '0 0 10px var(--cyan)',
          }}
        />
      </div>

      <div className="hc-numrow">
        {[1, 2, 3, 4, 5, 6].map((n) => {
          const isSel = picked === n;
          const isDis = disabled || picked != null;
          return (
            <button
              key={n}
              disabled={isDis}
              className={`hc-numbtn ${isSel ? 'sel' : ''} ${isDis && !isSel ? 'dim' : ''}`}
              onClick={() => !isDis && onPick?.(n)}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
