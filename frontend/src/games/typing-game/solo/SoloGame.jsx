import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SOLO_CONFIG, getPhaseConfig } from './soloConfig';
import { pickRandomWord } from '../shared/data/loadWords';
import { useGameLoop } from '../shared/hooks/useGameLoop';
import { computeWpm, computeAccuracy } from '../shared/utils/typingMath';
import Bottle from './components/Bottle';
import Gun from './components/Gun';
import Projectile from './components/Projectile';
import Barrier from './components/Barrier';
import SoloHUD from './components/SoloHUD';
import SoloGameOver from './components/SoloGameOver';
import '../styles/typing.css';

const ARENA_PAD_X = 60;

// Solo manages its own keystroke buffer inline. The shared useTypingInput hook
// is used in Friends mode, where the target (paragraph) never changes mid-race.
// Solo's target changes on every lock acquisition, which makes pre-feeding the
// trigger keystroke into a hook awkward — handling it inline is cleaner.

function pickBottleWord(poolKey, taken) {
  const set = new Set(taken);
  for (let i = 0; i < 12; i++) {
    const w = pickRandomWord(poolKey, set);
    if (!set.has(w)) return w;
    set.add(w);
  }
  return pickRandomWord(poolKey);
}

const EMPTY_SNAPSHOT = {
  bottles: [],
  projectiles: [],
  explosions: [],
  lockedId: null,
  buffer: '',
};

