import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/style/pages/Game.css';

function Game() {
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  const onBack = () => {
    navigate('/');
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      draw();
    };

    const draw = () => {
      const w = canvas.width, h = canvas.height;

      // Paper background
      ctx.fillStyle = '#f4f0e8';
      ctx.fillRect(0, 0, w, h);

      // Notebook lines
      ctx.strokeStyle = 'rgba(180,168,148,0.3)';
      ctx.lineWidth = 1;
      const lineSpacing = 28;
      for (let y = lineSpacing; y < h; y += lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Left margin red line
      ctx.strokeStyle = 'rgba(192,57,43,0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(60, 0);
      ctx.lineTo(60, h);
      ctx.stroke();

      // Placeholder text
      ctx.fillStyle = 'rgba(90,80,64,0.35)';
      ctx.font = '500 22px Patrick Hand';
      ctx.textAlign = 'center';
      ctx.fillText('[ game canvas — placeholder ]', w / 2, h / 2 - 16);
      ctx.font = '16px Patrick Hand';
      ctx.fillStyle = 'rgba(168,152,128,0.6)';
      ctx.fillText('game logic goes here', w / 2, h / 2 + 12);

      // Hand-drawn player circle
      ctx.save();
      ctx.translate(w / 2, h / 2 + 80);
      ctx.strokeStyle = '#5a5040';
      ctx.lineWidth = 2;
      // Slightly wobbly circle using bezier
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.bezierCurveTo(10, -19, 20, -8, 19, 2);
      ctx.bezierCurveTo(18, 12, 10, 20, 0, 19);
      ctx.bezierCurveTo(-10, 18, -20, 10, -19, 0);
      ctx.bezierCurveTo(-18, -10, -8, -17, 0, -18);
      ctx.stroke();

      // Little X inside player
      ctx.strokeStyle = '#2a2318';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-6, -6); ctx.lineTo(6, 6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(6, -6); ctx.lineTo(-6, 6); ctx.stroke();
      ctx.restore();

      // Some decorative swarm dots (placeholder enemies)
      const dots = [
        [w * 0.2, h * 0.3], [w * 0.25, h * 0.35], [w * 0.18, h * 0.4],
        [w * 0.75, h * 0.25], [w * 0.8, h * 0.3], [w * 0.72, h * 0.2],
        [w * 0.6, h * 0.7], [w * 0.65, h * 0.65], [w * 0.58, h * 0.75],
        [w * 0.35, h * 0.65], [w * 0.3, h * 0.7],
      ];
      ctx.fillStyle = 'rgba(90,80,64,0.2)';
      dots.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Small pencil annotation
      ctx.save();
      ctx.translate(w / 2 + 80, h / 2 + 65);
      ctx.rotate(0.15);
      ctx.fillStyle = 'rgba(122,110,95,0.5)';
      ctx.font = 'italic 13px Patrick Hand';
      ctx.textAlign = 'left';
      ctx.fillText('← player', 0, 0);
      ctx.restore();
    };

    window.addEventListener('resize', resize);
    resize();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000, background: '#f4f0e8' }}>
      <canvas ref={canvasRef} className="game-canvas"></canvas>
      <button onClick={onBack} className="back-btn">← menu</button>
      <div className="hud">
        <span>score: <strong>0</strong></span>
        <span>time: <strong>00:00</strong></span>
        <span>wave: <strong>1</strong></span>
        <span>hp: <strong>100</strong></span>
      </div>
    </div>
  );
}

export default Game;
