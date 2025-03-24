export class PowerUp {
    private x: number;
    private y: number;
    private size: number;
    private speed: number;
    private type: string;
    private collected: boolean;
  
    constructor(x: number) {
      this.x = x;
      this.y = Math.random() * (window.innerHeight - 100) + 50;
      this.size = 30;
      this.speed = 3;
      this.type = Math.random() < 0.5 ? '⭐' : '🛡️';
      this.collected = false;
    }
  
    update() {
      this.x -= this.speed;
    }
  
    draw(ctx: CanvasRenderingContext2D) {
      if (!this.collected) {
        ctx.font = `${this.size}px Arial`;
        ctx.fillText(this.type, this.x, this.y);
      }
    }
  
    checkCollision(bird: { getBounds: () => { x: number; y: number; width: number; height: number; } }) {
      if (this.collected) return false;
  
      const birdBounds = bird.getBounds();
      const collision = 
        birdBounds.x < this.x + this.size &&
        birdBounds.x + birdBounds.width > this.x &&
        birdBounds.y < this.y + this.size &&
        birdBounds.y + birdBounds.height > this.y;
  
      if (collision) {
        this.collected = true;
      }
  
      return collision;
    }
  
    isOffscreen(): boolean {
      return this.x < -this.size;
    }
  
    getType(): string {
      return this.type;
    }
  }