import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEngine } from '../game/engine';
import '../assets/style/pages/Game.css';

const DEFAULT_HUD = {
  score: 0,
  elapsed: 0,
  wave: 1,
  hp: 100,
};

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function Game() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const navigate = useNavigate();

  // ref is used for the raw values and only setState at ~15fps
  // to avoid React re-rendering on every animation frame
  const hudRawRef = useRef(DEFAULT_HUD);
  const [hud, setHud] = useState(DEFAULT_HUD);

  // Called by the engine every frame
  const onHUDUpdate = useCallback((data) => {
    hudRawRef.current = data;
  }, []);

  // Flush raw HUD values into React state at ~15fps
  useEffect(() => {
    const id = setInterval(() => setHud({ ...hudRawRef.current }), 66);
    return () => clearInterval(id);
  }, []);

  const onBack = () => {
    navigate('/');
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Resize canvas to viewport
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Create and start engine
    const engine = createEngine(canvas, onHUDUpdate);
    engineRef.current = engine;
    engine.start();

    const onKey = (e) => {
      if (e.key === 'Escape') engine.togglePause();
      if (e.key === '"') engine.restart();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      engine.stop();
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKey);
    };
  }, [onHUDUpdate]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000, background: '#f4f0e8' }}>
      <canvas ref={canvasRef} className="game-canvas"></canvas>
      <button onClick={onBack} className="back-btn">← menu</button>
      <div className="hud">
        <span>score: <strong>{hudRawRef.current.score}</strong></span>
        <span>time: <strong>{formatTime(hudRawRef.current.elapsed)}</strong></span>
        <span>wave: <strong>{hudRawRef.current.wave}</strong></span>
        <span>hp: <strong>{hudRawRef.current.hp}</strong></span>
      </div>
    </div>
  );
}

export default Game;