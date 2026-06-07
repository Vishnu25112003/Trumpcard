import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlayer } from '../../../../shared/context/PlayerContext';
import { getSocket } from '../../../../shared/socket/socket';
import { useTypingInput } from '../../../typing-game/shared/hooks/useTypingInput';
import RaceScene from '../scene/RaceScene';
import ParagraphView from '../components/ParagraphView';
import Countdown from '../components/Countdown';
import RaceTimer from '../components/RaceTimer';
import RankPanel from '../components/RankPanel';
import { RACE_TUNING } from '../logic/tuning';
import '../styles/race.css';

export default function RacePage() {
  const { code } = useParams();
  const roomCode = code.toUpperCase();
  const { playerName } = usePlayer();
  const navigate = useNavigate();

  const [phase, setPhase] = useState('countdown'); // 'countdown' | 'racing' | 'ended'
  const [paragraph, setParagraph] = useState('');
  const [players, setPlayers] = useState([]);
  const [startedAt, setStartedAt] = useState(null);
  const [timeLimitSec, setTimeLimitSec] = useState(0);
  const [countdownSeconds, setCountdownSeconds] = useState(3);
  const [wrongAt, setWrongAt] = useState(null);

  const joined = useRef(false);
  const finishedSent = useRef(false);
  const lastSent = useRef({ at: 0, correctChars: -1 });
  const cursorRef = useRef(0);

  const onWrong = useCallback(() => setWrongAt(cursorRef.current), []);
  const onCorrect = useCallback(() => setWrongAt(null), []);

  const typing = useTypingInput({
    target: paragraph,
    active: phase === 'racing',
    strict: true,
    onWrongChar: onWrong,
    onCorrectChar: onCorrect,
  });
  useEffect(() => { cursorRef.current = typing.cursorIndex; }, [typing.cursorIndex]);

  const myProgress = paragraph.length ? Math.min(1, typing.correctChars / paragraph.length) : 0;

  // ── Local 3-2-1 countdown animation ──────────────────────────────────────
  useEffect(() => {
    if (phase !== 'countdown') return undefined;
    if (countdownSeconds <= 0) return undefined;
    const id = setTimeout(() => setCountdownSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, countdownSeconds]);

  // ── Throttled progress emit ──────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'racing') return;
    const cc = typing.correctChars;
    const now = Date.now();
    if (cc === lastSent.current.correctChars) return;
    if (now - lastSent.current.at < RACE_TUNING.PROGRESS_SEND_INTERVAL_MS) return;
    lastSent.current = { at: now, correctChars: cc };
    getSocket().emit('typing:progress', {
      roomCode, playerName,
      correctChars: cc,
      totalKeystrokes: typing.totalKeystrokes,
      errors: typing.errors,
    });
  }, [typing.correctChars, typing.totalKeystrokes, typing.errors, phase, roomCode, playerName]);

  // ── Finish once ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'racing' || !paragraph) return;
    if (finishedSent.current) return;
    if (typing.correctChars < paragraph.length) return;
    finishedSent.current = true;
    getSocket().emit('typing:finished', {
      roomCode, playerName,
      correctChars: paragraph.length,
      totalKeystrokes: typing.totalKeystrokes,
      errors: typing.errors,
    });
  }, [typing.correctChars, typing.totalKeystrokes, typing.errors, paragraph, phase, roomCode, playerName]);

  // ── Socket wiring ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!playerName) { navigate('/boom-typer/race'); return undefined; }
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const applyState = (state) => {
      if (!state) return;
      if (state.paragraph) setParagraph(state.paragraph);
      if (state.players) setPlayers(state.players);
      if (state.timeLimitSec) setTimeLimitSec(state.timeLimitSec);
      if (state.startedAt) setStartedAt(new Date(state.startedAt).getTime());
    };

    const onSync = ({ state }) => {
      if (!state) return;
      applyState(state);
      if (state.phase === 'racing') setPhase('racing');
      else if (state.phase === 'countdown') setPhase('countdown');
      else if (state.phase === 'ended') navigate(`/boom-typer/race/results/${roomCode}`, { state: { results: state.results || [] } });
    };
    const onCountdown = ({ seconds, timeLimitSec: tl, state }) => {
      setPhase('countdown');
      setCountdownSeconds(seconds ?? 3);
      if (tl) setTimeLimitSec(tl);
      applyState(state);
    };
    const onRaceStart = ({ paragraph: p, timeLimitSec: tl, startedAt: sa, state }) => {
      if (p) setParagraph(p);
      if (tl) setTimeLimitSec(tl);
      setStartedAt(sa ? new Date(sa).getTime() : Date.now());
      applyState(state);
      setPhase('racing');
    };
    const onProgress = ({ players: pl }) => {
      setPlayers((prev) => prev.map((p) => {
        const u = pl.find((x) => x.playerId === p.name);
        return u ? { ...p, progress: u.progress, finished: u.finished } : p;
      }));
    };
    const onFinished = ({ playerId, rank }) => {
      setPlayers((prev) => prev.map((p) => (p.name === playerId ? { ...p, finished: true, rank, progress: 1 } : p)));
    };
    const onOver = ({ results }) => {
      navigate(`/boom-typer/race/results/${roomCode}`, { state: { results } });
    };
    const onDnf = ({ playerId }) => {
      setPlayers((prev) => prev.map((p) => (p.name === playerId ? { ...p, connected: false } : p)));
    };

    socket.on('typing:state_sync', onSync);
    socket.on('typing:countdown', onCountdown);
    socket.on('typing:race_start', onRaceStart);
    socket.on('typing:progress_update', onProgress);
    socket.on('typing:player_finished', onFinished);
    socket.on('typing:race_over', onOver);
    socket.on('typing:player_dnf', onDnf);

    if (!joined.current) {
      joined.current = true;
      socket.emit('typing:room:join', { roomCode, playerName });
    }

    return () => {
      socket.off('typing:state_sync', onSync);
      socket.off('typing:countdown', onCountdown);
      socket.off('typing:race_start', onRaceStart);
      socket.off('typing:progress_update', onProgress);
      socket.off('typing:player_finished', onFinished);
      socket.off('typing:race_over', onOver);
      socket.off('typing:player_dnf', onDnf);
    };
  }, [roomCode, playerName, navigate]);

  const quit = () => {
    getSocket().emit('typing:leave', { roomCode, playerName });
    navigate('/boom-typer/race');
  };

  return (
    <div className="bt-race-root">
      <RaceScene players={players} localName={playerName} localProgress={myProgress} />

      <button className="bt-hub-exit over" onClick={quit}>← Quit</button>

      {phase === 'racing' && <RaceTimer startedAt={startedAt} timeLimitSec={timeLimitSec} />}

      {(phase === 'racing' || phase === 'countdown') && (
        <RankPanel players={players} localName={playerName} localProgress={myProgress} />
      )}

      {phase === 'countdown' && <Countdown seconds={countdownSeconds} />}

      {phase === 'racing' && (
        <div className="bt-type-dock">
          <ParagraphView paragraph={paragraph} cursorIndex={typing.cursorIndex} wrongAt={wrongAt} />
          <div className="bt-type-hint">{Math.round(myProgress * 100)}% · keep your eyes on the text</div>
        </div>
      )}
    </div>
  );
}
