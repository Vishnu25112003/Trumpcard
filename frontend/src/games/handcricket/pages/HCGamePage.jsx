import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import '../../../styles/hc-ui.css';

import { SideHandDefs } from '../components/HandSign';
import Coin              from '../components/Coin';
import HCTopBar          from '../components/HCTopBar';
import ScorePanel        from '../components/ScorePanel';
import PitchHands        from '../components/PitchHands';
import CenterReveal      from '../components/CenterReveal';
import NumberStrip       from '../components/NumberStrip';
import InningsBreak      from '../components/InningsBreak';
import HCGameOver        from '../components/HCGameOver';

/* ---- constants ---- */
const MAX_BALLS   = 6;
const START_LIVES = 3;
const emptyScore  = () => ({ runs: 0, balls: 0, wickets: 0 });
const rnd         = () => 1 + Math.floor(Math.random() * 6);

/* ---- main page ---- */
export default function HCGamePage() {
  const navigate = useNavigate();

  const [phase,       setPhase]       = useState('toss');
  const [innings,     setInnings]     = useState(1);
  const [battingRole, setBattingRole] = useState('me');
  const [scores,      setScores]      = useState({ me: emptyScore(), cpu: emptyScore() });
  const [lives,       setLives]       = useState({ me: START_LIVES, cpu: START_LIVES });
  const [target,      setTarget]      = useState(null);
  const [myPick,      setMyPick]      = useState(null);
  const [timer,       setTimer]       = useState(7);
  const [reveal,      setReveal]      = useState(null);
  const [notif,       setNotif]       = useState(null);
  const [bannerMsg,   setBannerMsg]   = useState('');
  const [won,         setWon]         = useState(false);
  const [endReason,   setEndReason]   = useState('');

  const pending  = useRef(null);
  const timerRef = useRef(null);

  const isBatting = battingRole === 'me';
  const myName    = 'You';
  const cpuName   = 'Vishnu';

  const showNotif = useCallback((msg, color = 'var(--cyan)') => {
    setNotif({ msg, color });
    setTimeout(() => setNotif((n) => (n?.msg === msg ? null : n)), 3000);
  }, []);

  /* ---- countdown timer ---- */
  useEffect(() => {
    if (phase !== 'picking' || myPick != null) {
      clearInterval(timerRef.current);
      return;
    }
    setTimer(7);
    const end = Date.now() + 7000;
    timerRef.current = setInterval(() => {
      const r = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setTimer(r);
      if (r <= 0) { clearInterval(timerRef.current); resolveBall(rnd()); }
    }, 250);
    return () => clearInterval(timerRef.current);
  }, [phase, myPick, innings, battingRole]); // eslint-disable-line

  /* ---- auto-advance after reveal ---- */
  useEffect(() => {
    if (phase !== 'revealing') return;
    const t = setTimeout(advanceAfterReveal, 2400);
    return () => clearTimeout(t);
  }, [phase]); // eslint-disable-line

  /* ---- game helpers ---- */
  function startInnings(role, inns, tgt) {
    setBattingRole(role);
    setInnings(inns);
    setTarget(tgt);
    setMyPick(null);
    setReveal(null);
    setBannerMsg(`Innings ${inns} — ${role === 'me' ? 'You' : cpuName} bats`);
    setPhase('innings-start');
    setTimeout(() => setPhase('picking'), 1900);
  }

  function onTossChoose(choice) {
    const role = choice === 'bat' ? 'me' : 'cpu';
    setScores({ me: emptyScore(), cpu: emptyScore() });
    setLives({ me: START_LIVES, cpu: START_LIVES });
    startInnings(role, 1, null);
  }

  function resolveBall(myVal) {
    clearInterval(timerRef.current);
    const cpuVal   = rnd();
    const batRole  = battingRole;
    const bowlRole = batRole === 'me' ? 'cpu' : 'me';
    const batPick  = batRole === 'me' ? myVal : cpuVal;
    const bowlPick = batRole === 'me' ? cpuVal : myVal;
    const isWicket = batPick === bowlPick;
    const runs     = isWicket ? 0 : batPick;

    const newScores = { me: { ...scores.me }, cpu: { ...scores.cpu } };
    newScores[batRole].balls += 1;
    if (isWicket) newScores[batRole].wickets += 1;
    else          newScores[batRole].runs    += runs;

    const newLives = { ...lives };
    if (isWicket) {
      newLives[batRole] = Math.max(0, newLives[batRole] - 1);
      const who = batRole === 'me' ? 'You' : cpuName;
      showNotif(`${who} lost a life (${newLives[batRole]} left)`, 'var(--red)');
    }

    setScores(newScores);
    setLives(newLives);
    setReveal({
      myThrow: myVal, oppThrow: cpuVal,
      batPick, bowlPick, runs, isWicket, batRole,
      batsmanName: batRole === 'me' ? 'You' : cpuName,
      bowlerName:  bowlRole === 'me' ? 'You' : cpuName,
    });

    const inningsOver = newLives[batRole] <= 0 || newScores[batRole].balls >= MAX_BALLS;
    const chaseDone   = innings === 2 && target != null && newScores[batRole].runs >= target;
    pending.current = { inningsOver, chaseDone, newScores, batRole };
    setPhase('revealing');
  }

  function advanceAfterReveal() {
    const p = pending.current;
    if (!p) { setPhase('picking'); return; }
    const { inningsOver, chaseDone, newScores, batRole } = p;

    if (innings === 2 && (chaseDone || inningsOver)) {
      const meWin =
        newScores.me.runs > newScores.cpu.runs  ? true  :
        newScores.me.runs < newScores.cpu.runs  ? false :
        battingRole === 'me';
      setWon(meWin);
      setEndReason(chaseDone ? '🎯 Target Crossed' : '✅ Match Complete');
      setPhase('ended');
      return;
    }

    if (innings === 1 && inningsOver) {
      setTarget(newScores[batRole].runs + 1);
      setPhase('break');
      return;
    }

    setMyPick(null);
    setReveal(null);
    setPhase('picking');
  }

  function onPick(n) {
    if (myPick != null || phase !== 'picking') return;
    setMyPick(n);
    setTimeout(() => resolveBall(n), 420);
  }

  function startInnings2() {
    const newBat = battingRole === 'me' ? 'cpu' : 'me';
    startInnings(newBat, 2, target);
  }

  function restart() {
    setScores({ me: emptyScore(), cpu: emptyScore() });
    setLives({ me: START_LIVES, cpu: START_LIVES });
    setTarget(null); setMyPick(null); setReveal(null);
    setInnings(1); setBattingRole('me');
    setPhase('toss');
  }

  /* ---- derived values ---- */
  const modeLabel = `${MAX_BALLS}b · ${START_LIVES}W`;
  const needMore  = target != null
    ? Math.max(0, target - (isBatting ? scores.me.runs : scores.cpu.runs))
    : null;
  const myTone  = isBatting ? 'gold'   : 'purple';
  const oppTone = isBatting ? 'purple' : 'gold';

  /* ---- render ---- */
  return (
    <>
      <div className="table-bg" />
      <SideHandDefs />

      {/* floating notification */}
      {notif && (
        <div
          style={{
            position: 'fixed', top: 78, left: '50%',
            transform: 'translateX(-50%)', zIndex: 99,
            padding: '10px 22px',
            background: 'var(--surface-strong)',
            border: `1px solid ${notif.color}`,
            borderRadius: 12, color: notif.color,
            fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600,
            letterSpacing: '0.08em',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            animation: 'hcFadeUp 0.25s ease',
          }}
        >
          {notif.msg}
        </div>
      )}

      <HCTopBar
        modeLabel={modeLabel}
        phaseRole={
          ['picking', 'revealing'].includes(phase)
            ? isBatting ? 'bat' : 'bowl'
            : null
        }
        onLeave={() => navigate('/')}
      />

      <div
        style={{
          position: 'relative', zIndex: 10, height: '100%',
          display: 'flex', flexDirection: 'column',
          paddingTop: 76, paddingBottom: 16, overflowY: 'auto',
        }}
      >
        {/* TOSS */}
        {phase === 'toss' && (
          <Center>
            <div style={{
              fontSize: 11, letterSpacing: '0.26em',
              color: 'var(--cyan)', textTransform: 'uppercase',
              marginBottom: 4, fontWeight: 600,
            }}>
              Coin Toss
            </div>
            <Coin winnerName="You" isChooser onChoose={onTossChoose} />
          </Center>
        )}

        {/* INNINGS START BANNER */}
        {phase === 'innings-start' && (
          <Center>
            <div style={{
              fontFamily: 'var(--font-brand)',
              fontSize: 'clamp(22px,6vw,38px)',
              background: 'linear-gradient(180deg,var(--gold-bright),var(--gold-deep))',
              WebkitBackgroundClip: 'text', backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textAlign: 'center', animation: 'hcBannerIn 0.4s ease',
            }}>
              {bannerMsg}
            </div>
          </Center>
        )}

        {/* PICKING / REVEALING */}
        {['picking', 'revealing'].includes(phase) && (
          <div style={{
            display: 'flex', flexDirection: 'column',
            gap: 12, padding: '4px 12px 0', flex: 1, minHeight: 0,
          }}>
            {/* score panels */}
            <div style={{
              display: 'flex', gap: 12,
              justifyContent: 'center', alignItems: 'flex-start', flexWrap: 'wrap',
            }}>
              <ScorePanel
                name={myName} score={scores.me} lives={lives.me}
                isBatting={isBatting} isMe accent="var(--purple-bright)"
                flash={phase === 'revealing' && reveal?.isWicket && reveal?.batRole === 'me'}
              />

              {target != null && (
                <div style={{
                  alignSelf: 'center', padding: '8px 18px', borderRadius: 99,
                  background: 'rgba(94,236,255,0.1)',
                  border: '1px solid rgba(94,236,255,0.3)',
                  fontSize: 12, color: 'var(--cyan)',
                  fontFamily: 'var(--font-mono)', textAlign: 'center',
                }}>
                  Target {target}<br />Need {needMore}
                </div>
              )}

              <ScorePanel
                name={cpuName} score={scores.cpu} lives={lives.cpu}
                isBatting={!isBatting} isMe={false} accent="var(--pink)"
                flash={phase === 'revealing' && reveal?.isWicket && reveal?.batRole === 'cpu'}
              />
            </div>

            {/* pitch */}
            <PitchHands
              myValue={phase === 'revealing' && reveal ? reveal.myThrow : (myPick || 0)}
              oppValue={phase === 'revealing' && reveal ? reveal.oppThrow : 0}
              myTone={myTone} oppTone={oppTone}
              reveal={phase === 'revealing'}
              waitingMe={phase === 'picking' && myPick == null}
              waitingOpp={phase === 'picking'}
              center={
                phase === 'revealing' && reveal
                  ? <CenterReveal kind={reveal.isWicket ? 'out' : 'runs'} runs={reveal.runs} />
                  : <CenterReveal
                      kind="status"
                      text={myPick != null
                        ? 'Waiting for opponent…'
                        : isBatting ? 'You are batting' : 'You are bowling'}
                    />
              }
            />

            {/* number strip */}
            <div style={{ paddingBottom: 8 }}>
              <NumberStrip
                onPick={onPick}
                picked={myPick}
                timer={timer}
                disabled={phase === 'revealing'}
              />
            </div>
          </div>
        )}

        {/* INNINGS BREAK */}
        {phase === 'break' && (
          <InningsBreak
            target={target}
            myRuns={scores.me.runs}
            oppRuns={scores.cpu.runs}
            myBalls={scores.me.balls}
            oppBalls={scores.cpu.balls}
            chasing={battingRole !== 'me'}
            onContinue={startInnings2}
          />
        )}

        {/* GAME OVER */}
        {phase === 'ended' && (
          <HCGameOver
            won={won}
            myName={myName}
            oppName={cpuName}
            myScore={scores.me}
            oppScore={scores.cpu}
            reason={endReason}
            onRematch={restart}
            onExit={() => navigate('/')}
          />
        )}
      </div>
    </>
  );
}

function Center({ children }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 20, padding: '20px 24px', textAlign: 'center',
    }}>
      {children}
    </div>
  );
}
