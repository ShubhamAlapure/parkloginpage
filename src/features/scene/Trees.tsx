import * as THREE from 'three';
import React, { useMemo } from 'react';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { TREES } from './parkConstants';
import { mulberry32, windGLSL, windUniforms } from './Ground';

function createBranchTube(points: THREE.Vector3[], startR: number, endR: number, radialSegs: number) {
  const curve = new THREE.CatmullRomCurve3(points);
  const tubeSegs = Math.max(3, 2 * points.length);
  const geo = new THREE.TubeGeometry(curve, tubeSegs, 1, radialSegs, false);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const tempV = new THREE.Vector3();
  const stride = radialSegs + 1;
  const curveLen = curve.getLength();

  for (let i = 0; i < pos.count; i++) {
    const t = Math.floor(i / stride) / tubeSegs;
    const pt = curve.getPointAt(Math.min(t, 1));
    tempV.fromBufferAttribute(pos, i).sub(pt);
    const rad = THREE.MathUtils.lerp(startR, endR, Math.pow(t, 0.8));
    tempV.multiplyScalar(rad);
    pos.setXYZ(i, pt.x + tempV.x, pt.y + tempV.y, pt.z + tempV.z);
    uv.setXY(i, uv.getX(i) * Math.max(1, Math.round(12 * startR)), t * curveLen * 1.5);
  }
  geo.computeVertexNormals();
  return geo;
}

function generateTreeData(seed: number) {
  const rand = mulberry32(7919 * seed);
  const woodGeos: THREE.BufferGeometry[] = [];
  const leafPoints: { p: THREE.Vector3; size: number }[] = [];
  const trunkHeight = 1.35 + 0.5 * rand();

  const growBranch = (origin: THREE.Vector3, dir: THREE.Vector3, length: number, radius: number, depth: number) => {
    const pts = [origin.clone()];
    const curDir = dir.clone();
    let curPt = origin.clone();
    for (let i = 0; i < 4; i++) {
      curDir.x += (rand() - 0.5) * 0.35;
      curDir.z += (rand() - 0.5) * 0.35;
      curDir.y += depth > 1 ? -0.08 : 0.02;
      curDir.normalize();
      curPt = curPt.clone().addScaledVector(curDir, length / 4);
      pts.push(curPt);
    }
    woodGeos.push(createBranchTube(pts, radius, 0.45 * radius, depth === 0 ? 10 : depth === 1 ? 7 : 5));
    if (depth >= 2) {
      leafPoints.push({ p: pts[2].clone(), size: 0.9 });
    }
    if (depth >= 4 || radius < 0.008) {
      leafPoints.push({ p: curPt.clone(), size: 1 });
      leafPoints.push({ p: pts[3].clone(), size: 0.85 });
      return;
    }
    const numSub = depth === 0 ? 4 + Math.floor(2 * rand()) : 2 + Math.floor(2 * rand());
    for (let i = 0; i < numSub; i++) {
      const branchBase = pts[Math.min(pts.length - 1, 1 + Math.floor(rand() * (pts.length - 1)))];
      const angle = (i / numSub) * Math.PI * 2 + 0.8 * rand();
      const spread = depth === 0 ? 0.75 + 0.25 * rand() : 0.55 + 0.35 * rand();
      const elevation = depth === 0 ? 0.35 + 0.35 * rand() : 0.45 + 0.45 * rand();
      const subDir = new THREE.Vector3(Math.cos(angle) * spread, elevation, Math.sin(angle) * spread).normalize().lerp(curDir, depth === 0 ? 0.15 : 0.4).normalize();
      growBranch(branchBase, subDir, length * (0.6 + 0.15 * rand()), 0.58 * radius, depth + 1);
    }
    if (depth > 0) {
      leafPoints.push({ p: curPt.clone(), size: 1.2 });
    }
  };

  const trunkTop = new THREE.Vector3((rand() - 0.5) * 0.3, trunkHeight, (rand() - 0.5) * 0.3);
  woodGeos.push(createBranchTube([new THREE.Vector3(0, -0.15, 0), new THREE.Vector3((rand() - 0.5) * 0.1, 0.5 * trunkHeight, (rand() - 0.5) * 0.1), trunkTop], 0.24, 0.15, 12));
  growBranch(trunkTop, new THREE.Vector3(0, 1, 0), 2.3 + 0.5 * rand(), 0.15, 0);

  const centerCrown = new THREE.Vector3();
  leafPoints.forEach(lp => centerCrown.add(lp.p));
  centerCrown.divideScalar(leafPoints.length);
  let maxCrownR = 0;
  leafPoints.forEach(lp => (maxCrownR = Math.max(maxCrownR, lp.p.distanceTo(centerCrown))));

  const leafCardGeos: THREE.BufferGeometry[] = [];
  const crownColor = new THREE.Color();
  const qCard = new THREE.Quaternion();
  const eulerCard = new THREE.Euler();
  const upVec = new THREE.Vector3(0, 1, 0);

  for (const lp of leafPoints) {
    const cardCount = 3 + Math.floor(2 * rand());
    for (let c = 0; c < cardCount; c++) {
      const cardSize = (0.85 + 0.6 * rand()) * lp.size;
      const cardGeo = new THREE.PlaneGeometry(cardSize, cardSize);
      eulerCard.set(rand() * Math.PI, rand() * Math.PI * 2, rand() * Math.PI);
      qCard.setFromEuler(eulerCard);
      cardGeo.applyQuaternion(qCard);
      cardGeo.translate(lp.p.x + (rand() - 0.5) * 0.5, lp.p.y + (rand() - 0.3) * 0.4, lp.p.z + (rand() - 0.5) * 0.5);

      const pos = cardGeo.attributes.position;
      const normBuf = new Float32Array(3 * pos.count);
      const colBuf = new Float32Array(3 * pos.count);
      const bright = 0.85 + 0.3 * rand();
      const hueShift = 0.04 * rand();

      for (let v = 0; v < pos.count; v++) {
        const vPos = new THREE.Vector3().fromBufferAttribute(pos, v).sub(centerCrown);
        const distRatio = vPos.length() / maxCrownR;
        vPos.normalize().lerp(upVec, 0.25).normalize();
        normBuf.set([vPos.x, vPos.y, vPos.z], 3 * v);
        const smoothShade = THREE.MathUtils.smoothstep(distRatio, 0.25, 0.95);
        crownColor.setRGB(1, 1, 1).multiplyScalar(bright * (0.45 + 0.55 * smoothShade));
        crownColor.offsetHSL(hueShift, 0, 0);
        colBuf.set([crownColor.r, crownColor.g, crownColor.b], 3 * v);
      }
      cardGeo.setAttribute('normal', new THREE.BufferAttribute(normBuf, 3));
      cardGeo.setAttribute('color', new THREE.BufferAttribute(colBuf, 3));
      leafCardGeos.push(cardGeo);
    }
  }

  return {
    wood: BufferGeometryUtils.mergeGeometries(woodGeos)!,
    leaves: BufferGeometryUtils.mergeGeometries(leafCardGeos)!,
  };
}

