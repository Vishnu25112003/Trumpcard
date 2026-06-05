import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/HubHome.css';

const GAMES = [
  {
    id: 'trumpcard',
    icon: '🃏',
    title: 'Anime Trumpcard',
    description: 'Battle with anime character stats in this multiplayer card showdown. Compete across 6 epic stats to collect all cards and dominate the table.',
    tags: ['2–4 Players', 'Multiplayer', 'Strategy'],
    path: '/trumpcard',
    accent: '#f6d35a',
    glow: 'rgba(246, 211, 90, 0.22)',
  },
  {
    id: 'cricket',
    icon: '🏏',
    title: 'Hand Cricket',
    description: 'Face off in the classic hand cricket showdown. Pick your number, outsmart your opponent, and chase the target to become the ultimate champion.',
    tags: ['2 Players', '1v1', 'Casual'],
    path: '/hand-cricket',
    accent: '#58c8ff',
    glow: 'rgba(88, 200, 255, 0.18)',
  },
  {
    id: 'rajarani',
    icon: '👑',
    title: 'Raja Rani',
    description: 'Enter the royal court, keep your card secret, and follow the chain from Raja to Thief in this classic multiplayer party game.',
    tags: ['4–10 Players', 'Room Code', 'Party'],
    path: '/rajarani',
    accent: '#ff72c8',
    glow: 'rgba(255, 114, 200, 0.15)',
  },
  {
    id: 'boom-typer',
    icon: '⌨️',
    title: 'Boom Typer',
    description: 'Blast falling booms by typing their words. Solo survival mode — power booms flood the screen if you ignore them.',
    tags: ['Solo', 'Typing', 'Endless'],
    path: '/boom-typer',
    accent: '#46e0a0',
    glow: 'rgba(70, 224, 160, 0.16)',
  },
];

const TYPE_CARDS = [
  {
    id: 'cards',
    emoji: '🃏',
    title: 'Card Battles',
    desc: 'Stat-driven showdowns where you read the table, play the odds, and outsmart rivals to sweep every card. Pure strategy and nerve.',
    meta: ['♟ Strategy', '👥 2–4 players', '🧠 Skill-based'],
    accent: '#f6d35a',
  },
  {
    id: 'party',
    emoji: '🎭',
    title: 'Party & Bluff',
    desc: 'Big-group games of hidden roles, secret cards and royal hierarchy. Hold your nerve, bluff your way up, and don\'t get caught as the Thief.',
    meta: ['🎉 Party', '👥 4–10 players', '🔑 Room code'],
    accent: '#ff72c8',
  },
  {
    id: 'duel',
    emoji: '⚡',
    title: 'Quick 1v1 Duels',
    desc: 'Fast head-to-head face-offs you can finish in a couple of minutes. Pick your number, predict your rival, and chase the target to win.',
    meta: ['🤺 1v1', '👥 2 players', '⏱ Casual'],
    accent: '#58c8ff',
  },
  {
    id: 'solo',
    emoji: '🎯',
    title: 'Solo Survival',
    desc: 'Single-player score chases where the pressure never stops. Keep your reflexes sharp, survive the surge, and climb the global leaderboard.',
    meta: ['🏆 Endless', '👤 Solo', '📈 Leaderboard'],
    accent: '#46e0a0',
  },
];

