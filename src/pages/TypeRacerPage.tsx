import React, { useState, useEffect, useRef } from 'react'
import WordDisplay from '../components/wordDisplay'
import Speedometer from '../components/speedometer'
import './TypeRacerPage.css'
import FinishedUI from '../ui/finishedTyping'

const TypeRacerPage: React.FC = () => {
  const [wordsTypedCorrectly, setWordsTypedCorrectly] = useState(0)
  const [gameStartTime, setGameStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState<number>(0)
  const [isGameStarted, setIsGameStarted] = useState(false)
  const [isGameFinished, setIsGameFinished] = useState(false)
  const [typingSpeed, setTypingSpeed] = useState(0)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [showStartButton, setShowStartButton] = useState(true)
  const firstWordTypedTime = useRef<number | null>(null)
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

  // Countdown effect
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)

      return () => clearTimeout(timer)
    } else if (countdown === 0) {
      setCountdown(null)
      startGameAfterCountdown()
    }
  }, [countdown])

  const calculateTypingSpeed = (wordCount: number, timeElapsed: number) => {
    return wordCount / (timeElapsed / 60000)
  }

  const handleWordTyped = (correct: boolean) => {
    console.log('Word typed:', correct)
    if (correct) {
      setWordsTypedCorrectly((prevCount) => prevCount + 1)

      if (firstWordTypedTime.current === null) {
        firstWordTypedTime.current = Date.now()
        // Calculate speed from the first word
        const timeElapsed = Date.now() - gameStartTime!
        setTypingSpeed(calculateTypingSpeed(1, timeElapsed))
      } else {
        // Calculate speed for subsequent words
        const timeElapsed = Date.now() - gameStartTime!
        setTypingSpeed(calculateTypingSpeed(wordsTypedCorrectly + 1, timeElapsed))
      }
    }
  }

  const startCountdown = () => {
    setShowStartButton(false)
    setCountdown(3)
  }

  const startGameAfterCountdown = () => {
    setIsGameStarted(true)
    setIsGameFinished(false)
    setGameStartTime(Date.now())
    setWordsTypedCorrectly(0)
    setElapsedTime(0)
    setTypingSpeed(0)
    firstWordTypedTime.current = null
    wordsTypedCountRef.current = 0
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
    firstWordTypedTime.current = null
    wordsTypedCountRef.current = 0
    setShowStartButton(true)
  }

  return (
    <div>
      {!isGameFinished ? (
        // Game UI
        <>
          <div className="type-racer-page">
            <h1>Type Racer</h1>
            <Speedometer speed={typingSpeed} time={elapsedTime} />
            <WordDisplay
              onWordTyped={handleWordTyped}
              isGameStarted={isGameStarted}
              isGameFinished={isGameFinished}
              onGameFinish={handleGameFinish}
              currentSpeed={typingSpeed}
            />

            {/* Countdown or Start Button */}
            <div className="game-controls">
              {showStartButton && (
                <button className="start-button" onClick={startCountdown}>
                  Start Game
                </button>
              )}
              {countdown !== null && <div className="countdown">{countdown}</div>}
            </div>
          </div>
        </>
      ) : (
        // Finished UI
        <div className="finished-ui-typeracer">
          <FinishedUI time={elapsedTime} typingSpeed={typingSpeed} onRestart={restartGame} />
        </div>
      )}
    </div>
  )
}

export default TypeRacerPage
