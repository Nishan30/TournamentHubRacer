// src/App.tsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './Memory.css'
import type { Score, GameState } from '../types/memoryTypes'

function MemoryGame() {
  const [gameState, setGameState] = useState<GameState>({
    sequence: [],
    userInput: [],
    level: 1,
    isShowing: false,
    gameOver: false,
  })
  const [playerName, setPlayerName] = useState('')
  const [scores, setScores] = useState<Score[]>(() => {
    const saved = localStorage.getItem('numberMemoryScores')
    return saved ? JSON.parse(saved) : []
  })
  const [gameStarted, setGameStarted] = useState(false)
  const [theme, setTheme] = useState<'space' | 'forest' | 'ocean'>('space')

  const generateSequence = (level: number): number[] => {
    const length = Math.floor(level * 1.5) + 2 // Starts at 3, grows with level
    return Array.from({ length }, () => Math.floor(Math.random() * 10))
  }

  const startNewLevel = () => {
    const newSequence = generateSequence(gameState.level)
    setGameState({
      ...gameState,
      sequence: newSequence,
      userInput: [],
      isShowing: true,
    })

    setTimeout(() => {
      setGameState((prev) => ({ ...prev, isShowing: false }))
    }, 1500 + gameState.level * 300) // Extended show time
  }

  const handleStart = () => {
    if (playerName.trim()) {
      setGameStarted(true)
      startNewLevel()
    }
  }

  const handleNumberClick = (num: number) => {
    if (gameState.isShowing || gameState.gameOver) return

    const newInput = [...gameState.userInput, num]
    setGameState({ ...gameState, userInput: newInput })

    const currentIndex = newInput.length - 1
    if (newInput[currentIndex] !== gameState.sequence[currentIndex]) {
      endGame()
      return
    }

    if (newInput.length === gameState.sequence.length) {
      setGameState((prev) => ({
        ...prev,
        level: prev.level + 1,
        userInput: [],
      }))
      setTimeout(startNewLevel, 1000)
    }
  }

  const endGame = () => {
    const newScore: Score = {
      name: playerName,
      level: gameState.level,
      date: new Date().toLocaleDateString(),
    }
    const newScores = [...scores, newScore].sort((a, b) => b.level - a.level).slice(0, 10)
    setScores(newScores)
    localStorage.setItem('numberMemoryScores', JSON.stringify(newScores))
    setGameState({ ...gameState, gameOver: true })
  }

  const resetGame = () => {
    setGameState({
      sequence: [],
      userInput: [],
      level: 1,
      isShowing: false,
      gameOver: false,
    })
    setGameStarted(false)
  }

  if (!gameStarted) {
    return (
      <div className={`start-screen theme-${theme}`}>
        <h1>Number Memory Challenge</h1>
        <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Enter your name" />
        <div className="theme-selector">
          <button onClick={() => setTheme('space')}>Space</button>
          <button onClick={() => setTheme('forest')}>Forest</button>
          <button onClick={() => setTheme('ocean')}>Ocean</button>
        </div>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={handleStart}>
          Start Game
        </motion.button>
      </div>
    )
  }

  return (
    <div className={`game-container theme-${theme}`}>
      <motion.h1 initial={{ y: -50 }} animate={{ y: 0 }}>
        Level {gameState.level}
      </motion.h1>

      <div className="sequence-display">
        <AnimatePresence>
          {gameState.isShowing
            ? gameState.sequence.map((num, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {num}
                </motion.span>
              ))
            : gameState.userInput.map((num, index) => (
                <motion.span key={index} initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  {num}
                </motion.span>
              ))}
        </AnimatePresence>
      </div>

      <div className="number-pad">
        {Array.from({ length: 10 }, (_, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleNumberClick(i)}
            disabled={gameState.isShowing || gameState.gameOver}
          >
            {i}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {gameState.gameOver && (
          <motion.div className="game-over" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <h2>Game Over!</h2>
            <p>You reached level {gameState.level}</p>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={resetGame}>
              Play Again
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="leaderboard">
        <h2>Galactic Scores</h2>
        {scores.map((score, index) => (
          <motion.div key={index} className="score-entry" initial={{ x: -100 }} animate={{ x: 0 }} transition={{ delay: index * 0.1 }}>
            {score.name}: Level {score.level} ({score.date})
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default MemoryGame
