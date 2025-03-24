import React, { useRef, useEffect } from 'react';
import './flappyBird.css';
import { Game } from '../components/flappyBird/Game';

const FlappyBirdGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const game = new Game(canvas);
  
      const handleResize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        game.resize(); // Optional if resize logic exists
      };
  
      window.addEventListener('resize', handleResize);
  
      return () => {
        window.removeEventListener('resize', handleResize);
        game.cleanup(); // Optional if cleanup logic exists
      };
    }
  }, []);

  return (
    <div>
      <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} />
      <div className="instructions">
        Controls:<br />
        - Space/Touch: Flap<br />
        - S: Change bird skin<br />
        <br />
        Power-ups:<br />
        - ⭐ +5 points<br />
        - 🛡️ Shield (5 seconds)
      </div>
    </div>
  );
};

export default FlappyBirdGame;
