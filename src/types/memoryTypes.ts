// src/types.ts
export interface Score {
  name: string
  level: number
  date: string
}

export interface GameState {
  sequence: number[]
  userInput: number[]
  level: number
  isShowing: boolean
  gameOver: boolean
}
