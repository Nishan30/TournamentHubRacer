import { useRef, useEffect } from 'react'
// Make sure this path is correct for your project structure
import { useGameCanvas } from '../components/mathJump/useGameCanvas'
import './MathJump.css' // Assuming you have this CSS file

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
      {/* Main layout container */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 max-w-6xl w-full">
        {/* Game Canvas Section */}
        <div className="flex flex-col items-center w-full md:w-2/3">
          <h1 className="text-4xl font-bold text-white mb-6 animate-pulse text-center">
            Math Runner
          </h1>
          <canvas
            ref={canvasRef}
            className="w-full h-[600px] rounded-lg shadow-2xl border-4 border-indigo-600 bg-gray-800"
            onClick={handleClick}
            style={{ cursor: 'pointer' }}
            width={800} // Explicit width matching constant
            height={600}// Explicit height matching constant
          />
        </div>
        {/* Controls and Info Section */}
        <div className="bg-black bg-opacity-60 p-6 rounded-lg text-white text-center w-full md:w-1/3 backdrop-blur-sm">
          <h2 className="text-2xl font-bold mb-4">Controls & Info</h2>
          {/* Use grid for layout inside the info panel */}
          <div className="grid grid-cols-1 gap-6 text-left">
            {/* Basic Controls Section */}
            <div>
              <h3 className="text-xl font-semibold mb-2 border-b border-indigo-400 pb-1">Basic Controls</h3>
              <p><span className="font-bold text-indigo-300">Space / Click / Tap:</span> Jump</p>
              <p><span className="font-bold text-indigo-300">R:</span> Restart Game</p>
            </div>

            {/* UPDATED Hazards Section */}
            <div>
              <h3 className="text-xl font-semibold mb-2 border-b border-indigo-400 pb-1">Hazards (Game Over)</h3>
              <p className="mb-2">
                Colliding with any{' '}
                <span className="font-bold" style={{ color: '#FF0000' }}>Red</span>{' '}
                obstacle will end the game! These include:
              </p>
              {/* List the specific fatal symbols */}
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>
                  <span className="font-bold text-xl">∞</span> (Infinity)
                </li>
                <li>
                  <span className="font-bold text-xl">i</span> (Imaginary Unit)
                </li>
                 <li>
                  <span className="font-bold text-xl">X</span> (Direct Hazard)
                </li>
              </ul>
               <p className="mt-2">Watch out for stacked obstacles!</p>
            </div>
            {/* End of UPDATED Section */}

          </div>
        </div>
      </div>
    </div>
  )
}