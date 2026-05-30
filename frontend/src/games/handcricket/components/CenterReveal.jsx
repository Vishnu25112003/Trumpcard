const NUM_WORDS = {
  1: 'ONE', 2: 'TWO', 3: 'THREE',
  4: 'FOUR', 5: 'FIVE', 6: 'SIX',
};

export default function CenterReveal({ kind, runs, text }) {
  if (kind === 'out') {
    return (
      <div className="hc-center-pop">
        <div className="hc-shock" />
        <div className="hc-big-out">OUT!</div>
      </div>
    );
  }

  if (kind === 'runs') {
    return (
      <div className="hc-center-pop">
        <div className="hc-big-num">{runs}</div>
        <div className="hc-big-word">
          {NUM_WORDS[runs] ? `${NUM_WORDS[runs]} !!!` : `+${runs}`}
        </div>
      </div>
    );
  }

  if (kind === 'miss') {
    return (
      <div className="hc-center-pop">
        <div className="hc-big-word" style={{ color: 'var(--text-soft)' }}>{text}</div>
      </div>
    );
  }

  if (kind === 'status') {
    return <div className="hc-center-status">{text}</div>;
  }

  return null;
}
