import { useRef, useEffect } from 'react'
import { useGameCanvas } from '../components/mathJump/useGameCanvas'
import './MathJump.css'

export default function MathJump() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { startGame, handleClick } = useGameCanvas(canvasRef)

  useEffect(() => {
    if (canvasRef.current) {
      const cleanup = startGame()
      return () => {
        if (cleanup) cleanup()
      }
    }
  }, [startGame])

  // Prevent scrolling when space bar is pressed
  useEffect(() => {
    const preventScroll = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', preventScroll)
    return () => {
      window.removeEventListener('keydown', preventScroll)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-black flex items-center justify-center p-4">
      <div className="flex flex-row items-center justify-between gap-8 max-w-6xl w-full">
        <div className="flex flex-col items-center w-2/3">
          <h1 className="text-4xl font-bold text-white mb-8 animate-pulse text-center">Endless Runner</h1>
          <canvas
            ref={canvasRef}
            className="w-full h-[600px] rounded-lg shadow-2xl border-4 border-indigo-600"
            onClick={handleClick}
            style={{ cursor: 'pointer' }}
          />
        </div>
        <div className="bg-black bg-opacity-50 p-6 rounded-lg text-white text-center w-1/3">
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
  )
}
