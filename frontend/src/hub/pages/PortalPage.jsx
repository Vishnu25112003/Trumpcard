import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/PortalPage.css';

const GAMES = [
  {
    id: 'trumpcard',
    title: 'Anime Trumpcard',
    icon: '🃏',
    accent: 'var(--pp-c-anime)',
    tags: ['2–4 Players', 'Multiplayer', 'Strategy'],
    cats: ['card', 'multiplayer'],
    desc: 'Battle anime character stats across 6 epic categories to collect every card and dominate the table.',
    path: '/trumpcard',
  },
  {
    id: 'hand-cricket',
    title: 'Hand Cricket',
    icon: '🏏',
    accent: 'var(--pp-c-cricket)',
    tags: ['2 Players', '1v1', 'Casual'],
    cats: ['multiplayer'],
    desc: 'Pick your number, outsmart your opponent, and chase the target in the classic 1v1 hand-cricket showdown.',
    path: '/hand-cricket',
  },
  {
    id: 'rajarani',
    title: 'Raja Rani',
    icon: '👑',
    accent: 'var(--pp-c-raja)',
    tags: ['4–10 Players', 'Room Code', 'Party'],
    cats: ['multiplayer', 'party'],
    desc: "Keep your card secret and follow the royal chain from Raja to Thief in this classic party game of bluff.",
    path: '/rajarani',
  },
  {
    id: 'boom-typer',
    title: 'Boom Typer',
    icon: '⌨️',
    accent: 'var(--pp-c-boom)',
    tags: ['Solo', 'Typing', 'Endless'],
    cats: ['solo'],
    desc: 'Blast falling booms by typing their words. Solo survival is live, with power booms that flood the screen.',
    path: '/boom-typer',
  },
];

const FILTERS = [
  { id: 'all', label: 'All Games' },
  { id: 'card', label: 'Card' },
  { id: 'multiplayer', label: 'Multiplayer' },
  { id: 'party', label: 'Party' },
  { id: 'solo', label: 'Solo' },
];

const LEADERBOARD = [
  { rank: 1, name: 'NovaStrike',   game: 'Anime Trumpcard · 38 wins', score: '14,820', color: 'linear-gradient(150deg,#ffcf6b,#e08a2a)', initial: 'N' },
  { rank: 2, name: 'PixelRaja',    game: 'Raja Rani · 31 wins',        score: '13,440', color: 'linear-gradient(150deg,#9a6bff,#6431c4)', initial: 'P' },
  { rank: 3, name: 'AceOfBats',    game: 'Hand Cricket · 29 wins',     score: '12,910', color: 'linear-gradient(150deg,#58c8ff,#2a6fb0)', initial: 'A' },
  { rank: 4, name: 'KeyboardKid',  game: 'Boom Typer · 24 wins',       score: '11,760', color: 'linear-gradient(150deg,#46e0a0,#1f8a5b)', initial: 'K' },
];

