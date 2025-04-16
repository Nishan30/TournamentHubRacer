import { useCallback, useEffect, useState, useRef } from 'react'

// --- Game Constants ---
const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600
const GROUND_HEIGHT = 100
const PLAYER_SIZE = 40
const GRAVITY = 0.8
const JUMP_FORCE = -15
const INITIAL_SPEED = 3.5
const MAX_SPEED = 10
const SCORE_THRESHOLD_FOR_SPEED_INCREASE = 400
const MAX_OBSTACLES = 5
const MIN_OBSTACLE_DISTANCE = 280
const OBSTACLE_ELEVATION_CHANCE = 0.35
const STACKED_OBSTACLE_CHANCE = 0.25
const STACKED_OBSTACLE_VERTICAL_GAP = PLAYER_SIZE * 1.8
// *** NEW/UPDATED Dimension Constants ***
const SQUARE_OBSTACLE_SIZE = 40 // Size for simple/fatal obstacles
const RECT_OBSTACLE_WIDTH = 90 // Width for complex equations
const RECT_OBSTACLE_HEIGHT = 35 // Height for complex equations (slightly shorter)
const DIMENSION_VARIATION = 6 // Max +/- random variation for square obstacles
// *** END Dimension Constants ***
const TEXT_FONT_SIZE = 20
const TEXT_OUTLINE_WIDTH = 1.5
const GLOW_BASE_BLUR = 4
const GLOW_AMPLITUDE = 3
const GLOW_FREQUENCY = 0.003

// --- COLOR CONSTANTS (Using the ones you provided) ---

const COLOR_FATAL = '#FF0000' // Bright Red
const COLOR_SIMPLE_ADDSUB = '#00FF00' // Bright Green
const COLOR_SIMPLE_MULDIV = '#0000FF' // Bright Blue
const COLOR_COMPLEX = '#FF69B4' // Hot Pink
const COLOR_PLAYER = '#FFD700' // Gold (Added for clarity)
const COLOR_TEXT_LIGHT = '#FFFFFF' // White (Added for clarity)
const COLOR_TEXT_DARK = '#000000' // Black (Added for clarity)
const COLOR_SKY_TOP = '#1a2a6c' // Added for clarity
const COLOR_SKY_MID = '#b21f1f' // Added for clarity
const COLOR_SKY_BOTTOM = '#fdbb2d' // Added for clarity
const COLOR_GROUND_TOP = '#4B3A26' // Added for clarity
const COLOR_GROUND_BOTTOM = '#2E2013' // Added for clarity
const COLOR_GAMEOVER_BG = 'rgba(0, 0, 0, 0.8)' // Added for clarity
const COLOR_GAMEOVER_TITLE = '#FF6347' // Added for clarity
const COLOR_GAMEOVER_TEXT = '#FFFFFF' // Added for clarity

// --- Types ---

type ObstacleType =
  | 'negative'
  | 'divide'
  | 'infinity'
  | 'sqrt-1'
  | 'normal'
  | 'multiply'
  | 'add'
  | 'add_multiply'
  | 'subtract_multiply'
  | 'add_divide'
  | 'subtract_divide'

interface GameObject {
  x: number
  y: number
  width: number // Now dynamically set
  height: number // Now dynamically set
  color?: string
  type?: ObstacleType
  value?: number
  value2?: number
  text?: string
  id: number
}

interface GameState {
  player: GameObject & { velocity: number; value: number; jumpsRemaining: number }
  obstacles: GameObject[]
  score: number // Game score (distinct from player value)
  gameOver: boolean
  speed: number
}

// --- Utility Variables and Functions ---

let nextObstacleId = 0

const isFatalObstacle = (type: ObstacleType | undefined): boolean => {
  return type === 'infinity' || type === 'sqrt-1' || type === 'normal'
}

const getObstacleCategoryColor = (type: ObstacleType): string => {
  switch (type) {
    case 'add':
    case 'negative':
      return COLOR_SIMPLE_ADDSUB
    case 'multiply':
    case 'divide':
      return COLOR_SIMPLE_MULDIV
    case 'add_multiply':
    case 'subtract_multiply':
    case 'add_divide':
    case 'subtract_divide':
      return COLOR_COMPLEX
    case 'infinity':
    case 'sqrt-1':
    case 'normal':
    default:
      return COLOR_FATAL
  }
}

// --- Custom Hook ---

