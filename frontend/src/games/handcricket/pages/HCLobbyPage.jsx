import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlayer } from '../../../shared/context/PlayerContext';
import { useHC } from '../context/HCContext';
import { getSocket } from '../../../shared/socket/socket';
import SparkleLayer from '../../../shared/components/SparkleLayer';

export default function HCLobbyPage() {
  const { code }                   = useParams();
  const { playerName }             = usePlayer();
  const { myRole, roomSettings, initRoom, setHostName, setGuestName } = useHC();
  const navigate                   = useNavigate();

  const [hostN,   setHostN]   = useState('—');
  const [guestN,  setGuestN]  = useState(null);
  const [copied,  setCopied]  = useState(false);
  const [settings, setSettings] = useState(roomSettings);
  const didJoin = useRef(false);

  useEffect(() => {
    if (!playerName) { navigate('/hand-cricket'); return; }

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    if (!didJoin.current) {
      didJoin.current = true;
      socket.emit('hc:room:join', {
        roomCode:   code.toUpperCase(),
        playerName,
        role:       myRole || 'guest',
      });
    }

    socket.on('hc:room:updated', ({ hostName, guestName, settings: s }) => {
      setHostN(hostName || '—');
      setGuestN(guestName || null);
      if (s) setSettings(s);
      if (hostName) setHostName(hostName);
      if (guestName) setGuestName(guestName);
    });

    socket.on('hc:game:start', ({ hostName, guestName, settings: s }) => {
      setHostName(hostName); setGuestName(guestName);
      navigate(`/hand-cricket/play/${code}`, {
        state: { hostName, guestName, settings: s },
      });
    });

    socket.on('hc:error', (msg) => {
      alert(msg);
      navigate('/hand-cricket/dashboard');
    });

    return () => {
      socket.off('hc:room:updated');
      socket.off('hc:game:start');
      socket.off('hc:error');
    };
  }, [code, playerName, myRole, navigate, setHostName, setGuestName]);

  const copyCode = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const s = settings || {};

  return (
    <>
      <div className="table-bg" />
      <SparkleLayer />

      <div className="center-screen">
        {/* Room code */}
        <div className="code-display" style={{ cursor: 'pointer' }} onClick={copyCode}>
          <div className="label">Room Code</div>
          <div className="code">{code}</div>
          <div className="sub">{copied ? '✓ Copied!' : 'Tap to copy · Share with your friend'}</div>
        </div>

        {/* Game settings summary */}
        <div className="mini-stats">
          <div className="mini-stat">
            <div className="v">{s.mode === 'wicketBased' ? s.wickets : s.overs}</div>
            <div className="l">{s.mode === 'wicketBased' ? 'Wickets' : 'Overs'}</div>
          </div>
          <div className="mini-stat">
            <div className="v">1v1</div>
            <div className="l">Format</div>
          </div>
          <div className="mini-stat">
            <div className="v">7s</div>
            <div className="l">Per Ball</div>
          </div>
        </div>

        {/* Players */}
        <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <PlayerSlot name={hostN} label="Host" index={0} />
          <PlayerSlot name={guestN} label="Guest" index={1} waiting={!guestN} />
        </div>

        {!guestN && (
          <p style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 16, textAlign: 'center' }}>
            Waiting for opponent to join…
          </p>
        )}
      </div>
    </>
  );
}

function PlayerSlot({ name, label, index, waiting }) {
  const colors = ['var(--purple-bright)', 'var(--pink)'];
  return (
    <div className={`player-row${waiting ? ' waiting' : ''}`}>
      <div className={`player-avatar${index === 1 ? ' p2' : ''}`}>
        {waiting ? '?' : name?.[0]?.toUpperCase()}
      </div>
      <div style={{ flex: 1 }}>
        <div className="name">{waiting ? 'Waiting for player…' : name}</div>
      </div>
      <span className="badge badge-host" style={{ color: colors[index], borderColor: `${colors[index]}55`, background: `${colors[index]}18` }}>
        {label}
      </span>
    </div>
  );
}
