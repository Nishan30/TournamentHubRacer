import { useRef, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Adjust paths as needed
import { useGameCanvas } from '../components/mathJump/useGameCanvas'
// Ensure this path is correct for your FinishedCanvasUI component
import { FinishedCanvasUI } from '../ui/finishedCanvasUI'
import './MathJump.css' // Your CSS file

// Constants matching the hook
const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600

export default function MathJump() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { startGame, handleClick, resetGame, gameState } = useGameCanvas(canvasRef)
  const [searchParams] = useSearchParams()
  const tournamentId = searchParams.get('tourId')

  // --- Effect to start/manage the game loop ---
  useEffect(() => {
    let cleanupFunction: (() => void) | undefined
    if (canvasRef.current && !gameState.gameOver) {
      console.log('MathJump: Starting game loop...')
      cleanupFunction = startGame()
    } else {
      console.log('MathJump: Game over or canvas not ready, ensuring loop is stopped.')
      const cleanup = startGame()
      if (typeof cleanup === 'function') cleanup()
    }
    return () => {
      console.log('MathJump: Cleanup effect...')
      if (typeof cleanupFunction === 'function') {
        cleanupFunction()
      }
    }
  }, [startGame, gameState.gameOver])

  // --- Prevent scrolling on space ---
  useEffect(() => {
    const preventScroll = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !gameState.gameOver) {
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', preventScroll)
    return () => {
      window.removeEventListener('keydown', preventScroll)
    }
  }, [gameState.gameOver])

  // --- Restart Handler ---
  const handleRestart = useCallback(() => {
    console.log('MathJump: handleRestart called...')
    resetGame()
  }, [resetGame])

  return (
    // Main page container
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Toaster for notifications */}
      <Toaster position="top-center" reverseOrder={false} />
      {/* Game Title */}
      <h1 className="text-4xl font-bold text-white mb-4 md:mb-6 animate-pulse text-center">Math Runner</h1>
      {/* Main Content Area (Game + Info Side-by-Side on Medium+ Screens) */}
      {/* Increased max-width to better accommodate side-by-side layout */}
      <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-6 md:gap-8 max-w-7xl w-full">
        {/* Game Area Container (Canvas + Overlay) - Takes more width on larger screens */}
        <div className="relative w-full md:w-2/3 max-w-[800px]">
          {' '}
          {/* Adjusted width allocation */}
          {/* Canvas Element */}
          <canvas
            ref={canvasRef}
            // Apply fade effect only when game is over
            className={`w-full rounded-lg shadow-2xl border-4 border-indigo-600 bg-gray-800 transition-opacity duration-300 ${
              gameState.gameOver ? 'opacity-50 blur-[2px]' : 'opacity-100 blur-0'
            }`}
            onClick={!gameState.gameOver ? handleClick : undefined}
            style={{
              cursor: !gameState.gameOver ? 'pointer' : 'default',
              height: `${CANVAS_HEIGHT}px`, // Maintain aspect ratio via height
            }}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
          />
          {/* --- Finished UI Overlay --- */}
          {gameState.gameOver && (
            // This div now provides the background/panel effect
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black bg-opacity-60 backdrop-blur-sm p-4 rounded-lg">
              <FinishedCanvasUI score={gameState.player.value} onRestart={handleRestart} tournamentId={tournamentId} />
            </div>
          )}
          {/* Optional: Display score during gameplay */}
          {/* {!gameState.gameOver && (
            <div className="absolute top-3 left-3 bg-black bg-opacity-50 px-3 py-1 rounded z-5">
              <span className="text-white text-xl font-bold ">Score: {gameState.player.value}</span>
            </div>
          )} */}
        </div>

        {/* Controls and Info Section (Conditionally Rendered on the Side) - Takes less width */}
        {/* Hide this section completely when game is over */}
        {!gameState.gameOver && (
          // Added md:sticky and md:top-10 for better positioning on scroll if page was longer
          <div className="bg-black bg-opacity-60 p-4 md:p-6 rounded-lg text-white w-full md:w-1/3 max-w-[400px] backdrop-blur-sm md:sticky md:top-10">
            <h2 className="text-xl md:text-2xl font-bold mb-4 text-center">Controls & Info</h2>
            <div className="grid grid-cols-1 gap-4 text-left text-sm md:text-base">
              {/* Basic Controls */}
              <div>
                <h3 className="text-lg md:text-xl font-semibold mb-2 border-b border-indigo-400 pb-1">Controls</h3>
                <p>
                  <span className="font-bold text-indigo-300">Space / Click / Tap:</span> Jump
                </p>
                <p>
                  <span className="font-bold text-indigo-300">R:</span> Restart Game
                </p>
              </div>
              {/* Hazards */}
              <div>
                <h3 className="text-lg md:text-xl font-semibold mb-2 border-b border-indigo-400 pb-1">Hazards (Game Over)</h3>
                <p className="mb-1">
                  Hitting{' '}
                  <span className="font-bold" style={{ color: '#FF0000' }}>
                    Red (X, ∞, i)
                  </span>{' '}
                  obstacles ends the game.
                </p>
                <p className="font-bold text-sm">Watch out for stacked obstacles!</p>
              </div>
              {/* Optional: Add Objectives/Scoring Info */}
              <div>
                <h3 className="text-lg md:text-xl font-semibold mb-2 border-b border-indigo-400 pb-1">Scoring</h3>
                <p>Run farther and collide with math operations to increase your score. Avoid the red hazards!</p>
                <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
                  <li>
                    <span style={{ color: '#00FF00' }}>Green:</span> Simple +/-
                  </li>
                  <li>
                    <span style={{ color: '#0000FF' }}>Blue:</span> Simple x / ÷
                  </li>
                  <li>
                    <span style={{ color: '#FF69B4' }}>Pink:</span> Complex Ops
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>{' '}
      {/* End of Main Content Area */}
    </div> // End of Main Page Container
  )
}
