import * as THREE from 'three';

export class PaintingCanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public texture: THREE.CanvasTexture;
  private width: number = 768;
  private height: number = 576;
  private progress: number = 0;
  private masterImage: HTMLImageElement | null = null;
  private isLoaded: boolean = false;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    const context = this.canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context not supported');
    this.ctx = context;

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.generateMipmaps = true;
    this.texture.minFilter = THREE.LinearMipmapLinearFilter;

    // Load masterpiece impressionist oil painting image
    this.masterImage = new Image();
    this.masterImage.src = '/textures/oil_painting.jpg';
    this.masterImage.onload = () => {
      this.isLoaded = true;
      this.renderCanvas();
    };

    this.resetCanvas();
  }

  public resetCanvas() {
    this.progress = 0;
    // Gesso linen primer canvas background
    this.ctx.fillStyle = '#EFE9DE';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Realistic linen woven texture lines
    this.ctx.strokeStyle = 'rgba(215, 200, 180, 0.35)';
    this.ctx.lineWidth = 1;
    for (let i = 0; i < this.height; i += 4) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, i);
      this.ctx.lineTo(this.width, i);
      this.ctx.stroke();
    }
    for (let j = 0; j < this.width; j += 4) {
      this.ctx.beginPath();
      this.ctx.moveTo(j, 0);
      this.ctx.lineTo(j, this.height);
      this.ctx.stroke();
    }

    // Faint graphite underdrawing sketch of the landscape
    this.ctx.strokeStyle = 'rgba(120, 110, 95, 0.25)';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    // Horizon & hills
    this.ctx.moveTo(0, this.height * 0.42);
    this.ctx.bezierCurveTo(this.width * 0.3, this.height * 0.4, this.width * 0.7, this.height * 0.45, this.width, this.height * 0.4);
    // Pond outline
    this.ctx.moveTo(this.width * 0.35, this.height * 0.55);
    this.ctx.bezierCurveTo(this.width * 0.6, this.height * 0.5, this.width * 0.85, this.height * 0.75, this.width * 0.5, this.height * 0.85);
    this.ctx.stroke();

    this.texture.needsUpdate = true;
  }

  public drawDirectStroke(uvX: number, uvY: number, color: string, brushSize = 16) {
    const px = uvX * this.width;
    const py = (1 - uvY) * this.height;

    this.ctx.save();
    this.ctx.globalAlpha = 0.9;
    this.ctx.fillStyle = color;

    // Oil impasto bristle dab with highlight and shadow
    for (let b = 0; b < 6; b++) {
      const ox = (Math.random() - 0.5) * brushSize;
      const oy = (Math.random() - 0.5) * brushSize;
      const rad = brushSize * (0.4 + Math.random() * 0.5);

      this.ctx.beginPath();
      this.ctx.ellipse(px + ox, py + oy, rad * 1.4, rad * 0.8, Math.random() * Math.PI, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();
    this.texture.needsUpdate = true;
  }

  public updatePaintingProgress(targetProgress: number, activeColor: string) {
    const prev = this.progress;
    this.progress = THREE.MathUtils.clamp(targetProgress, 0, 1);

    if (this.progress < prev - 0.2) {
      this.resetCanvas();
    }

    this.renderCanvas();
  }

  private renderCanvas() {
    if (!this.isLoaded || !this.masterImage) return;

    this.ctx.save();
    // Progressively reveal the masterpiece using a soft artistic wipe and painterly patches
    const revealHeight = this.progress * (this.height * 1.2);
    
    this.ctx.globalAlpha = Math.min(1.0, this.progress * 1.4);
    
    // Draw master artwork
    this.ctx.drawImage(this.masterImage, 0, 0, this.width, this.height);

    // Mask with unfinished bottom / edges if not fully complete
    if (this.progress < 0.95) {
      this.ctx.fillStyle = '#EFE9DE';
      this.ctx.globalAlpha = 1.0 - this.progress;

      for (let y = revealHeight; y < this.height; y += 12) {
        this.ctx.fillRect(0, y, this.width, 12);
      }
    }

    this.ctx.restore();
    this.texture.needsUpdate = true;
  }

  public dispose() {
    this.texture.dispose();
  }
}
