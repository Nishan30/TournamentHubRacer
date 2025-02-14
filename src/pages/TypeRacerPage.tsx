import React, { useState, useEffect, useRef } from 'react'
import WordDisplay from '../components/wordDisplay'
import TrackVisualization from '../components/trackVisualization'
import Speedometer from '../components/speedometer'
import './TypeRacerPage.css'
import FinishedUI from '../ui/finishedTyping'

const TypeRacerPage: React.FC = () => {
  const [wordsTypedCorrectly, setWordsTypedCorrectly] = useState(0)
  const [gameStartTime, setGameStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState<number>(0)
  const [isGameStarted, setIsGameStarted] = useState(false)
  const [isGameFinished, setIsGameFinished] = useState(false)
  const [wordsToTypeCount] = useState(20)
  const [typingSpeed, setTypingSpeed] = useState(0)
  const lastWordTypedTime = useRef<number>(0)
  const wordsTypedCountRef = useRef(0)

  useEffect(() => {
    let timerInterval: ReturnType<typeof setInterval> | null = null

    if (isGameStarted && gameStartTime !== null && !isGameFinished) {
      timerInterval = setInterval(() => {
        setElapsedTime(Date.now() - gameStartTime)
      }, 10)
    }

    return () => {
      if (timerInterval) clearInterval(timerInterval)
    }
  }, [isGameStarted, gameStartTime, isGameFinished])

  useEffect(() => {
    wordsTypedCountRef.current = wordsTypedCorrectly
  }, [wordsTypedCorrectly])

  const handleWordTyped = (correct: boolean) => {
    if (correct) {
      setWordsTypedCorrectly((prevCount) => prevCount + 1)
      const now = Date.now()
      if (lastWordTypedTime.current !== 0) {
        const timeDiff = (now - lastWordTypedTime.current) / 60000
        if (timeDiff > 0) {
          const averageSpeed = (wordsTypedCountRef.current + 1) / (elapsedTime / 60000)
          setTypingSpeed(averageSpeed)
        }
      }
      lastWordTypedTime.current = now
    }
  }

  const handleGameStart = () => {
    if (!isGameStarted) {
      setIsGameStarted(true)
      setIsGameFinished(false)
      setGameStartTime(Date.now())
      setWordsTypedCorrectly(0)
      setElapsedTime(0)
      setTypingSpeed(0)
      lastWordTypedTime.current = 0
      wordsTypedCountRef.current = 0
    }
  }

  const handleGameFinish = () => {
    setIsGameFinished(true)
    setIsGameStarted(false)
  }

  const restartGame = () => {
    setIsGameFinished(false)
    setIsGameStarted(false)
    setWordsTypedCorrectly(0)
    setElapsedTime(0)
    setGameStartTime(null)
    setTypingSpeed(0)
    lastWordTypedTime.current = 0
    wordsTypedCountRef.current = 0
  }

  const progress = isGameFinished ? 1 : isGameStarted ? wordsTypedCorrectly / wordsToTypeCount : 0
  const minutes = Math.floor(elapsedTime / 60000)
  const seconds = ((elapsedTime % 60000) / 1000).toFixed(2)

  return (
    <div className="type-racer-page">
      {!isGameFinished ? (
        // Game UI
        <>
          <h1>Type Racer</h1>
          <Speedometer speed={typingSpeed} />
          <WordDisplay
            onWordTyped={handleWordTyped}
            onGameStart={handleGameStart}
            isGameStarted={isGameStarted}
            isGameFinished={isGameFinished}
            onGameFinish={handleGameFinish}
            currentSpeed={typingSpeed}
          />
          <TrackVisualization progress={progress} />
          <div className="stats">
            {isGameStarted && !isGameFinished && (
              <p>
                Time: {minutes}:{seconds.padStart(5, '0')} | Speed: {typingSpeed.toFixed(0)} WPM
              </p>
            )}
          </div>
        </>
      ) : (
        // Finished UI
        <FinishedUI time={elapsedTime} typingSpeed={typingSpeed} onRestart={restartGame} />
      )}
    </div>
  )
}

export default TypeRacerPage
