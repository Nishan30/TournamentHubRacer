export class Bird {
    private x: number;
    private y: number;
    private velocity: number;
    private gravity: number;
    private lift: number;
    private size: number;
    private skins: string[];
    private currentSkin: number;
  
    constructor(x: number, y: number) {
      this.x = x;
      this.y = y;
      this.velocity = 0;
      this.gravity = 0.6;
      this.lift = -10;
      this.size = 32;
      this.skins = ['🐦', '🦜', '🦚', '🦢'];
      this.currentSkin = 0;
    }
  
    flap() {
      this.velocity = this.lift;
    }
  
    changeSkin() {
      this.currentSkin = (this.currentSkin + 1) % this.skins.length;
    }
  
    update() {
      this.velocity += this.gravity;
      this.y += this.velocity;
  
      if (this.y > window.innerHeight - this.size) {
        this.y = window.innerHeight - this.size;
        this.velocity = 0;
      }
  
      if (this.y < 0) {
        this.y = 0;
        this.velocity = 0;
      }
    }
  
    draw(ctx: CanvasRenderingContext2D) {
      ctx.font = `${this.size}px Arial`;
      ctx.fillText(this.skins[this.currentSkin], this.x, this.y);
    }
  
    getBounds() {
      return {
        x: this.x,
        y: this.y,
        width: this.size,
        height: this.size
      };
    }
  }