export class Pipe {
    private x: number;
    private topHeight: number;
    private gap: number;
    private width: number;
    private speed: number;
    private passed: boolean;
    private color: string;
  
    constructor(x: number) {
      this.x = x;
      this.width = 50;
      this.gap = 150;
      this.topHeight = Math.random() * (window.innerHeight - this.gap - 100) + 50;
      this.speed = 3;
      this.passed = false;
      this.color = this.getRandomColor();
    }
  
    private getRandomColor(): string {
      const colors = ['#4CAF50', '#2196F3', '#9C27B0', '#FF9800'];
      return colors[Math.floor(Math.random() * colors.length)];
    }
  
    update() {
      this.x -= this.speed;
    }
  
    draw(ctx: CanvasRenderingContext2D) {
      ctx.fillStyle = this.color;
      // Top pipe
      ctx.fillRect(this.x, 0, this.width, this.topHeight);
      // Bottom pipe
      ctx.fillRect(
        this.x,
        this.topHeight + this.gap,
        this.width,
        window.innerHeight - (this.topHeight + this.gap)
      );
    }
  
    isOffscreen(): boolean {
      return this.x < -this.width;
    }
  
    checkCollision(bird: { getBounds: () => { x: number; y: number; width: number; height: number; } }) {
      const birdBounds = bird.getBounds();
      
      // Check collision with top pipe
      if (
        birdBounds.x + birdBounds.width > this.x &&
        birdBounds.x < this.x + this.width &&
        birdBounds.y < this.topHeight
      ) {
        return true;
      }
      
      // Check collision with bottom pipe
      if (
        birdBounds.x + birdBounds.width > this.x &&
        birdBounds.x < this.x + this.width &&
        birdBounds.y + birdBounds.height > this.topHeight + this.gap
      ) {
        return true;
      }
      
      return false;
    }
  
    checkPassed(birdX: number): boolean {
      if (!this.passed && birdX > this.x + this.width) {
        this.passed = true;
        return true;
      }
      return false;
    }
  }