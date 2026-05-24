import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { getSocket } from '../socket/socket';
import Card, { CardBack } from '../components/Card';
import PlayerInfo from '../components/PlayerInfo';
import RoundResult from '../components/RoundResult';
import GameOver from '../components/GameOver';

const TURN_TIMEOUT_DEFAULT = 30;

export default function GamePage() {
  const { roomCode } = useParams();
  const { playerName } = useGame();
  const navigate = useNavigate();

  // ── game state ────────────────────────────────────────────────────────────
  const [phase, setPhase]                 = useState('loading');
  const [currentPlayer, setCurrentPlayer] = useState('');
  const [roundNumber, setRoundNumber]     = useState(1);
  const [players, setPlayers]             = useState([]);
  const [myCard, setMyCard]               = useState(null);
  const [cardReady, setCardReady]         = useState(false);
  const [selectedStat, setSelectedStat]   = useState(null);
  const [roundResult, setRoundResult]     = useState(null);
  const [gameWinner, setGameWinner]       = useState(null);

  // ── notifications ─────────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState([]);

  // ── your-turn banner ──────────────────────────────────────────────────────
  const [showBanner, setShowBanner]   = useState(false);
  const bannerTimer                   = useRef(null);

  // ── turn timer ────────────────────────────────────────────────────────────
  const [timeLeft, setTimeLeft]         = useState(TURN_TIMEOUT_DEFAULT);
  const [turnDuration, setTurnDuration] = useState(TURN_TIMEOUT_DEFAULT);
  const timerRef                        = useRef(null);

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

  useEffect(() => () => { stopTimer(); clearTimeout(bannerTimer.current); }, [stopTimer]);

  // ── socket ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!playerName) { navigate('/'); return; }
    const socket = getSocket();
    if (!socket.connected) socket.connect();
    socket.emit('rejoin_game', { roomCode, playerName });

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
      if (data.status === 'finished') { setGameWinner(data.winner); setPhase('gameover'); }
      else setPhase('playing');
    };

    const onStarted = ({ gameState }) => { applyState(gameState, true); setPhase('playing'); };

    const onDeal = ({ card }) => {
      setCardReady(false);
      // brief delay so deal-in animation re-triggers even for same card
      requestAnimationFrame(() => { setMyCard(card); setSelectedStat(null); setCardReady(true); });
    };

    const onTurnStarted = ({ currentPlayer: cp, roundNumber: rn, players: pl, skippedPlayer, skipReason }) => {
      setCurrentPlayer(cp);
      setRoundNumber(rn);
      setPlayers(pl);
      setRoundResult(null);
      setSelectedStat(null);
      setPhase('playing');
      resetTimer(turnDuration);
      if (skippedPlayer) {
        pushNote(`⏭️ ${skippedPlayer} skipped (${skipReason === 'timeout' ? 'timed out' : 'disconnected'})`, 'warn');
      }
    };

    const onResult = (data) => { setPlayers(data.players); setRoundResult(data); setPhase('result'); stopTimer(); };
    const onLifeLost = ({ playerName: pn, livesLeft, reason }) => {
      setPlayers((prev) => prev.map((p) => p.name === pn ? { ...p, lives: livesLeft } : p));
      pushNote(`⚠️ ${pn} lost a life (${livesLeft} left) — ${reason === 'timeout' ? 'timed out' : 'disconnected'}`, 'warn');
    };
    const onEliminated = ({ playerName: pn, reason, players: pl }) => {
      if (pl) setPlayers(pl);
      pushNote(`❌ ${pn} eliminated (${reason === 'disconnect' ? 'no lives left' : 'no cards'})`, 'error');
    };
    const onOver = ({ winner }) => { setGameWinner(winner); setPhase('gameover'); stopTimer(); };
    const onErr  = (msg) => pushNote(`⚠️ ${msg}`, 'error');

    socket.on('game_state_sync',   onSync);
    socket.on('game_started',      onStarted);
    socket.on('deal_card',         onDeal);
    socket.on('turn_started',      onTurnStarted);
    socket.on('round_result',      onResult);
    socket.on('life_lost',         onLifeLost);
    socket.on('player_eliminated', onEliminated);
    socket.on('game_over',         onOver);
    socket.on('error_message',     onErr);

    return () => {
      socket.off('game_state_sync', onSync); socket.off('game_started', onStarted);
      socket.off('deal_card', onDeal);       socket.off('turn_started', onTurnStarted);
      socket.off('round_result', onResult);  socket.off('life_lost', onLifeLost);
      socket.off('player_eliminated', onEliminated);
      socket.off('game_over', onOver);       socket.off('error_message', onErr);
    };
  }, [roomCode, playerName, navigate, pushNote, resetTimer, stopTimer, turnDuration]);

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
    if (!isMyTurn || phase !== 'playing' || iAmEliminated || selectedStat) return;
    setSelectedStat(stat);
    stopTimer();
    setShowBanner(false);
    getSocket().emit('choose_stat', { roomCode, stat, playerName });
  }, [isMyTurn, phase, iAmEliminated, selectedStat, roomCode, playerName, stopTimer]);

  // Only clear the overlay — turn_started from the server owns the phase transition.
  // Setting phase('playing') here while currentPlayer is stale causes the loser to
  // briefly see "Your Turn!" before turn_started arrives and corrects currentPlayer.
  const handleResultClose = useCallback(() => { setRoundResult(null); }, []);

  // ── renders ───────────────────────────────────────────────────────────────
  if (phase === 'gameover') return <GameOver winner={gameWinner} />;

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="w-12 h-12 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Loading game...</p>
        </div>
      </div>
    );
  }

  const timerPct  = turnDuration > 0 ? (timeLeft / turnDuration) * 100 : 0;
  const isLowTime = timeLeft <= 5 && timeLeft > 0;
  const isMidTime = timeLeft <= 10 && timeLeft > 5;
  const timerColor = isLowTime ? 'bg-red-500' : isMidTime ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="bg-[#12121a] border-b border-[#1a1a2e] shrink-0">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl shrink-0">🃏</span>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm leading-tight">Round {roundNumber}</p>
              <p className="text-gray-600 text-[11px] truncate">{roomCode}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {phase === 'playing' && !iAmEliminated && (
              <span className={`text-sm font-mono font-bold tabular-nums
                ${isLowTime ? 'text-red-400 animate-timer-pulse'
                : isMidTime ? 'text-yellow-400' : 'text-gray-500'}`}>
                {timeLeft}s
              </span>
            )}
            <div className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              iAmEliminated
                ? 'bg-red-900/30 border-red-800/50 text-red-400'
                : isMyTurn && phase === 'playing'
                  ? 'bg-green-900/30 border-green-700/50 text-green-400'
                  : 'bg-[#1a1a2e] border-[#2a2a3e] text-gray-500'
            }`}>
              {iAmEliminated ? 'Eliminated'
                : isMyTurn && phase === 'playing' ? 'Your Turn!'
                : `${currentPlayer}`}
            </div>
          </div>
        </div>

        {/* Timer bar */}
        {phase === 'playing' && !iAmEliminated && (
          <div className="h-0.5 bg-[#1a1a2e]">
            <div className={`h-full ${timerColor} transition-all duration-1000`}
                 style={{ width: `${timerPct}%` }} />
          </div>
        )}
      </header>

      {/* ── "Your Turn" Banner ────────────────────────────────────────────── */}
      {showBanner && (
        <div className="fixed inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div className="bg-purple-600/95 backdrop-blur-sm text-white text-2xl font-bold
            px-8 py-4 rounded-2xl shadow-2xl shadow-purple-900/60 animate-turn-banner
            border border-purple-400/30">
            ⚔️ Your Turn!
          </div>
        </div>
      )}

      {/* ── Notifications ─────────────────────────────────────────────────── */}
      <div className="fixed top-16 right-3 z-40 space-y-2 pointer-events-none max-w-[260px]">
        {notifications.map((n) => (
          <div key={n.id} className={`px-3 py-2.5 rounded-xl text-xs font-medium shadow-xl
            border backdrop-blur-sm animate-slide-down
            ${n.type === 'error' ? 'bg-red-900/90 border-red-800/50 text-red-200'
            : n.type === 'warn'  ? 'bg-amber-900/90 border-amber-800/50 text-amber-200'
            :                      'bg-[#12121a]/90 border-[#2a2a3e] text-gray-200'}`}>
            {n.text}
          </div>
        ))}
      </div>

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-4 gap-5 overflow-y-auto">

        {iAmEliminated ? (
          <div className="text-center py-6 animate-fade-in space-y-3">
            <p className="text-6xl animate-float">💀</p>
            <p className="text-red-400 font-bold text-lg">Eliminated!</p>
            <p className="text-gray-500 text-sm">Watching the battle...</p>
          </div>
        ) : (
          <>
            {/* Card — stats are clickable inside when it's your turn */}
            <div className="flex flex-col items-center gap-1.5">
              <p className="text-gray-600 text-[10px] uppercase tracking-widest">Your Top Card</p>
              {cardReady && myCard
                ? <Card
                    card={myCard}
                    selectedStat={selectedStat}
                    onSelectStat={isMyTurn && phase === 'playing' ? handleChooseStat : null}
                    size="normal"
                  />
                : <CardBack size="normal" />
              }
            </div>

            {/* Waiting indicator — shown when it's not your turn */}
            {(!isMyTurn || phase === 'result') && (
              <div className="flex items-center justify-center gap-2 text-gray-600 text-sm animate-fade-in">
                {phase !== 'result' && (
                  <span className="w-4 h-4 border-2 border-gray-700 border-t-gray-500 rounded-full animate-spin shrink-0" />
                )}
                <span>
                  {phase === 'result' ? 'Battle in progress...' : `${currentPlayer} is choosing...`}
                </span>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Footer: players ───────────────────────────────────────────────── */}
      <footer className="bg-[#12121a] border-t border-[#1a1a2e] px-4 py-3 shrink-0 overflow-x-auto">
        <PlayerInfo players={players} currentPlayer={currentPlayer} myName={playerName} />
      </footer>

      {/* ── Round result overlay ───────────────────────────────────────────── */}
      {phase === 'result' && roundResult && (
        <RoundResult result={roundResult} myName={playerName} onClose={handleResultClose} />
      )}
    </div>
  );
}
