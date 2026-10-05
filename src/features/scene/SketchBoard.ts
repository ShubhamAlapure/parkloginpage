import * as THREE from 'three';
import { mulberry32 } from './Ground';

const rgbaStr = ([r, g, b]: number[], a: number) => `rgba(${r},${g},${b},${a})`;

interface BlobItem {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

function makeBlobs(rand: () => number, cx: number, cy: number, radius: number, count: number): BlobItem[] {
  const blobs: BlobItem[] = [{ cx, cy, rx: 0.55 * radius, ry: 0.42 * radius }];
  for (let i = 1; i < count; i++) {
    const angle = (i / (count - 1)) * Math.PI * 2 + 0.6 * rand();
    const dist = radius * (0.42 + 0.2 * rand());
    blobs.push({
      cx: cx + Math.cos(angle) * dist,
      cy: cy + Math.sin(angle) * dist * 0.62 - 0.05 * radius,
      rx: radius * (0.3 + 0.14 * rand()),
      ry: radius * (0.24 + 0.1 * rand()),
    });
  }
  return blobs;
}

function isInsideBlob(blobs: BlobItem[], x: number, y: number, excludeIdx: number) {
  return blobs.some((b, idx) => idx !== excludeIdx && Math.pow((x - b.cx) / b.rx, 2) + Math.pow((y - b.cy) / b.ry, 2) < 0.92);
}

function makeBlobPath(blobs: BlobItem[], scale = 1.04) {
  const p = new Path2D();
  for (const b of blobs) {
    p.ellipse(b.cx, b.cy, b.rx * scale, b.ry * scale, 0, 0, 2 * Math.PI);
  }
  return p;
}

function makePolyPath(pts: [number, number][]) {
  const p = new Path2D();
  pts.forEach(([x, y], idx) => (idx === 0 ? p.moveTo(x, y) : p.lineTo(x, y)));
  p.closePath();
  return p;
}

export interface StrokeDef {
  points: [number, number][];
  width: number;
  alpha: number;
}

export interface WashDef {
  region: Path2D;
  color: number[];
  strength: number;
  dabs: [number, number, number][];
  edge: boolean;
  done: number;
}

export class SketchBoard {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
  sheet: number;
  rand: () => number;
  strokes: StrokeDef[];
  strokeIndex: number;
  pointIndex: number;
  washes: WashDef[];
  washIndex: number;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 512;
    this.canvas.height = 640;
    this.ctx = this.canvas.getContext('2d')!;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 4;
    this.sheet = 0;
    this.rand = mulberry32(131);
    this.strokes = [];
    this.strokeIndex = 0;
    this.pointIndex = 0;
    this.washes = [];
    this.washIndex = 0;
    this.reset();
  }

  reset() {
    this.sheet += 1;
    const rand = mulberry32(131 * this.sheet);
    this.rand = rand;

    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.fillStyle = '#f5f0e4';
    this.ctx.fillRect(0, 0, 512, 640);
    for (let i = 0; i < 9000; i++) {
      this.ctx.fillStyle = 0.5 > rand() ? `rgba(120,108,88,${0.06 * rand()})` : `rgba(255,255,250,${0.08 * rand()})`;
      this.ctx.fillRect(512 * rand(), 640 * rand(), 1 + rand(), 1 + rand());
    }

    const blobs = {
      big: makeBlobs(rand, 152, 212, 150, 7),
      small: makeBlobs(rand, 444, 296, 58, 4),
    };

    this.strokes = this.generateStrokes(rand, blobs);
    this.strokeIndex = 0;
    this.pointIndex = 0;
    this.washes = this.generateWashes(rand, blobs);
    this.washIndex = 0;
    this.texture.needsUpdate = true;
  }

  get sketchDone() {
    return this.strokeIndex >= this.strokes.length;
  }

  get paintDone() {
    return this.washIndex >= this.washes.length;
  }