export function Trees() {
  const { treeModels, leafMaterial, barkMaterial } = useMemo(() => {
    // Leaf canvas texture
    const leafCanvas = document.createElement('canvas');
    leafCanvas.width = leafCanvas.height = 512;
    const lCtx = leafCanvas.getContext('2d')!;
    const randLeaf = mulberry32(11);
    const clusters = Array.from({ length: 5 }, () => [512 * (0.3 + 0.4 * randLeaf()), 512 * (0.3 + 0.4 * randLeaf())]);
    for (let i = 0; i < 70; i++) {
      const [cx, cy] = clusters[i % clusters.length];
      const ang = randLeaf() * Math.PI * 2;
      const dist = 30 + 170 * randLeaf();
      const sx = cx + Math.cos(ang) * dist;
      const sy = cy + Math.sin(ang) * dist;
      if (sx < 30 || sy < 30 || sx > 482 || sy > 482) continue;
      const lw = 34 + 26 * randLeaf();
      const lh = lw * (0.42 + 0.12 * randLeaf());
      lCtx.save();
      lCtx.translate(sx, sy);
      lCtx.rotate(ang + (randLeaf() - 0.5) * 0.8);
      const lum = 0.35 + 0.3 * randLeaf();
      lCtx.fillStyle = `hsl(${88 + 20 * randLeaf()}, ${38 + 18 * randLeaf()}%, ${Math.round(60 * lum)}%)`;
      lCtx.beginPath();
      lCtx.moveTo(-lw / 2, 0);
      lCtx.quadraticCurveTo(0, -lh, lw / 2, 0);
      lCtx.quadraticCurveTo(0, lh, -lw / 2, 0);
      lCtx.fill();
      lCtx.strokeStyle = 'rgba(230,240,190,0.25)';
      lCtx.lineWidth = 1.2;
      lCtx.beginPath();
      lCtx.moveTo(-lw / 2, 0);
      lCtx.lineTo(lw / 2, 0);
      lCtx.stroke();
      lCtx.fillStyle = 'rgba(255,255,220,0.07)';
      lCtx.beginPath();
      lCtx.moveTo(-lw / 2, 0);
      lCtx.quadraticCurveTo(0, -lh, lw / 2, 0);
      lCtx.closePath();
      lCtx.fill();
      lCtx.restore();
    }
    const leafTex = new THREE.CanvasTexture(leafCanvas);
    leafTex.colorSpace = THREE.SRGBColorSpace;
    leafTex.anisotropy = 4;

    const leafMat = new THREE.MeshStandardMaterial({
      map: leafTex,
      vertexColors: true,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
      roughness: 0.75,
      metalness: 0,
    });
    leafMat.onBeforeCompile = shader => {
      Object.assign(shader.uniforms, windUniforms);
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>\n${windGLSL}`)
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vec2 w = windAt(wp.xz);
          float sway = smoothstep(1.5, 6.0, position.y);
          transformed.xz += w * sway * 0.1;
          float flutter = sin(uTime * 4.7 + wp.x * 3.1 + wp.y * 2.3 + wp.z * 1.7);
          transformed += normal * flutter * 0.03 * length(w);`
        );
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\nnormal = normalize(vNormal);')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * 0.08;');
    };

    // Bark canvas texture
    const barkCanvas = document.createElement('canvas');
    barkCanvas.width = 128;
    barkCanvas.height = 256;
    const bCtx = barkCanvas.getContext('2d')!;
    const randBark = mulberry32(5);
    bCtx.fillStyle = '#5a4a3c';
    bCtx.fillRect(0, 0, 128, 256);
    for (let i = 0; i < 90; i++) {
      const bx = 128 * randBark();
      const bw = 1 + 4 * randBark();
      bCtx.fillStyle = 0.5 > randBark() ? `rgba(30,22,16,${0.25 + 0.35 * randBark()})` : `rgba(150,135,115,${0.12 + 0.2 * randBark()})`;
      let by = 40 * randBark() - 40;
      while (by < 256) {
        const bh = 20 + 60 * randBark();
        bCtx.fillRect(bx + (randBark() - 0.5) * 3, by, bw, bh);
        by += bh + 12 * randBark();
      }
    }
    for (let i = 0; i < 40; i++) {
      bCtx.fillStyle = `rgba(140,150,110,${0.15 + 0.2 * randBark()})`;
      bCtx.fillRect(128 * randBark(), 256 * randBark(), 2 + 4 * randBark(), 2 + 3 * randBark());
    }
    const barkTex = new THREE.CanvasTexture(barkCanvas);
    barkTex.colorSpace = THREE.SRGBColorSpace;
    barkTex.wrapS = barkTex.wrapT = THREE.RepeatWrapping;

    const barkMat = new THREE.MeshStandardMaterial({
      map: barkTex,
      color: '#d2c4b2',
      roughness: 0.95,
    });

    const models = TREES.map(tree => ({
      ...tree,
      ...generateTreeData(tree.seed),
    }));

    return { treeModels: models, leafMaterial: leafMat, barkMaterial: barkMat };
  }, []);

  return (
    <group>
      {treeModels.map(t => (
        <group key={t.seed} position={t.position} scale={t.scale} rotation-y={t.seed}>
          <mesh geometry={t.wood} material={barkMaterial} castShadow receiveShadow />
          <mesh geometry={t.leaves} material={leafMaterial} castShadow receiveShadow />
        </group>
      ))}
    </group>
  );
}

