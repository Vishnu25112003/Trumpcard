import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../../shared/context/GameContext';
import { useTrumpcard } from '../context/TrumpcardContext';
import api from '../../../shared/utils/api';
import SparkleLayer from '../../../shared/components/SparkleLayer';

const CARDS_PER_PLAYER_OPTIONS = { 2: [10, 13, 17, 20, 26], 3: [10, 13, 17], 4: [10, 13] };

const MATCH_DURATION_OPTIONS = [
  { label: 'No Limit', value: 0 },
  { label: '5 min',    value: 300 },
  { label: '10 min',   value: 600 },
  { label: '15 min',   value: 900 },
  { label: '20 min',   value: 1200 },
];

function TopBar({ playerName, onChangeName }) {
  return (
    <div className="top-bar">
      <div className="brand">
        <div className="brand-mark">T</div>
        <div className="brand-text">
          <div className="b1">Anime</div>
          <div className="b2">Trumpcard</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>
          Playing as <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{playerName}</span>
        </span>
        <button className="btn btn-ghost btn-sm" onClick={onChangeName}>
          Change
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { playerName, clearName } = useGame();
  const { setCurrentRoom } = useTrumpcard();
  const navigate = useNavigate();

  const [tab, setTab]                       = useState('create');
  const [totalPlayers, setTotalPlayers]     = useState(2);
  const [cardsPerPlayer, setCardsPerPlayer] = useState(10);
  const [matchDuration, setMatchDuration]   = useState(0);
  const [creating, setCreating]             = useState(false);
  const [createError, setCreateError]       = useState('');
  const [roomCode, setRoomCode]             = useState('');
  const [joining, setJoining]               = useState(false);
  const [joinError, setJoinError]           = useState('');

  const handlePlayerCountChange = (count) => {
    setTotalPlayers(count);
    setCardsPerPlayer(CARDS_PER_PLAYER_OPTIONS[count][0]);
  };

  const handleCreate = async () => {
    setCreating(true); setCreateError('');
    try {
      const res  = await api.post('/rooms/create', { createdBy: playerName, totalPlayers, cardsPerPlayer, matchDuration });
      const room = res.data.data;
      setCurrentRoom(room);
      navigate(`/trumpcard/lobby/${room.roomCode}`);
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Failed to create room');
    } finally { setCreating(false); }
  };

  const handleJoin = async () => {
    const code = roomCode.trim().toUpperCase();
    if (!code) { setJoinError('Enter a room code'); return; }
    setJoining(true); setJoinError('');
    try {
      const res  = await api.post('/rooms/join', { roomCode: code, playerName });
      const room = res.data.data;
      setCurrentRoom(room);
      navigate(`/trumpcard/lobby/${room.roomCode}`);
    } catch (err) {
      setJoinError(err.response?.data?.error || 'Failed to join room');
    } finally { setJoining(false); }
  };

  return (
    <>
      <div className="table-bg" />
      <SparkleLayer />
      <TopBar playerName={playerName} onChangeName={() => { clearName(); navigate('/'); }} />

      <div className="center-screen" style={{ justifyContent: 'flex-start', paddingTop: 100 }}>
        {/* Welcome */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 4vw, 28px)', color: 'var(--text)', margin: 0 }}>
            Welcome, <span style={{ color: 'var(--gold)' }}>{playerName}</span>!
          </h2>
          <p style={{ color: 'var(--text-dim)', marginTop: 6, fontSize: 13 }}>
            Create a table or join one with a code
          </p>
        </div>

        {/* Tab switch */}
        <div className="tab-switch" style={{ width: '100%', maxWidth: 400 }}>
          <button
            className={tab === 'create' ? 'active' : ''}
            onClick={() => setTab('create')}
          >
            + Create Table
          </button>
          <button
            className={tab === 'join' ? 'active' : ''}
            onClick={() => setTab('join')}
          >
            &#x2192; Join Table
          </button>
        </div>

        {/* Create form */}
        {tab === 'create' && (
          <div className="field-card stack" style={{ width: '100%', maxWidth: 400 }}>
            {/* Player count */}
            <div>
              <label className="field-label">Number of Players</label>
              <div className="option-grid cols-3">
                {[2, 3, 4].map((n) => (
                  <button
                    key={n}
                    className={`opt ${totalPlayers === n ? 'active' : ''}`}
                    onClick={() => handlePlayerCountChange(n)}
                  >
                    {n} Players
                  </button>
                ))}
              </div>
            </div>

            {/* Cards per player */}
            <div>
              <label className="field-label">Cards per Player</label>
              <div className="option-grid" style={{ gridTemplateColumns: `repeat(${CARDS_PER_PLAYER_OPTIONS[totalPlayers].length}, 1fr)` }}>
                {CARDS_PER_PLAYER_OPTIONS[totalPlayers].map((n) => (
                  <button
                    key={n}
                    className={`opt ${cardsPerPlayer === n ? 'active' : ''}`}
                    onClick={() => setCardsPerPlayer(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="muted" style={{ marginTop: 6, fontSize: 11 }}>
                {totalPlayers * cardsPerPlayer} / 52 cards used
              </p>
            </div>

            {/* Match Duration */}
            <div>
              <label className="field-label">Match Duration</label>
              <div className="option-grid" style={{ gridTemplateColumns: `repeat(${MATCH_DURATION_OPTIONS.length}, 1fr)` }}>
                {MATCH_DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`opt ${matchDuration === opt.value ? 'active' : ''}`}
                    onClick={() => setMatchDuration(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {createError && (
              <p style={{ color: 'var(--red)', fontSize: 12, background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.3)', borderRadius: 8, padding: '8px 12px' }}>
                {createError}
              </p>
            )}

            <button
              className="btn btn-purple"
              style={{ width: '100%' }}
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? (
                <>
                  <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                  Creating...
                </>
              ) : 'Create Room'}
            </button>
          </div>
        )}

        {/* Join form */}
        {tab === 'join' && (
          <div className="field-card stack" style={{ width: '100%', maxWidth: 400 }}>
            <div>
              <label className="field-label">Room Code</label>
              <input
                className="field-input code"
                type="text"
                value={roomCode}
                onChange={(e) => { setRoomCode(e.target.value.toUpperCase()); setJoinError(''); }}
                placeholder="ANIME-XXXX"
                maxLength={10}
              />
              {joinError && (
                <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 6 }}>{joinError}</p>
              )}
            </div>

            <button
              className="btn btn-purple"
              style={{ width: '100%' }}
              onClick={handleJoin}
              disabled={joining}
            >
              {joining ? (
                <>
                  <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                  Joining...
                </>
              ) : 'Join Room →'}
            </button>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
