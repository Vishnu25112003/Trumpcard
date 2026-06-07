import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BoomTyperEngine } from './engine/BoomTyperEngine';
import './styles.css';

const INITIAL_SNAP = {
  screen: 'title',
  hudVisible: false,
  score: '000000',
  mult: '',
  progressPct: 0,
  waveClear: { title: 'WAVE 001 CLEAR', score: '000000' },
  gameover: { score: '000000', wave: 1, acc: '0%', wpm: 0, words: 0 },
  best: { score: '000000', wave: '—' },
};

const BLOCKING_SCREENS = new Set(['pause', 'waveclear', 'gameover', 'howto', 'scores']);

export default function SoloGame() {
  const navigate = useNavigate();
  const fieldRef = useRef(null);
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [snap, setSnap] = useState(INITIAL_SNAP);

  useEffect(() => {
    const engine = new BoomTyperEngine(fieldRef.current, canvasRef.current, {
      onState: setSnap,
    });
    engineRef.current = engine;
    engine.start();
    return () => { engine.destroy(); engineRef.current = null; };
  }, []);

  const act = (name) => engineRef.current?.action(name);
  const { screen } = snap;
  const fieldBlur = BLOCKING_SCREENS.has(screen);
  const onMenu = screen === 'title' || screen === 'howto' || screen === 'scores';

  return (
    <div className="bt-root">
      {onMenu && (
        <button className="bt-hub-exit" onClick={() => navigate('/')}>← GameHub</button>
      )}

      <div id="stage" className="bt-stage">
        <div
          id="field"
          ref={fieldRef}
          className={`bt-field${fieldBlur ? ' blur-bg' : ''}`}
          tabIndex={0}
        >
          <canvas id="game-canvas" ref={canvasRef} className="bt-canvas" />

          {/* HUD */}
          <div className="bt-hud" style={{ opacity: snap.hudVisible ? 1 : 0 }}>
            <div className="hud-top">
              <button className="pause-btn" aria-label="Pause" onClick={() => engineRef.current?.togglePause()}>
                <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
              </button>
              <div className="score-readout">
                <span className="label">Score</span>
                <span className="value">{snap.score}</span><span className="mult">{snap.mult}</span>
              </div>
            </div>
            <div className="wave-progress" style={{ width: `${snap.progressPct}%` }} />
          </div>

          {/* TITLE */}
          {screen === 'title' && (
            <div className="overlay">
              <div className="overlay-scrim" />
              <div className="studio">MEEKAAN</div>
              <h1 className="wordmark">BOOM<span className="l2">TYPER</span></h1>
              <nav className="menu">
                <button className="menu-item primary" onClick={() => act('start')}>new game</button>
                <button className="menu-item" onClick={() => navigate('/boom-typer/race')}>friends race</button>
                <button className="menu-item" onClick={() => act('howto')}>how to play</button>
                <button className="menu-item" onClick={() => act('scores')}>high scores</button>
              </nav>
            </div>
          )}

          {/* HOW TO PLAY */}
          {screen === 'howto' && (
            <div className="overlay">
              <div className="overlay-scrim" />
              <div className="eyebrow">Briefing</div>
              <div className="howto">
                <div className="howto-row"><span className="n">1</span><p>Bombs fall from the top, each tagged with a <b>word</b>.</p></div>
                <div className="howto-row"><span className="n">2</span><p>Type a word&apos;s <b>first letter</b> to lock on. Your turret targets it automatically.</p></div>
                <div className="howto-row"><span className="n">3</span><p>Finish the word to <b>detonate</b> it. Chain clean kills to raise your <b>multiplier</b>.</p></div>
                <div className="howto-row"><span className="n">4</span><p>If a bomb crosses the <b>danger line</b>, the run is over.</p></div>
              </div>
              <div className="btn-row">
                <button className="btn primary" onClick={() => act('start')}>Start run</button>
                <button className="btn" onClick={() => act('back')}>Back</button>
              </div>
            </div>
          )}

          {/* HIGH SCORES */}
          {screen === 'scores' && (
            <div className="overlay">
              <div className="overlay-scrim" />
              <div className="eyebrow">Best Runs</div>
              <div className="big-stat">{snap.best.score}</div>
              <div className="underline-rule" />
              <div className="sub-readout">Top wave reached · <b>{snap.best.wave}</b></div>
              <div className="btn-row" style={{ marginTop: 28 }}>
                <button className="btn primary" onClick={() => act('start')}>New game</button>
                <button className="btn" onClick={() => act('back')}>Back</button>
              </div>
            </div>
          )}

          {/* PAUSE */}
          {screen === 'pause' && (
            <div className="overlay">
              <div className="overlay-scrim" />
              <div className="eyebrow">Paused</div>
              <h2 className="big-stat" style={{ color: 'var(--bt-white)' }}>HOLD</h2>
              <div className="underline-rule" style={{ background: 'var(--bt-white)' }} />
              <div className="btn-row" style={{ marginTop: 18 }}>
                <button className="btn primary" onClick={() => act('resume')}>Resume</button>
                <button className="btn" onClick={() => act('quit')}>Quit run</button>
              </div>
            </div>
          )}

          {/* WAVE CLEAR */}
          {screen === 'waveclear' && (
            <div className="overlay">
              <div className="overlay-scrim" />
              <div className="eyebrow">Sector cleared</div>
              <div className="big-stat">{snap.waveClear.title}</div>
              <div className="underline-rule" />
              <div className="sub-readout">Score: <b>{snap.waveClear.score}</b></div>
            </div>
          )}

          {/* GAME OVER */}
          {screen === 'gameover' && (
            <div className="overlay">
              <div className="overlay-scrim" />
              <div className="eyebrow">Run terminated</div>
              <h2 className="big-stat warn">GAME OVER</h2>
              <div className="stat-grid">
                <div className="stat-cell"><div className="sv">{snap.gameover.score}</div><div className="sl">Score</div></div>
                <div className="stat-cell"><div className="sv">{snap.gameover.wave}</div><div className="sl">Wave</div></div>
                <div className="stat-cell"><div className="sv">{snap.gameover.acc}</div><div className="sl">Accuracy</div></div>
              </div>
              <div className="sub-readout" style={{ marginBottom: 26 }}><b>{snap.gameover.wpm}</b> WPM · <b>{snap.gameover.words}</b> bombs cleared</div>
              <div className="btn-row">
                <button className="btn primary" onClick={() => act('start')}>Retry</button>
                <button className="btn" onClick={() => act('quit')}>Main menu</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
