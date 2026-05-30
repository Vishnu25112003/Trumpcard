import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { usePlayer } from '../../../shared/context/PlayerContext';
import { useHC } from '../context/HCContext';
import { getSocket } from '../../../shared/socket/socket';
import SparkleLayer from '../../../shared/components/SparkleLayer';
import Particles from '../../../shared/components/Particles';
import CoinFlip from '../components/CoinFlip';
import HandPicker from '../components/HandPicker';
import InningsBreak from '../components/InningsBreak';
import { BallReveal, ScorePanel } from '../components/CricketScoreboard';

const EMPTY_SCORE = { runs: 0, balls: 0, wickets: 0 };

export default function HCGamePage() {
  const { code }       = useParams();
  const location       = useLocation();
  const navigate       = useNavigate();
  const { playerName } = usePlayer();
  const { myRole, hostName: ctxHost, guestName: ctxGuest } = useHC();

  // names from navigation state or context
  const navState  = location.state || {};
  const hostName  = navState.hostName  || ctxHost  || 'Host';
  const guestName = navState.guestName || ctxGuest || 'Guest';
  const myName    = myRole === 'host' ? hostName : guestName;
  const oppName   = myRole === 'host' ? guestName : hostName;

  // ── Game state ──────────────────────────────────────────────────────────────
  const [uiPhase,   setUiPhase]   = useState('connecting'); // connecting | toss | picking | revealing | break | super-over | ended
  const [toss,      setToss]      = useState({ winner: null, winnerName: '', choice: null });
  const [innings,   setInnings]   = useState(1);
  const [battingRole, setBattingRole] = useState(null);
  const [scores,    setScores]    = useState({ host: { ...EMPTY_SCORE }, guest: { ...EMPTY_SCORE } });
  const [lives,     setLives]     = useState({ host: 3, guest: 3 });
  const [target,    setTarget]    = useState(null);
  const [myPick,    setMyPick]    = useState(null);
  const [timer,     setTimer]     = useState(7);
  const [reveal,    setReveal]    = useState(null);
  const [breakData, setBreakData] = useState(null);
  const [breakWaiting, setBreakWaiting] = useState(false);
  const [inningsMsg, setInningsMsg] = useState('');
  const [winner,    setWinner]    = useState(null);
  const [endData,   setEndData]   = useState(null);
  const [notification, setNotif] = useState(null);
  const [settings,  setSettings] = useState(navState.settings || {});

  const timerRef  = useRef(null);
  const didRejoin = useRef(false);

  const myScore  = scores[myRole]  || EMPTY_SCORE;
  const oppScore = scores[myRole === 'host' ? 'guest' : 'host'] || EMPTY_SCORE;
  const myLives  = lives[myRole]  ?? 3;
  const oppLives = lives[myRole === 'host' ? 'guest' : 'host'] ?? 3;
  const isBatting = battingRole === myRole;

  // ── Timer ───────────────────────────────────────────────────────────────────
  const startTimer = useCallback((deadline) => {
    clearInterval(timerRef.current);
    setTimer(7);
    const end = deadline ? new Date(deadline).getTime() : Date.now() + 7000;
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setTimer(remaining);
      if (remaining <= 0) clearInterval(timerRef.current);
    }, 250);
  }, []);

  const stopTimer = useCallback(() => {
    clearInterval(timerRef.current);
    setTimer(0);
  }, []);

  useEffect(() => () => clearInterval(timerRef.current), []);

  // ── Notification helper ─────────────────────────────────────────────────────
  const showNotif = useCallback((msg, color = 'var(--cyan)') => {
    setNotif({ msg, color });
    setTimeout(() => setNotif(null), 3500);
  }, []);

  // ── Socket setup ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!playerName) { navigate('/hand-cricket'); return; }

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    // Rejoin in case of page refresh
    if (!didRejoin.current) {
      didRejoin.current = true;
      socket.emit('hc:room:rejoin', { roomCode: code.toUpperCase(), playerName });
    }

    socket.on('hc:state:sync', (data) => {
      if (data.settings) setSettings(data.settings);
      setScores(data.scores || { host: { ...EMPTY_SCORE }, guest: { ...EMPTY_SCORE } });
      setLives(data.lives || { host: 3, guest: 3 });
      setBattingRole(data.battingRole);
      setTarget(data.target);
      if (data.phase === 'break') {
        setBreakData({ target: data.target, scores: data.scores });
        setUiPhase('break');
      } else if (data.phase === 'ended') {
        setWinner(data.winner);
        setUiPhase('ended');
      } else if (['innings1','innings2','superOver'].includes(data.phase)) {
        setInnings(data.currentInnings || 1);
        setUiPhase('picking');
      } else if (data.phase === 'toss') {
        setUiPhase('toss');
      }
    });

    socket.on('hc:toss:start', () => setUiPhase('toss-spinning'));

    socket.on('hc:toss:result', ({ winner }) => {
      const winnerName = winner === 'host' ? hostName : guestName;
      setToss({ winner, winnerName, choice: null });
      setUiPhase('toss');
    });

    socket.on('hc:innings:start', ({ innings: i, battingRole: br, bowlingRole, target: t, settings: s }) => {
      setBattingRole(br);
      setInnings(i);
      if (t != null) setTarget(t);
      if (s) setSettings(s);
      setMyPick(null);
      stopTimer();
      const batName = br === 'host' ? hostName : guestName;
      setInningsMsg(`Innings ${i} — ${batName} bats`);
      setUiPhase('innings-start');
      setTimeout(() => { setUiPhase('picking'); }, 2000);
    });

    socket.on('hc:ball:start', ({ ballNumber, deadline, battingRole: br, scores: s, lives: l }) => {
      setBattingRole(br);
      if (s) setScores(s);
      if (l) setLives(l);
      setMyPick(null);
      setReveal(null);
      setUiPhase('picking');
      startTimer(deadline);
    });

    socket.on('hc:pick:ack', () => stopTimer());

    socket.on('hc:ball:reveal', (data) => {
      stopTimer();
      setScores(data.scores || scores);
      setLives(data.lives  || lives);
      setReveal(data);
      setUiPhase('revealing');
    });

    socket.on('hc:life:lost', ({ player, livesLeft, reason }) => {
      const name = player === myRole ? 'You' : oppName;
      showNotif(`${name} lost a life (${livesLeft} left)`, 'var(--red)');
      setLives(prev => ({ ...prev, [player]: livesLeft }));
    });

    socket.on('hc:innings:end', (summary) => {
      setScores(summary.scores || scores);
    });

    socket.on('hc:break:start', ({ target: t, scores: s, innings1Summary }) => {
      setTarget(t);
      if (s) setScores(s);
      setBreakData({ target: t, scores: s, innings1Summary });
      setBreakWaiting(false);
      setUiPhase('break');
    });

    socket.on('hc:superOver:start', ({ battingRole: br }) => {
      setBattingRole(br);
      setMyPick(null);
      setInningsMsg('Super Over!');
      setUiPhase('super-over-start');
      setTimeout(() => setUiPhase('picking'), 2500);
    });

    socket.on('hc:superOver:switch', ({ battingRole: br, target: t }) => {
      setBattingRole(br);
      setTarget(t);
      showNotif('Super Over — Switch!', 'var(--gold)');
    });

    socket.on('hc:match:end', (data) => {
      stopTimer();
      setEndData(data);
      setWinner(data.winner);
      setUiPhase('ended');
    });

    socket.on('hc:opponent:disconnected', () => {
      showNotif('Opponent disconnected', 'var(--red)');
    });

    socket.on('hc:room:left', () => {
      showNotif('Opponent left the game', 'var(--red)');
    });

    return () => {
      socket.off('hc:state:sync'); socket.off('hc:toss:start'); socket.off('hc:toss:result');
      socket.off('hc:innings:start'); socket.off('hc:ball:start'); socket.off('hc:pick:ack');
      socket.off('hc:ball:reveal'); socket.off('hc:life:lost'); socket.off('hc:innings:end');
      socket.off('hc:break:start'); socket.off('hc:superOver:start'); socket.off('hc:superOver:switch');
      socket.off('hc:match:end'); socket.off('hc:opponent:disconnected'); socket.off('hc:room:left');
    };
  }, [code, playerName, myRole, hostName, guestName, navigate, startTimer, stopTimer, showNotif]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleTossChoose = (choice) => {
    const socket = getSocket();
    socket.emit('hc:toss:choose', { roomCode: code.toUpperCase(), choice });
  };

  const handlePick = (n) => {
    if (myPick != null) return;
    setMyPick(n);
    stopTimer();
    const socket = getSocket();
    socket.emit('hc:ball:pick', { roomCode: code.toUpperCase(), pick: n, role: myRole });
  };

  const handleBreakContinue = () => {
    setBreakWaiting(true);
    const socket = getSocket();
    socket.emit('hc:break:continue', { roomCode: code.toUpperCase() });
  };

  const handleRematch = () => {
    const socket = getSocket();
    socket.emit('hc:rematch:request', { roomCode: code.toUpperCase() });
    setUiPhase('connecting');
    setWinner(null); setEndData(null); setReveal(null);
    setScores({ host: { ...EMPTY_SCORE }, guest: { ...EMPTY_SCORE } });
    setLives({ host: 3, guest: 3 });
    setTarget(null); setMyPick(null);
  };

  const handleLeave = () => {
    const socket = getSocket();
    socket.emit('hc:room:leave', { roomCode: code.toUpperCase(), role: myRole });
    navigate('/hand-cricket/dashboard');
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  const isEnded    = uiPhase === 'ended';
  const iWon       = winner === myRole;
  const modeLabel = settings.overs
    ? `${settings.overs}Ov · ${settings.wickets ?? 1}W`
    : 'Cricket';

  return (
    <>
      <div className="table-bg" />
      <SparkleLayer />
      {isEnded && iWon && <Particles />}

      {/* Notification toast */}
      {notification && (
        <div style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
          zIndex: 99, padding: '10px 22px',
          background: 'var(--surface-strong)', border: `1px solid ${notification.color}`,
          borderRadius: 12, color: notification.color,
          fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600,
          letterSpacing: '0.08em', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          animation: 'fade-in 0.25s ease',
        }}>
          {notification.msg}
        </div>
      )}

      {/* Top bar */}
      <div className="top-bar">
        <div className="brand">
          <div className="brand-mark" style={{ background: 'linear-gradient(135deg, var(--cyan), #2aa0c2)', color: '#0a3a4a' }}>🏏</div>
          <div className="brand-text">
            <div className="b1">{modeLabel}</div>
            <div className="b2" style={{ background: 'linear-gradient(180deg, var(--cyan), #2aa0c2)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Hand Cricket
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {['picking','revealing'].includes(uiPhase) && (
            <div className="round-pill">
              {isBatting ? '🏏 Batting' : '⚾ Bowling'}
            </div>
          )}
          <button className="btn btn-ghost btn-sm" onClick={handleLeave}
            style={{ color: 'var(--text-dim)', fontSize: 11 }}>
            Leave
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div style={{
        position: 'relative', zIndex: 10,
        height: '100%', display: 'flex', flexDirection: 'column',
        paddingTop: 80, paddingBottom: 16,
        overflowY: 'auto',
      }}>

        {/* ── CONNECTING ─────────────────────────────────────────────────── */}
        {uiPhase === 'connecting' && (
          <CenterPanel>
            <div style={{ fontSize: 40 }}>⏳</div>
            <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Connecting…</p>
          </CenterPanel>
        )}

        {/* ── TOSS ──────────────────────────────────────────────────────── */}
        {(uiPhase === 'toss' || uiPhase === 'toss-spinning') && (
          <CenterPanel>
            <div style={{ fontSize: 11, letterSpacing: '0.26em', color: 'var(--cyan)', textTransform: 'uppercase', marginBottom: 20, fontWeight: 600 }}>
              Coin Toss
            </div>
            {toss.winner ? (
              <CoinFlip
                winner={toss.winner}
                winnerName={toss.winnerName}
                isChooser={toss.winner === myRole}
                onChoose={handleTossChoose}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 72, animation: 'coin-spin 1.8s ease-out infinite' }}>🪙</div>
                <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Flipping the coin…</p>
              </div>
            )}
          </CenterPanel>
        )}

        {/* ── INNINGS START BANNER ──────────────────────────────────────── */}
        {uiPhase === 'innings-start' && (
          <CenterPanel>
            <div style={{
              fontFamily: 'var(--font-brand)', fontSize: 'clamp(22px,6vw,36px)',
              background: 'linear-gradient(180deg, var(--gold-bright), var(--gold-deep))',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
              textAlign: 'center', animation: 'banner-in 0.4s ease',
            }}>
              {inningsMsg}
            </div>
          </CenterPanel>
        )}

        {/* ── SUPER OVER START ─────────────────────────────────────────── */}
        {uiPhase === 'super-over-start' && (
          <CenterPanel>
            <div style={{ fontSize: 56 }}>⚡</div>
            <div style={{
              fontFamily: 'var(--font-brand)', fontSize: 'clamp(28px,7vw,44px)',
              background: 'linear-gradient(135deg, var(--gold-bright), var(--pink))',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
              animation: 'banner-in 0.4s ease', textAlign: 'center',
            }}>
              SUPER OVER!
            </div>
            <p style={{ color: 'var(--text-soft)', fontSize: 13 }}>6 balls · 1 wicket each</p>
          </CenterPanel>
        )}

        {/* ── PICKING / REVEALING ──────────────────────────────────────── */}
        {['picking', 'revealing'].includes(uiPhase) && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '0 20px', flex: 1 }}>
            {/* Score panels */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <ScorePanel
                name={myName}
                score={myScore}
                lives={myLives}
                isBatting={isBatting}
                isMe={true}
                accent={myRole === 'host' ? 'var(--purple-bright)' : 'var(--pink)'}
              />
              <ScorePanel
                name={oppName}
                score={oppScore}
                lives={oppLives}
                isBatting={!isBatting}
                isMe={false}
                accent={myRole === 'host' ? 'var(--pink)' : 'var(--purple-bright)'}
              />
            </div>

            {/* Target info */}
            {target != null && (
              <div style={{
                padding: '8px 20px', borderRadius: 99,
                background: 'rgba(94,236,255,0.1)', border: '1px solid rgba(94,236,255,0.3)',
                fontSize: 13, color: 'var(--cyan)', fontFamily: 'var(--font-mono)',
              }}>
                Target: {target + 1} · Need {Math.max(0, target + 1 - (isBatting ? myScore.runs : oppScore.runs))} more
              </div>
            )}

            {/* Ball reveal area */}
            {uiPhase === 'revealing' && reveal && (
              <BallReveal
                batsmanPick={reveal.batsmanPick}
                bowlerPick={reveal.bowlerPick}
                runs={reveal.runs}
                isWicket={reveal.isWicket}
                notes={reveal.notes}
                batsmanName={reveal.batsmanRole === myRole ? 'You' : oppName}
                bowlerName={reveal.batsmanRole !== myRole ? 'You' : oppName}
              />
            )}

            {/* Pick prompt */}
            {uiPhase === 'picking' && (
              <div style={{ width: '100%', maxWidth: 340 }}>
                <div style={{
                  textAlign: 'center', marginBottom: 12,
                  fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: '0.14em',
                  color: isBatting ? 'var(--gold)' : 'var(--cyan)',
                  textTransform: 'uppercase',
                }}>
                  {isBatting ? '🏏 Pick your shot' : '⚾ Pick your delivery'}
                </div>
                <HandPicker
                  onPick={handlePick}
                  picked={myPick}
                  disabled={false}
                  timer={timer}
                />
                {myPick != null && (
                  <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 12, marginTop: 12 }}>
                    Waiting for opponent…
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── INNINGS BREAK ────────────────────────────────────────────── */}
        {uiPhase === 'break' && breakData && (
          <InningsBreak
            target={breakData.target}
            innings1Summary={breakData.innings1Summary}
            battingRole={battingRole}
            myRole={myRole}
            scores={scores}
            onContinue={handleBreakContinue}
            waiting={breakWaiting}
          />
        )}

        {/* ── ENDED ─────────────────────────────────────────────────────── */}
        {uiPhase === 'ended' && (
          <CenterPanel>
            <div className={`trophy${iWon ? '' : ' lose'}`} style={{ fontSize: 72, filter: `drop-shadow(0 0 30px ${iWon ? 'rgba(240,199,80,0.7)' : 'rgba(255,77,109,0.5)'})` }}>
              {iWon ? '🏆' : '😔'}
            </div>
            <div style={{
              fontFamily: 'var(--font-brand)',
              fontSize: 'clamp(24px, 6vw, 40px)',
              background: iWon
                ? 'linear-gradient(180deg, var(--gold-bright), var(--gold-deep))'
                : 'linear-gradient(180deg, var(--text), var(--text-dim))',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
              textAlign: 'center',
            }}>
              {iWon ? 'You Win!' : endData?.reason === 'forfeit' ? 'Opponent Forfeited' : 'You Lose'}
            </div>

            {/* Final scores */}
            {endData && (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <ScorePanel name={myName} score={endData.finalScores?.[myRole] || myScore} isMe={true} isBatting={false} accent={myRole === 'host' ? 'var(--purple-bright)' : 'var(--pink)'} />
                <ScorePanel name={oppName} score={endData.finalScores?.[myRole === 'host' ? 'guest' : 'host'] || oppScore} isMe={false} isBatting={false} accent={myRole === 'host' ? 'var(--pink)' : 'var(--purple-bright)'} />
              </div>
            )}

            {endData?.reason && (
              <div style={{ fontSize: 12, color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {{
                  'target-crossed': '🎯 Target Crossed',
                  'normal':         '✅ Match Complete',
                  'superOver':      '⚡ Super Over',
                  'forfeit':        '🏳️ Forfeit',
                  'disconnect':     '⚡ Disconnection',
                  'livesOut':       '💀 Lives Exhausted',
                }[endData.reason] || endData.reason}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button className="btn btn-gold" style={{ fontSize: 13, padding: '13px 28px' }} onClick={handleRematch}>
                Rematch ↩
              </button>
              <button className="btn btn-ghost" style={{ fontSize: 13, padding: '13px 24px' }} onClick={() => navigate('/hand-cricket/dashboard')}>
                Exit
              </button>
            </div>
          </CenterPanel>
        )}
      </div>

      <style>{`
        @keyframes coin-spin {
          0%   { transform: rotateY(0deg) scale(1); }
          50%  { transform: rotateY(720deg) scale(1.1); }
          100% { transform: rotateY(1440deg) scale(1); }
        }
        @keyframes banner-in {
          from { transform: translateY(-16px) scale(0.9); opacity: 0; }
          to   { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes pop-in {
          0%   { transform: scale(0.7); opacity: 0; }
          60%  { transform: scale(1.08); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </>
  );
}

function CenterPanel({ children }) {
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
