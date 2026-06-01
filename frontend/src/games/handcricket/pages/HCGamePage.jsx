import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import '../../../styles/hc-ui.css';

import { usePlayer } from '../../../shared/context/PlayerContext';
import { getSocket } from '../../../shared/socket/socket';
import { useHC } from '../context/HCContext';
import { SideHandDefs } from '../components/HandSign';
import Coin from '../components/Coin';
import HCTopBar from '../components/HCTopBar';
import ScorePanel from '../components/ScorePanel';
import PitchHands from '../components/PitchHands';
import CenterReveal from '../components/CenterReveal';
import NumberStrip from '../components/NumberStrip';
import InningsBreak from '../components/InningsBreak';
import HCGameOver from '../components/HCGameOver';

const START_LIVES = 3;
const emptyScore = () => ({ runs: 0, balls: 0, wickets: 0 });
const emptyScores = () => ({ host: emptyScore(), guest: emptyScore() });
const opponentOf = (role) => (role === 'host' ? 'guest' : 'host');
const safeScore = (score) => score || emptyScore();

export default function HCGamePage() {
  const { code } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { playerName } = usePlayer();
  const {
    myRole: contextRole,
    roomSettings,
    hostName: contextHostName,
    guestName: contextGuestName,
    setHostName,
    setGuestName,
  } = useHC();

  const roomCode = code?.toUpperCase();
  const [myRole, setMyRole] = useState(contextRole);
  const [hostN, setHostN] = useState(contextHostName || location.state?.hostName || 'Host');
  const [guestN, setGuestN] = useState(contextGuestName || location.state?.guestName || 'Guest');
  const [settings, setSettings] = useState(location.state?.settings || roomSettings || null);

  const [phase, setPhase] = useState('toss');
  const [tossStage, setTossStage] = useState('waiting-call');
  const [toss, setToss] = useState({ caller: null, call: null, result: null, winner: null, choice: null });
  const [battingRole, setBattingRole] = useState(null);
  const [scores, setScores] = useState(emptyScores);
  const [lives, setLives] = useState({ host: START_LIVES, guest: START_LIVES });
  const [target, setTarget] = useState(null);
  const [myPick, setMyPick] = useState(null);
  const [timer, setTimer] = useState(7);
  const [deadline, setDeadline] = useState(null);
  const [reveal, setReveal] = useState(null);
  const [notif, setNotif] = useState(null);
  const [bannerMsg, setBannerMsg] = useState('');
  const [won, setWon] = useState(false);
  const [endReason, setEndReason] = useState('');
  const [breakReady, setBreakReady] = useState(false);

  const timerRef = useRef(null);
  const roleRef = useRef(myRole);
  useEffect(() => { roleRef.current = myRole; }, [myRole]);

  const opponentRole = myRole ? opponentOf(myRole) : null;
  const myName = myRole === 'host' ? hostN : myRole === 'guest' ? guestN : 'You';
  const oppName = opponentRole === 'host' ? hostN : opponentRole === 'guest' ? guestN : 'Opponent';
  const isBatting = battingRole === myRole;
  const myScore = safeScore(scores[myRole]) || emptyScore();
  const oppScore = safeScore(scores[opponentRole]) || emptyScore();
  const myLives = myRole ? lives[myRole] : START_LIVES;
  const oppLives = opponentRole ? lives[opponentRole] : START_LIVES;

  const showNotif = useCallback((msg, color = 'var(--cyan)') => {
    setNotif({ msg, color });
    setTimeout(() => setNotif((n) => (n?.msg === msg ? null : n)), 3000);
  }, []);

  useEffect(() => {
    if (!playerName || !roomCode) {
      navigate('/hand-cricket');
      return;
    }

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const resolveRole = ({ hostName, guestName }) => {
      if (contextRole) return contextRole;
      if (hostName === playerName) return 'host';
      if (guestName === playerName) return 'guest';
      return roleRef.current;
    };

    const applyNames = ({ hostName, guestName }) => {
      if (hostName) {
        setHostN(hostName);
        setHostName(hostName);
      }
      if (guestName) {
        setGuestN(guestName);
        setGuestName(guestName);
      }
    };

    const applyScores = (nextScores) => {
      if (nextScores) setScores({ host: safeScore(nextScores.host), guest: safeScore(nextScores.guest) });
    };

    const applyLives = (nextLives) => {
      if (nextLives) setLives(nextLives);
    };

    const onTossStart = ({ caller }) => {
      setPhase('toss');
      setTossStage('waiting-call');
      setToss({ caller, call: null, result: null, winner: null, choice: null });
      setBattingRole(null);
      setTarget(null);
      setMyPick(null);
      setReveal(null);
      setBreakReady(false);
    };

    const onTossResult = (payload) => {
      setToss(payload);
      setTossStage('spinning');
      setTimeout(() => setTossStage('winner-choice'), 2300);
    };

    const onInningsStart = ({ innings: inns, battingRole: bat, target: tgt, settings: nextSettings }) => {
      if (nextSettings) setSettings(nextSettings);
      setBattingRole(bat);
      setTarget(tgt ?? null);
      setMyPick(null);
      setReveal(null);
      setBreakReady(false);
      const batterName = bat === 'host' ? hostN : guestN;
      setBannerMsg(`Innings ${inns} - ${batterName} bats`);
      setPhase('innings-start');
    };

    const onBallStart = ({ deadline: nextDeadline, battingRole: bat, scores: nextScores, lives: nextLives }) => {
      if (bat) {
        setBattingRole(bat);
      }
      applyScores(nextScores);
      applyLives(nextLives);
      setDeadline(nextDeadline);
      setMyPick(null);
      setReveal(null);
      setPhase('picking');
    };

    const onPickAck = ({ pick }) => {
      setMyPick(pick);
    };

    const onBallReveal = (payload) => {
      const currentRole = roleRef.current;
      const currentOpponent = opponentOf(currentRole);
      applyScores(payload.scores);
      applyLives(payload.lives);
      setBattingRole(payload.batsmanRole);
      setReveal({
        myThrow: payload[`${currentRole === payload.batsmanRole ? 'batsman' : 'bowler'}Pick`] || 0,
        oppThrow: payload[`${currentOpponent === payload.batsmanRole ? 'batsman' : 'bowler'}Pick`] || 0,
        batPick: payload.batsmanPick,
        bowlPick: payload.bowlerPick,
        runs: payload.runs,
        isWicket: payload.isWicket,
        notes: payload.notes,
        batRole: payload.batsmanRole,
        batsmanName: payload.batsmanRole === 'host' ? hostN : guestN,
        bowlerName: payload.bowlerRole === 'host' ? hostN : guestN,
      });
      setPhase('revealing');
    };

    const onLifeLost = ({ player, livesLeft }) => {
      const who = player === roleRef.current ? 'You' : 'Opponent';
      showNotif(`${who} lost a life (${livesLeft} left)`, 'var(--red)');
    };

    const onBreakStart = ({ target: nextTarget, scores: nextScores }) => {
      applyScores(nextScores);
      setTarget(nextTarget);
      setBreakReady(false);
      setPhase('break');
    };

    const onSuperOverStart = ({ battingRole: bat, target: nextTarget }) => {
      setBattingRole(bat);
      setTarget(nextTarget ?? null);
      setBannerMsg(`Super Over - ${roleName(bat, hostN, guestN)} bats`);
      setPhase('innings-start');
    };

    const onMatchEnd = ({ winner, finalScores, reason }) => {
      applyScores(finalScores);
      setWon(winner === roleRef.current);
      setEndReason(reasonText(reason));
      setPhase('ended');
    };

    const onStateSync = (state) => {
      applyNames(state);
      const resolvedRole = resolveRole(state);
      if (resolvedRole) {
        setMyRole(resolvedRole);
        roleRef.current = resolvedRole;
      }
      if (state.settings) setSettings(state.settings);
      applyScores(state.scores);
      applyLives(state.lives);
      setTarget(state.target ?? null);
      setBattingRole(state.battingRole);
      setToss(state.toss || { caller: null, call: null, result: null, winner: null, choice: null });

      if (state.phase === 'toss') {
        setPhase('toss');
        setTossStage(state.toss?.winner ? 'winner-choice' : 'waiting-call');
      } else if (state.phase === 'break') {
        setPhase('break');
      } else if (state.phase === 'ended') {
        setWon(state.winner === resolvedRole);
        setEndReason(reasonText(state.endReason));
        setPhase('ended');
      } else if (['innings1', 'innings2', 'superOver'].includes(state.phase)) {
        const syncedInnings = state.currentInnings || (state.phase === 'innings2' ? 2 : state.phase === 'superOver' ? 3 : 1);
        if (state.currentBall?.deadline && new Date(state.currentBall.deadline).getTime() > Date.now()) {
          setDeadline(state.currentBall.deadline);
          setPhase('picking');
        } else {
          setBannerMsg(`${syncedInnings === 3 ? 'Super Over' : `Innings ${syncedInnings}`} - ${roleName(state.battingRole, state.hostName, state.guestName)} bats`);
          setPhase('innings-start');
        }
      }
    };

    const onRematchReady = ({ hostName, guestName, settings: nextSettings }) => {
      applyNames({ hostName, guestName });
      setSettings(nextSettings);
      setScores(emptyScores());
      setLives({ host: START_LIVES, guest: START_LIVES });
      setTarget(null);
      setWon(false);
      setEndReason('');
      setPhase('toss');
      setTossStage('waiting-call');
    };

    const onError = (msg) => showNotif(msg, 'var(--red)');

    socket.on('hc:toss:start', onTossStart);
    socket.on('hc:toss:result', onTossResult);
    socket.on('hc:innings:start', onInningsStart);
    socket.on('hc:ball:start', onBallStart);
    socket.on('hc:pick:ack', onPickAck);
    socket.on('hc:ball:reveal', onBallReveal);
    socket.on('hc:life:lost', onLifeLost);
    socket.on('hc:break:start', onBreakStart);
    socket.on('hc:superOver:start', onSuperOverStart);
    socket.on('hc:superOver:switch', onSuperOverStart);
    socket.on('hc:match:end', onMatchEnd);
    socket.on('hc:state:sync', onStateSync);
    socket.on('hc:rematch:ready', onRematchReady);
    socket.on('hc:error', onError);

    socket.emit('hc:room:rejoin', { roomCode, playerName });

    return () => {
      socket.off('hc:toss:start', onTossStart);
      socket.off('hc:toss:result', onTossResult);
      socket.off('hc:innings:start', onInningsStart);
      socket.off('hc:ball:start', onBallStart);
      socket.off('hc:pick:ack', onPickAck);
      socket.off('hc:ball:reveal', onBallReveal);
      socket.off('hc:life:lost', onLifeLost);
      socket.off('hc:break:start', onBreakStart);
      socket.off('hc:superOver:start', onSuperOverStart);
      socket.off('hc:superOver:switch', onSuperOverStart);
      socket.off('hc:match:end', onMatchEnd);
      socket.off('hc:state:sync', onStateSync);
      socket.off('hc:rematch:ready', onRematchReady);
      socket.off('hc:error', onError);
    };
  }, [contextRole, guestN, hostN, navigate, playerName, roomCode, setGuestName, setHostName, showNotif]);

  useEffect(() => {
    if (phase !== 'picking' || !deadline || myPick != null) {
      clearInterval(timerRef.current);
      return;
    }

    const end = new Date(deadline).getTime();
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setTimer(remaining);
      if (remaining <= 0) clearInterval(timerRef.current);
    };

    tick();
    timerRef.current = setInterval(tick, 250);
    return () => clearInterval(timerRef.current);
  }, [deadline, myPick, phase]);

  function callToss(call) {
    if (toss.caller !== myRole || toss.call) return;
    getSocket().emit('hc:toss:call', { roomCode, role: myRole, call });
  }

  function chooseBatBowl(choice) {
    if (toss.winner !== myRole || toss.choice) return;
    setToss((prev) => ({ ...prev, choice }));
    getSocket().emit('hc:toss:choose', { roomCode, role: myRole, choice });
  }

  function onPick(n) {
    if (myPick != null || phase !== 'picking' || !myRole) return;
    setMyPick(n);
    getSocket().emit('hc:ball:pick', { roomCode, role: myRole, pick: n });
  }

  function continueBreak() {
    if (breakReady) return;
    setBreakReady(true);
    getSocket().emit('hc:break:continue', { roomCode });
  }

  function rematch() {
    getSocket().emit('hc:rematch:request', { roomCode });
  }

  function leaveGame() {
    if (myRole && phase !== 'ended') getSocket().emit('hc:room:leave', { roomCode, role: myRole });
    navigate('/');
  }

  const maxBalls = (settings?.overs || 1) * 6;
  const wickets = settings?.wickets || START_LIVES;
  const modeLabel = `${maxBalls}b · ${wickets}W`;
  const chaseTarget = target == null ? null : target + 1;
  const currentBatScore = battingRole ? scores[battingRole]?.runs || 0 : 0;
  const needMore = chaseTarget != null ? Math.max(0, chaseTarget - currentBatScore) : null;
  const myTone = isBatting ? 'gold' : 'purple';
  const oppTone = isBatting ? 'purple' : 'gold';

  return (
    <>
      <div className="table-bg" />
      <SideHandDefs />

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
        phaseRole={['picking', 'revealing'].includes(phase) ? (isBatting ? 'bat' : 'bowl') : null}
        onLeave={leaveGame}
      />

      <div
        style={{
          position: 'relative', zIndex: 10, height: '100%',
          display: 'flex', flexDirection: 'column',
          paddingTop: 76, paddingBottom: 16, overflowY: 'auto',
        }}
      >
        {phase === 'toss' && (
          <TossScreen
            toss={toss}
            stage={tossStage}
            myRole={myRole}
            hostName={hostN}
            guestName={guestN}
            onCall={callToss}
            onChoose={chooseBatBowl}
          />
        )}

        {phase === 'innings-start' && (
          <Center>
            <div
              style={{
                fontFamily: 'var(--font-brand)',
                fontSize: 'clamp(22px,6vw,38px)',
                background: 'linear-gradient(180deg,var(--gold-bright),var(--gold-deep))',
                WebkitBackgroundClip: 'text', backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textAlign: 'center', animation: 'hcBannerIn 0.4s ease',
              }}
            >
              {bannerMsg || `${roleName(battingRole, hostN, guestN)} bats`}
            </div>
          </Center>
        )}

        {['picking', 'revealing'].includes(phase) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '4px 12px 0', flex: 1, minHeight: 0 }}>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <ScorePanel
                name={myName} score={myScore} lives={myLives}
                isBatting={isBatting} isMe accent="var(--purple-bright)"
                flash={phase === 'revealing' && reveal?.isWicket && reveal?.batRole === myRole}
              />

              {chaseTarget != null && (
                <div
                  style={{
                    alignSelf: 'center', padding: '8px 18px', borderRadius: 99,
                    background: 'rgba(94,236,255,0.1)',
                    border: '1px solid rgba(94,236,255,0.3)',
                    fontSize: 12, color: 'var(--cyan)',
                    fontFamily: 'var(--font-mono)', textAlign: 'center',
                  }}
                >
                  Target {chaseTarget}<br />Need {needMore}
                </div>
              )}

              <ScorePanel
                name={oppName} score={oppScore} lives={oppLives}
                isBatting={!isBatting} isMe={false} accent="var(--pink)"
                flash={phase === 'revealing' && reveal?.isWicket && reveal?.batRole === opponentRole}
              />
            </div>

            <PitchHands
              myValue={phase === 'revealing' && reveal ? reveal.myThrow : (myPick || 0)}
              oppValue={phase === 'revealing' && reveal ? reveal.oppThrow : 0}
              myTone={myTone} oppTone={oppTone}
              reveal={phase === 'revealing'}
              waitingMe={phase === 'picking' && myPick == null}
              waitingOpp={phase === 'picking'}
              myName={myName}
              oppName={oppName}
              center={
                phase === 'revealing' && reveal
                  ? <CenterReveal kind={reveal.isWicket ? 'out' : 'runs'} runs={reveal.runs} />
                  : <CenterReveal kind="status" text={myPick != null ? 'Waiting for opponent...' : isBatting ? 'You are batting' : 'You are bowling'} />
              }
            />

            <div style={{ paddingBottom: 8 }}>
              <NumberStrip onPick={onPick} picked={myPick} timer={timer} disabled={phase === 'revealing'} />
            </div>
          </div>
        )}

        {phase === 'break' && (
          <InningsBreak
            target={chaseTarget}
            myRuns={myScore.runs}
            oppRuns={oppScore.runs}
            myBalls={myScore.balls}
            oppBalls={oppScore.balls}
            chasing={battingRole !== myRole}
            onContinue={continueBreak}
          />
        )}

        {phase === 'ended' && (
          <HCGameOver
            won={won}
            myName={myName}
            oppName={oppName}
            myScore={myScore}
            oppScore={oppScore}
            reason={endReason}
            onRematch={rematch}
            onExit={leaveGame}
          />
        )}
      </div>
    </>
  );
}