const ACTIVITY = [
  { icon: '👑', text: <><b>ShadowByte</b> opened a Raja Rani room <b>#4821</b></>, when: 'Just now · 6/10 players' },
  { icon: '🏏', text: <><b>MintFox</b> won a Hand Cricket match</>,               when: '2 min ago' },
  { icon: '⌨️', text: <><b>Kiyo</b> set a new Boom Typer high score</>,           when: '8 min ago · 1,204 pts' },
  { icon: '🃏', text: <><b>NovaStrike</b> is on a 5-win streak in Anime Trumpcard</>, when: '12 min ago' },
];

const CATEGORIES = [
  { label: 'Card Battles',    meta: '1 game · Strategy', emoji: '🃏', accent: 'var(--pp-c-anime)',   filter: 'card' },
  { label: 'Party Games',     meta: '1 game · 4–10 players', emoji: '🎉', accent: 'var(--pp-c-raja)', filter: 'party' },
  { label: 'Quick 1v1',       meta: '1 game · Casual',   emoji: '⚡', accent: 'var(--pp-c-cricket)', filter: 'multiplayer' },
  { label: 'Solo Challenge',  meta: '1 game · Endless',  emoji: '🎯', accent: 'var(--pp-c-boom)',    filter: 'solo' },
];

const COLLECTIONS = [
  { label: 'Weekend Tournaments', sub: 'Compete for the top spot', cls: 'pp-cc1' },
  { label: 'Party Pack',          sub: 'Best games for a crowd',   cls: 'pp-cc2' },
  { label: 'Quick Matches',       sub: 'Drop in, play, rematch',   cls: 'pp-cc3' },
  { label: 'Solo Grind',          sub: 'Beat your own record',     cls: 'pp-cc4' },
];

const RAIL_ITEMS = [
  {
    id: 'library', label: 'Game Library', active: true,
    icon: <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/></svg>,
  },
  {
    id: 'home', label: 'Home', nav: '/',
    icon: <svg viewBox="0 0 24 24" fill="none"><path d="M3 11l9-8 9 8M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
  {
    id: 'live', label: 'Live Rooms',
    icon: <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M6.3 6.3a8 8 0 0 0 0 11.4M17.7 6.3a8 8 0 0 1 0 11.4M3.5 3.5a12 12 0 0 0 0 17M20.5 3.5a12 12 0 0 1 0 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  },
  {
    id: 'leaders', label: 'Leaderboard',
    icon: <svg viewBox="0 0 24 24" fill="none"><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4ZM5 5H3a2 2 0 0 0 0 4h2M19 5h2a2 2 0 0 1 0 4h-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
  {
    id: 'settings', label: 'Settings',
    icon: <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 7.5 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3 14.6H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 8.91a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6h.09A1.65 1.65 0 0 0 10.5 3V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1.82 1.5h.09A1.65 1.65 0 0 0 19.4 9c.36.66.27 1.46-.27 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
];

export default function PortalPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');

  const visible = GAMES.filter(g => {
    const matchCat = activeFilter === 'all' || g.cats.includes(activeFilter);
    const matchSearch = !search || g.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="portal-page">
      {/* Background layers */}
      <div className="pp-bg">
        <div className="pp-bg-grid" />
      </div>

      {/* ── Sidebar Rail ──────────────────────────────────────── */}
      <aside className="pp-rail">
        <button className="pp-rail-logo" onClick={() => navigate('/')}>
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M6 8h12a4 4 0 0 1 4 4v0a4 4 0 0 1-4 4h-1.2a2 2 0 0 1-1.5-.7L13.6 14h-3.2l-1.7 1.3a2 2 0 0 1-1.5.7H6a4 4 0 0 1-4-4v0a4 4 0 0 1 4-4Z" fill="#fff"/>
            <circle cx="16.5" cy="11.5" r="1.2" fill="#6431c4"/>
            <circle cx="18.6" cy="13" r="1.2" fill="#6431c4"/>
            <path d="M7 11v2M6 12h2" stroke="#6431c4" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </button>

        <nav className="pp-nav-group">
          {RAIL_ITEMS.map(item => (
            <button
              key={item.id}
              className={`pp-rail-item${item.active ? ' active' : ''}`}
              onClick={() => item.nav && navigate(item.nav)}
            >
              {item.icon}
              <span className="pp-tip">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="pp-rail-avatar">P</div>
      </aside>

      {/* ── Main content ──────────────────────────────────────── */}
      <main className="pp-main">

        {/* Top bar */}
        <div className="pp-topbar">
          <div className="pp-title-block">
            <h1>Game Portal</h1>
            <p>4 arenas live now — pick a game and drop straight into a room.</p>
          </div>
          <div className="pp-topbar-right">
            <label className="pp-search">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/>
                <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              <input
                type="text" placeholder="Search games…"
                value={search} onChange={e => setSearch(e.target.value)}
              />
            </label>
            <span className="pp-coin-chip">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M12 7v10M9.5 9.2A2.5 2.5 0 0 1 12 8h.6a2 2 0 0 1 0 4h-1.2a2 2 0 0 0 0 4h.6a2.5 2.5 0 0 0 2.5-1.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              2,480
            </span>
          </div>
        </div>

        {/* Featured banner */}
        <section className="pp-featured">
          <div className="pp-feat-glyph">🃏</div>
          <div className="pp-feat-inner">
            <div className="pp-feat-eyebrow">
              <span className="pp-live-badge"><span className="pp-live-dot" />FEATURED · LIVE</span>
              <span className="pp-feat-pill">Card Battle</span>
            </div>
            <h2>Anime Trumpcard</h2>
            <p>Battle with anime character stats across 6 epic categories. Collect every card, outsmart the table, and crown yourself champion of the arena.</p>
            <div className="pp-feat-cta">
              <button className="pp-btn pp-btn-gold" onClick={() => navigate('/trumpcard')}>
                Play Now
                <svg viewBox="0 0 24 24" fill="none"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
              </button>
              <button className="pp-btn pp-btn-ghost" onClick={() => navigate('/trumpcard')}>Create Room</button>
            </div>
          </div>
          <div className="pp-feat-dots">
            <span className="on" /><span /><span /><span />
          </div>
        </section>

        {/* Filters */}
        <div className="pp-filters">
          {FILTERS.map(f => (
            <button
              key={f.id}
              className={`pp-filter-tab${activeFilter === f.id ? ' active' : ''}`}
              onClick={() => setActiveFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
          <span className="pp-filter-count">
            {visible.length} {visible.length === 1 ? 'game' : 'games'}
          </span>
        </div>

        {/* Game card grid */}
        <section className="pp-grid">
          {visible.map(game => (
            <GameCard key={game.id} game={game} onPlay={() => navigate(game.path)} />
          ))}
          {visible.length === 0 && (
            <div className="pp-empty">No games match your search.</div>
          )}
        </section>

        {/* Browse by Category */}
        <section className="pp-row">
          <div className="pp-row-head">
            <h2>Browse by Category</h2>
            <button className="pp-see-all" onClick={() => setActiveFilter('all')}>
              See all
              <svg viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
          <div className="pp-cat-grid">
            {CATEGORIES.map(cat => (
              <div key={cat.label} className="pp-cat-tile"
                style={{ '--pp-cat-accent': cat.accent }}
                onClick={() => setActiveFilter(cat.filter)}>
                <span className="pp-cat-emoji">{cat.emoji}</span>
                <div className="pp-cat-name">{cat.label}</div>
                <div className="pp-cat-meta">{cat.meta}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Leaderboard + Activity */}
        <section className="pp-row pp-split">
          <div className="pp-panel">
            <div className="pp-panel-head">
              <h3>Top Players</h3>
              <span className="pp-panel-badge">THIS WEEK</span>
            </div>
            {LEADERBOARD.map(p => (
              <div key={p.rank} className="pp-lb-row">
                <span className="pp-lb-rank">{p.rank}</span>
                <span className="pp-lb-pic" style={{ background: p.color }}>{p.initial}</span>
                <div className="pp-lb-info">
                  <div className="pp-lb-name">{p.name}</div>
                  <div className="pp-lb-sub">{p.game}</div>
                </div>
                <span className="pp-lb-score">{p.score}</span>
              </div>
            ))}
            <div className="pp-lb-row pp-lb-you">
              <span className="pp-lb-rank">12</span>
              <span className="pp-lb-pic" style={{ background: 'linear-gradient(150deg,#ff9ad6,#b85cff)' }}>P</span>
              <div className="pp-lb-info">
                <div className="pp-lb-name">You</div>
                <div className="pp-lb-sub">Climbing fast · 9 wins</div>
              </div>
              <span className="pp-lb-score">6,340</span>
            </div>
          </div>

          <div className="pp-panel">
            <div className="pp-panel-head">
              <h3>Live Activity</h3>
              <span className="pp-live-badge"><span className="pp-live-dot" />LIVE</span>
            </div>
            {ACTIVITY.map((a, i) => (
              <div key={i} className="pp-act-item">
                <span className="pp-act-icon">{a.icon}</span>
                <div className="pp-act-text">
                  {a.text}
                  <span className="pp-act-when">{a.when}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Collections */}
        <section className="pp-row">
          <div className="pp-row-head"><h2>More Ways to Play</h2></div>
          <div className="pp-coll-grid">
            {COLLECTIONS.map(c => (
              <div key={c.label} className={`pp-coll-card ${c.cls}`}>
                <div className="pp-coll-label">{c.label}</div>
                <div className="pp-coll-sub">{c.sub}</div>
              </div>
            ))}
          </div>
        </section>

        <footer className="pp-footer">
          <div className="inner">
            <span>© 2026 The GameHub — Always open.</span>
            <span className="links">
              <button onClick={() => navigate('/')}>Home</button>
              <button onClick={() => setActiveFilter('all')}>Games</button>
              <button onClick={() => document.querySelector('.pp-split')?.scrollIntoView({ behavior: 'smooth' })}>Leaderboard</button>
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}

function GameCard({ game, onPlay }) {
  return (
    <article className="pp-card" onClick={onPlay} style={{ '--pp-card-accent': game.accent }}>
      <div className="pp-cover">
        <div className="pp-cover-tagchip">
          <span className="pp-live-badge"><span className="pp-live-dot" />LIVE</span>
        </div>
        <div className="pp-cover-glyph">{game.icon}</div>
        <div className="pp-cover-accentline" />
        <div className="pp-play-overlay">
          <button className="pp-play-btn" onClick={e => { e.stopPropagation(); onPlay(); }}>
            <svg viewBox="0 0 24 24" fill="none"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
          </button>
        </div>
      </div>
      <div className="pp-card-body">
        <h3>{game.title}</h3>
        <p className="pp-card-desc">{game.desc}</p>
        <div className="pp-card-tags">
          {game.tags.map(t => <span key={t} className="pp-tag">{t}</span>)}
        </div>
        <div className="pp-card-foot">
          <button className="pp-btn pp-btn-gold pp-btn-sm" onClick={e => { e.stopPropagation(); onPlay(); }}>
            Play Now
            <svg viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>
    </article>
  );
}