export function SkyDome() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { uTime: windUniforms.uTime },
        vertexShader: `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            vec4 p = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * p;
          }`,
        fragmentShader: `
          uniform float uTime;
          varying vec3 vDir;
          float h(vec2 p) { return fract(sin(dot(p, vec2(12.7, 311.1))) * 43758.55); }
          float n(vec2 p) {
            vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(mix(h(i), h(i + vec2(1, 0)), u.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), u.x), u.y);
          }
          float fbm(vec2 p) { float v = 0.0; float a = 0.5; for (int i = 0; i < 5; i++) { v += a * n(p); p *= 2.02; a *= 0.5; } return v; }
          void main() {
            float y = clamp(vDir.y, -0.1, 1.0);
            vec3 horizon = vec3(0.93, 0.90, 0.82);
            vec3 zenith = vec3(0.47, 0.66, 0.86);
            vec3 col = mix(horizon, zenith, pow(smoothstep(0.0, 0.7, y), 0.8));
            vec2 uv = vDir.xz / max(vDir.y + 0.18, 0.05);
            float c = fbm(uv * 0.55 + vec2(uTime * 0.004, 0.0));
            float cloud = smoothstep(0.52, 0.78, c) * smoothstep(0.02, 0.25, y);
            vec3 cloudCol = mix(vec3(0.83, 0.84, 0.86), vec3(1.0, 0.98, 0.94), smoothstep(0.55, 0.85, c));
            col = mix(col, cloudCol, cloud * 0.85);
            gl_FragColor = vec4(col, 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    []
  );

  return (
    <mesh material={mat} scale={80} renderOrder={-1}>
      <sphereGeometry args={[1, 32, 16]} />
    </mesh>
  );
}
