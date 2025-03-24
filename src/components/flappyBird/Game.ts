export class Game {
    cleanup() {
        throw new Error('Method not implemented.');
    }
    resize() {
        throw new Error('Method not implemented.');
    }
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private bird: any;
    private pipes: any[];
    private powerUps: any[];
    private score: number;
    private highScore: number;
    private gameOver: boolean;
    private frameCount: number;
    private isNight: boolean;
    private shield: boolean;
  
    constructor(canvas: HTMLCanvasElement) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d')!;
      this.bird = null;
      this.pipes = [];
      this.powerUps = [];
      this.score = 0;
      this.highScore = parseInt(localStorage.getItem('highScore') || '0');
      this.gameOver = false;
      this.frameCount = 0;
      this.isNight = false;
      this.shield = false;
      this.init();
    }
  
    private init() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      
      import('./Bird').then(({ Bird }) => {
        this.bird = new Bird(100, this.canvas.height / 2);
        
        // Event listeners
        window.addEventListener('keydown', (e) => {
          if (e.code === 'Space') {
            if (this.gameOver) {
              this.reset();
            } else {
              this.bird.flap();
            }
          }
          if (e.code === 'KeyS') {
            this.bird.changeSkin();
          }
        });
  
        // Touch support for mobile
        this.canvas.addEventListener('touchstart', () => {
          if (this.gameOver) {
            this.reset();
          } else {
            this.bird.flap();
          }
        });
  
        // Start game loop
        this.update();
      });
    }
  
    private async reset() {
      const { Bird } = await import('./Bird');
      this.bird = new Bird(100, this.canvas.height / 2);
      this.pipes = [];
      this.powerUps = [];
      this.score = 0;
      this.gameOver = false;
      this.shield = false;
    }
  
    private update() {
      if (!this.gameOver) {
        this.frameCount++;
  
        // Add new pipe every 100 frames
        if (this.frameCount % 100 === 0) {
          import('./Pipe').then(({ Pipe }) => {
            this.pipes.push(new Pipe(this.canvas.width));
          });
        }
  
        // Add power-up every 300 frames
        if (this.frameCount % 300 === 0) {
          import('./PowerUp').then(({ PowerUp }) => {
            this.powerUps.push(new PowerUp(this.canvas.width));
          });
        }
  
        // Toggle day/night every 500 frames
        if (this.frameCount % 500 === 0) {
          this.isNight = !this.isNight;
        }
  
        // Update game objects
        this.bird.update();
        this.pipes.forEach(pipe => pipe.update());
        this.powerUps.forEach(powerUp => powerUp.update());
  
        // Check collisions and update score
        this.pipes.forEach(pipe => {
          if (pipe.checkPassed(this.bird.getBounds().x)) {
            this.score++;
            if (this.score > this.highScore) {
              this.highScore = this.score;
              localStorage.setItem('highScore', this.highScore.toString());
            }
          }
          if (!this.shield && pipe.checkCollision(this.bird)) {
            this.gameOver = true;
          }
        });
  
        // Check power-up collisions
        this.powerUps.forEach(powerUp => {
          if (powerUp.checkCollision(this.bird)) {
            if (powerUp.getType() === '⭐') {
              this.score += 5;
            } else if (powerUp.getType() === '🛡️') {
              this.shield = true;
              setTimeout(() => this.shield = false, 5000);
            }
          }
        });
  
        // Remove offscreen objects
        this.pipes = this.pipes.filter(pipe => !pipe.isOffscreen());
        this.powerUps = this.powerUps.filter(powerUp => !powerUp.isOffscreen());
      }
  
      this.draw();
      requestAnimationFrame(() => this.update());
    }
  
    private draw() {
      // Clear canvas
      this.ctx.fillStyle = this.isNight ? '#1a1a1a' : '#87CEEB';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  
      // Draw game objects
      this.pipes.forEach(pipe => pipe.draw(this.ctx));
      this.powerUps.forEach(powerUp => powerUp.draw(this.ctx));
      
      if (this.shield) {
        this.ctx.beginPath();
        this.ctx.arc(
          this.bird.getBounds().x + this.bird.getBounds().width / 2,
          this.bird.getBounds().y + this.bird.getBounds().height / 2,
          40,
          0,
          Math.PI * 2
        );
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.stroke();
      }
      
      this.bird.draw(this.ctx);
  
      // Draw score
      this.ctx.fillStyle = 'white';
      this.ctx.font = '32px Arial';
      this.ctx.fillText(`Score: ${this.score}`, 10, 40);
      this.ctx.fillText(`High Score: ${this.highScore}`, 10, 80);
  
      if (this.gameOver) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '48px Arial';
        this.ctx.fillText('Game Over!', this.canvas.width / 2 - 100, this.canvas.height / 2);
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Press Space to Restart', this.canvas.width / 2 - 100, this.canvas.height / 2 + 50);
      }
    }
  }
