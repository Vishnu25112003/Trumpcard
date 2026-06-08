/* This page drives an imperative 3D HUD (a faithful port of the vanilla
   "Type to Drive" prototype): a cache of HUD element refs is populated via
   callback refs and read every frame in a rAF loop, and a few refs mirror
   typing state for that loop. The react-hooks/refs rule flags these legitimate
   imperative patterns, so it's disabled for this file. */
/* eslint-disable react-hooks/refs */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlayer } from '../../../../shared/context/PlayerContext';
import { getSocket } from '../../../../shared/socket/socket';
import { useTypingInput } from '../../../typing-game/shared/hooks/useTypingInput';
import { RaceScene } from '../scene/raceScene';
import { carColor } from '../data/cars';
import '../styles/race.css';

const PROGRESS_SEND_INTERVAL_MS = 250;
const LANE_RING = [0, -2.6, 2.6, -5.2, 5.2, -7.1];
const TARGET_CPS = 8; // ~96 wpm = full throttle

export default function RacePage() {
  const { code } = useParams();
  const roomCode = code.toUpperCase();
  const { playerName } = usePlayer();
  const navigate = useNavigate();

  const [phase, setPhase] = useState('loading'); // 'loading' | 'countdown' | 'racing'
  const [loading, setLoading] = useState(true);
  const [countdownText, setCountdownText] = useState(null);
  const [paragraph, setParagraph] = useState('');
  const [wrongAt, setWrongAt] = useState(null);
  const [finishInfo, setFinishInfo] = useState(null);

  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const setupDone = useRef(false);
  const joined = useRef(false);
  const finishedSent = useRef(false);
  const lastSent = useRef({ at: 0, correctChars: -1 });

  // live data for the imperative HUD loop
  const playersRef = useRef([]);
  const myProgressRef = useRef(0);
  const startedAtRef = useRef(0);
  const timeLimitRef = useRef(0);
  const cpsRef = useRef(0);
  const lastKeyRef = useRef(0);
  const cursorRef = useRef(0);
  const correctRef = useRef(0);
  const totalKeysRef = useRef(0);
  const playerDoneRef = useRef(false);

  // HUD element refs
  const hudEls = useRef({});
  const rowEls = useRef({});
  const tagEls = useRef({});
  const rafRef = useRef(null);

  const onCorrect = useCallback(() => {
    const now = performance.now();
    const dt = Math.max(0.02, (now - lastKeyRef.current) / 1000);
    lastKeyRef.current = now;
    cpsRef.current = cpsRef.current * 0.6 + (1 / dt) * 0.4;
    setWrongAt(null);
  }, []);
  const onWrong = useCallback(() => {
    lastKeyRef.current = performance.now();
    cpsRef.current *= 0.8;
    setWrongAt(cursorRef.current);
  }, []);

  const typing = useTypingInput({
    target: paragraph,
    active: phase === 'racing',
    strict: true,
    onCorrectChar: onCorrect,
    onWrongChar: onWrong,
  });
  useEffect(() => { cursorRef.current = typing.cursorIndex; }, [typing.cursorIndex]);
  correctRef.current = typing.correctChars;
  totalKeysRef.current = typing.totalKeystrokes;
  myProgressRef.current = paragraph.length ? Math.min(1, typing.correctChars / paragraph.length) : 0;

  // ── build car specs (local player centered, rivals fan out) ──────────────
  const buildCarSpecs = useCallback((players) => {
    const ordered = [...players].sort((a, b) => (a.name === playerName ? -1 : b.name === playerName ? 1 : 0));
    return ordered.map((p, i) => ({
      id: p.name,
      model: p.carId || 'italia',
      color: carColor(p.carId),
      tint: p.name === playerName ? carColor(p.carId) : null,
      isPlayer: p.name === playerName,
      lane: LANE_RING[i] ?? 0,
    }));
  }, [playerName]);

  // ── build standings + tag DOM once players are known ─────────────────────
  const buildHud = useCallback((players) => {
    const sRows = hudEls.current.standingsRows;
    const tagsWrap = hudEls.current.tags;
    if (!sRows || !tagsWrap) return;
    sRows.innerHTML = ''; tagsWrap.innerHTML = '';
    rowEls.current = {}; tagEls.current = {};
    players.forEach((p) => {
      const me = p.name === playerName;
      // standings row
      const row = document.createElement('div');
      row.className = `srow${me ? ' me' : ''}`;
      const rk = document.createElement('span'); rk.className = 'rk';
      const who = document.createElement('span'); who.className = 'who';
      const dot = document.createElement('span'); dot.className = 'dot'; dot.style.background = carColor(p.carId);
      const nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = (me ? '★ ' : '') + p.name;
      who.append(dot, nm);
      const pct = document.createElement('span'); pct.className = 'pct'; pct.style.color = carColor(p.carId); pct.textContent = '0%';
      const prog = document.createElement('span'); prog.className = 'prog'; prog.style.color = carColor(p.carId); prog.style.width = '0';
      row.append(rk, who, pct, prog);
      sRows.appendChild(row);
      rowEls.current[p.name] = { row, rk, pct, prog };
      // tag
      const tag = document.createElement('div');
      tag.className = `tag${me ? ' me' : ''}`;
      tag.innerHTML = me ? '<span class="star">★</span>' : '';
      tag.appendChild(document.createTextNode(p.name));
      tag.style.display = 'none';
      tagsWrap.appendChild(tag);
      tagEls.current[p.name] = tag;
    });
  }, [playerName]);

  // ── per-frame HUD updater ────────────────────────────────────────────────
  const updateHud = useCallback(() => {
    const scene = sceneRef.current;
    const players = playersRef.current;
    if (!scene || !players.length) return;
    const liveOf = (p) => (p.name === playerName ? myProgressRef.current : (p.progress || 0));

    // decay typing speed when idle so the world coasts to a stop (no idle creep)
    const sinceKey = (performance.now() - lastKeyRef.current) / 1000;
    if (sinceKey > 0.35) cpsRef.current *= 0.92;

    // sync scene progress + player speed (frozen once the player has finished)
    players.forEach((p) => scene.setProgress(p.name, liveOf(p)));
    const norm = playerDoneRef.current ? 0 : Math.max(0, Math.min(1, cpsRef.current / TARGET_CPS));
    scene.setPlayerSpeed(norm);

    // speedo
    if (hudEls.current.spdNum) hudEls.current.spdNum.textContent = String(Math.round(cpsRef.current * 12));
    if (hudEls.current.spdBar) hudEls.current.spdBar.style.width = (norm * 100) + '%';

    // boost FX
    if (hudEls.current.typebox) hudEls.current.typebox.classList.toggle('boost', norm > 0.66);
    if (hudEls.current.speedlines) hudEls.current.speedlines.style.opacity = norm > 0.5 ? (norm - 0.5) * 1.6 : 0;

    // typing stats
    const elapsedMin = Math.max(0.001, (performance.now() - startedAtRef.current) / 60000);
    const wpm = Math.round((correctRef.current / 5) / elapsedMin);
    const acc = totalKeysRef.current ? Math.round((correctRef.current / totalKeysRef.current) * 100) : 100;
    if (hudEls.current.wpmStat) hudEls.current.wpmStat.textContent = wpm;
    if (hudEls.current.accStat) hudEls.current.accStat.textContent = acc + '%';
    if (hudEls.current.hint) hudEls.current.hint.textContent = Math.round(myProgressRef.current * 100) + '% · keep your eyes on the text';

    // timer
    if (timeLimitRef.current && hudEls.current.timerVal) {
      const r = Math.max(0, timeLimitRef.current - (performance.now() - startedAtRef.current) / 1000);
      const m = Math.floor(r / 60), s = Math.floor(r % 60);
      hudEls.current.timerVal.textContent = `${m}:${String(s).padStart(2, '0')}`;
      hudEls.current.timer?.classList.toggle('warn', r <= 10);
    }

    // standings (sorted)
    const sorted = [...players].sort((a, b) => {
      if (a.finished && b.finished) return (a.rank || 99) - (b.rank || 99);
      if (a.finished) return -1; if (b.finished) return 1;
      return liveOf(b) - liveOf(a);
    });
    sorted.forEach((p, i) => {
      const r = rowEls.current[p.name]; if (!r) return;
      r.row.style.order = i;
      r.rk.textContent = i + 1;
      r.pct.textContent = (p.finished ? '#' + (p.rank || i + 1) : Math.round(liveOf(p) * 100) + '%');
      r.prog.style.width = (liveOf(p) * 100) + '%';
    });
    const meIdx = sorted.findIndex((p) => p.name === playerName);
    if (hudEls.current.posP) hudEls.current.posP.textContent = 'P' + (meIdx + 1);
    if (hudEls.current.posOf) hudEls.current.posOf.textContent = '/ ' + sorted.length;

    // floating tags
    players.forEach((p) => {
      const el = tagEls.current[p.name]; if (!el) return;
      const t = scene.getTag(p.name);
      if (t.visible) {
        el.style.display = 'block';
        el.style.left = t.x + 'px';
        el.style.top = t.y + 'px';
        el.style.opacity = t.depth > 180 ? Math.max(0, 1 - (t.depth - 180) / 120) : 1;
      } else el.style.display = 'none';
    });
  }, [playerName]);

  // run the HUD loop while racing
  useEffect(() => {
    if (phase !== 'racing') return undefined;
    const tick = () => { updateHud(); rafRef.current = requestAnimationFrame(tick); };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [phase, updateHud]);

  // local 3-2-1-GO animation
  const runCountdown = useCallback(() => {
    const seq = ['3', '2', '1', 'GO'];
    let i = 0;
    const step = () => {
      setCountdownText(seq[i]);
      i += 1;
      if (i < seq.length) setTimeout(step, 720);
      else setTimeout(() => setCountdownText(null), 620);
    };
    step();
  }, []);

  // ── set up scene from a server state (once) ──────────────────────────────
  const ensureSetup = useCallback(async (state) => {
    if (!state) return;
    if (state.paragraph) setParagraph(state.paragraph);
    if (state.players) { playersRef.current = state.players; }
    if (state.timeLimitSec) timeLimitRef.current = state.timeLimitSec;
    if (setupDone.current || !state.players?.length) return;
    setupDone.current = true;

    const scene = sceneRef.current;
    scene.init(canvasRef.current);
    buildHud(state.players);
    await scene.setup({ cars: buildCarSpecs(state.players), env: 'desert', time: 'day' });
    state.players.forEach((p) => scene.setProgress(p.name, 0));
    scene.setPlayerSpeed(0);
    scene.start();
    setLoading(false);
    if (state.phase === 'countdown') { setPhase('countdown'); runCountdown(); }
  }, [buildCarSpecs, buildHud, runCountdown]);

  // ── socket wiring ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!playerName) { navigate('/boom-typer/race'); return undefined; }
    sceneRef.current = new RaceScene();
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const onSync = ({ state }) => {
      if (!state) return;
      if (state.phase === 'ended') { navigate(`/boom-typer/race/results/${roomCode}`, { state: { results: state.results || [] } }); return; }
      ensureSetup(state);
      if (state.phase === 'racing') {
        startedAtRef.current = state.startedAt ? new Date(state.startedAt).getTime() : performance.now();
        lastKeyRef.current = performance.now();
        setCountdownText(null);
        setPhase('racing');
      }
    };
    const onCountdown = ({ state }) => { ensureSetup(state); };
    const onRaceStart = ({ startedAt, timeLimitSec, state }) => {
      if (state) { playersRef.current = state.players || playersRef.current; if (state.paragraph) setParagraph(state.paragraph); }
      if (timeLimitSec) timeLimitRef.current = timeLimitSec;
      startedAtRef.current = startedAt ? new Date(startedAt).getTime() : performance.now();
      lastKeyRef.current = performance.now();
      setCountdownText(null);
      setLoading(false);
      setPhase('racing');
    };
    const onProgress = ({ players: pl }) => {
      playersRef.current = playersRef.current.map((p) => {
        const u = pl.find((x) => x.playerId === p.name);
        return u ? { ...p, progress: u.progress, finished: u.finished } : p;
      });
    };
    const onFinished = ({ playerId, rank }) => {
      playersRef.current = playersRef.current.map((p) => (p.name === playerId ? { ...p, finished: true, rank, progress: 1 } : p));
    };
    const onOver = ({ results }) => { navigate(`/boom-typer/race/results/${roomCode}`, { state: { results } }); };
    const onDnf = ({ playerId }) => { playersRef.current = playersRef.current.map((p) => (p.name === playerId ? { ...p, connected: false } : p)); };

    socket.on('typing:state_sync', onSync);
    socket.on('typing:countdown', onCountdown);
    socket.on('typing:race_start', onRaceStart);
    socket.on('typing:progress_update', onProgress);
    socket.on('typing:player_finished', onFinished);
    socket.on('typing:race_over', onOver);
    socket.on('typing:player_dnf', onDnf);

    if (!joined.current) { joined.current = true; socket.emit('typing:room:join', { roomCode, playerName }); }

    return () => {
      socket.off('typing:state_sync', onSync);
      socket.off('typing:countdown', onCountdown);
      socket.off('typing:race_start', onRaceStart);
      socket.off('typing:progress_update', onProgress);
      socket.off('typing:player_finished', onFinished);
      socket.off('typing:race_over', onOver);
      socket.off('typing:player_dnf', onDnf);
      sceneRef.current?.dispose();
      sceneRef.current = null;
      setupDone.current = false;
      joined.current = false;
      playerDoneRef.current = false;
    };
  }, [roomCode, playerName, navigate, ensureSetup]);

  // ── progress + finish emits ──────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'racing') return;
    const cc = typing.correctChars;
    const now = Date.now();
    if (cc === lastSent.current.correctChars) return;
    if (now - lastSent.current.at < PROGRESS_SEND_INTERVAL_MS) return;
    lastSent.current = { at: now, correctChars: cc };
    getSocket().emit('typing:progress', { roomCode, playerName, correctChars: cc, totalKeystrokes: typing.totalKeystrokes, errors: typing.errors });
  }, [typing.correctChars, typing.totalKeystrokes, typing.errors, phase, roomCode, playerName]);

  useEffect(() => {
    if (phase !== 'racing' || !paragraph || finishedSent.current) return;
    if (typing.correctChars < paragraph.length) return;
    finishedSent.current = true;
    getSocket().emit('typing:finished', { roomCode, playerName, correctChars: paragraph.length, totalKeystrokes: typing.totalKeystrokes, errors: typing.errors });

    // Freeze the player's throttle and show the finish popup; rivals keep racing.
    playerDoneRef.current = true;
    sceneRef.current?.setPlayerSpeed(0);
    const liveOf = (p) => (p.name === playerName ? 1 : (p.progress || 0));
    const sorted = [...playersRef.current].sort((a, b) => {
      if (a.finished && b.finished) return (a.rank || 99) - (b.rank || 99);
      if (a.finished) return -1; if (b.finished) return 1;
      return liveOf(b) - liveOf(a);
    });
    const pos = sorted.findIndex((p) => p.name === playerName) + 1 || 1;
    const ord = ['st', 'nd', 'rd'][pos - 1] || 'th';
    const elapsedMin = Math.max(0.001, (performance.now() - startedAtRef.current) / 60000);
    setFinishInfo({
      pos,
      place: pos === 1 ? 'You won the race!' : `You crossed the line in ${pos}${ord} place`,
      sub: pos === 1 ? '🏁 First across the finish line' : 'Rivals are still on track…',
      wpm: Math.round((paragraph.length / 5) / elapsedMin),
      acc: totalKeysRef.current ? Math.round((correctRef.current / totalKeysRef.current) * 100) : 100,
    });
  }, [typing.correctChars, typing.totalKeystrokes, typing.errors, paragraph, phase, roomCode, playerName]);

  const quit = () => { getSocket().emit('typing:leave', { roomCode, playerName }); sceneRef.current?.stop(); navigate('/boom-typer/race'); };

  // paragraph spans (React renders these; keystroke-rate, not per-frame)
  const cursor = typing.cursorIndex;
  const chars = [];
  for (let i = 0; i < paragraph.length; i++) {
    let cls = '';
    if (i < cursor) cls = 'done';
    else if (i === cursor && wrongAt === i) cls = 'err';
    else if (i === cursor) cls = 'cur';
    chars.push(<span key={i} className={cls}>{paragraph[i]}</span>);
  }

  const setEl = (key) => (el) => { hudEls.current[key] = el; };

  return (
    <div className="ttd">
      <canvas id="race-canvas" ref={canvasRef} />
      <div className="race-fade" />
      <div className="speedlines" ref={setEl('speedlines')} />

      <div className="hud">
        <div style={{ position: 'absolute', top: 20, left: 22, zIndex: 30 }}>
          <button className="btn-ghost" onClick={quit}>← Quit</button>
        </div>

        <div className="timer" ref={setEl('timer')}>
          <div className="lbl">TIME</div>
          <div className="val" ref={setEl('timerVal')}>—:—</div>
        </div>

        <div className="posbadge">
          <span className="p" ref={setEl('posP')}>P1</span>
          <span className="of" ref={setEl('posOf')}>/ —</span>
        </div>

        <div className="speedo">
          <div className="num" ref={setEl('spdNum')}>0</div>
          <div className="unit">WPM</div>
          <div className="bar"><i ref={setEl('spdBar')} /></div>
        </div>

        <div className="standings">
          <h4>Standings</h4>
          <div id="standings-rows" ref={setEl('standingsRows')} />
        </div>

        <div className="tags" ref={setEl('tags')} />

        {countdownText != null && (
          <div className="countdown"><div className={`cd${countdownText === 'GO' ? ' go' : ''}`} key={countdownText}>{countdownText}</div></div>
        )}

        {loading && (
          <div className="loading">
            <div className="spin" />
            <div className="t">Loading Race</div>
            <div className="s">Warming up engines…</div>
          </div>
        )}

        <div className={`finish-pop${finishInfo ? ' show' : ''}`}>
          <div className="finish-card">
            <div className="finish-flag">🏁</div>
            <p className="kicker" style={{ marginBottom: 4 }}>Race Finished</p>
            <div className="finish-pos">P{finishInfo?.pos ?? 1}</div>
            <h2 className="finish-place">{finishInfo?.place ?? 'You finished!'}</h2>
            <p className="finish-sub">{finishInfo?.sub ?? ''}</p>
            <div className="finish-stats">
              <div><span>{finishInfo?.wpm ?? 0}</span><label>WPM</label></div>
              <div><span>{finishInfo?.acc ?? 100}%</span><label>Accuracy</label></div>
            </div>
            <button className="btn-primary" onClick={() => navigate(`/boom-typer/race/results/${roomCode}`)}>View full results →</button>
          </div>
        </div>

        <div className="typebox" ref={setEl('typebox')}>
          <div className="ttext">{chars}</div>
          <div className="tmeta">
            <span className="hint" ref={setEl('hint')}>0% · keep your eyes on the text</span>
            <span className="stats">
              <span>WPM <b ref={setEl('wpmStat')}>—</b></span>
              <span>ACC <b ref={setEl('accStat')}>—</b></span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
