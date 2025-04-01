import React, { useRef, useEffect } from 'react';
import { useGameCanvas } from './useGameCanvas';

export const CanvasGame: React.FC = () => {
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
    <canvas
      ref={canvasRef}
      className="w-full h-[600px] rounded-lg shadow-2xl border-4 border-indigo-600"
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    />
  );
};