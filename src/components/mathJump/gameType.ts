export interface GameObject {
    x: number;
    y: number;
    width: number;
    height: number;
  }
  
  export interface Player extends GameObject {
    velocity: number;
    isJumping: boolean;
  }
  
  export interface Obstacle extends GameObject {
    speed: number;
  }
  
  export interface Coin extends GameObject {
    speed: number;
    collected: boolean;
  }
  
  export interface GameState {
    player: Player;
    obstacles: Obstacle[];
    coins: Coin[];
    score: number;
    gameOver: boolean;
    speed: number;
  }