export default function SoloGame() {
  const navigate = useNavigate();
  const arenaRef = useRef(null);
  const [size, setSize] = useState({ w: 800, h: 600 });

  // Mutable simulation refs (don't trigger re-render on every mutation).
  const bottlesRef = useRef([]);
  const projectilesRef = useRef([]);
  const explosionsRef = useRef([]);
  const lockedIdRef = useRef(null);
  const bufferRef = useRef('');

  const spawnTimerRef = useRef(0);
  const phaseTimerRef = useRef(0);
  const elapsedRef = useRef(0);
  const phaseRef = useRef(0);

  const correctCharsRef = useRef(0);
  const totalKeystrokesRef = useRef(0);
  const errorsRef = useRef(0);

  // Per-frame snapshot consumed by JSX. RAF publishes this once per tick;
  // event handlers publish on keystroke.
  const [snap, setSnap] = useState(EMPTY_SNAPSHOT);
  // HUD stats — updated from the RAF loop at most once per second.
  const [stats, setStats] = useState({ wpm: 0, accuracy: 0 });
  const [hp, setHp] = useState(SOLO_CONFIG.MAX_HP);
  const [score, setScore] = useState(0);
  const [destroyed, setDestroyed] = useState(0);
  const [phase, setPhase] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [paused, setPaused] = useState(false);
  const [overlay, setOverlay] = useState('start'); // 'start' | null | 'gameover'
  const [shake, setShake] = useState(false);
  const startedAtRef = useRef(null);

  const isActiveRef = useRef(false);
  useEffect(() => { isActiveRef.current = !paused && overlay == null; }, [paused, overlay]);

  const publishSnap = useCallback(() => {
    setSnap({
      bottles: bottlesRef.current.slice(),
      projectiles: projectilesRef.current.slice(),
      explosions: explosionsRef.current.slice(),
      lockedId: lockedIdRef.current,
      buffer: bufferRef.current,
    });
  }, []);

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 240);
  }, []);

  const endGame = useCallback(() => setOverlay('gameover'), []);

  const onWordComplete = useCallback(() => {
    const bottle = bottlesRef.current.find((b) => b.id === lockedIdRef.current);
    if (!bottle) {
      lockedIdRef.current = null;
      bufferRef.current = '';
      return;
    }
    const gunX = size.w / 2;
    const gunY = size.h - 60;
    projectilesRef.current.push({
      id: `p-${Date.now()}-${Math.random()}`,
      x: gunX,
      y: gunY,
      targetX: bottle.x,
      targetY: bottle.y,
      bottleId: bottle.id,
      spawnedAt: performance.now(),
    });
    lockedIdRef.current = null;
    bufferRef.current = '';
  }, [size.w, size.h]);

  // ── Unified keystroke handler (auto-lock + buffer accumulation) ─────────
  useEffect(() => {
    function onKey(event) {
      if (!isActiveRef.current) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const k = event.key;

      if (k === 'Backspace') {
        event.preventDefault();
        if (lockedIdRef.current && bufferRef.current.length) {
          bufferRef.current = bufferRef.current.slice(0, -1);
          publishSnap();
        }
        return;
      }
      if (k.length !== 1) return;
      event.preventDefault();

      // Auto-lock if no current lock.
      if (!lockedIdRef.current) {
        const matches = bottlesRef.current.filter((b) => b.word[0] === k);
        if (!matches.length) return;
        const barrierY = size.h * SOLO_CONFIG.ARENA.BARRIER_Y_FRAC;
        matches.sort((a, b) => (barrierY - a.y) - (barrierY - b.y));
        lockedIdRef.current = matches[0].id;
        bufferRef.current = '';
        // fall through to apply keystroke against the just-locked word
      }

      const bottle = bottlesRef.current.find((b) => b.id === lockedIdRef.current);
      if (!bottle) return;

      totalKeystrokesRef.current += 1;
      const expected = bottle.word[bufferRef.current.length];
      bufferRef.current += k;
      if (k === expected) {
        correctCharsRef.current += 1;
        if (bufferRef.current === bottle.word) onWordComplete();
      } else {
        errorsRef.current += 1;
      }
      publishSnap();
    }
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [size.h, size.w, onWordComplete, publishSnap]);

  // Arena sizing.
  useEffect(() => {
    const measure = () => {
      const el = arenaRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setSize({ w: r.width, h: r.height });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Pause on tab blur.
  useEffect(() => {
    const onVis = () => { if (document.hidden) setPaused(true); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const spawnBottle = useCallback(() => {
    const cfg = getPhaseConfig(phaseRef.current);
    if (bottlesRef.current.length >= cfg.maxOnScreen) return;
    const taken = new Set(bottlesRef.current.map((b) => b.word));
    const word = pickBottleWord(cfg.pool, taken);
    const x = ARENA_PAD_X + Math.random() * Math.max(1, size.w - ARENA_PAD_X * 2);
    bottlesRef.current.push({
      id: `b-${Date.now()}-${Math.random()}`,
      word,
      x,
      y: size.h * SOLO_CONFIG.ARENA.SPAWN_Y_FRAC,
    });
  }, [size.w, size.h]);

  // ── Main game loop ─────────────────────────────────────────────────────
  useGameLoop((dt) => {
    if (paused || overlay) return;
    elapsedRef.current += dt;
    const newElapsedSec = Math.floor(elapsedRef.current / 1000);
    if (newElapsedSec !== elapsedSec) {
      setElapsedSec(newElapsedSec);
      setStats({
        wpm: computeWpm({ correctChars: correctCharsRef.current, elapsedMs: elapsedRef.current }),
        accuracy: computeAccuracy({
          correctChars: correctCharsRef.current,
          totalKeystrokes: totalKeystrokesRef.current,
        }),
      });
    }

    // Phase progression.
    phaseTimerRef.current += dt;
    if (phaseTimerRef.current >= SOLO_CONFIG.PHASE_DURATION_MS) {
      phaseTimerRef.current -= SOLO_CONFIG.PHASE_DURATION_MS;
      phaseRef.current += 1;
      setPhase(phaseRef.current);
    }

    // Spawn cadence.
    const cfg = getPhaseConfig(phaseRef.current);
    spawnTimerRef.current += dt;
    if (spawnTimerRef.current >= cfg.spawnEveryMs) {
      spawnTimerRef.current = 0;
      spawnBottle();
    }

    // Move bottles & detect barrier breach.
    const fallPx = (SOLO_CONFIG.FALL_SPEED[cfg.tier] * dt) / 1000;
    const barrierY = size.h * SOLO_CONFIG.ARENA.BARRIER_Y_FRAC;
    const breachers = [];
    bottlesRef.current.forEach((b) => { b.y += fallPx; });
    bottlesRef.current = bottlesRef.current.filter((b) => {
      if (b.y >= barrierY) { breachers.push(b); return false; }
      return true;
    });

    if (breachers.length) {
      breachers.forEach((b) => {
        if (lockedIdRef.current === b.id) {
          lockedIdRef.current = null;
          bufferRef.current = '';
        }
      });
      setHp((prev) => {
        const next = Math.max(0, prev - breachers.length);
        if (next === 0) setTimeout(endGame, 50);
        return next;
      });
      triggerShake();
    }

    // Projectiles.
    const now = performance.now();
    const remaining = [];
    projectilesRef.current.forEach((p) => {
      const t = Math.min(1, (now - p.spawnedAt) / 140);
      const gunX = size.w / 2;
      const gunY = size.h - 60;
      p.x = gunX + (p.targetX - gunX) * t;
      p.y = gunY + (p.targetY - gunY) * t;
      if (t >= 1) {
        const idx = bottlesRef.current.findIndex((b) => b.id === p.bottleId);
        if (idx !== -1) {
          const bottle = bottlesRef.current[idx];
          bottlesRef.current.splice(idx, 1);
          explosionsRef.current.push({
            id: `e-${now}-${Math.random()}`,
            x: bottle.x, y: bottle.y, spawnedAt: now,
          });
          setDestroyed((n) => n + 1);
          setScore((s) => s + SOLO_CONFIG.SCORE_PER_LETTER * bottle.word.length);
        }
      } else {
        remaining.push(p);
      }
    });
    projectilesRef.current = remaining;

    explosionsRef.current = explosionsRef.current.filter((e) => now - e.spawnedAt < 380);

    publishSnap();
  }, !paused && !overlay);

  const start = useCallback(() => {
    bottlesRef.current = [];
    projectilesRef.current = [];
    explosionsRef.current = [];
    lockedIdRef.current = null;
    bufferRef.current = '';
    spawnTimerRef.current = 0;
    phaseTimerRef.current = 0;
    elapsedRef.current = 0;
    phaseRef.current = 0;
    correctCharsRef.current = 0;
    totalKeystrokesRef.current = 0;
    errorsRef.current = 0;
    setHp(SOLO_CONFIG.MAX_HP);
    setScore(0);
    setDestroyed(0);
    setPhase(0);
    setElapsedSec(0);
    setOverlay(null);
    setPaused(false);
    setSnap(EMPTY_SNAPSHOT);
    setStats({ wpm: 0, accuracy: 0 });
    startedAtRef.current = performance.now();
  }, []);

  // When the game ends, capture final wpm/accuracy from the latest refs.
  useEffect(() => {
    if (overlay !== 'gameover') return;
    setStats({
      wpm: computeWpm({ correctChars: correctCharsRef.current, elapsedMs: elapsedRef.current }),
      accuracy: computeAccuracy({
        correctChars: correctCharsRef.current,
        totalKeystrokes: totalKeystrokesRef.current,
      }),
    });
  }, [overlay]);

  const finalStats = useMemo(() => ({
    score,
    elapsedSec,
    destroyed,
    phase,
    wpm: stats.wpm,
    accuracy: stats.accuracy,
  }), [score, elapsedSec, destroyed, phase, stats]);

  const barrierY = size.h * SOLO_CONFIG.ARENA.BARRIER_Y_FRAC;

  return (
    <div className={`tg-solo${shake ? ' tg-shake' : ''}`}>
      <SoloHUD
        score={score}
        phase={phase}
        elapsedSec={elapsedSec}
        wpm={stats.wpm}
        paused={paused}
        onPause={() => setPaused((p) => !p)}
        onExit={() => navigate('/typing-game/dashboard')}
      />
      <div className="tg-arena" ref={arenaRef}>
        {snap.bottles.map((b) => (
          <Bottle
            key={b.id}
            bottle={b}
            locked={snap.lockedId === b.id}
            typed={snap.lockedId === b.id ? snap.buffer : ''}
          />
        ))}
        {snap.projectiles.map((p) => <Projectile key={p.id} projectile={p} />)}
        {snap.explosions.map((e) => (
          <div key={e.id} className="tg-explosion" style={{ left: e.x, top: e.y }} />
        ))}
        <Barrier hp={hp} maxHp={SOLO_CONFIG.MAX_HP} top={barrierY} />
        <Gun />
      </div>

      {overlay === 'start' && (
        <div className="tg-overlay">
          <div className="tg-overlay-card">
            <h2 style={{
              fontFamily: 'var(--font-brand)',
              fontSize: 30,
              margin: 0,
              background: 'linear-gradient(180deg, var(--gold-bright), var(--gold))',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Defend the Barrier</h2>
            <p style={{ color: 'var(--text-soft)', margin: '10px 0 18px', fontSize: 13, lineHeight: 1.6 }}>
              Type the word on each falling bottle to shoot it down. Each bottle that reaches the
              barrier costs 1 HP. The game gets harder every 30 seconds.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-gold" onClick={start}>Start →</button>
              <button className="btn btn-ghost" onClick={() => navigate('/typing-game/dashboard')}>Back</button>
            </div>
          </div>
        </div>
      )}

      {overlay === 'gameover' && (
        <SoloGameOver
          stats={finalStats}
          onRetry={start}
          onExit={() => navigate('/typing-game/dashboard')}
        />
      )}

      {paused && overlay == null && (
        <div className="tg-overlay">
          <div className="tg-overlay-card">
            <h2 style={{ fontFamily: 'var(--font-brand)', fontSize: 28, margin: 0, color: 'var(--gold)' }}>Paused</h2>
            <p style={{ color: 'var(--text-soft)', margin: '10px 0 18px', fontSize: 13 }}>Take a breather.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-gold" onClick={() => setPaused(false)}>Resume →</button>
              <button className="btn btn-ghost" onClick={() => navigate('/typing-game/dashboard')}>Exit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
