import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { usePlayer } from '../../../shared/context/PlayerContext';
import { getSocket } from '../../../shared/socket/socket';
import SparkleLayer from '../../../shared/components/SparkleLayer';
import PlayerResultRow from '../friends/components/PlayerResultRow';
import api from '../../../shared/utils/api';
import '../styles/typing.css';

export default function TypingResultsPage() {
  const { code } = useParams();
  const { playerName } = usePlayer();
  const location = useLocation();
  const navigate = useNavigate();
  const [results, setResults] = useState(location.state?.results || []);

  useEffect(() => {
    if (results.length) return;
    api.get(`/typing/rooms/${code}/state`)
      .then(({ data }) => setResults(data.state?.results || []))
      .catch(() => {});
  }, [code, results.length]);

  useEffect(() => {
    const socket = getSocket();
    const onRematch = () => navigate(`/typing-game/lobby/${code}`);
    socket.on('typing:rematch_ready', onRematch);
    return () => socket.off('typing:rematch_ready', onRematch);
  }, [code, navigate]);

  const rematch = () => {
    getSocket().emit('typing:rematch', { roomCode: code.toUpperCase(), playerName });
    navigate(`/typing-game/lobby/${code}`);
  };

  return (
    <>
      <div className="table-bg" />
      <SparkleLayer />
      <div className="center-screen">
        <div className="field-card tg-panel" style={{ width: '100%', maxWidth: 720 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <h2 style={{
                fontFamily: 'var(--font-brand)',
                fontSize: 24, margin: 0,
                background: 'linear-gradient(180deg, var(--gold-bright), var(--gold))',
                WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>Final Standings</h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-dim)', fontSize: 12 }}>Room {code}</p>
            </div>
            <button className="btn btn-gold btn-sm" onClick={rematch}>Rematch</button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr 70px 70px 70px',
            gap: 8,
            padding: '6px 12px',
            fontSize: 10,
            letterSpacing: '0.18em',
            color: 'var(--purple-soft)',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}>
            <div>Rank</div><div>Name</div>
            <div style={{ textAlign: 'right' }}>WPM</div>
            <div style={{ textAlign: 'right' }}>Accuracy</div>
            <div style={{ textAlign: 'right' }}>Time</div>
          </div>

          <div>
            {results.map((r) => (
              <PlayerResultRow key={r.playerId || r.name} result={r} isMe={r.name === playerName} />
            ))}
            {!results.length && (
              <p className="muted center" style={{ padding: 20 }}>No results found.</p>
            )}
          </div>

          <button className="btn btn-ghost" style={{ marginTop: 12, width: '100%' }} onClick={() => navigate('/')}>
            Back to Hub
          </button>
        </div>
      </div>
    </>
  );
}