  sketch(count: number): [number, number] | null {
    const ctx = this.ctx;
    let tipCoord: [number, number] | null = null;
    while (count > 0 && !this.sketchDone) {
      const stroke = this.strokes[this.strokeIndex];
      if (this.pointIndex === 0) this.pointIndex = 1;
      const idx = this.pointIndex;
      const prev = stroke.points[idx - 1];
      const cur = stroke.points[idx];
      const curve = 0.6 * Math.sin(Math.PI * Math.min(1, 1.15 * (idx / (stroke.points.length - 1)) + 0.05)) + 0.4;
      ctx.strokeStyle = `rgba(58,55,54,${stroke.alpha * curve})`;
      ctx.lineWidth = stroke.width * (0.7 + 0.5 * curve);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(prev[0], prev[1]);
      ctx.lineTo(cur[0], cur[1]);
      ctx.stroke();

      if (0.35 > this.rand()) {
        ctx.fillStyle = `rgba(40,38,38,${0.12 * curve})`;
        ctx.fillRect(cur[0] + (this.rand() - 0.5) * 2, cur[1] + (this.rand() - 0.5) * 2, 1, 1);
      }
      tipCoord = [cur[0] / 512, cur[1] / 640];
      this.pointIndex++;
      count--;
      if (this.pointIndex >= stroke.points.length) {
        this.strokeIndex++;
        this.pointIndex = 0;
      }
    }
    this.texture.needsUpdate = true;
    return tipCoord;
  }

  paint(count: number): [number, number] | null {
    const ctx = this.ctx;
    let tipCoord: [number, number] | null = null;
    while (count > 0 && !this.paintDone) {
      const wash = this.washes[this.washIndex];
      const [dabX, dabY, dabR] = wash.dabs[wash.done];
      ctx.save();
      ctx.clip(wash.region);
      ctx.globalCompositeOperation = 'multiply';
      const grad = ctx.createRadialGradient(dabX, dabY, 0, dabX, dabY, dabR);
      grad.addColorStop(0, rgbaStr(wash.color, wash.strength));
      grad.addColorStop(0.7, rgbaStr(wash.color, 0.7 * wash.strength));
      grad.addColorStop(1, rgbaStr(wash.color, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(dabX, dabY, dabR, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();

      tipCoord = [dabX / 512, dabY / 640];
      wash.done++;
      count--;
      if (wash.done >= wash.dabs.length) {
        if (wash.edge) {
          ctx.save();
          ctx.clip(wash.region);
          ctx.globalCompositeOperation = 'multiply';
          ctx.filter = 'blur(1.5px)';
          ctx.strokeStyle = rgbaStr(wash.color, 2.2 * wash.strength);
          ctx.lineWidth = 3;
          ctx.stroke(wash.region);
          ctx.restore();
          ctx.filter = 'none';
        }
        this.washIndex++;
      }
    }
    this.texture.needsUpdate = true;
    return tipCoord;
  }

  dispose() {
    this.texture.dispose();
  }

  private generateStrokes(rand: () => number, blobs: { big: BlobItem[]; small: BlobItem[] }): StrokeDef[] {
    const result: StrokeDef[] = [];
    const jitter = (val: number, amount: number) => val + (rand() - 0.5) * amount;
    const addStroke = (pts: [number, number][], { width = 1.6, alpha = 0.75, wobble = 1.2, step = 5 } = {}) => {
      const dense: [number, number][] = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i];
        const [x1, y1] = pts[i + 1];
        const segCount = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / step));
        for (let j = +(i !== 0); j <= segCount; j++) {
          const t = j / segCount;
          dense.push([jitter(x0 + (x1 - x0) * t, wobble), jitter(y0 + (y1 - y0) * t, wobble)]);
        }
      }
      if (dense.length > 1) {
        result.push({ points: dense, width, alpha });
      }
    };

    const addSampledCurve = (fn: (t: number) => [number, number], steps: number, opts: any) =>
      addStroke(Array.from({ length: steps + 1 }, (_, i) => fn(i / steps)), opts);

    const addTuft = (cx: number, cy: number, r: number, alpha: number) => {
      const a = rand() * Math.PI * 2;
      const cosA = Math.cos(a);
      const sinA = Math.sin(a);
      addStroke(
        [
          [cx - cosA * r, cy - sinA * r],
          [cx + (rand() - 0.5) * r * 0.8, cy + (rand() - 0.5) * r * 0.8],
          [cx + cosA * r, cy + sinA * r * 0.6],
        ],
        { width: 1, alpha, wobble: 0.6, step: 3 }
      );
    };

