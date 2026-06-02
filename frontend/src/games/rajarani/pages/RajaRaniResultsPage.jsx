import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { usePlayer } from '../../../shared/context/PlayerContext';
import { getSocket } from '../../../shared/socket/socket';
import SparkleLayer from '../../../shared/components/SparkleLayer';
import { characterInfo } from '../utils/rajaRaniConfig';
import '../utils/rajaRaniStyles.css';

export default function RajaRaniResultsPage() {
  const { code } = useParams();
  const { playerName } = usePlayer();
  const location = useLocation();
  const navigate = useNavigate();
  const [results, setResults] = useState(location.state?.results || []);

  useEffect(() => {
    if (results.length) return;
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/rajarani/rooms/${code}/state`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setResults(data.state?.results || []))
      .catch(() => {});
  }, [code, results.length]);

  const rematch = () => {
    getSocket().emit('rajarani:rematch', { roomCode: code, playerName });
    navigate(`/rajarani/lobby/${code}`);
  };

  return (
    <>
      <div className="table-bg" />
      <SparkleLayer />
      <div className="center-screen">
        <div className="field-card rr-panel" style={{ width: '100%', maxWidth: 620 }}>
          <div className="rr-panel-head">
            <div><h2>Final Court</h2><p>Room {code}</p></div>
            <button className="btn btn-gold btn-sm" onClick={rematch}>Rematch</button>
          </div>
          <div className="rr-results">
            {results.map((row) => {
              const info = characterInfo(row.character);
              return (
                <div key={row.playerId} className="rr-result-row">
                  <span>#{row.rank}</span>
                  <strong>{row.name}</strong>
                  <em style={{ color: info.color }}>{info.icon} {info.label}</em>
                  <b>{row.score}</b>
                </div>
              );
            })}
          </div>
          <button className="btn btn-ghost" onClick={() => navigate('/')}>Back to Hub</button>
        </div>
      </div>
    </>
  );
}
