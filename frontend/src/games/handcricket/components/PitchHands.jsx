import { SideHand } from './HandSign';

export default function PitchHands({
  myValue,
  oppValue,
  myTone,
  oppTone,
  reveal,
  waitingMe,
  waitingOpp,
  center,
  myName = 'You',
  oppName = 'Opponent',
}) {
  return (
    <div className="hc-pitch">
      <div className="hc-hand-slot left">
        <SideHand
          value={myValue}
          side="left"
          tone={myTone}
          size={172}
          active={waitingMe && !reveal}
          reveal={reveal}
        />
        <div
          className="hc-hand-tag"
          style={{ color: myTone === 'gold' ? 'var(--gold)' : 'var(--purple-soft)' }}
        >
          {myName}
        </div>
      </div>

      <div className="hc-center">{center}</div>

      <div className="hc-hand-slot right">
        <SideHand
          value={oppValue}
          side="right"
          tone={oppTone}
          size={172}
          active={waitingOpp && !reveal}
          reveal={reveal}
        />
        <div
          className="hc-hand-tag"
          style={{ color: oppTone === 'gold' ? 'var(--gold)' : 'var(--purple-soft)' }}
        >
          {oppName}
        </div>
      </div>
    </div>
  );
}
