// Traffic-signal start: red (3) -> red+amber (2) -> amber (1) -> green (GO).
export default function Countdown({ seconds }) {
  const go = seconds <= 0;
  const red = seconds >= 3;
  const amber = seconds === 2 || seconds === 1;
  const redAmber = seconds === 2;
  return (
    <div className="bt-race-overlay">
      <div className="bt-trafficlight">
        <span className={`tl tl-red${red || redAmber ? ' on' : ''}`} />
        <span className={`tl tl-amber${amber ? ' on' : ''}`} />
        <span className={`tl tl-green${go ? ' on' : ''}`} />
      </div>
      <div className={`bt-count-num${go ? ' go' : ''}`} key={seconds}>{go ? 'GO!' : seconds}</div>
    </div>
  );
}
