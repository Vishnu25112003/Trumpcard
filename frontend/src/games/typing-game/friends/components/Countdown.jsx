export default function Countdown({ seconds }) {
  const label = seconds <= 0 ? 'GO!' : seconds;
  return (
    <div className="tg-overlay">
      <div className="tg-countdown" key={seconds}>{label}</div>
    </div>
  );
}