function TossScreen({ toss, stage, myRole, hostName, guestName, onCall, onChoose }) {
  const callerName = roleName(toss.caller, hostName, guestName);
  const winnerName = roleName(toss.winner, hostName, guestName);
  const canCall = toss.caller === myRole && !toss.call;
  const canChoose = toss.winner === myRole && !toss.choice && stage === 'winner-choice';

  return (
    <Center>
      <div style={{ fontSize: 11, letterSpacing: '0.26em', color: 'var(--cyan)', textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>
        Coin Toss
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <PlayerPill label="Host" name={hostName} active={toss.caller === 'host'} />
        <PlayerPill label="Guest" name={guestName} active={toss.caller === 'guest'} />
      </div>

      {!toss.call && (
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <div style={{ fontFamily: 'var(--font-brand)', fontSize: 'clamp(20px,5vw,30px)', color: 'var(--gold)' }}>
            {callerName} calls the toss
          </div>
          {canCall ? (
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
              <button className="btn btn-gold" style={{ fontSize: 13, padding: '13px 28px' }} onClick={() => onCall('heads')}>
                Heads
              </button>
              <button className="btn btn-ghost" style={{ fontSize: 13, padding: '13px 28px' }} onClick={() => onCall('tails')}>
                Tails
              </button>
            </div>
          ) : (
            <p style={{ color: 'var(--text-soft)', fontSize: 14, marginTop: 14 }}>
              Waiting for {callerName} to choose heads or tails...
            </p>
          )}
        </div>
      )}

      {toss.call && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--text-soft)', fontSize: 13, marginBottom: 10 }}>
            {callerName} chose <span style={{ color: 'var(--gold)', textTransform: 'capitalize' }}>{toss.call}</span>
          </div>
          <Coin
            key={`${toss.caller}-${toss.call}-${toss.result}`}
            winnerName={winnerName}
            isChooser={canChoose}
            onChoose={onChoose}
            forcedFace={toss.result}
            autoLaunchKey={`${toss.call}-${toss.result}`}
            interactive={false}
          />
        </div>
      )}
    </Center>
  );
}

