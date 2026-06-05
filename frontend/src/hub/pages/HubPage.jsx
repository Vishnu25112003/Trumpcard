import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/HubHome.css';

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
    desc: "Big-group games of hidden roles, secret cards and royal hierarchy. Hold your nerve, bluff your way up, and don't get caught as the Thief.",
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
    scroller.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
  };

  useEffect(() => {
    const cine = cineRef.current;
    if (cine) requestAnimationFrame(() => cine.classList.add('loaded'));

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

    const onKey = (e) => {
      if (e.key === 'Tab' || e.key === 'Shift' || e.metaKey || e.ctrlKey || e.altKey) return;
      const scroller = scrollRef.current;
      if (scroller && scroller.scrollTop < window.innerHeight * 0.6) {
        e.preventDefault();
        navigate('/portal');
      }
    };
    document.addEventListener('keydown', onKey);

    const scroller = scrollRef.current;
    const nav = navRef.current;
    const onScroll = () => nav?.classList.toggle('scrolled', (scroller?.scrollTop ?? 0) > 40);
    onScroll();
    scroller?.addEventListener('scroll', onScroll, { passive: true });

    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.16, root: scroller });
    document.querySelectorAll('.hub-home .reveal').forEach(el => io.observe(el));

    return () => {
      document.removeEventListener('keydown', onKey);
      scroller?.removeEventListener('scroll', onScroll);
      io.disconnect();
    };
  }, [navigate]);

  return (
    <>
      <div className="table-bg" />
      <div ref={scrollRef} style={{ position: 'fixed', inset: 0, zIndex: 10, overflowY: 'auto', overflowX: 'hidden' }}>
        <div className="hub-home">
          <div className="hh-bg-grid" />

          {/* ── Top Nav ─────────────────────────────────────────── */}
          <header className="hh-topnav" ref={navRef}>
            <button className="hh-logo"
              onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
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
              <a href="#hh-how"   onClick={e => { e.preventDefault(); scrollTo('hh-how'); }}>How to Play</a>
            </nav>

            <button className="hh-btn-gold" onClick={() => navigate('/portal')}>
              Game Portal
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

              <button className="hh-press-start anim-up d5" onClick={() => navigate('/portal')}>
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
                  <article key={tc.id} className={`hh-type-card reveal d${(i % 3) + 1}`} style={{ '--tc-accent': tc.accent }}>
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
                  { n: 1, title: 'Enter the Portal', body: 'Open the Game Portal and browse the arena by play style — cards, party, duels or solo.' },
                  { n: 2, title: 'Create or Join a Room', body: "Spin up a fresh room and share the code, or drop into a friend's live room in one tap." },
                  { n: 3, title: 'Play & Climb', body: 'Battle it out, rack up wins, and rise up the weekly leaderboard. Then rematch and run it back.' },
                ].map((s, i) => (
                  <div key={s.n} className={`hh-step reveal d${i + 1}`}>
                    <div className="hh-step-num">{s.n}</div>
                    <h3>{s.title}</h3>
                    <p>{s.body}</p>
                  </div>
                ))}
              </div>

              {/* Final CTA */}
              <div className="hh-final-cta reveal">
                <h2>The arena is open.</h2>
                <p>Step through the portal and find your next match.</p>
                <button className="hh-btn-gold" onClick={() => navigate('/portal')}
                  style={{ fontSize: 14, padding: '15px 32px', borderRadius: 12 }}>
                  Enter the Game Portal
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
                  <button onClick={() => navigate('/portal')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--hh-text-dim)', fontFamily: "'Chakra Petch',sans-serif", fontSize: 12.5, letterSpacing: '0.04em' }}>
                    Portal
                  </button>
                </span>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </>
  );
}