export const useGameCanvas = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
  const animationFrameId = useRef<number | null>(null)

  const [gameState, setGameState] = useState<GameState>(() => ({
    // Use initializer function
    player: {
      x: 50,
      y: CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE,
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
      velocity: 0,
      color: COLOR_PLAYER,
      value: 0,
      jumpsRemaining: 2,
      id: -1,
    },
    obstacles: [],
    score: 0,
    gameOver: false,
    speed: INITIAL_SPEED,
  }))

  const resetGame = useCallback(() => {
    nextObstacleId = 0
    setGameState({
      player: {
        x: 50,
        y: CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE,
        width: PLAYER_SIZE,
        height: PLAYER_SIZE,
        velocity: 0,
        color: COLOR_PLAYER,
        value: 0,
        jumpsRemaining: 2,
        id: -1,
      },
      obstacles: [],
      score: 0,
      gameOver: false,
      speed: INITIAL_SPEED,
    })
    // Note: startGame needs to be called again after reset if the loop was stopped
  }, [])

  // --- Draw Function (Handles Rendering) ---
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (!ctx) {
        return
      }

      ctx.canvas.width = CANVAS_WIDTH
      ctx.canvas.height = CANVAS_HEIGHT

      // --- Background ---
      const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
      skyGradient.addColorStop(0, COLOR_SKY_TOP)
      skyGradient.addColorStop(0.7, COLOR_SKY_MID)
      skyGradient.addColorStop(1, COLOR_SKY_BOTTOM)
      ctx.fillStyle = skyGradient
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      const groundGradient = ctx.createLinearGradient(0, CANVAS_HEIGHT - GROUND_HEIGHT, 0, CANVAS_HEIGHT)
      groundGradient.addColorStop(0, COLOR_GROUND_TOP)
      groundGradient.addColorStop(1, COLOR_GROUND_BOTTOM)
      ctx.fillStyle = groundGradient
      ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT)

      // --- Player ---
      ctx.fillStyle = gameState.player.color!
      ctx.fillRect(gameState.player.x, gameState.player.y, gameState.player.width, gameState.player.height)
      ctx.fillStyle = COLOR_TEXT_DARK
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(gameState.player.value.toString(), gameState.player.x + gameState.player.width / 2, gameState.player.y + gameState.player.height / 2)

      // --- Obstacles ---
      const currentTime = Date.now()

      gameState.obstacles.forEach((obstacle) => {
        // 1. Determine BLOCK color based on CATEGORY
        const blockColor = getObstacleCategoryColor(obstacle.type!) // Use helper

        // 2. Draw the obstacle block (uses obstacle width/height set during generation)
        ctx.fillStyle = blockColor
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height)

        // 3. Draw Text with Outline and Glow
        if (obstacle.text) {
          const glowSize = GLOW_BASE_BLUR + GLOW_AMPLITUDE * (0.5 + 0.5 * Math.sin(currentTime * GLOW_FREQUENCY))
          ctx.shadowColor = obstacle.color || COLOR_TEXT_LIGHT // Use glow color or default
          ctx.shadowBlur = glowSize

          ctx.font = `bold ${TEXT_FONT_SIZE}px Arial`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'

          const textX = obstacle.x + obstacle.width / 2
          let textY = obstacle.y + obstacle.height / 2
          const maxWidth = obstacle.width * 0.9 // Text wrap based on obstacle width

          // ESLint FIX: Removed unnecessary escapes for *, /, +, (, ) inside []
          const words = obstacle.text.split(/([*/+\-()])/) // Keep hyphen escape \- for clarity
          const lines: string[] = []
          let currentLine = ''

          for (const word of words) {
            if (!word) continue
            const testLine = currentLine ? currentLine + word : word
            if (ctx.measureText(testLine).width > maxWidth && currentLine) {
              lines.push(currentLine)
              currentLine = word
            } else {
              currentLine = testLine
            }
          }
          lines.push(currentLine)

          const lineHeight = TEXT_FONT_SIZE * 1.1
          textY = textY - ((lines.length - 1) * lineHeight) / 2

          for (let i = 0; i < lines.length; i++) {
            const lineY = textY + i * lineHeight
            ctx.strokeStyle = COLOR_TEXT_DARK
            ctx.lineWidth = TEXT_OUTLINE_WIDTH
            ctx.strokeText(lines[i], textX, lineY)
            // Fill - Use black text on Pink blocks, white otherwise
            ctx.fillStyle = blockColor === COLOR_COMPLEX ? COLOR_TEXT_DARK : COLOR_TEXT_LIGHT
            ctx.fillText(lines[i], textX, lineY)
          }

          // Reset shadow for next element
          ctx.shadowColor = 'transparent'
          ctx.shadowBlur = 0
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 0
        }
      })

      // --- Score Display (Added for visibility) ---
      ctx.fillStyle = COLOR_TEXT_LIGHT
      ctx.font = 'bold 20px Arial'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText(`Score: ${gameState.score}`, 10, 10)

      // --- Game Over Screen ---
      if (gameState.gameOver) {
        ctx.fillStyle = COLOR_GAMEOVER_BG
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        ctx.fillStyle = COLOR_GAMEOVER_TITLE
        ctx.font = 'bold 52px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('Game Over!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60)
        ctx.fillStyle = COLOR_GAMEOVER_TEXT
        ctx.font = 'bold 26px Arial'
        // Display player's final value, not the game score
        ctx.fillText(`Final Value: ${gameState.player.value}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
        ctx.font = 'bold 22px Arial'
        ctx.fillText('Click or Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 90)
      }
    },
    [gameState], // Dependency: Re-render when game state changes
  )

  // --- Collision Check Function ---
  const checkCollision = (obj1: GameObject, obj2: GameObject): boolean => {
    return obj1.x < obj2.x + obj2.width && obj1.x + obj1.width > obj2.x && obj1.y < obj2.y + obj2.height && obj1.y + obj1.height > obj2.y
  }

  // --- Generate Obstacle Properties Function ---
  // Removed unused playerValue parameter from previous fix
  const generateObstacleProperties = (): Omit<GameObject, 'x' | 'y' | 'id'> => {
    const typeRoll = Math.random()
    let type: ObstacleType = 'normal'
    let value: number | undefined
    let value2: number | undefined
    let text: string | undefined
    let width: number
    let height: number

    // 1. Determine type, values, and text first
    if (typeRoll < 0.12) {
      type = 'add'
      value = Math.floor(Math.random() * 12) + 1
      text = `+${value}`
    } else if (typeRoll < 0.24) {
      type = 'negative'
      value = Math.floor(Math.random() * 12) + 1
      text = `-${value}`
    } else if (typeRoll < 0.36) {
      type = 'multiply'
      value = Math.floor(Math.random() * 4) + 2
      text = `x${value}`
    } else if (typeRoll < 0.48) {
      type = 'divide'
      value = Math.max(2, Math.floor(Math.random() * 5))
      text = `/${value}`
    } else if (typeRoll < 0.58) {
      type = 'add_multiply'
      value = Math.floor(Math.random() * 6) + 1
      value2 = Math.floor(Math.random() * 3) + 2
      text = `(+${value})*${value2}`
    } else if (typeRoll < 0.68) {
      type = 'subtract_multiply'
      value = Math.floor(Math.random() * 6) + 1
      value2 = Math.floor(Math.random() * 3) + 2
      text = `(-${value})*${value2}`
    } else if (typeRoll < 0.78) {
      type = 'add_divide'
      value = Math.floor(Math.random() * 10) + 1
      value2 = Math.max(2, Math.floor(Math.random() * 4))
      text = `(+${value})/${value2}`
    } else if (typeRoll < 0.88) {
      type = 'subtract_divide'
      value = Math.floor(Math.random() * 10) + 1
      value2 = Math.max(2, Math.floor(Math.random() * 4))
      text = `(-${value})/${value2}`
    } else if (typeRoll < 0.93) {
      type = 'infinity'
      text = '∞'
    } else if (typeRoll < 0.98) {
      type = 'sqrt-1'
      text = 'i'
    } else {
      type = 'normal'
      text = 'X'
    }

    // 2. Determine dimensions based on type category
    switch (
      type // Determine dimensions
    ) {
      case 'add_multiply':
      case 'subtract_multiply':
      case 'add_divide':
      case 'subtract_divide': {
        width = RECT_OBSTACLE_WIDTH
        height = RECT_OBSTACLE_HEIGHT
        break
      }

      default: {
        const variation = Math.random() * DIMENSION_VARIATION * 2 - DIMENSION_VARIATION
        width = SQUARE_OBSTACLE_SIZE + variation
        height = SQUARE_OBSTACLE_SIZE + variation
        width = Math.max(width, SQUARE_OBSTACLE_SIZE / 2)
        height = Math.max(height, SQUARE_OBSTACLE_SIZE / 2)
        break
      }
    }

    // 3. Get the category color (used for glow)
    const color = getObstacleCategoryColor(type)

    // 4. Return all properties including the calculated dimensions
    return { width, height, type, value, value2, text, color }
  }

  // --- Update Function (Main Game Loop Logic) ---
  const update = useCallback(() => {
    if (gameState.gameOver) {
      return
    } // Don't update if game over

    setGameState((prev) => {
      // Create mutable copy of state
      const newState: GameState = {
        ...prev,
        player: { ...prev.player },
        obstacles: [...prev.obstacles],
      }

      // Calculate Speed (increases with score)
      const calculatedSpeed = Math.min(
        MAX_SPEED,
        INITIAL_SPEED + Math.floor(newState.score / SCORE_THRESHOLD_FOR_SPEED_INCREASE) * 0.5, // Smoother increase
      )
      newState.speed = calculatedSpeed

      // Player Physics (Gravity, Position, Ground/Ceiling checks)
      newState.player.velocity += GRAVITY
      newState.player.y += newState.player.velocity
      if (newState.player.y < 0) {
        // Ceiling check
        newState.player.y = 0
        newState.player.velocity = 0
      }
      const groundY = CANVAS_HEIGHT - GROUND_HEIGHT - newState.player.height
      if (newState.player.y >= groundY) {
        // Ground check
        newState.player.y = groundY
        newState.player.velocity = 0
        if (newState.player.jumpsRemaining < 2) {
          // Reset jumps on ground
          newState.player.jumpsRemaining = 2
        }
      }

      // Obstacle Movement & Filter (Move left, remove off-screen)
      newState.obstacles = newState.obstacles
        .map((obstacle) => ({ ...obstacle, x: obstacle.x - newState.speed }))
        .filter((obstacle) => obstacle.x > -obstacle.width)

      // Obstacle Generation (Spawn new obstacles based on distance/count)
      const lastObstacle = newState.obstacles.length > 0 ? newState.obstacles[newState.obstacles.length - 1] : null
      const canSpawn =
        newState.obstacles.length < MAX_OBSTACLES && (!lastObstacle || CANVAS_WIDTH - (lastObstacle.x + lastObstacle.width) >= MIN_OBSTACLE_DISTANCE)
      if (canSpawn) {
        const startX = CANVAS_WIDTH + Math.random() * 20
        const shouldStack = Math.random() < STACKED_OBSTACLE_CHANCE

        if (shouldStack && newState.obstacles.length <= MAX_OBSTACLES - 2) {
          // Stacked obstacles
          const obs1Props = generateObstacleProperties()
          let obs2Props = generateObstacleProperties()
          // Prevent two fatal obstacles stacking
          if (isFatalObstacle(obs1Props.type) && isFatalObstacle(obs2Props.type)) {
            do {
              obs2Props = generateObstacleProperties()
            } while (isFatalObstacle(obs2Props.type))
          }
          const y1 = CANVAS_HEIGHT - GROUND_HEIGHT - obs1Props.height
          const y2 = y1 - STACKED_OBSTACLE_VERTICAL_GAP - obs2Props.height
          newState.obstacles.push({ ...obs1Props, x: startX, y: y1, id: nextObstacleId++ })
          newState.obstacles.push({ ...obs2Props, x: startX, y: y2, id: nextObstacleId++ })
        } else {
          const obsProps = generateObstacleProperties()
          let obstacleY = CANVAS_HEIGHT - GROUND_HEIGHT - obsProps.height
          // Elevate non-fatal obstacles sometimes
          if (!isFatalObstacle(obsProps.type) && Math.random() < OBSTACLE_ELEVATION_CHANCE) {
            const minElevation = PLAYER_SIZE + 15
            const maxElevation = PLAYER_SIZE * 3
            obstacleY = CANVAS_HEIGHT - GROUND_HEIGHT - obsProps.height - (Math.random() * (maxElevation - minElevation) + minElevation)
            obstacleY = Math.max(PLAYER_SIZE / 2, obstacleY) // Prevent going too high
          }
          newState.obstacles.push({ ...obsProps, x: startX, y: obstacleY, id: nextObstacleId++ })
        }
      }

      // Collision Detection & Handling
      let playerValue = newState.player.value
      let score = newState.score + 1 // Increment score over time
      let gameOver = newState.gameOver
      const collidedObstacleIds = new Set<number>() // Track hits this frame

      if (!gameOver) {
        for (const obstacle of newState.obstacles) {
          if (checkCollision(newState.player, obstacle)) {
            collidedObstacleIds.add(obstacle.id) // Mark for removal

            // ESLint FIX: Wrapped each case block in {}
            switch (obstacle.type) {
              case 'add': {
                playerValue += obstacle.value || 0
                score += 10
                break
              }
              case 'negative': {
                playerValue -= obstacle.value || 0
                score += 5
                break
              }
              case 'multiply': {
                playerValue *= obstacle.value || 1
                score += 25 * (obstacle.value || 1)
                break
              }
              case 'divide': {
                if (obstacle.value && obstacle.value !== 0) {
                  playerValue = Math.floor(playerValue / obstacle.value)
                  score += 15
                }
                break
              }
              case 'add_multiply': {
                playerValue += obstacle.value || 0
                playerValue *= obstacle.value2 || 1
                score += 40
                break
              }
              case 'subtract_multiply': {
                playerValue -= obstacle.value || 0
                playerValue *= obstacle.value2 || 1
                score += 35
                break
              }
              case 'add_divide': {
                if (obstacle.value2 && obstacle.value2 !== 0) {
                  playerValue += obstacle.value || 0
                  playerValue = Math.floor(playerValue / obstacle.value2)
                  score += 30
                }
                break
              }
              case 'subtract_divide': {
                if (obstacle.value2 && obstacle.value2 !== 0) {
                  playerValue -= obstacle.value || 0
                  playerValue = Math.floor(playerValue / obstacle.value2)
                  score += 25
                }
                break
              }
              case 'infinity': {
                gameOver = true
                break
              }
              case 'sqrt-1': {
                gameOver = true
                break
              }
              case 'normal': {
                gameOver = true
                break
              }
            }
            if (gameOver) break // Exit loop if game over
          }
        }
      }
      // Remove collided obstacles
      const nextObstacles = newState.obstacles.filter((obs) => !collidedObstacleIds.has(obs.id))

      // Return Final State for this frame
      return {
        ...newState,
        obstacles: nextObstacles,
        score,
        gameOver,
        speed: calculatedSpeed,
        player: { ...newState.player, value: playerValue },
      }
    })
  }, [gameState.gameOver]) // Rerun update logic based on gameOver status

  // --- Handle Click/Tap (Jump/Restart) ---
  const handleClick = useCallback(() => {
    if (gameState.gameOver) {
      // If game is over, reset it. StartGame needs to be called again elsewhere.
      resetGame()
    } else {
      // If game is active, attempt a jump
      setGameState((prev) => {
        if (prev.player.jumpsRemaining > 0) {
          return { ...prev, player: { ...prev.player, velocity: JUMP_FORCE, jumpsRemaining: prev.player.jumpsRemaining - 1 } }
        }
        return prev // No change if no jumps left
      })
    }
  }, [gameState.gameOver, resetGame])

  // --- Start Game Function ---
  const startGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      console.error('Canvas ref not found')
      return
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.error('Canvas context not found')
      return
    }

    // Animation loop
    const render = () => {
      if (!gameState.gameOver) {
        // Only update/draw if game isn't over implicitly by loop stopping
        update()
      }
      draw(ctx) // Always draw the state (even game over screen)
      // Continue loop only if game is not over
      if (!gameState.gameOver) {
        animationFrameId.current = window.requestAnimationFrame(render)
      } else {
        // Ensure loop stops if game ended this frame
        if (animationFrameId.current) {
          window.cancelAnimationFrame(animationFrameId.current)
          animationFrameId.current = null
        }
      }
    }

    // Stop any previous loop before starting
    if (animationFrameId.current) {
      window.cancelAnimationFrame(animationFrameId.current)
    }
    // Start the new loop
    animationFrameId.current = window.requestAnimationFrame(render)

    // Cleanup function
    return () => {
      if (animationFrameId.current) {
        window.cancelAnimationFrame(animationFrameId.current)
        animationFrameId.current = null
      }
    }
    // Need gameState.gameOver in dependencies so render function uses latest value
  }, [draw, update, canvasRef, gameState.gameOver])

  // --- Effect for Keyboard Controls ---
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        // Trigger jump only if game is active
        if (!gameState.gameOver) {
          handleClick()
        }
      } else if (e.code === 'KeyR') {
        // Always allow reset with 'R'
        resetGame()
        // Consider calling startGame() here if 'R' should immediately restart the loop
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
    // Add gameState.gameOver dependency for conditional spacebar jump
  }, [handleClick, resetGame, gameState.gameOver])

  // --- Hook Return Value ---
  return { startGame, handleClick, gameState, resetGame }
}
