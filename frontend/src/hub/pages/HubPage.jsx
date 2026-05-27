import { useNavigate } from 'react-router-dom';
import SparkleLayer from '../../shared/components/SparkleLayer';

const GAMES = [
  {
    id: 'trumpcard',
    icon: '🃏',
    title: 'Anime Trumpcard',
    description: 'Battle with anime character stats in this multiplayer card showdown. Compete across 6 epic stats to collect all cards and dominate the table.',
    tags: ['2–4 Players', 'Multiplayer', 'Strategy'],
    status: 'live',
    path: '/trumpcard',
    accent: 'var(--gold)',
    glow: 'rgba(240, 199, 80, 0.25)',
  },
  {
    id: 'cricket',
    icon: '🏏',
    title: 'Hand Cricket',
    description: 'Face off in the classic hand cricket showdown. Pick your number, outsmart your opponent, and chase the target to become the ultimate champion.',
    tags: ['2 Players', '1v1', 'Casual'],
    status: 'live',
    path: '/hand-cricket',
    accent: 'var(--cyan)',
    glow: 'rgba(94, 236, 255, 0.18)',
  },
  {
    id: 'mystery',
    icon: '🎯',
    title: '??? Coming Soon',
    description: 'A brand new game is in the works. Stay tuned — something legendary is about to drop in the GameHub arena.',
    tags: ['Multiplayer', 'TBA'],
    status: 'soon',
    path: null,
    accent: 'var(--pink)',
    glow: 'rgba(255, 93, 158, 0.15)',
  },
];