export default function HubPage() {
  const navigate = useNavigate();
  const navRef = useRef(null);
  const cineRef = useRef(null);
  const embersRef = useRef(null);
  const scrollRef = useRef(null);

  const scrollTo = (id) => {
    const scroller = scrollRef.current;
    const el = document.getElementById(id);
    if (!scroller || !el) return;
    const top = el.offsetTop - 80;
    scroller.scrollTo({ top, behavior: 'smooth' });
  };

  const scrollToPortal = () => scrollTo('hh-portal');

  useEffect(() => {
    // hero entrance
    const cine = cineRef.current;
    if (cine) requestAnimationFrame(() => cine.classList.add('loaded'));

    // floating embers
    const embers = embersRef.current;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (embers && !reduce) {
      for (let i = 0; i < 26; i++) {
        const s = document.createElement('span');
        s.className = 'hh-ember';
        const size = 2 + Math.random() * 4;
        s.style.left = Math.random() * 100 + '%';
        s.style.width = s.style.height = size + 'px';
        s.style.setProperty('--drift', (Math.random() * 80 - 40) + 'px');
        s.style.animationDuration = (7 + Math.random() * 9) + 's';
        s.style.animationDelay = (-Math.random() * 12) + 's';
        embers.appendChild(s);
      }
    }

    // "press any key" → portal
    let navigated = false;
    const onKey = (e) => {
      if (e.key === 'Tab' || e.key === 'Shift' || e.metaKey || e.ctrlKey || e.altKey) return;
      const scroller = scrollRef.current;
      if (scroller && scroller.scrollTop < window.innerHeight * 0.6) {
        e.preventDefault();
        scrollToPortal();
        navigated = true;
      }
    };
    document.addEventListener('keydown', onKey);

    // nav background on scroll
    const scroller = scrollRef.current;
    const nav = navRef.current;
    const onScroll = () => {
      if (nav) nav.classList.toggle('scrolled', (scroller?.scrollTop ?? 0) > 40);
    };
    onScroll();
    scroller?.addEventListener('scroll', onScroll, { passive: true });

    // scroll reveal
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.16, root: scroller });
    document.querySelectorAll('.hub-home .reveal').forEach(el => io.observe(el));

    return () => {
      document.removeEventListener('keydown', onKey);
      scroller?.removeEventListener('scroll', onScroll);
      io.disconnect();
    };
  }, []);

  return (
    <>
      <div className="table-bg" />

      <div
        ref={scrollRef}
        style={{ position: 'fixed', inset: 0, zIndex: 10, overflowY: 'auto', overflowX: 'hidden' }}
      >
        <div className="hub-home">
          <div className="hh-bg-grid" />

          {/* ── Top Nav ─────────────────────────────────────────── */}
          <header className="hh-topnav" ref={navRef}>
            <button className="hh-logo" onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <span className="hh-logo-tile">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M6 8h12a4 4 0 0 1 4 4v0a4 4 0 0 1-4 4h-1.2a2 2 0 0 1-1.5-.7L13.6 14h-3.2l-1.7 1.3a2 2 0 0 1-1.5.7H6a4 4 0 0 1-4-4v0a4 4 0 0 1 4-4Z" fill="#fff" opacity="0.95"/>
                  <circle cx="16.5" cy="11.5" r="1.1" fill="#6431c4"/>
                  <circle cx="18.6" cy="13" r="1.1" fill="#6431c4"/>
                  <path d="M7 11v2M6 12h2" stroke="#6431c4" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </span>
              <span className="hh-logo-name">
                <small>THE</small>
                <b>Game<span className="hub">Hub</span></b>
              </span>
            </button>

            <nav className="hh-nav-links">
              <a href="#hh-about" onClick={e => { e.preventDefault(); scrollTo('hh-about'); }}>About</a>
              <a href="#hh-types" onClick={e => { e.preventDefault(); scrollTo('hh-types'); }}>Game Types</a>
              <a href="#hh-how" onClick={e => { e.preventDefault(); scrollTo('hh-how'); }}>How to Play</a>
            </nav>

            <button className="hh-btn-gold" onClick={scrollToPortal}>
              Enter the Arena
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </header>

          {/* ── Cinematic Hero ───────────────────────────────────── */}
          <section className="hh-cine" ref={cineRef}>
            <div className="hh-sky" />
            <div className="hh-ridge" />
            <div className="hh-embers" ref={embersRef} />

            <div className="hh-cine-inner">
              <div className="hh-sigil anim-up d1">
                <div className="glow" />
                <div className="ticks" />
                <div className="ring r1" />
                <div className="ring r2" />
                <div className="ring r3" />
                <div className="core">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M6 8h12a4 4 0 0 1 4 4v0a4 4 0 0 1-4 4h-1.2a2 2 0 0 1-1.5-.7L13.6 14h-3.2l-1.7 1.3a2 2 0 0 1-1.5.7H6a4 4 0 0 1-4-4v0a4 4 0 0 1 4-4Z" fill="#fff"/>
                    <circle cx="16.5" cy="11.5" r="1.2" fill="#6431c4"/>
                    <circle cx="18.6" cy="13" r="1.2" fill="#6431c4"/>
                    <path d="M7 11v2M6 12h2" stroke="#6431c4" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>

              <div className="hh-kicker anim-up d2">The Multiplayer Arena</div>
              <h1 className="hh-h1 anim-up d3">GameHub</h1>
              <div className="hh-tagline anim-up d4">Gather · Challenge · Conquer</div>

              <button className="hh-press-start anim-up d5" onClick={scrollToPortal}>
                Enter the Portal
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M8 5v14l11-7z" fill="currentColor"/>
                </svg>
              </button>
              <div className="hh-press-hint anim-up d5">Press any key to continue</div>
            </div>

            <button className="hh-scroll-cue" onClick={() => scrollTo('hh-about')}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              Explore the Hub
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </section>

          <main className="hh-container">
            {/* ── About ─────────────────────────────────────────── */}
            <section className="hh-section" id="hh-about">
              <div className="hh-section-head reveal">
                <div className="hh-eyebrow">What is GameHub</div>
                <h2>One hub. Every kind of match.</h2>
                <p>GameHub is a live multiplayer playground built for quick sessions with friends. No installs, no waiting rooms — just open the portal, grab a room code, and jump straight into the action. The arena never closes.</p>
              </div>

              <div className="hh-pillars">
                <div className="hh-pillar reveal d1">
                  <div className="hh-picon">
                    <svg viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
                      <path d="M6.3 6.3a8 8 0 0 0 0 11.4M17.7 6.3a8 8 0 0 1 0 11.4M3.5 3.5a12 12 0 0 0 0 17M20.5 3.5a12 12 0 0 1 0 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <h3>Always Live</h3>
                  <p>Rooms are open around the clock. There's always a match starting and an opponent ready to play.</p>
                </div>
                <div className="hh-pillar reveal d2">
                  <div className="hh-picon">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM22 19v-1a4 4 0 0 0-3-3.87M16 4.13A4 4 0 0 1 16 12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3>Play With Friends</h3>
                  <p>Share a room code and your crew drops in instantly. From 1v1 duels to ten-player party chaos.</p>
                </div>
                <div className="hh-pillar reveal d3">
                  <div className="hh-picon">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M13 2 4.5 13.5H11l-1 8.5L19.5 10H13l0-8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3>Instant Rooms</h3>
                  <p>No downloads, no setup. Pick a game, spin up a room in one tap, and you're playing in seconds.</p>
                </div>
              </div>
            </section>

            {/* ── Game Types ────────────────────────────────────── */}
            <section className="hh-section" id="hh-types">
              <div className="hh-section-head reveal">
                <div className="hh-eyebrow">What You'll Play</div>
                <h2>Kinds of games in the arena</h2>
                <p>Every game on GameHub falls into one of four play styles. Find the vibe that fits your crew tonight.</p>
              </div>

              <div className="hh-types">
                {TYPE_CARDS.map((tc, i) => (
                  <article
                    key={tc.id}
                    className={`hh-type-card reveal d${(i % 3) + 1}`}
                    style={{ '--tc-accent': tc.accent }}
                  >
                    <span className="glyph">{tc.emoji}</span>
                    <div className="hh-ttop">
                      <span className="hh-temoji">{tc.emoji}</span>
                      <h3>{tc.title}</h3>
                    </div>
                    <p>{tc.desc}</p>
                    <div className="hh-type-meta">
                      {tc.meta.map(m => <span key={m}>{m}</span>)}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* ── How to Play ───────────────────────────────────── */}
            <section className="hh-section" id="hh-how">
              <div className="hh-section-head reveal">
                <div className="hh-eyebrow">Getting Started</div>
                <h2>How a session works</h2>
                <p>Three steps from landing here to your first win. No accounts to wrestle with, no waiting.</p>
              </div>

              <div className="hh-steps">
                {[
                  { n: 1, title: 'Pick Your Game', body: 'Browse the arena below by play style — cards, party, duels or solo. Every game is one tap away.' },
                  { n: 2, title: 'Create or Join a Room', body: 'Spin up a fresh room and share the code, or drop into a friend\'s live room in one tap.' },
                  { n: 3, title: 'Play & Climb', body: 'Battle it out, rack up wins, and rise up the weekly leaderboard. Then rematch and run it back.' },
                ].map((s, i) => (
                  <div key={s.n} className={`hh-step reveal d${i + 1}`}>
                    <div className="hh-step-num">{s.n}</div>
                    <h3>{s.title}</h3>
                    <p>{s.body}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Game Portal ───────────────────────────────────── */}
            <section className="hh-section" id="hh-portal">
              <div className="hh-portal-head reveal">
                <p>Choose Your Battle</p>
                <h2>Enter the Game Portal</h2>
              </div>

              <div className="hh-game-grid">
                {GAMES.map((game) => (
                  <GameCard key={game.id} game={game} onPlay={() => navigate(game.path)} />
                ))}
              </div>

              {/* Final CTA */}
              <div className="hh-final-cta reveal">
                <h2>The arena is open.</h2>
                <p>Every game is live. Pick one and find your first match.</p>
                <button className="hh-btn-gold" onClick={() => navigate('/trumpcard')}
                  style={{ fontSize: 13, padding: '14px 28px', borderRadius: 12 }}>
                  Play Now
                  <svg viewBox="0 0 24 24" fill="none" style={{ width: 16, height: 16 }}>
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </section>

            <footer className="hh-footer">
              <div className="inner">
                <span>© 2026 The GameHub — Always open.</span>
                <span className="links">
                  <a href="#hh-about" onClick={e => { e.preventDefault(); scrollTo('hh-about'); }}>About</a>
                  <a href="#hh-types" onClick={e => { e.preventDefault(); scrollTo('hh-types'); }}>Game Types</a>
                  <a href="#hh-portal" onClick={e => { e.preventDefault(); scrollToPortal(); }}>Portal</a>
                </span>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </>
  );
}

function GameCard({ game, onPlay }) {
  return (
    <div
      style={{
        position: 'relative',
        background: 'rgba(20, 8, 60, 0.88)',
        border: '1px solid rgba(140, 100, 255, 0.28)',
        borderRadius: 20,
        padding: '28px 24px',
        display: 'flex', flexDirection: 'column', gap: 14,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)',
        transition: 'transform 0.22s, box-shadow 0.22s, border-color 0.22s',
        cursor: 'pointer', overflow: 'hidden',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.borderColor = game.accent;
        e.currentTarget.style.boxShadow = `0 28px 70px rgba(0,0,0,0.5), 0 0 30px ${game.glow}, 0 0 0 1px rgba(255,255,255,0.06)`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.borderColor = 'rgba(140, 100, 255, 0.28)';
        e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)';
      }}
      onClick={onPlay}
    >
      {/* glow blob */}
      <div style={{
        position: 'absolute', top: -30, right: -30,
        width: 120, height: 120, borderRadius: '50%',
        background: game.glow, filter: 'blur(40px)', pointerEvents: 'none',
      }} />

      {/* live badge */}
      <div style={{ position: 'absolute', top: 16, right: 16 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '4px 10px', borderRadius: 999,
          background: 'rgba(56, 220, 147, 0.12)',
          border: '1px solid rgba(56, 220, 147, 0.32)',
          fontSize: 9, fontWeight: 700, letterSpacing: '0.16em',
          textTransform: 'uppercase', color: '#38dc93',
          fontFamily: "'Chakra Petch', sans-serif",
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#38dc93', display: 'inline-block', boxShadow: '0 0 6px #38dc93' }} />
          Live
        </span>
      </div>

      {/* icon */}
      <div style={{ fontSize: 44, lineHeight: 1, filter: `drop-shadow(0 4px 20px ${game.glow})` }}>
        {game.icon}
      </div>

      {/* title */}
      <h3 style={{
        fontFamily: "'Orbitron', sans-serif",
        fontSize: 18, fontWeight: 700, margin: 0,
        background: `linear-gradient(135deg, ${game.accent}, #fff)`,
        WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
      }}>
        {game.title}
      </h3>

      {/* desc */}
      <p style={{ color: 'rgba(179, 164, 216, 1)', fontSize: 13, lineHeight: 1.65, margin: 0, flex: 1 }}>
        {game.description}
      </p>

      {/* tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {game.tags.map((tag) => (
          <span key={tag} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 11px', borderRadius: 999,
            border: '1px solid rgba(150, 110, 255, 0.32)',
            background: 'rgba(30, 18, 60, 0.55)',
            fontSize: 11.5, color: 'rgba(179, 164, 216, 1)',
            fontFamily: "'Chakra Petch', sans-serif",
            fontWeight: 500, letterSpacing: '0.05em',
          }}>{tag}</span>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={e => { e.stopPropagation(); onPlay(); }}
        style={{
          width: '100%', padding: '13px 20px', borderRadius: 12,
          fontFamily: "'Chakra Petch', sans-serif", fontWeight: 600,
          fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase',
          color: '#2a1604', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(180deg, #fbe6a0, #f6d35a 55%, #ecb838)',
          boxShadow: '0 10px 26px -10px rgba(246,211,90,0.7), inset 0 1px 0 rgba(255,255,255,0.6)',
          transition: 'transform 0.18s, box-shadow 0.25s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
      >
        Play Now →
      </button>
    </div>
  );
}
