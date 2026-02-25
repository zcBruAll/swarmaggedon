import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEngine, GAME_STATE } from '../game/engine';
import '../assets/style/pages/Game.css';
import { formatDurationToHours } from '../utils/Utils';

const DEFAULT_HUD = {
  score: 0,
  elapsed: 0,
  wave: 1,
  hp: 100,
  gameState: GAME_STATE.RUNNING,
};

function Game() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const navigate = useNavigate();

  // ref is used for the raw values and only setState at ~15fps
  // to avoid React re-rendering on every animation frame
  const hudRawRef = useRef(DEFAULT_HUD);
  const [hud, setHud] = useState(DEFAULT_HUD);

  // Called by the engine every frame
  const onHUDUpdate = useCallback(async (data) => {
    hudRawRef.current = data;
    
    if (data.gameState == "game_over") {
      try {
        const result = await fetch('/api/user/runs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            score: data.score,
            duration: Math.round(data.elapsed),
            wave: data.wave,
            kills: 111 //placeholder
          })
        })
      } catch (err) {
        console.error("Error while sending data", err)
      }
    } 
  }, []);

  // Flush raw HUD values into React state at ~15fps
  useEffect(() => {
    const id = setInterval(() => setHud({ ...hudRawRef.current }), 66);
    return () => clearInterval(id);
  }, []);

  const onBack = () => {
    navigate('/');
  };

  const onPause = () => {
    engineRef.current.togglePause();
  }

  const onNewRun = () => {
    engineRef.current.restart();
  }

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
      {hudRawRef.current.gameState === GAME_STATE.GAME_OVER &&
        <div className='overlay game-over'>
          <span className='game-title'>GAME OVER</span>
          <div className='menu'>
            <button className='menu-btn' onClick={onNewRun}>Start a new run</button>
            <button className='menu-btn' onClick={onBack}>← menu</button>
          </div>
        </div>
      }
      {hudRawRef.current.gameState === GAME_STATE.PAUSED &&
        <div className='overlay pause'>
          <span className='game-title'>GAME PAUSED</span>
          <div className='menu'>
            <button className='menu-btn' onClick={onPause}>Return to game</button>
            <button className='menu-btn' onClick={onBack}>← menu</button>
          </div>
        </div>
      }
      {hudRawRef.current.gameState === GAME_STATE.RUNNING &&
        <div className="hud">
          <span>score: <strong>{hudRawRef.current.score}</strong></span>
          <span>time: <strong>{formatDurationToHours(hudRawRef.current.elapsed)}</strong></span>
          <span>wave: <strong>{hudRawRef.current.wave}</strong></span>
          <span>hp: <strong>{hudRawRef.current.hp}</strong></span>
        </div>
      }
      <canvas ref={canvasRef} className="game-canvas"></canvas>
    </div>
  );
}

export default Game;