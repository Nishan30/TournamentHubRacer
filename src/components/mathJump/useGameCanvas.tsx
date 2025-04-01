import { useCallback, useEffect, useState, useRef } from 'react';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GROUND_HEIGHT = 100;
const PLAYER_SIZE = 40;
const GRAVITY = 0.8;
const JUMP_FORCE = -15;

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
}

interface GameState {
  player: GameObject & { velocity: number };
  obstacles: GameObject[];
  coins: (GameObject & { collected: boolean })[];
  score: number;
  gameOver: boolean;
  speed: number;
}

export const useGameCanvas = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
  const animationFrameId = useRef<number>();
  const [gameState, setGameState] = useState<GameState>({
    player: {
      x: 50,
      y: CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE,
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
      velocity: 0,
      color: '#FFD700'
    },
    obstacles: [],
    coins: [],
    score: 0,
    gameOver: false,
    speed: 5
  });

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#4A90E2');
    gradient.addColorStop(1, '#87CEEB');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw ground
    const groundGradient = ctx.createLinearGradient(0, CANVAS_HEIGHT - GROUND_HEIGHT, 0, CANVAS_HEIGHT);
    groundGradient.addColorStop(0, '#8B4513');
    groundGradient.addColorStop(1, '#654321');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);

    // Draw player
    ctx.fillStyle = gameState.player.color!;
    ctx.fillRect(
      gameState.player.x,
      gameState.player.y,
      gameState.player.width,
      gameState.player.height
    );

    // Draw obstacles
    ctx.fillStyle = '#FF0000';
    gameState.obstacles.forEach(obstacle => {
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });

    // Draw coins
    gameState.coins.forEach(coin => {
      if (!coin.collected) {
        ctx.beginPath();
        ctx.arc(
          coin.x + coin.width / 2,
          coin.y + coin.height / 2,
          coin.width / 2,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = '#FFD700';
        ctx.fill();
        ctx.closePath();
      }
    });

    // Draw score
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`Score: ${gameState.score}`, 20, 40);

    // Draw game over screen
    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      
      ctx.font = 'bold 24px Arial';
      ctx.fillText(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
      ctx.fillText('Click to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
    }
  }, [gameState]);

  const checkCollision = (obj1: GameObject, obj2: GameObject) => {
    return (
      obj1.x < obj2.x + obj2.width &&
      obj1.x + obj1.width > obj2.x &&
      obj1.y < obj2.y + obj2.height &&
      obj1.y + obj1.height > obj2.y
    );
  };

  const update = useCallback(() => {
    if (gameState.gameOver) return;

    setGameState(prev => {
      const newState = { ...prev };

      // Update player
      newState.player.velocity += GRAVITY;
      newState.player.y += newState.player.velocity;

      // Ground collision
      if (newState.player.y > CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE) {
        newState.player.y = CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE;
        newState.player.velocity = 0;
      }

      // Update obstacles
      newState.obstacles = newState.obstacles
        .map(obstacle => ({
          ...obstacle,
          x: obstacle.x - newState.speed
        }))
        .filter(obstacle => obstacle.x > -obstacle.width);

      // Generate new obstacles
      if (Math.random() < 0.02 && newState.obstacles.length < 3) {
        newState.obstacles.push({
          x: CANVAS_WIDTH,
          y: CANVAS_HEIGHT - GROUND_HEIGHT - 40,
          width: 30,
          height: 40
        });
      }

      // Update coins
      newState.coins = newState.coins
        .map(coin => ({
          ...coin,
          x: coin.x - newState.speed
        }))
        .filter(coin => coin.x > -coin.width && !coin.collected);

      // Generate new coins
      if (Math.random() < 0.03 && newState.coins.length < 3) {
        newState.coins.push({
          x: CANVAS_WIDTH,
          y: Math.random() * (CANVAS_HEIGHT - GROUND_HEIGHT - 150) + 50,
          width: 20,
          height: 20,
          collected: false
        });
      }

      // Check collisions
      let gameOver = false;
      let score = prev.score;
      let speed = prev.speed;

      // Obstacle collisions
      for (const obstacle of newState.obstacles) {
        if (checkCollision(newState.player, obstacle)) {
          gameOver = true;
          break;
        }
      }

      // Coin collisions
      newState.coins.forEach(coin => {
        if (!coin.collected && checkCollision(newState.player, coin)) {
          coin.collected = true;
          score += 10;
          if (score % 100 === 0) {
            speed += 1;
          }
        }
      });

      return {
        ...newState,
        score,
        gameOver,
        speed
      };
    });
  }, [gameState.gameOver]);

  const handleClick = useCallback(() => {
    if (gameState.gameOver) {
      setGameState({
        player: {
          x: 50,
          y: CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE,
          width: PLAYER_SIZE,
          height: PLAYER_SIZE,
          velocity: 0,
          color: '#FFD700'
        },
        obstacles: [],
        coins: [],
        score: 0,
        gameOver: false,
        speed: 5
      });
    } else {
      setGameState(prev => ({
        ...prev,
        player: {
          ...prev.player,
          velocity: JUMP_FORCE
        }
      }));
    }
  }, [gameState.gameOver]);

  const startGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Dynamically set canvas dimensions to fit container
    const containerWidth = canvas.parentElement?.clientWidth || CANVAS_WIDTH;
    const containerHeight = canvas.parentElement?.clientHeight || CANVAS_HEIGHT;
    const aspectRatio = CANVAS_WIDTH / CANVAS_HEIGHT;

    if (containerWidth / containerHeight > aspectRatio) {
      canvas.width = containerHeight * aspectRatio;
      canvas.height = containerHeight;
    } else {
      canvas.width = containerWidth;
      canvas.height = containerWidth / aspectRatio;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    const render = () => {
      update();
      draw(ctx);
      frameId = window.requestAnimationFrame(render);
    };

    frameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [draw, update]);

  // Add keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        handleClick();
      } else if (e.code === 'KeyR') {
        setGameState({
          player: {
            x: 50,
            y: CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE,
            width: PLAYER_SIZE,
            height: PLAYER_SIZE,
            velocity: 0,
            color: '#FFD700'
          },
          obstacles: [],
          coins: [],
          score: 0,
          gameOver: false,
          speed: 5
        });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleClick]);

  return {
    startGame,
    handleClick
  };
};