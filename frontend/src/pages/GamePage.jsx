import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { getSocket } from '../socket/socket';
import PlayingCard, { CardBack, FanOfCards } from '../components/PlayingCard';
import Particles from '../components/Particles';
import SparkleLayer from '../components/SparkleLayer';
import { STATS, getStat } from '../utils/gameData';

const TURN_TIMEOUT_DEFAULT = 15;

// ── TopBar ────────────────────────────────────────────────────────────────────
function TopBar({ round, code, isYourTurn, timer, matchTimeLeft }) {
  const fmtMatch = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  return (
    <div className="top-bar">
      <div className="brand">
        <div className="brand-mark">T</div>
        <div className="brand-text">
          <div className="b1">{code || 'TRUMPCARD'}</div>
          <div className="b2">{round ? `Round ${round}` : 'Anime Trumpcard'}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {matchTimeLeft != null && (
          <div className="round-pill" style={{ color: matchTimeLeft <= 30 ? 'var(--red)' : 'var(--gold)' }}>
            <span>&#x23F3;</span><span>{fmtMatch(matchTimeLeft)}</span>
          </div>
        )}
        {timer != null && <div className="round-pill"><span>&#x23F1;</span><span>{timer}s</span></div>}
        {isYourTurn != null && (
          <div className={`turn-pill ${isYourTurn ? '' : 'waiting'}`}>
            {isYourTurn ? 'YOUR TURN' : 'OPPONENT'}
          </div>
        )}
      </div>
    </div>
  );
}

// ── GameOver screen ────────────────────────────────────────────────────────────
const RANK_MEDALS = ['🥇', '🥈', '🥉'];

function GameOverScreen({ winner, playerName, navigate, rankings, timeExpired }) {
  // ── Time-expired path: rankings board ──────────────────────────────────────
  if (timeExpired && rankings?.length) {
    const myRanking = rankings.find((r) => r.playerName === playerName);
    const myRank    = myRanking?.rank ?? null;

    return (
      <>
        <div className="table-bg" />
        <SparkleLayer />
        {myRank === 1 && winner === playerName && <Particles active count={80} />}
        <div className="center-screen">
          <div style={{ fontSize: 52, lineHeight: 1 }}>&#x23F1;</div>
          <h1 style={{
            fontFamily: 'var(--font-brand)',
            fontSize: 'clamp(28px, 5vw, 44px)',
            margin: '12px 0 4px',
            background: 'linear-gradient(180deg, var(--gold-bright) 0%, var(--gold) 50%, var(--gold-deep) 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Time&apos;s Up!
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 20 }}>
            {winner
              ? <><span style={{ color: 'var(--gold)', fontWeight: 700 }}>{winner}</span> wins by card score!</>
              : 'It\'s a tie at the top!'}
          </p>

          {/* Rankings list */}
          <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {rankings.map((r) => {
              const isMe   = r.playerName === playerName;
              const medal  = RANK_MEDALS[r.rank - 1] || `#${r.rank}`;
              return (
                <div key={r.playerName} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 16px',
                  borderRadius: 12,
                  background: isMe ? 'rgba(108,63,190,0.18)' : 'var(--surface)',
                  border: `1px solid ${r.rank === 1 ? 'rgba(240,199,80,0.4)' : isMe ? 'rgba(108,63,190,0.4)' : 'var(--line)'}`,
                  boxShadow: r.rank === 1 ? '0 0 16px rgba(240,199,80,0.15)' : 'none',
                }}>
                  <div style={{ fontSize: 22, minWidth: 32, textAlign: 'center' }}>{medal}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 13,
                      fontWeight: 700,
                      color: r.rank === 1 ? 'var(--gold)' : isMe ? 'var(--purple-soft)' : 'var(--text)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}>
                      {r.playerName}{isMe ? ' (you)' : ''}
                    </div>
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 16,
                    fontWeight: 700,
                    color: r.rank === 1 ? 'var(--gold)' : 'var(--text-soft)',
                    textShadow: r.rank === 1 ? '0 0 12px rgba(240,199,80,0.5)' : 'none',
                  }}>
                    {r.score}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320 }}>
            <button
              className={`btn ${myRank === 1 ? 'btn-gold' : 'btn-purple'}`}
              style={{ width: '100%' }}
              onClick={() => navigate('/dashboard')}
            >
              Play Again
            </button>
            <button className="btn btn-ghost" style={{ width: '100%' }} onClick={() => navigate('/')}>
              Change Name
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── Normal game-over path ──────────────────────────────────────────────────
  const didIWin = winner === playerName;

  return (
    <>
      <div className="table-bg" />
      <SparkleLayer />
      {didIWin && <Particles active count={80} />}
      <div className="center-screen">
        <div className={`trophy ${didIWin ? '' : 'lose'}`}>
          {didIWin ? '🏆' : '🃏'}
        </div>
        <h1 style={{
          fontFamily: 'var(--font-brand)',
          fontSize: 'clamp(32px, 6vw, 52px)',
          margin: '16px 0 8px',
          background: didIWin
            ? 'linear-gradient(180deg, var(--gold-bright) 0%, var(--gold) 50%, var(--gold-deep) 100%)'
            : 'linear-gradient(180deg, #fff 0%, var(--text-soft) 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: didIWin ? 'drop-shadow(0 4px 20px rgba(240,199,80,0.4))' : 'none',
        }}>
          {didIWin ? 'You Win!' : 'Game Over'}
        </h1>

        {!didIWin && winner && (
          <p style={{ color: 'var(--text-soft)', marginBottom: 8, fontSize: 15 }}>
            <span style={{ color: 'var(--purple-soft)', fontWeight: 700 }}>{winner}</span> wins the game!
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320, marginTop: 24 }}>
          <button
            className={`btn ${didIWin ? 'btn-gold' : 'btn-purple'}`}
            style={{ width: '100%' }}
            onClick={() => navigate('/dashboard')}
          >
            Play Again
          </button>
          <button
            className="btn btn-ghost"
            style={{ width: '100%' }}
            onClick={() => navigate('/')}
          >
            Change Name
          </button>
        </div>
      </div>
    </>
  );
}

// ── ComparisonOverlay — N-player ──────────────────────────────────────────────
function ComparisonOverlay({ roundResult, myName, onClose }) {
  const [stage, setStage] = useState(0);
  // stage 0 = banner only, 1 = all cards in, 2 = stat bars, 3 = winner text + close

  const { winner, isDraw, decidingStat, cards } = roundResult;
  const statMeta  = STATS.find((s) => s.key === decidingStat) || STATS[0];
  const maxVal    = Math.max(...cards.map((c) => getStat(c.card, decidingStat)), 1);
  const cardSize  = cards.length <= 2 ? 'md' : 'sm';
  const POP_ANIMS = ['card-pop-l', 'card-pop-r', 'card-pop-up', 'card-pop-l'];

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 300),
      setTimeout(() => setStage(2), 950),
      setTimeout(() => setStage(3), 1900),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (stage < 3) return;
    const t = setTimeout(() => onClose(), 3800);
    return () => clearTimeout(t);
  }, [stage, onClose]);

  return (
    <div className="compare-overlay">
      <div className="compare-arena">

        {/* ── Stat banner ── */}
        <div className="compare-stat-banner">
          <span>{statMeta.icon}</span>
          <span>{statMeta.label}</span>
          {isDraw && <span style={{ color: 'var(--text-dim)', fontSize: '0.82em' }}>— Draw!</span>}
        </div>

        {/* ── All player cards ── */}
        {stage >= 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            gap: cards.length <= 2 ? 20 : 10,
            flexWrap: 'wrap',
            width: '100%',
          }}>
            {cards.map((c, i) => {
              const isWinner = !isDraw && c.playerName === winner;
              const isMe     = c.playerName === myName;
              return (
                <div
                  key={c.playerName}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    transform: isWinner ? 'translateY(-10px)' : 'none',
                    transition: 'transform 0.5s cubic-bezier(0.34,1.36,0.64,1)',
                    animation: `${POP_ANIMS[i % POP_ANIMS.length]} 0.5s cubic-bezier(0.34,1.36,0.64,1)`,
                  }}
                >
                  {/* Crown above winner */}
                  <div style={{
                    height: 22,
                    fontSize: 18,
                    lineHeight: '22px',
                    opacity: isWinner ? 1 : 0,
                    transition: 'opacity 0.3s',
                    animation: isWinner ? 'trophy-bob 1.4s ease-in-out infinite' : 'none',
                  }}>
                    ♛
                  </div>

                  <PlayingCard
                    card={c.card}
                    size={cardSize}
                    faceUp={true}
                    winningStat={isWinner ? decidingStat : null}
                    losingStat={!isWinner && !isDraw ? decidingStat : null}
                  />

                  {/* Player name tag */}
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    padding: '4px 12px',
                    borderRadius: 999,
                    background: isWinner
                      ? 'linear-gradient(180deg, var(--gold-bright), var(--gold))'
                      : 'var(--surface)',
                    color: isWinner ? '#2a1450' : 'var(--text)',
                    border: `1px solid ${isWinner ? 'var(--gold)' : 'var(--line)'}`,
                    boxShadow: isWinner ? '0 0 18px var(--gold-dim)' : 'none',
                  }}>
                    {c.playerName}{isMe ? ' (you)' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Per-player stat bars ── */}
        {stage >= 2 && (
          <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 9 }}>
            {cards.map((c) => {
              const val      = getStat(c.card, decidingStat);
              const isWinner = !isDraw && c.playerName === winner;
              const pct      = (val / maxVal) * 100;
              return (
                <div key={c.playerName} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  {/* Avatar initial */}
                  <div style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: isWinner ? 'var(--gold)' : 'var(--surface-strong)',
                    border: `1px solid ${isWinner ? 'var(--gold)' : 'var(--line)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    color: isWinner ? '#2a1450' : 'var(--text-dim)',
                    flexShrink: 0,
                  }}>
                    {c.playerName[0].toUpperCase()}
                  </div>

                  {/* Fill bar */}
                  <div style={{ flex: 1, height: 9, background: 'rgba(0,0,0,0.45)', borderRadius: 5, overflow: 'hidden', border: '1px solid var(--line)' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      borderRadius: 5,
                      background: isWinner
                        ? 'linear-gradient(90deg, var(--gold), var(--gold-bright))'
                        : 'linear-gradient(90deg, var(--purple-bright), var(--purple-soft))',
                      boxShadow: isWinner ? '0 0 10px rgba(240,199,80,0.6)' : '0 0 6px var(--purple-glow)',
                      transition: 'width 0.85s cubic-bezier(0.4,0,0.2,1)',
                    }} />
                  </div>

                  {/* Stat value */}
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 15,
                    fontWeight: 700,
                    width: 30,
                    textAlign: 'right',
                    flexShrink: 0,
                    color: isWinner ? 'var(--gold)' : 'var(--text-soft)',
                    textShadow: isWinner ? '0 0 12px rgba(240,199,80,0.55)' : 'none',
                  }}>
                    {val}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Winner text + Next Round ── */}
        {stage >= 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: isDraw ? 'var(--text-dim)' : 'var(--gold)',
              textShadow: isDraw ? 'none' : '0 0 16px rgba(240,199,80,0.5)',
              margin: 0,
            }}>
              {isDraw
                ? 'Draw — no cards taken'
                : winner === myName
                  ? 'You win this round!'
                  : `${winner} wins the round`}
            </p>
            <button className="btn btn-gold" onClick={onClose}>
              Next Round →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

// ── GamePage ──────────────────────────────────────────────────────────────────
export default function GamePage() {
  const { roomCode } = useParams();
  const { playerName } = useGame();
  const navigate = useNavigate();
  const location = useLocation();

  // ── game state ────────────────────────────────────────────────────────────
  const [phase, setPhase]                 = useState('loading');
  const [currentPlayer, setCurrentPlayer] = useState('');
  const [roundNumber, setRoundNumber]     = useState(1);
  const [players, setPlayers]             = useState([]);
  const [myCard, setMyCard]               = useState(null);
  const [selectedStat, setSelectedStat]   = useState(null);
  const [roundResult, setRoundResult]     = useState(null);
  const [gameWinner, setGameWinner]       = useState(null);
  const [showParticles, setShowParticles] = useState(false);
  const [matchTimeLeft, setMatchTimeLeft] = useState(null);
  const [gameRankings, setGameRankings]   = useState(null);
  const [timeExpired, setTimeExpired]     = useState(false);
  const matchTimerRef                      = useRef(null);

  // ── notifications ─────────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState([]);

  // ── your-turn banner ──────────────────────────────────────────────────────
  const [showBanner, setShowBanner]   = useState(false);
  const bannerTimer                   = useRef(null);

  // ── turn timer ────────────────────────────────────────────────────────────
  const [timeLeft, setTimeLeft]         = useState(TURN_TIMEOUT_DEFAULT);
  const [turnDuration, setTurnDuration] = useState(TURN_TIMEOUT_DEFAULT);
  const timerRef                        = useRef(null);

  // ── guard against rapid double-tap selecting two different stats ──────────
  const statChosenRef = useRef(false);

  const isMyTurn      = currentPlayer === playerName;
  const iAmEliminated = players.find((p) => p.name === playerName)?.isEliminated || false;

  // ── helpers ───────────────────────────────────────────────────────────────
  const pushNote = useCallback((text, type = 'info') => {
    const id = Date.now() + Math.random();
    setNotifications((n) => [...n.slice(-2), { id, text, type }]);
    setTimeout(() => setNotifications((n) => n.filter((x) => x.id !== id)), 4000);
  }, []);

  const resetTimer = useCallback((secs) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(secs);
    timerRef.current = setInterval(() => {
      setTimeLeft((p) => { if (p <= 1) { clearInterval(timerRef.current); return 0; } return p - 1; });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setTimeLeft(0);
  }, []);

  const startMatchCountdown = useCallback((matchDurationSecs, matchStartedAtISO) => {
    if (matchTimerRef.current) clearInterval(matchTimerRef.current);
    if (!matchDurationSecs || matchDurationSecs <= 0) { setMatchTimeLeft(null); return; }
    const tick = () => {
      const elapsed   = Math.floor((Date.now() - new Date(matchStartedAtISO).getTime()) / 1000);
      const remaining = Math.max(0, matchDurationSecs - elapsed);
      setMatchTimeLeft(remaining);
      if (remaining <= 0) { clearInterval(matchTimerRef.current); matchTimerRef.current = null; }
    };
    tick();
    matchTimerRef.current = setInterval(tick, 1000);
  }, []);

  useEffect(() => () => {
    stopTimer();
    clearTimeout(bannerTimer.current);
    if (matchTimerRef.current) clearInterval(matchTimerRef.current);
  }, [stopTimer]);

  // ── bootstrap from navigation state (navigated here from lobby on game start) ─
  // LobbyPage passes gameState via navigate(..., { state: { gameState } }).
  // Read it once on mount so the game shows instantly without waiting for
  // the rejoin_game → game_state_sync round-trip.
  useEffect(() => {
    const navGS = location.state?.gameState;
    if (!navGS) return;
    setCurrentPlayer(navGS.currentPlayer ?? '');
    setRoundNumber(navGS.roundNumber ?? 1);
    setPlayers(navGS.players ?? []);
    const secs = Math.round((navGS.turnTimeout ?? TURN_TIMEOUT_DEFAULT * 1000) / 1000);
    setTurnDuration(secs);
    resetTimer(secs);
    if (navGS.matchDuration && navGS.matchStartedAt) {
      startMatchCountdown(navGS.matchDuration, navGS.matchStartedAt);
    }
    setPhase('playing');
  }, [resetTimer, startMatchCountdown]); // both stable; effect runs once on mount

  // ── socket ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!playerName) { navigate('/'); return; }
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const applyState = (data, resetT) => {
      setCurrentPlayer(data.currentPlayer);
      setRoundNumber(data.roundNumber);
      setPlayers(data.players);
      const secs = Math.round((data.turnTimeout ?? TURN_TIMEOUT_DEFAULT * 1000) / 1000);
      setTurnDuration(secs);
      if (resetT) resetTimer(secs);
    };

    const onSync = (data) => {
      applyState(data, true);
      if (data.matchDuration && data.matchStartedAt) {
        startMatchCountdown(data.matchDuration, data.matchStartedAt);
      }
      if (data.status === 'finished') { setGameWinner(data.winner); setPhase('gameover'); }
      else setPhase('playing');
    };

    const onStarted = ({ gameState }) => {
      applyState(gameState, true);
      if (gameState.matchDuration && gameState.matchStartedAt) {
        startMatchCountdown(gameState.matchDuration, gameState.matchStartedAt);
      }
      setPhase('playing');
    };

    const onDeal = ({ card }) => {
      setMyCard(card);
      statChosenRef.current = false;
      setSelectedStat(null);
    };

    const onTurnStarted = ({ currentPlayer: cp, roundNumber: rn, players: pl, skippedPlayer, skipReason }) => {
      setCurrentPlayer(cp);
      setRoundNumber(rn);
      setPlayers(pl);
      setRoundResult(null);
      statChosenRef.current = false;
      setSelectedStat(null);
      setPhase('playing');
      resetTimer(turnDuration);
      if (skippedPlayer) {
        pushNote(`${skippedPlayer} skipped — ${skipReason === 'timeout' ? 'timed out' : 'disconnected'}`, 'warn');
      }
    };

    const onResult = (data) => {
      setPlayers(data.players);
      setRoundResult(data);
      setPhase('result');
      stopTimer();
      // Show particles if I won this round
      if (data.winner === playerName) {
        setShowParticles(true);
        setTimeout(() => setShowParticles(false), 3000);
      }
    };

    const onLifeLost = ({ playerName: pn, livesLeft, reason }) => {
      setPlayers((prev) => prev.map((p) => p.name === pn ? { ...p, lives: livesLeft } : p));
      pushNote(`${pn} lost a life · ${livesLeft} remaining`, 'warn');
    };
    const onEliminated = ({ playerName: pn, reason, players: pl }) => {
      if (pl) setPlayers(pl);
      pushNote(`${pn} was eliminated`, 'error');
    };
    const onOver = ({ winner, timeExpired: te, rankings }) => {
      setGameWinner(winner);
      if (rankings) setGameRankings(rankings);
      if (te) setTimeExpired(true);
      setPhase('gameover');
      stopTimer();
      if (matchTimerRef.current) { clearInterval(matchTimerRef.current); matchTimerRef.current = null; }
    };
    const onErr  = (msg) => pushNote(msg, 'error');

    socket.on('game_state_sync',   onSync);
    socket.on('game_started',      onStarted);
    socket.on('deal_card',         onDeal);
    socket.on('turn_started',      onTurnStarted);
    socket.on('round_result',      onResult);
    socket.on('life_lost',         onLifeLost);
    socket.on('player_eliminated', onEliminated);
    socket.on('game_over',         onOver);
    socket.on('error_message',     onErr);

    // Emit AFTER listeners are registered so no response event is missed
    socket.emit('rejoin_game', { roomCode, playerName });

    return () => {
      socket.off('game_state_sync', onSync); socket.off('game_started', onStarted);
      socket.off('deal_card', onDeal);       socket.off('turn_started', onTurnStarted);
      socket.off('round_result', onResult);  socket.off('life_lost', onLifeLost);
      socket.off('player_eliminated', onEliminated);
      socket.off('game_over', onOver);       socket.off('error_message', onErr);
    };
  }, [roomCode, playerName, navigate, pushNote, resetTimer, stopTimer, startMatchCountdown, turnDuration]);

  // ── "Your Turn" banner ────────────────────────────────────────────────────
  useEffect(() => {
    if (isMyTurn && phase === 'playing' && !iAmEliminated) {
      setShowBanner(true);
      clearTimeout(bannerTimer.current);
      bannerTimer.current = setTimeout(() => setShowBanner(false), 2200);
    }
  }, [isMyTurn, phase, iAmEliminated, currentPlayer]);

  // ── actions ───────────────────────────────────────────────────────────────
  const handleChooseStat = useCallback((stat) => {
    if (!isMyTurn || phase !== 'playing' || iAmEliminated || statChosenRef.current) return;
    statChosenRef.current = true;
    setSelectedStat(stat);
    stopTimer();
    setShowBanner(false);
    getSocket().emit('choose_stat', { roomCode, stat, playerName });
  }, [isMyTurn, phase, iAmEliminated, roomCode, playerName, stopTimer]);

  const handleResultClose = useCallback(() => { setRoundResult(null); }, []);

  // ── render helpers ────────────────────────────────────────────────────────
  const PLAYER_ACCENT_CLASSES = ['p-1', 'p-2', 'p-3', 'p-4'];

  // ── game over ────────────────────────────────────────────────────────────
  if (phase === 'gameover') {
    return <GameOverScreen winner={gameWinner} playerName={playerName} navigate={navigate} rankings={gameRankings} timeExpired={timeExpired} />;
  }

  // ── loading ───────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <>
        <div className="table-bg" />
        <div className="center-screen">
          <div style={{ width: 48, height: 48, border: '2px solid var(--purple-bright)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 16 }}>Loading game...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </>
    );
  }

  const opponentPlayers = players.filter((p) => p.name !== playerName && !p.isEliminated);
  const myPlayerData    = players.find((p) => p.name === playerName);

  return (
    <>
      <div className="table-bg" />
      <SparkleLayer />
      {showParticles && <Particles active count={70} />}

      {/* TopBar */}
      <TopBar
        round={roundNumber}
        code={roomCode}
        isYourTurn={phase === 'playing' && !iAmEliminated ? isMyTurn : null}
        timer={phase === 'playing' && !iAmEliminated ? timeLeft : null}
        matchTimeLeft={matchTimeLeft}
      />

      {/* "Your Turn" toast — anchored below TopBar, never covers the card */}
      {showBanner && (
        <div style={{
          position: 'fixed',
          top: 62,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 60,
          pointerEvents: 'none',
          animation: 'banner-drop 0.35s cubic-bezier(0.34, 1.36, 0.64, 1)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'linear-gradient(135deg, rgba(108,63,190,0.96), rgba(90,40,180,0.92))',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            border: '1px solid rgba(170,110,255,0.45)',
            color: '#fff',
            fontFamily: 'var(--font-display)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.22em',
            padding: '6px 18px 6px 14px',
            borderRadius: 24,
            boxShadow: '0 4px 20px rgba(108,63,190,0.55), 0 1px 0 rgba(255,255,255,0.08) inset',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
          }}>
            <span style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'var(--gold)',
              boxShadow: '0 0 8px rgba(240,199,80,0.9)',
              display: 'inline-block',
              animation: 'pulse-dot 1s ease-in-out infinite',
              flexShrink: 0,
            }} />
            Your Turn
          </div>
        </div>
      )}

      {/* Notifications */}
      <div style={{ position: 'fixed', top: 80, right: 12, zIndex: 70, display: 'flex', flexDirection: 'column', gap: 6, pointerEvents: 'none', maxWidth: 240 }}>
        {notifications.map((n) => {
          const accentColor = n.type === 'error' ? 'var(--red)' : n.type === 'warn' ? 'var(--gold)' : 'var(--purple-soft)';
          return (
            <div key={n.id} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 9,
              padding: '8px 12px',
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 500,
              lineHeight: 1.4,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              background: n.type === 'error' ? 'rgba(255,77,109,0.14)' : n.type === 'warn' ? 'rgba(240,199,80,0.12)' : 'rgba(30,18,60,0.75)',
              border: `1px solid ${n.type === 'error' ? 'rgba(255,77,109,0.35)' : n.type === 'warn' ? 'rgba(240,199,80,0.25)' : 'rgba(255,255,255,0.07)'}`,
              borderLeft: `3px solid ${accentColor}`,
              color: n.type === 'error' ? 'var(--red)' : n.type === 'warn' ? 'var(--gold)' : 'var(--text-soft)',
              animation: 'note-in 0.25s ease',
            }}>
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: accentColor,
                marginTop: 3,
                flexShrink: 0,
              }} />
              {n.text}
            </div>
          );
        })}
      </div>

      {/* Main game stage */}
      <div className="game-stage">

        {/* Opponent fans at top */}
        {opponentPlayers.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, padding: '8px 16px', flexShrink: 0 }}>
            {opponentPlayers.map((op) => (
              <div key={op.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <p className="area-label" style={{ fontSize: 9 }}>{op.name} · {op.cardCount ?? '?'} cards</p>
                <FanOfCards count={Math.min(op.cardCount ?? 3, 7)} size="sm" maxAngle={24} spacing={12} />
              </div>
            ))}
          </div>
        )}

        {/* Play area */}
        <div className="play-area">
          {iAmEliminated ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 64, marginBottom: 12 }}>💀</div>
              <p style={{ color: 'var(--red)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>Eliminated!</p>
              <p style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 4 }}>Watching the battle...</p>
            </div>
          ) : (
            <>
              <p className="area-label">Your Top Card</p>
              {myCard ? (
                <PlayingCard
                  key={myCard._id?.toString() || myCard.name}
                  card={myCard}
                  size="lg"
                  faceUp={true}
                  interactive={isMyTurn && phase === 'playing'}
                  selectedStat={selectedStat}
                  onStatTap={isMyTurn && phase === 'playing' ? handleChooseStat : null}
                  shine={isMyTurn && phase === 'playing' && !selectedStat}
                />
              ) : (
                <CardBack size="lg" />
              )}

              {!isMyTurn && phase === 'playing' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-dim)', fontSize: 13 }}>
                  <span style={{ width: 16, height: 16, border: '2px solid var(--line-strong)', borderTopColor: 'var(--purple-soft)', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.9s linear infinite', flexShrink: 0 }} />
                  {currentPlayer} is choosing...
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Players bar */}
      <div className="players-bar">
        {players.map((p, i) => (
          <div
            key={p.name}
            className={`player-tag ${PLAYER_ACCENT_CLASSES[i] || ''} ${p.name === currentPlayer && phase === 'playing' ? 'is-turn' : ''}`}
            style={{ opacity: p.isEliminated ? 0.4 : 1 }}
          >
            <div className="pa">{p.name[0].toUpperCase()}</div>
            <div className="info">
              <span className="n">{p.name}{p.name === playerName ? ' (you)' : ''}</span>
              <span className="c">{p.isEliminated ? 'eliminated' : `${p.cardCount ?? '?'} cards`}</span>
              {!p.isEliminated && p.lives != null && p.lives > 0 && (
                <span style={{ display: 'flex', gap: 3, marginTop: 3 }}>
                  {Array.from({ length: p.lives }, (_, li) => (
                    <span key={li} style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'var(--red)',
                      boxShadow: '0 0 5px rgba(255,77,109,0.7)',
                      display: 'inline-block',
                    }} />
                  ))}
                </span>
              )}
            </div>
            {p.name === currentPlayer && phase === 'playing' && (
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--purple-bright)',
                boxShadow: '0 0 8px var(--purple-glow)',
                display: 'inline-block',
                animation: 'pulse-dot 1.1s ease-in-out infinite',
                flexShrink: 0,
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Comparison overlay */}
      {phase === 'result' && roundResult && (
        <ComparisonOverlay
          roundResult={roundResult}
          myName={playerName}
          onClose={handleResultClose}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes banner-drop { from { transform: translateY(-28px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes pulse-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.6); } }
        @keyframes note-in { from { transform: translateX(16px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes card-pop-l { from { transform: translateX(-50px) rotate(-8deg); opacity: 0; } to { transform: none; opacity: 1; } }
        @keyframes card-pop-r { from { transform: translateX(50px) rotate(8deg); opacity: 0; } to { transform: none; opacity: 1; } }
        @keyframes card-pop-up { from { transform: translateY(40px) scale(0.85); opacity: 0; } to { transform: none; opacity: 1; } }
      `}</style>
    </>
  );
}