export default function HubPage() {
  const navigate = useNavigate();

  const scrollToGames = () => {
    document.getElementById('games-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <div className="table-bg" />
      <SparkleLayer />

      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>

        {/* ── Navbar ─────────────────────────────────────────────────────────── */}
        <nav style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 28px',
          background: 'rgba(6, 2, 26, 0.75)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(154, 92, 255, 0.18)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'linear-gradient(135deg, var(--purple-bright), var(--purple))',
              display: 'grid',
              placeItems: 'center',
              fontSize: 20,
              boxShadow: '0 0 0 1px var(--gold), 0 0 20px var(--purple-glow)',
            }}>
              🎮
            </div>
            <div>
              <div style={{ fontSize: 9, letterSpacing: '0.22em', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>The</div>
              <div style={{
                fontFamily: 'var(--font-brand)',
                fontSize: 17,
                fontWeight: 700,
                background: 'linear-gradient(180deg, var(--gold-bright), var(--gold))',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1,
              }}>
                GameHub
              </div>
            </div>
          </div>

          {/* Nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={scrollToGames}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                background: 'transparent',
                border: '1px solid var(--line-strong)',
                color: 'var(--purple-soft)',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.1em',
                cursor: 'pointer',
                transition: 'all 0.18s',
                fontFamily: 'var(--font-body)',
              }}
              onMouseEnter={e => { e.target.style.background = 'var(--surface-light)'; e.target.style.color = 'white'; }}
              onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--purple-soft)'; }}
            >
              Games
            </button>
          </div>
        </nav>

        {/* ── Hero Section ──────────────────────────────────────────────────── */}
        <section style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: 'clamp(60px, 10vh, 100px) 24px clamp(40px, 8vh, 80px)',
          minHeight: '60vh',
        }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            background: 'rgba(154, 92, 255, 0.12)',
            border: '1px solid rgba(154, 92, 255, 0.35)',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.18em',
            color: 'var(--purple-soft)',
            textTransform: 'uppercase',
            marginBottom: 28,
            animation: 'badge-glow 2.5s ease-in-out infinite',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', boxShadow: '0 0 8px var(--green)', animation: 'pulse-dot 1.8s ease-in-out infinite' }} />
            Live — Play Now
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: 'var(--font-brand)',
            fontSize: 'clamp(44px, 9vw, 88px)',
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: '0.03em',
            background: 'linear-gradient(180deg, #fff 0%, var(--gold-bright) 30%, var(--gold) 60%, var(--gold-deep) 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 4px 30px rgba(240, 199, 80, 0.45))',
            margin: '0 0 16px',
          }}>
            GameHub
          </h1>

          <p style={{
            fontSize: 'clamp(13px, 2.5vw, 17px)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--purple-soft)',
            fontWeight: 500,
            margin: '0 0 32px',
            maxWidth: 500,
          }}>
            Your Ultimate Multiplayer Gaming Destination
          </p>

          <p style={{
            fontSize: 'clamp(13px, 2vw, 15px)',
            color: 'var(--text-soft)',
            lineHeight: 1.7,
            maxWidth: 520,
            margin: '0 0 40px',
          }}>
            Jump into intense multiplayer games with friends. From anime card battles to cricket showdowns — the arena is always open.
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              className="btn btn-gold"
              onClick={() => navigate('/trumpcard')}
              style={{ fontSize: 13, padding: '14px 32px' }}
            >
              Play Now →
            </button>
            <button
              className="btn btn-ghost"
              onClick={scrollToGames}
              style={{ fontSize: 13, padding: '14px 28px' }}
            >
              Browse Games
            </button>
          </div>

          {/* Stats row */}
          <div style={{
            display: 'flex',
            gap: 32,
            marginTop: 56,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            {[
              { value: '2', label: 'Games Available' },
              { value: '4', label: 'Max Players' },
              { value: '52', label: 'Anime Cards' },
              { value: '∞', label: 'Fun' },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'var(--font-brand)',
                  fontSize: 28,
                  fontWeight: 700,
                  color: 'var(--gold)',
                  textShadow: '0 0 16px rgba(240, 199, 80, 0.4)',
                  lineHeight: 1,
                }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 10, letterSpacing: '0.16em', color: 'var(--text-dim)', textTransform: 'uppercase', marginTop: 4, fontWeight: 600 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Divider ────────────────────────────────────────────────────────── */}
        <div style={{
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(154, 92, 255, 0.4), rgba(240, 199, 80, 0.3), rgba(154, 92, 255, 0.4), transparent)',
          margin: '0 24px',
        }} />

        {/* ── Games Section ─────────────────────────────────────────────────── */}
        <section id="games-section" style={{ padding: 'clamp(48px, 8vh, 80px) clamp(16px, 5vw, 60px)' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 10, letterSpacing: '0.26em', color: 'var(--purple-soft)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 10 }}>
              Choose Your Battle
            </p>
            <h2 style={{
              fontFamily: 'var(--font-brand)',
              fontSize: 'clamp(26px, 5vw, 40px)',
              fontWeight: 800,
              background: 'linear-gradient(180deg, #fff 0%, var(--text-soft) 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0,
            }}>
              Available Games
            </h2>
          </div>

          {/* Game cards grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
            maxWidth: 1000,
            margin: '0 auto',
          }}>
            {GAMES.map((game) => (
              <GameCard key={game.id} game={game} onPlay={() => navigate(game.path)} />
            ))}
          </div>
        </section>

        {/* ── Footer ─────────────────────────────────────────────────────────── */}
        <footer style={{
          padding: '28px 24px',
          textAlign: 'center',
          borderTop: '1px solid rgba(154, 92, 255, 0.12)',
        }}>
          <p style={{ color: 'var(--text-dim)', fontSize: 12, letterSpacing: '0.08em' }}>
            GameHub · Built for fun · More games coming soon
          </p>
        </footer>
      </div>

      <style>{`
        @keyframes badge-glow {
          0%, 100% { box-shadow: 0 0 0px rgba(154, 92, 255, 0); }
          50% { box-shadow: 0 0 16px rgba(154, 92, 255, 0.3); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.7); }
        }
      `}</style>
    </>
  );
}

function GameCard({ game, onPlay }) {
  const isLive = game.status === 'live';

  return (
    <div
      style={{
        position: 'relative',
        background: 'var(--surface-strong)',
        border: `1px solid ${isLive ? 'rgba(154, 92, 255, 0.3)' : 'rgba(154, 92, 255, 0.15)'}`,
        borderRadius: 20,
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        backdropFilter: 'blur(12px)',
        boxShadow: `0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)`,
        transition: 'transform 0.22s, box-shadow 0.22s, border-color 0.22s',
        opacity: isLive ? 1 : 0.72,
        cursor: isLive ? 'pointer' : 'default',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        if (!isLive) return;
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = game.accent;
        e.currentTarget.style.boxShadow = `0 28px 70px rgba(0,0,0,0.5), 0 0 30px ${game.glow}, 0 0 0 1px rgba(255,255,255,0.06)`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.borderColor = isLive ? 'rgba(154, 92, 255, 0.3)' : 'rgba(154, 92, 255, 0.15)';
        e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)';
      }}
    >
      {/* Glow blob */}
      <div style={{
        position: 'absolute',
        top: -30,
        right: -30,
        width: 120,
        height: 120,
        borderRadius: '50%',
        background: game.glow,
        filter: 'blur(40px)',
        pointerEvents: 'none',
        opacity: isLive ? 1 : 0.5,
      }} />

      {/* Status badge */}
      <div style={{ position: 'absolute', top: 16, right: 16 }}>
        {isLive ? (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            borderRadius: 999,
            background: 'rgba(94, 224, 138, 0.12)',
            border: '1px solid rgba(94, 224, 138, 0.35)',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--green)',
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', boxShadow: '0 0 6px var(--green)' }} />
            Live
          </span>
        ) : (
          <span style={{
            padding: '4px 10px',
            borderRadius: 999,
            background: 'rgba(154, 92, 255, 0.1)',
            border: '1px solid rgba(154, 92, 255, 0.25)',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--text-dim)',
          }}>
            Soon
          </span>
        )}
      </div>

      {/* Icon */}
      <div style={{
        fontSize: 44,
        lineHeight: 1,
        filter: isLive ? `drop-shadow(0 4px 20px ${game.glow})` : 'none',
      }}>
        {game.icon}
      </div>

      {/* Title */}
      <h3 style={{
        fontFamily: 'var(--font-brand)',
        fontSize: 20,
        fontWeight: 700,
        margin: 0,
        background: isLive
          ? `linear-gradient(135deg, ${game.accent}, white)`
          : 'linear-gradient(135deg, var(--text-dim), var(--text-soft))',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        {game.title}
      </h3>

      {/* Description */}
      <p style={{
        color: 'var(--text-soft)',
        fontSize: 13,
        lineHeight: 1.65,
        margin: 0,
        flex: 1,
      }}>
        {game.description}
      </p>

      {/* Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {game.tags.map((tag) => (
          <span key={tag} className="chip" style={{ fontSize: 11 }}>{tag}</span>
        ))}
      </div>

      {/* CTA */}
      {isLive ? (
        <button
          className="btn btn-gold"
          style={{ width: '100%', fontSize: 13 }}
          onClick={onPlay}
        >
          Play Now →
        </button>
      ) : (
        <button
          className="btn btn-ghost"
          style={{ width: '100%', fontSize: 13, opacity: 0.6, cursor: 'not-allowed' }}
          disabled
        >
          Coming Soon
        </button>
      )}
    </div>
  );
}
