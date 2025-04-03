import { useCallback, useEffect, useState } from 'react'

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600
const GROUND_HEIGHT = 100
const PLAYER_SIZE = 40
const GRAVITY = 0.8
const JUMP_FORCE = -15
const INITIAL_SPEED = 3 // Reduced initial speed

interface GameObject {
  x: number
  y: number
  width: number
  height: number
  color?: string
  type?: 'negative' | 'divide' | 'infinity' | 'sqrt-1' | 'normal' | 'multiply' // Added 'multiply' type
  value?: number
  text?: string
}

interface GameState {
  player: GameObject & { velocity: number; value: number; jumpsRemaining: number } // Added jumpsRemaining
  obstacles: GameObject[]
  score: number
  gameOver: boolean
  speed: number
}

export const useGameCanvas = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
  const [gameState, setGameState] = useState<GameState>({
    player: {
      x: 50,
      y: CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE,
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
      velocity: 0,
      color: '#FFD700',
      value: 0,
      jumpsRemaining: 2, // Initial jumps remaining
    },
    obstacles: [],
    score: 0,
    gameOver: false,
    speed: INITIAL_SPEED, // Use INITIAL_SPEED here
  })

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (!ctx) return

      // Ensure canvas dimensions are set
      ctx.canvas.width = CANVAS_WIDTH
      ctx.canvas.height = CANVAS_HEIGHT

      // Clear canvas
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // Draw sky gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
      gradient.addColorStop(0, '#4A90E2')
      gradient.addColorStop(1, '#87CEEB')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // Draw ground
      const groundGradient = ctx.createLinearGradient(0, CANVAS_HEIGHT - GROUND_HEIGHT, 0, CANVAS_HEIGHT)
      groundGradient.addColorStop(0, '#8B4513')
      groundGradient.addColorStop(1, '#654321')
      ctx.fillStyle = groundGradient
      ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT)

      // Draw player
      ctx.fillStyle = gameState.player.color!
      ctx.fillRect(gameState.player.x, gameState.player.y, gameState.player.width, gameState.player.height)
      // Draw player value
      ctx.fillStyle = '#000000'
      ctx.font = 'bold 20px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(gameState.player.value.toString(), gameState.player.x + gameState.player.width / 2, gameState.player.y + gameState.player.height / 2)

      // Draw obstacles
      gameState.obstacles.forEach((obstacle) => {
        switch (obstacle.type) {
          case 'negative':
            ctx.fillStyle = '#FF5733' // Red for negative
            break
          case 'divide':
            ctx.fillStyle = '#3498DB' // Blue for divide
            break
          case 'infinity':
            ctx.fillStyle = '#000000' // Black for infinity
            break
          case 'sqrt-1':
            ctx.fillStyle = '#9B59B6' // Purple for sqrt-1
            break
          case 'multiply':
            ctx.fillStyle = '#2ECC71' // Green for multiply
            break
          default:
            ctx.fillStyle = '#FF0000' // Default red (normal - game over)
        }
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height)

        // Draw obstacle value/text
        if (obstacle.text) {
          ctx.fillStyle = '#FFFFFF'
          ctx.font = 'bold 16px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(obstacle.text, obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2)
        } else if (obstacle.value !== undefined) {
          ctx.fillStyle = '#FFFFFF'
          ctx.font = 'bold 16px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(obstacle.value.toString(), obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2)
        }
      })

      // Draw score
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 24px Arial'
      ctx.fillText(`Score: ${gameState.score}`, 20, 40)
      ctx.fillText(`Value: ${gameState.player.value}`, 20, 70) // Display player value

      // Draw game over screen (no change needed here)
      if (gameState.gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 48px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('Game Over!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)

        ctx.font = 'bold 24px Arial'
        ctx.fillText(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50)
        ctx.fillText('Click to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100)
      }
    },
    [gameState],
  )

  const checkCollision = (obj1: GameObject, obj2: GameObject) => {
    return obj1.x < obj2.x + obj2.width && obj1.x + obj1.width > obj2.x && obj1.y < obj2.y + obj2.height && obj1.y + obj1.height > obj2.y
  }

  const update = useCallback(() => {
    if (gameState.gameOver) return

    setGameState((prev) => {
      const newState = { ...prev }

      // Update player
      newState.player.velocity += GRAVITY
      newState.player.y += newState.player.velocity

      if (newState.player.y < 0) {
        newState.player.y = 0
        newState.player.velocity = 0
      }
      if (newState.player.y > CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE) {
        newState.player.y = CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE
        newState.player.velocity = 0
        newState.player.jumpsRemaining = 2 // Reset jumps on ground
      }

      // Update obstacles (movement is the same)
      newState.obstacles = newState.obstacles
        .map((obstacle) => ({
          ...obstacle,
          x: obstacle.x - newState.speed,
        }))
        .filter((obstacle) => obstacle.x > -obstacle.width)

      // Generate new obstacles with different types
      if (Math.random() < 0.02 && newState.obstacles.length < 3) {
        const obstacleType = Math.random()
        let type: 'negative' | 'divide' | 'infinity' | 'sqrt-1' | 'normal' | 'multiply' = 'normal'
        let value: number | undefined
        let text: string | undefined

        if (obstacleType < 0.2) {
          type = 'negative'
          value = Math.floor(Math.random() * 10) + 1 // Negative value 1 to 10
          text = `-${value}`
        } else if (obstacleType < 0.4) {
          type = 'divide'
          value = Math.floor(Math.random() * 5) + 2 // Divide value 2 to 6 (avoid divide by 1 and 0)
          text = `/${value}`
        } else if (obstacleType < 0.5) {
          type = 'infinity'
          text = '∞'
        } else if (obstacleType < 0.6) {
          type = 'sqrt-1'
          text = '√-1'
        } else if (obstacleType < 0.8) {
          type = 'multiply'
          value = Math.floor(Math.random() * 5) + 2 // Multiply value 2 to 6
          text = `x${value}`
        }

        newState.obstacles.push({
          x: CANVAS_WIDTH,
          y: CANVAS_HEIGHT - GROUND_HEIGHT - 40,
          width: 30,
          height: 40,
          type: type,
          value: value,
          text: text,
        })
      }

      // Check collisions and update score/game state
      let gameOver = false
      let score = prev.score + 1 // Score increases over time now
      const speed = prev.speed
      let playerValue = prev.player.value

      for (const obstacle of newState.obstacles) {
        if (checkCollision(newState.player, obstacle)) {
          switch (obstacle.type) {
            case 'negative':
              playerValue -= obstacle.value || 0 // Subtract obstacle value
              break
            case 'divide':
              playerValue = Math.floor(playerValue / (obstacle.value || 1)) // Divide player value (integer division)
              break
            case 'multiply':
              playerValue *= obstacle.value || 1 // Multiply player value
              score += 50 // give extra score for multiply
              break
            case 'infinity':
            case 'sqrt-1':
            case 'normal': // Normal type also game over now
              gameOver = true // Game over for infinity and sqrt-1 and normal
              break
          }
          if (gameOver) break // No need to check other obstacles if game over
        }
      }

      return {
        ...newState,
        score,
        gameOver,
        speed,
        player: { ...newState.player, value: playerValue }, // Update player value
      }
    })
  }, [gameState.gameOver])

  const handleClick = useCallback(() => {
    if (gameState.gameOver) {
      setGameState({
        player: {
          x: 50,
          y: CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE,
          width: PLAYER_SIZE,
          height: PLAYER_SIZE,
          velocity: 0,
          color: '#FFD700',
          value: 0,
          jumpsRemaining: 2, // Reset jumps on restart
        },
        obstacles: [],
        score: 0,
        gameOver: false,
        speed: INITIAL_SPEED, // Reset speed on restart
      })
    } else {
      if (gameState.player.jumpsRemaining > 0) {
        setGameState((prev) => ({
          ...prev,
          player: {
            ...prev.player,
            velocity: JUMP_FORCE,
            jumpsRemaining: prev.player.jumpsRemaining - 1, // Decrement jumps
          },
        }))
      }
    }
  }, [gameState.gameOver])

  const startGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let frameId: number
    const render = () => {
      update()
      draw(ctx)
      frameId = window.requestAnimationFrame(render)
    }

    frameId = window.requestAnimationFrame(render)

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [draw, update])

  // Add keyboard controls (no change needed here)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        handleClick()
      } else if (e.code === 'KeyR') {
        setGameState({
          player: {
            x: 50,
            y: CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE,
            width: PLAYER_SIZE,
            height: PLAYER_SIZE,
            velocity: 0,
            color: '#FFD700',
            value: 0,
            jumpsRemaining: 2, // Reset jumps on 'R' restart
          },
          obstacles: [],
          score: 0,
          gameOver: false,
          speed: INITIAL_SPEED, // Reset speed on 'R' restart
        })
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [handleClick])

  return {
    startGame,
    handleClick,
  }
}
