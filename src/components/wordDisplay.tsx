import React, { useState, useEffect, useRef } from 'react'
import { shuffleArray } from '../utils/helper'
import { wordList } from '../utils/words'
import './WordDisplay.css'

interface WordDisplayProps {
  onWordTyped: (correct: boolean) => void
  onGameStart: () => void
  isGameStarted: boolean
  isGameFinished: boolean
  onGameFinish: () => void
  currentSpeed: number
}

const WordDisplay: React.FC<WordDisplayProps> = ({ onWordTyped, onGameStart, isGameStarted, isGameFinished, onGameFinish }) => {
  const [words, setWords] = useState<string[]>([])
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0)
  const [typedWord, setTypedWord] = useState('')
  const [letterStatus, setLetterStatus] = useState<('correct' | 'incorrect' | 'pending')[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const [wordAnimation, setWordAnimation] = useState<'none' | 'fadeOut'>('none')
  const [displayedWords, setDisplayedWords] = useState<string[]>([])

  useEffect(() => {
    const shuffledWords = shuffleArray(wordList)
    const pairs = []
    for (let i = 0; i < 20; i += 2) {
      pairs.push(`${shuffledWords[i]} ${shuffledWords[i + 1] || ''}`.trim())
    }
    setWords(pairs)
    setCurrentWordIndex(0)
    setTypedWord('')
    setLetterStatus([])
    setDisplayedWords(pairs.slice(0, 3))
    setWordAnimation('none')
  }, [isGameFinished])

  useEffect(() => {
    if (isGameStarted && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isGameStarted])

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
    if (!isGameStarted) {
      onGameStart()
    }
    const value = event.target.value
    setTypedWord(value)

    if (value.trim() === words[currentWordIndex]) {
      onWordTyped(true)
      setWordAnimation('fadeOut')
      setTimeout(() => {
        if (currentWordIndex < words.length - 1) {
          setCurrentWordIndex(currentWordIndex + 1)
          setTypedWord('')
          setLetterStatus([])
          setDisplayedWords(words.slice(currentWordIndex + 1, currentWordIndex + 4))
          setWordAnimation('none')
        } else {
          onGameFinish()
        }
      }, 300)
    }
  }

  const getLetterClassName = (index: number): string => {
    return letterStatus[index] || 'pending'
  }

  const currentWord = words[currentWordIndex] || ''

  if (isGameFinished) {
    return (
      <div className="word-display">
        <p className="instruction">Game Finished! Words typed: {words.length}. Restart to play again.</p>
      </div>
    )
  }

  return (
    <div className="word-display">
      {!isGameStarted && <p className="instruction">Start typing to begin!</p>}
      <div className="word-container">
        {displayedWords.map((wordPair, index) => {
          const wordIndex = currentWordIndex + index
          const isCurrent = wordIndex === currentWordIndex
          const isCompleted = wordIndex < currentWordIndex
          const animatedClass = isCurrent && wordAnimation === 'fadeOut' ? 'word-fade-out' : ''

          return (
            <span key={index} className={`word ${isCurrent ? 'current' : isCompleted ? 'completed' : 'upcoming'} ${animatedClass}`}>
              {isCurrent
                ? currentWord.split('').map((letter, letterIndex) => (
                    <span key={letterIndex} className={`letter ${getLetterClassName(letterIndex)}`}>
                      {letter === ' ' ? '\u00A0' : letter} {/* Preserve space using non-breaking space */}
                    </span>
                  ))
                : wordPair + ' '}
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
        disabled={isGameFinished}
        placeholder="Type here..."
      />
    </div>
  )
}

export default WordDisplay
