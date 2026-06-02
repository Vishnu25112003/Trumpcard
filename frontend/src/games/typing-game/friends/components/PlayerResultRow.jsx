import { formatTime } from '../../shared/utils/typingMath';

export default function PlayerResultRow({ result, isMe }) {
  const time = result.dnf ? 'DNF' : formatTime(result.finishMs);
  return (
    <div className={`tg-result-row${isMe ? ' me' : ''}`}>
      <div className="rank">#{result.rank}</div>
      <div className="name">{isMe ? '★ ' : ''}{result.name}</div>
      <div className="stat">{result.wpm} wpm</div>
      <div className="stat">{result.accuracy}%</div>
      <div className={`stat${result.dnf ? ' dnf' : ''}`}>{time}</div>
    </div>
  );
}