    const addBlobHatching = (blobArr: BlobItem[], count: number, angle: number) => {
      blobArr.forEach((b, idx) => {
        let contourPts: [number, number][] = [];
        const commit = () => {
          if (contourPts.length > 2) addStroke(contourPts, { width: 1.3, alpha: 0.6, wobble: 2.4, step: 3 });
          contourPts = [];
        };
        const nSteps = Math.round((b.rx + b.ry) / 3);
        for (let s = 0; s <= nSteps; s++) {
          const a = (s / nSteps) * Math.PI * 2;
          const wobbleRad = 1 + (s % 2 ? 0.06 : -0.03) + (rand() - 0.5) * 0.08;
          const px = b.cx + Math.cos(a) * b.rx * wobbleRad;
          const py = b.cy + Math.sin(a) * b.ry * wobbleRad;
          if (isInsideBlob(blobArr, px, py, idx) || 0.06 > rand()) commit();
          else contourPts.push([px, py]);
        }
        commit();
      });

      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);
      for (let i = 0; i < count; i++) {
        const b = blobArr[Math.floor(rand() * blobArr.length)];
        const a = rand() * Math.PI * 2;
        const dist = Math.sqrt(rand());
        const px = b.cx + Math.cos(a) * b.rx * dist * 0.95;
        const py = b.cy + Math.sin(a) * b.ry * dist * 0.95;
        const dotA = (Math.cos(a) * cosAngle + Math.sin(a) * sinAngle) * dist;
        if (rand() <= 0.35 + 0.6 * dotA) {
          addTuft(px, py, 3 + 3 * rand(), 0.3 + 0.35 * Math.max(0, dotA));
        }
      }
    };

    const addShadingLines = (cx: number, cy: number, rx: number, ry: number, angle: number, spacing: number, alpha = 0.32) => {
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const maxR = Math.max(rx, ry);
      for (let s = -maxR; s < maxR; s += spacing * (0.8 + 0.4 * rand())) {
        const linePts: [number, number][] = [];
        for (let e = -1.2; e <= 1.2; e += 0.05) {
          const px = cx - sinA * s + cosA * e * rx;
          const py = cy + cosA * s + sinA * e * ry;
          if (Math.pow((px - cx) / rx, 2) + Math.pow((py - cy) / ry, 2) <= 1) {
            linePts.push([px, py]);
          }
        }
        if (linePts.length < 3) continue;
        const p1 = linePts[Math.floor(rand() * linePts.length * 0.2)];
        const p2 = linePts[linePts.length - 1 - Math.floor(rand() * linePts.length * 0.2)];
        const mid: [number, number] = [(p1[0] + p2[0]) / 2 + (rand() - 0.5) * 3, (p1[1] + p2[1]) / 2 + (rand() - 0.5) * 3];
        addStroke([p1, mid, p2], { width: 0.9, alpha, wobble: 0.6, step: 4 });
      }
    };

    addStroke([[16, 372], [496, 367]], { width: 0.9, alpha: 0.3, wobble: 0.6, step: 8 });
    addSampledCurve(t => [150 + 150 * t + 36 * Math.sin(3.2 * t), 636 - 262 * t], 22, { width: 1.1, alpha: 0.45, wobble: 1.6 });
    addSampledCurve(t => [318 + 34 * t + 26 * Math.sin(3.2 * t), 636 - 264 * t], 22, { width: 1.1, alpha: 0.45, wobble: 1.6 });

    let treeX = 16;
    while (treeX < 496) {
      const w = 26 + 30 * rand();
      const h = 12 + 12 * rand();
      const baseGroundY = 371 - ((treeX - 16) / 480) * 5;
      addSampledCurve(t => [treeX + t * w, baseGroundY - Math.sin(t * Math.PI) * h * (0.85 + 0.3 * rand())], 10, {
        width: 1.1,
        alpha: 0.5,
        wobble: 1.8,
        step: 3,
      });
      for (let i = 0; i < 3; i++) addTuft(treeX + rand() * w, baseGroundY - rand() * h * 0.7, 3, 0.3);
      treeX += w * (0.8 + 0.15 * rand());
    }

    addStroke([[124, 506], [134, 470], [138, 420], [140, 360], [138, 318]], { width: 2.1, alpha: 0.8 });
    addStroke([[172, 508], [164, 472], [160, 420], [160, 360], [164, 318]], { width: 2.1, alpha: 0.8 });
    addStroke([[124, 506], [110, 512]], { width: 1.6 });
    addStroke([[172, 508], [188, 513]], { width: 1.6 });
    addStroke([[140, 330], [110, 282], [82, 262]], { width: 1.7 });
    addStroke([[160, 326], [192, 280], [226, 258]], { width: 1.7 });
    addStroke([[150, 322], [150, 250]], { width: 1.5 });
    addStroke([[112, 284], [100, 250]], { width: 1.1, alpha: 0.6 });
    addStroke([[194, 278], [210, 244]], { width: 1.1, alpha: 0.6 });

    for (let i = 0; i < 16; i++) {
      const y = 330 + 170 * rand();
      const x = 142 + 18 * rand() + 6 * (0.6 > rand() ? 1 : 0);
      addStroke([[x, y], [x + (rand() - 0.5) * 2, y + 6 + 8 * rand()]], { width: 0.9, alpha: 0.45, wobble: 0.4, step: 3 });
    }

    addBlobHatching(blobs.big, 380, 0.9);
    addStroke([[440, 368], [442, 322]], { width: 1.4, alpha: 0.65 });
    addStroke([[449, 368], [447, 322]], { width: 1.4, alpha: 0.65 });
    addBlobHatching(blobs.small, 70, 0.9);

    addStroke([[292, 470], [330, 302]], { width: 1.8 });
    addStroke([[350, 470], [330, 302]], { width: 1.8 });
    addStroke([[398, 458], [426, 304]], { width: 1.8 });
    addStroke([[452, 456], [426, 304]], { width: 1.8 });
    addStroke([[324, 303], [434, 300]], { width: 2.1 });
    addStroke([[362, 303], [357, 416]], { width: 0.9, alpha: 0.55, step: 6 });
    addStroke([[392, 302], [398, 416]], { width: 0.9, alpha: 0.55, step: 6 });
    addStroke([[350, 418], [405, 418]], { width: 2.3 });

    addSampledCurve(t => [377 + 9 * Math.cos(t * Math.PI * 2), 371 + 10 * Math.sin(t * Math.PI * 2)], 18, { width: 1.3, wobble: 0.6 });
    addSampledCurve(t => [369 + 16 * t, 366 - 7 * Math.sin(t * Math.PI)], 8, { width: 1.8, alpha: 0.7, wobble: 0.6 });
    addSampledCurve(t => [370 - 3 * Math.sin(t * Math.PI), 382 + 34 * t], 8, { width: 1.4, wobble: 0.5 });
    addSampledCurve(t => [385 + 3 * Math.sin(t * Math.PI), 382 + 34 * t], 8, { width: 1.4, wobble: 0.5 });
    addStroke([[371, 388], [362, 392], [358, 378]], { width: 1.2 });
    addStroke([[384, 388], [393, 392], [396, 378]], { width: 1.2 });
    addStroke([[372, 416], [394, 428], [404, 444]], { width: 1.4 });
    addStroke([[383, 416], [402, 426], [414, 440]], { width: 1.4 });

    for (let i = 0; i < 80; i++) {
      const y = 388 + 246 * Math.pow(rand(), 0.6);
      const x = 16 + 480 * rand();
      const normY = (636 - y) / 262;
      const minX = 150 + 150 * normY + 36 * Math.sin(3.2 * normY);
      const maxX = 318 + 34 * normY + 26 * Math.sin(3.2 * normY);
      if (x > minX - 6 && x < maxX + 6) continue;
      const sc = 0.35 + ((y - 372) / 260) * 1.1;
      for (let j = 0; j < 3; j++) {
        const gx = x + 3 * j * sc;
        addStroke([[gx, y], [gx + (j - 1) * 2 * sc, y - (6 + 5 * rand()) * sc]], { width: 0.9, alpha: 0.45, wobble: 0.4, step: 3 });
      }
    }

    addShadingLines(158, 420, 7, 90, 1.5, 4, 0.34);
    addShadingLines(172, 514, 78, 11, 0.06, 4.5, 0.26);
    addShadingLines(372, 466, 66, 7, 0.04, 4.5, 0.22);

    return result;
  }

  private generateWashes(rand: () => number, blobs: { big: BlobItem[]; small: BlobItem[] }): WashDef[] {
    const bigPath = makeBlobPath(blobs.big);
    const smallPath = makeBlobPath(blobs.small);
    const makeDabs = (minX: number, minY: number, maxX: number, maxY: number, count: number, radius: number): [number, number, number][] =>
      Array.from({ length: count }, () => [minX + rand() * (maxX - minX), minY + rand() * (maxY - minY), radius * (0.7 + 0.6 * rand())]);

    const makeWash = (region: Path2D, color: number[], strength: number, dabs: [number, number, number][], edge = true): WashDef => ({
      region,
      color,
      strength,
      dabs,
      edge,
      done: 0,
    });

    const skyPath = makePolyPath([[0, 0], [512, 0], [512, 367], [0, 372]]);
    const groundPath = makePolyPath([[0, 372], [512, 367], [512, 640], [0, 640]]);

    const pathCurve: [number, number][] = [];
    for (let i = 0; i <= 22; i++) {
      const t = i / 22;
      pathCurve.push([150 + 150 * t + 36 * Math.sin(3.2 * t), 636 - 262 * t]);
    }
    for (let i = 22; i >= 0; i--) {
      const t = i / 22;
      pathCurve.push([318 + 34 * t + 26 * Math.sin(3.2 * t), 636 - 264 * t]);
    }
    const pathArea = makePolyPath(pathCurve);

    const horizonBushes = new Path2D();
    for (let x = 10; x < 512; x += 34) {
      horizonBushes.ellipse(x + 17, 362, 24, 16, 0, 0, 2 * Math.PI);
    }

    const easelStandPath = makePolyPath([[122, 508], [134, 470], [140, 360], [138, 316], [164, 316], [160, 420], [164, 472], [174, 510]]);
    const easelShadow = new Path2D();
    easelShadow.ellipse(172, 514, 84, 15, 0, 0, 2 * Math.PI);

    const artistFigure = new Path2D();
    artistFigure.ellipse(377, 400, 8, 14, 0, 0, 2 * Math.PI);

    return [
      makeWash(skyPath, [160, 195, 225], 0.09, makeDabs(0, 0, 512, 372, 60, 70)),
      makeWash(skyPath, [110, 155, 210], 0.08, makeDabs(0, 0, 512, 148.8, 30, 66)),
      makeWash(groundPath, [175, 195, 105], 0.11, makeDabs(0, 372, 512, 640, 70, 60)),
      makeWash(pathArea, [220, 196, 158], 0.12, makeDabs(140, 370, 380, 640, 28, 40)),
      makeWash(horizonBushes, [85, 120, 90], 0.14, makeDabs(0, 342, 512, 376, 30, 24), false),
      makeWash(bigPath, [130, 170, 85], 0.13, makeDabs(20, 100, 290, 320, 70, 44), false),
      makeWash(smallPath, [115, 155, 90], 0.13, makeDabs(390, 250, 500, 340, 14, 26), false),
      makeWash(easelStandPath, [120, 92, 70], 0.2, makeDabs(122, 316, 174, 510, 16, 16)),
      makeWash(bigPath, [70, 110, 62], 0.12, makeDabs(110, 220, 290, 320, 34, 32), false),
      makeWash(groundPath, [125, 160, 75], 0.09, makeDabs(0, 520, 512, 640, 26, 50)),
      makeWash(easelShadow, [85, 105, 75], 0.13, makeDabs(90, 500, 256, 530, 14, 22), false),
      makeWash(artistFigure, [205, 85, 72], 0.24, makeDabs(370, 386, 384, 414, 8, 7), false),
    ];
  }
}
