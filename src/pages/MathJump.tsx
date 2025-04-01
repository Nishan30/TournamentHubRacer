import { useRef, useEffect } from 'react';
import { useGameCanvas } from '../components/mathJump/useGameCanvas';
import './MathJump.css';

export default function MathJump() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { startGame, handleClick } = useGameCanvas(canvasRef);

  useEffect(() => {
    if (canvasRef.current) {
      const cleanup = startGame();
      return () => {
        if (cleanup) cleanup();
      };
    }
  }, [startGame]);

  return (
    <div className="h-screen bg-gradient-to-b from-indigo-900 to-black flex items-center justify-center p-4">
      <div className="flex w-full max-w-6xl h-[90%]">
        <div className="flex-1 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="w-full max-w-[800px] h-full max-h-[600px] rounded-lg shadow-2xl border-4 border-indigo-600"
            onClick={handleClick}
            style={{ cursor: 'pointer' }}
          />
        </div>
        <div className="ml-8 bg-black bg-opacity-50 p-6 rounded-lg text-white text-center w-80 h-full flex flex-col justify-center">
          <h2 className="text-2xl font-bold mb-4">Controls</h2>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Basic Controls</h3>
              <p>Space / Click / Touch - Jump</p>
              <p>R - Restart Game</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Power-ups</h3>
              <p>⭐ Coin (+10 points)</p>
              <p>🏃‍♂️ Speed increases every 100 points</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}