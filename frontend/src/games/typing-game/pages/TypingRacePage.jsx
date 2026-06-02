import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlayer } from '../../../shared/context/PlayerContext';
import { getSocket } from '../../../shared/socket/socket';
import { useTypingInput } from '../shared/hooks/useTypingInput';
import { computeWpm, computeAccuracy } from '../shared/utils/typingMath';
import ParagraphView from '../friends/components/ParagraphView';
import Track from '../friends/components/Track';
import ProgressLeaderboard from '../friends/components/ProgressLeaderboard';
import Countdown from '../friends/components/Countdown';
import SparkleLayer from '../../../shared/components/SparkleLayer';
import '../styles/typing.css';

const VEHICLE_VIEW_MAX = 8;
const PROGRESS_SEND_INTERVAL_MS = 200;

export default function TypingRacePage() {
  const { code } = useParams();
  const { playerName } = usePlayer();
  const navigate = useNavigate();

  const [paragraph, setParagraph] = useState('');
  const [phase, setPhase] = useState('countdown'); // 'countdown' | 'racing' | 'ended'
  const [countdownSeconds, setCountdownSeconds] = useState(null);
  const [players, setPlayers] = useState([]); // [{ name, progress, finished, rank, wpm, accuracy }]
  const [wrongAt, setWrongAt] = useState(null);
  const [startedAt, setStartedAt] = useState(null);
  const joined = useRef(false);

  // Local typing buffer is owned by useTypingInput (strict per-character).
  const racing = phase === 'racing';

  const typingInput = useTypingInput({
    target: paragraph,
    active: racing,
    strict: true,
  });
  const typingInputRef = useRef(typingInput);
  useEffect(() => { typingInputRef.current = typingInput; }, [typingInput]);
  const finishedRef = useRef(false);

  // Emit `typing:finished` exactly once when the local buffer fills the paragraph.
  // Using an effect (not the hook's onComplete) guarantees that totalKeystrokes
  // and errors have committed to state before we read them.
  useEffect(() => {
    if (!racing) return;
    if (finishedRef.current) return;
    if (!paragraph) return;
    if (typingInput.correctChars < paragraph.length) return;
    finishedRef.current = true;
    getSocket().emit('typing:finished', {
      roomCode: code.toUpperCase(),
      playerName,
      correctChars: paragraph.length,
      totalKeystrokes: typingInput.totalKeystrokes,
      errors: typingInput.errors,
    });
  }, [racing, paragraph, typingInput.correctChars, typingInput.totalKeystrokes, typingInput.errors, code, playerName]);

  // Reset finish guard whenever we get a new paragraph.
  useEffect(() => { finishedRef.current = false; }, [paragraph]);

  // When a wrong char happens, paint that index briefly.
  useEffect(() => {
    // useTypingInput doesn't expose the position of the last wrong key directly,
    // but in strict mode any wrong attempt happens AT the current cursor.
    // We watch `errors` to flash the cursor position as wrong for a moment.
    if (!racing) return;
    if (typingInput.errors === 0) return;
    const at = typingInput.cursorIndex;
    setWrongAt(at);
    const tid = setTimeout(() => setWrongAt(null), 220);
    return () => clearTimeout(tid);
  }, [typingInput.errors, typingInput.cursorIndex, racing]);

  // Throttled progress emit.
  const lastSentRef = useRef({ at: 0, correctChars: -1 });
  useEffect(() => {
    if (!racing) return;
    const now = Date.now();
    const cc = typingInput.correctChars;
    if (cc === lastSentRef.current.correctChars) return;
    if (now - lastSentRef.current.at < PROGRESS_SEND_INTERVAL_MS) return;
    lastSentRef.current = { at: now, correctChars: cc };
    getSocket().emit('typing:progress', {
      roomCode: code.toUpperCase(),
      playerName,
      correctChars: cc,
      totalKeystrokes: typingInput.totalKeystrokes,
      errors: typingInput.errors,
    });
  }, [typingInput.correctChars, typingInput.totalKeystrokes, typingInput.errors, racing, code, playerName]);

  // Socket setup.
  useEffect(() => {
    if (!playerName) { navigate('/typing-game'); return; }
    const socket = getSocket();
    if (!socket.connected) socket.connect();
    if (!joined.current) {
      joined.current = true;
      socket.emit('typing:room:join', { roomCode: code.toUpperCase(), playerName });
    }

    const onStateSync = ({ state }) => {
      if (!state) return;
      if (state.phase === 'racing') {
        setParagraph(state.paragraph || '');
        setPhase('racing');
        setStartedAt(state.startedAt ? new Date(state.startedAt).getTime() : Date.now());
        setPlayers(state.players || []);
      } else if (state.phase === 'countdown') {
        setParagraph(state.paragraph || '');
        setPhase('countdown');
        setPlayers(state.players || []);
      } else if (state.phase === 'ended') {
        navigate(`/typing-game/results/${code}`, { state: { results: state.results || [] } });
      }
    };

    const onCountdown = ({ seconds, state }) => {
      setPhase('countdown');
      setCountdownSeconds(seconds);
      if (state?.players) setPlayers(state.players);
      if (state?.paragraph) setParagraph(state.paragraph);
    };
    const onRaceStart = ({ paragraph: p, startedAt: sa, state }) => {
      setParagraph(p);
      setStartedAt(sa ? new Date(sa).getTime() : Date.now());
      setPhase('racing');
      setCountdownSeconds(null);
      if (state?.players) setPlayers(state.players);
    };
    const onProgress = ({ players: pl }) => {
      setPlayers((prev) => prev.map((p) => {
        const updated = pl.find((u) => u.playerId === p.name);
        return updated ? { ...p, progress: updated.progress, finished: updated.finished } : p;
      }));
    };
    const onPlayerFinished = ({ playerId, rank, wpm, accuracy }) => {
      setPlayers((prev) => prev.map((p) =>
        p.name === playerId ? { ...p, finished: true, rank, wpm, accuracy, progress: 1 } : p
      ));
    };
    const onRaceOver = ({ results }) => {
      navigate(`/typing-game/results/${code}`, { state: { results } });
    };
    const onPlayerDnf = ({ playerId }) => {
      setPlayers((prev) => prev.map((p) => p.name === playerId ? { ...p, dnf: true } : p));
    };
    const onError = (payload) => alert(payload?.message || 'Error');

    socket.on('typing:state_sync', onStateSync);
    socket.on('typing:countdown', onCountdown);
    socket.on('typing:race_start', onRaceStart);
    socket.on('typing:progress_update', onProgress);
    socket.on('typing:player_finished', onPlayerFinished);
    socket.on('typing:race_over', onRaceOver);
    socket.on('typing:player_dnf', onPlayerDnf);
    socket.on('typing:error', onError);

    return () => {
      socket.off('typing:state_sync', onStateSync);
      socket.off('typing:countdown', onCountdown);
      socket.off('typing:race_start', onRaceStart);
      socket.off('typing:progress_update', onProgress);
      socket.off('typing:player_finished', onPlayerFinished);
      socket.off('typing:race_over', onRaceOver);
      socket.off('typing:player_dnf', onPlayerDnf);
      socket.off('typing:error', onError);
    };
  }, [code, playerName, navigate]);

  // Countdown ticker (local, mirrors server start delay).
  useEffect(() => {
    if (phase !== 'countdown' || countdownSeconds == null) return;
    if (countdownSeconds <= 0) return;
    const tid = setTimeout(() => setCountdownSeconds((s) => (s == null ? null : s - 1)), 1000);
    return () => clearTimeout(tid);
  }, [phase, countdownSeconds]);

  const myAccuracy = useMemo(() => computeAccuracy({
    correctChars: typingInput.correctChars,
    totalKeystrokes: typingInput.totalKeystrokes,
  }), [typingInput.correctChars, typingInput.totalKeystrokes]);

  // Recompute wpm once per second from the latest typing snapshot.
  const [myWpm, setMyWpm] = useState(0);
  useEffect(() => {
    if (!racing || !startedAt) return;
    const recompute = () => {
      setMyWpm(computeWpm({
        correctChars: typingInputRef.current?.correctChars ?? 0,
        elapsedMs: Date.now() - startedAt,
      }));
    };
    recompute();
    const id = setInterval(recompute, 1000);
    return () => clearInterval(id);
  }, [racing, startedAt]);

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      if (a.finished && b.finished) return (a.rank || 0) - (b.rank || 0);
      if (a.finished) return -1;
      if (b.finished) return 1;
      return (b.progress || 0) - (a.progress || 0);
    });
  }, [players]);

  const useLeaderboard = players.length > VEHICLE_VIEW_MAX;

  return (
    <>
      <div className="table-bg" />
      <SparkleLayer />
      <div className="tg-wrap">
        <div className="tg-top">
          <div className="brand">
            <div className="brand-mark">⌨️</div>
            <div className="brand-text"><div className="b1">Race</div><div className="b2">Room {code}</div></div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="tg-hud-pill">WPM <span className="v">{myWpm}</span></div>
            <div className="tg-hud-pill">Acc <span className="v">{myAccuracy}%</span></div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/typing-game/dashboard')}>Exit</button>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16, maxWidth: 1180, margin: '0 auto' }}>
          <ParagraphView paragraph={paragraph} cursorIndex={typingInput.cursorIndex} wrongAt={wrongAt} />

          <div className="tg-panel">
            {useLeaderboard ? (
              <ProgressLeaderboard players={sortedPlayers} myName={playerName} />
            ) : (
              sortedPlayers.map((p, i) => (
                <Track
                  key={p.name}
                  player={{ ...p, progress: p.name === playerName ? (paragraph.length ? typingInput.correctChars / paragraph.length : 0) : p.progress }}
                  isMe={p.name === playerName}
                  index={i}
                  total={sortedPlayers.length}
                />
              ))
            )}
          </div>
        </div>

        {phase === 'countdown' && countdownSeconds != null && countdownSeconds >= 0 && (
          <Countdown seconds={countdownSeconds} />
        )}
      </div>
    </>
  );
}