function PlayerPill({ label, name, active }) {
  return (
    <div
      style={{
        minWidth: 140,
        padding: '10px 14px',
        borderRadius: 12,
        border: `1px solid ${active ? 'var(--gold)' : 'rgba(255,255,255,0.12)'}`,
        background: active ? 'rgba(240,199,80,0.12)' : 'rgba(255,255,255,0.05)',
      }}
    >
      <div style={{ fontSize: 10, letterSpacing: '0.18em', color: active ? 'var(--gold)' : 'var(--text-dim)', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', color: 'var(--text)', fontWeight: 700 }}>
        {name}
      </div>
    </div>
  );
}

function Center({ children }) {
  return (
    <div
      style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 20, padding: '20px 24px', textAlign: 'center',
      }}
    >
      {children}
    </div>
  );
}

function roleName(role, hostName, guestName) {
  if (role === 'host') return hostName || 'Host';
  if (role === 'guest') return guestName || 'Guest';
  return 'Player';
}

function reasonText(reason) {
  const labels = {
    normal: 'Match Complete',
    superOver: 'Super Over',
    'target-crossed': 'Target Crossed',
    livesOut: 'Lives Out',
    forfeit: 'Forfeit',
    disconnect: 'Disconnected',
  };
  return labels[reason] || reason || 'Match Complete';
}
