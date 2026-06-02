import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlayer } from '../../../shared/context/PlayerContext';
import { getSocket } from '../../../shared/socket/socket';
import SparkleLayer from '../../../shared/components/SparkleLayer';
import CharacterCard from '../components/CharacterCard';
import PlayerSeat from '../components/PlayerSeat';
import ScoreTable from '../components/ScoreTable';
import SearchPopup from '../components/SearchPopup';
import TurnTimer from '../components/TurnTimer';
import { characterInfo } from '../utils/rajaRaniConfig';
import '../utils/rajaRaniStyles.css';

export default function RajaRaniGamePage() {
  const { code } = useParams();
  const { playerName } = usePlayer();
  const [state, setState] = useState(null);
  const [myCard, setMyCard] = useState(null);
  const [turn, setTurn] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [viewed, setViewed] = useState(false);
  const [rajaId, setRajaId] = useState(null);
  const [message, setMessage] = useState('');
  const joined = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!playerName) { navigate('/rajarani'); return; }
    const socket = getSocket();
    if (!socket.connected) socket.connect();
    if (!joined.current) {
      joined.current = true;
      socket.emit('rajarani:room:join', { roomCode: code, playerName });
    }

    socket.on('rajarani:stateSync', ({ state: nextState }) => {
      setState(nextState);
      // Game page misses the countdown event (fired before this page mounts from lobby nav)
      // so initialize the countdown timer here when the synced phase is countdown
      if (nextState?.phase === 'countdown') setCountdown((c) => (c == null ? 10 : c));
      if (nextState?.phase === 'ended' && nextState?.results) {
        navigate(`/rajarani/results/${code}`, { state: { results: nextState.results } });
      }
    });
    socket.on('rajarani:countdown', ({ state: nextState, secondsLeft }) => {
      setState(nextState);
      setCountdown(secondsLeft);
    });
    socket.on('rajarani:dealt', ({ state: nextState }) => {
      setState(nextState);
      setCountdown(null);
      setMessage('Cards dealt. View your secret card.');
    });
    socket.on('rajarani:yourCard', ({ character }) => setMyCard(character));
    socket.on('rajarani:viewState', ({ state: nextState }) => setState(nextState));
    socket.on('rajarani:rajaRevealed', ({ playerId, name, state: nextState }) => {
      setRajaId(playerId);
      setState(nextState);
      setMessage(`${name} is Raja`);
    });
    socket.on('rajarani:turn', (payload) => {
      setTurn(payload);
      setState(payload.state);
      setMessage(`${payload.searcherName} must find ${characterInfo(payload.targetCharacter).label}`);
    });
    socket.on('rajarani:pickResult', ({ pickedName, pickedCharacter, correct, source }) => {
      setMessage(`${source === 'timeout' ? 'Auto-picked' : 'Picked'} ${pickedName}: ${characterInfo(pickedCharacter).label} ${correct ? '✓' : '✕'}`);
    });
    socket.on('rajarani:swap', ({ state: nextState }) => setState(nextState));
    socket.on('rajarani:locked', ({ state: nextState }) => { if (nextState) setState(nextState); });
    socket.on('rajarani:afk', () => {});
    socket.on('rajarani:ended', ({ results, state: nextState }) => {
      setState(nextState);
      setTurn(null);
      navigate(`/rajarani/results/${code}`, { state: { results } });
    });
    socket.on('rajarani:error', (msg) => alert(msg));

    return () => {
      ['rajarani:stateSync', 'rajarani:countdown', 'rajarani:dealt', 'rajarani:yourCard', 'rajarani:viewState', 'rajarani:rajaRevealed', 'rajarani:turn', 'rajarani:pickResult', 'rajarani:swap', 'rajarani:locked', 'rajarani:afk', 'rajarani:ended', 'rajarani:error'].forEach((event) => socket.off(event));
    };
  }, [code, playerName, navigate]);

  useEffect(() => {
    if (countdown == null) return;
    const id = setInterval(() => setCountdown((n) => (n > 0 ? n - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  const mySeat = useMemo(() => state?.seats?.find((seat) => seat.name === playerName), [state, playerName]);
  const isMyTurn = turn?.searcherId === playerName;
  const chainOrder = state?.chainOrder || [];

  const viewCard = () => {
    setViewed(true);
    getSocket().emit('rajarani:viewCard', { roomCode: code, playerName });
  };

  const pick = (targetPlayerId) => {
    getSocket().emit('rajarani:pick', { roomCode: code, playerName, targetPlayerId });
  };

  if (!state || state.phase === 'countdown') {
    return (
      <>
        <div className="table-bg" />
        <SparkleLayer />
        <div className="center-screen">
          <ScoreTable chainOrder={chainOrder} secondsLeft={countdown ?? 10} />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="table-bg" />
      <SparkleLayer />
      <div className="rr-game">
        <div className="rr-top">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/rajarani/lobby/${code}`)}>Lobby</button>
          <div className="code-display mini"><div className="label">Room</div><div className="code">{code}</div></div>
          {turn?.deadline && <TurnTimer deadline={turn.deadline} />}
        </div>

        <div className="rr-table">
          <div className="rr-center">
            <CharacterCard character={viewed || mySeat?.viewed ? myCard : null} hidden={!(viewed || mySeat?.viewed)} viewed={viewed || mySeat?.viewed} />
            <button className="btn btn-gold" disabled={state.phase !== 'viewing' || mySeat?.viewed} onClick={viewCard}>
              {mySeat?.viewed ? 'Card Viewed' : 'View Card'}
            </button>
            <p className="muted center">{message || 'Waiting for the court...'}</p>
          </div>

          <div className="rr-seats">
            {state.seats.map((seat) => (
              <PlayerSeat
                key={seat.playerId}
                seat={seat}
                isMe={seat.name === playerName}
                isSearcher={turn?.searcherId === seat.playerId}
                rajaId={rajaId}
              />
            ))}
          </div>
        </div>

        {isMyTurn && (
          <SearchPopup
            targetLabel={characterInfo(turn.targetCharacter).label}
            seats={state.seats}
            eligibleIds={turn.eligiblePlayerIds || []}
            onPick={pick}
          />
        )}
      </div>
    </>
  );
}
