import React, { useState, useEffect, useRef } from 'react'
import { shuffleArray } from '../utils/helper'
import { wordList } from '../utils/words'
import './WordDisplay.css'

interface WordDisplayProps {
  onWordTyped: (correct: boolean) => void
  isGameStarted: boolean
  isGameFinished: boolean
  onGameFinish: () => void
  currentSpeed: number
}

const WordDisplay: React.FC<WordDisplayProps> = ({ onWordTyped, isGameStarted, isGameFinished, onGameFinish }) => {
  const [words, setWords] = useState<string[]>([])
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0)
  const [typedWord, setTypedWord] = useState('')
  const [letterStatus, setLetterStatus] = useState<('correct' | 'incorrect' | 'pending')[]>([])
  const [displayedWords, setDisplayedWords] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize words on component mount or game restart
  useEffect(() => {
    const shuffledWords = shuffleArray(wordList)
    const selectedWords = shuffledWords.slice(0, 20)
    setWords(selectedWords)
    setCurrentWordIndex(0)
    setTypedWord('')
    setLetterStatus([])
    setDisplayedWords(selectedWords.slice(0, 3))
  }, [isGameFinished])

  // Focus input when game starts
  useEffect(() => {
    if (isGameStarted && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isGameStarted])

  // Update letter status as user types
  useEffect(() => {
    if (!isGameStarted) return

    if (currentWordIndex < words.length) {
      const currentWord = words[currentWordIndex]
      const status = typedWord.split('').map((char, index) => {
        if (index < currentWord.length) {
          return char === currentWord[index] ? 'correct' : 'incorrect'
        }
        return 'incorrect'
      })
      setLetterStatus(status)
    }
  }, [typedWord, currentWordIndex, words, isGameStarted])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isGameStarted) return

    const value = event.target.value
    setTypedWord(value)

    const currentWord = words[currentWordIndex]
    if (value.trim() === currentWord) {
      onWordTyped(true)

      const nextIndex = currentWordIndex + 1
      if (nextIndex < words.length) {
        setCurrentWordIndex(nextIndex)
        setTypedWord('')
        setLetterStatus([])
        setDisplayedWords(words.slice(nextIndex, nextIndex + 3))

        if (inputRef.current) {
          inputRef.current.focus()
        }
      } else {
        onGameFinish()
      }
    }
  }

  const getLetterClassName = (index: number): string => {
    return letterStatus[index] || 'pending'
  }

  if (isGameFinished) {
    return (
      <div className="word-display">
        <p className="instruction">Game Finished! Words typed: {words.length}. Restart to play again.</p>
      </div>
    )
  }

  return (
    <div className="word-display">
      {!isGameStarted && <p className="instruction">Get ready to type!</p>}
      <div className="word-container">
        {displayedWords.map((word, index) => {
          const isCurrent = index === 0
          const isCompleted = currentWordIndex > index

          return (
            <span key={currentWordIndex + index} className={`word ${isCurrent ? 'current' : isCompleted ? 'completed' : 'upcoming'}`}>
              {isCurrent
                ? word.split('').map((letter, letterIndex) => (
                    <span key={letterIndex} className={`letter ${getLetterClassName(letterIndex)}`}>
                      {letter}
                    </span>
                  ))
                : word}
            </span>
          )
        })}
      </div>
      <input
        type="text"
        value={typedWord}
        onChange={handleInputChange}
        className="input-field"
        ref={inputRef}
        disabled={!isGameStarted || isGameFinished}
        placeholder={isGameStarted ? 'Type here...' : 'Waiting for countdown...'}
      />
    </div>
  )
}

export default WordDisplay
