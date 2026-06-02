import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlayer } from '../../../shared/context/PlayerContext';
import { useRajaRani } from '../context/RajaRaniContext';
import { getSocket } from '../../../shared/socket/socket';
import api from '../../../shared/utils/api';
import SparkleLayer from '../../../shared/components/SparkleLayer';

export default function RajaRaniLobbyPage() {
  const { code } = useParams();
  const { playerName } = usePlayer();
  const { isHost, initRoom } = useRajaRani();
  const [room, setRoom] = useState(null);
  const [copied, setCopied] = useState(false);
  const joined = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!playerName) { navigate('/rajarani'); return; }
    const roomCode = code.toUpperCase();
    const samePlayer = (a, b) => a?.trim().toLowerCase() === b?.trim().toLowerCase();
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    socket.on('rajarani:lobbyUpdate', (nextRoom) => {
      setRoom(nextRoom);
      initRoom({ roomCode: nextRoom.roomCode, maxPlayers: nextRoom.maxPlayers, isHost: samePlayer(nextRoom.hostName, playerName) });
    });
    socket.on('rajarani:countdown', () => navigate(`/rajarani/game/${code}`));
    socket.on('rajarani:error', (msg) => alert(msg));

    api.get(`/rajarani/rooms/${roomCode}`)
      .then(({ data }) => {
        if (!data.success) return;
        setRoom(data.room);
        initRoom({ roomCode: data.room.roomCode, maxPlayers: data.room.maxPlayers, isHost: samePlayer(data.room.hostName, playerName) });
        if (data.room.status === 'active') navigate(`/rajarani/game/${roomCode}`);
      })
      .catch((err) => {
        alert(err.response?.data?.error || 'Room not found');
        navigate('/rajarani/dashboard');
      });

    if (!joined.current) {
      joined.current = true;
      socket.emit('rajarani:room:join', { roomCode, playerName });
    }

    return () => {
      socket.off('rajarani:lobbyUpdate');
      socket.off('rajarani:countdown');
      socket.off('rajarani:error');
    };
  }, [code, playerName, navigate, initRoom]);

  const start = () => getSocket().emit('rajarani:start', { roomCode: code.toUpperCase(), playerName });
  const copy = () => navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  const players = room?.players || [];
  const connectedCount = players.filter((p) => p.connected).length;
  const host = players.some((p) => p.isHost && p.name?.trim().toLowerCase() === playerName?.trim().toLowerCase()) || room?.hostName?.trim().toLowerCase() === playerName?.trim().toLowerCase() || isHost;

  return (
    <>
      <div className="table-bg" />
      <SparkleLayer />
      <div className="center-screen">
        <div className="code-display" onClick={copy} style={{ cursor: 'pointer' }}>
          <div className="label">Room Code</div>
          <div className="code">{code}</div>
          <div className="sub">{copied ? 'Copied' : 'Tap to copy'}</div>
        </div>
        <div className="mini-stats">
          <div className="mini-stat"><div className="v">{connectedCount}</div><div className="l">Ready</div></div>
          <div className="mini-stat"><div className="v">{room?.maxPlayers || 4}</div><div className="l">Max</div></div>
          <div className="mini-stat"><div className="v">4</div><div className="l">Minimum</div></div>
        </div>
        <div style={{ width: '100%', maxWidth: 520, display: 'grid', gap: 8 }}>
          {players.map((p) => (
            <div key={p.name} className={`player-row${p.connected ? '' : ' waiting'}`}>
              <div className="player-avatar">{p.name[0]?.toUpperCase()}</div>
              <div className="name">{p.name}</div>
              <span className="badge">{p.isHost ? 'Host' : p.connected ? 'Ready' : 'Offline'}</span>
            </div>
          ))}
        </div>
        {host ? (
          <button className="btn btn-gold" disabled={connectedCount < 4} onClick={start} style={{ marginTop: 18 }}>
            {connectedCount < 4 ? 'Need 4 Ready Players' : 'Start Game →'}
          </button>
        ) : (
          <p className="muted center" style={{ marginTop: 16 }}>Waiting for host to start...</p>
        )}
      </div>
    </>
  );
}
