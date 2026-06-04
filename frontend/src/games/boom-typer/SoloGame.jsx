import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SparkleLayer from '../../shared/components/SparkleLayer';
import { BoomTyperEngine } from './engine/Engine';
import GameOverScreen from './ui/GameOverScreen';
import HUD from './ui/HUD';
import LevelTransition from './ui/LevelTransition';
import MenuScreen from './ui/MenuScreen';
import './styles.css';

const INITIAL_CHROME = {
  status: 'menu',
  level: 1,
  finalLevel: 1,
  boomsClearedThisLevel: 0,
  boomsGoalThisLevel: 10,
  liveBoomCount: 0,
  maxBoomsOnScreen: 3,
  bannerLevel: null,
  lockedWord: null,
  lockedTypedIndex: 0,
};

export default function SoloGame() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [chrome, setChrome] = useState(INITIAL_CHROME);

  const stopEngine = useCallback(() => {
    engineRef.current?.stop();
    engineRef.current = null;
  }, []);

  const startGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    stopEngine();
    setChrome({ ...INITIAL_CHROME, status: 'playing' });
    const engine = new BoomTyperEngine(canvas, {
      onUpdate: setChrome,
    });
    engineRef.current = engine;
    engine.start();
    canvas.focus({ preventScroll: true });
  }, [stopEngine]);

  const backToHub = useCallback(() => {
    stopEngine();
    navigate('/');
  }, [navigate, stopEngine]);

  useEffect(() => () => stopEngine(), [stopEngine]);

  useEffect(() => {
    if (chrome.status !== 'playing') return undefined;

    const onKeyDown = (event) => {
      if (!/^[a-z]$/i.test(event.key)) return;
      event.preventDefault();
      engineRef.current?.handleKey(event.key);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [chrome.status]);

  return (
    <>
      <div className="table-bg" />
      <SparkleLayer />

      <main className="bt-page">
        <header className="bt-topbar">
          <button className="bt-brand" onClick={backToHub}>
            <span className="bt-brand-mark">BT</span>
            <span>
              <small>GameHub</small>
              <strong>Boom Typer</strong>
            </span>
          </button>
          {chrome.status === 'playing' && (
            <button className="btn btn-ghost bt-exit" onClick={backToHub}>Exit</button>
          )}
        </header>

        <section className="bt-stage-wrap" aria-label="Boom Typer solo game">
          {chrome.status === 'playing' && (
            <HUD
              level={chrome.level}
              cleared={chrome.boomsClearedThisLevel}
              goal={chrome.boomsGoalThisLevel}
              liveBoomCount={chrome.liveBoomCount}
              maxBooms={chrome.maxBoomsOnScreen}
              lockedWord={chrome.lockedWord}
              lockedTypedIndex={chrome.lockedTypedIndex}
            />
          )}

          <div className="bt-playfield">
            <canvas
              ref={canvasRef}
              className="bt-canvas"
              tabIndex={0}
              aria-label="Typing shooter canvas"
            />

            {chrome.status === 'menu' && <MenuScreen onStart={startGame} onBack={backToHub} />}
            {chrome.status === 'gameover' && (
              <GameOverScreen finalLevel={chrome.finalLevel} onRetry={startGame} onBack={backToHub} />
            )}
            {chrome.status === 'playing' && <LevelTransition level={chrome.bannerLevel} />}
          </div>
        </section>
      </main>
    </>
  );
}
