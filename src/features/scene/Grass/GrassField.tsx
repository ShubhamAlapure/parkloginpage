import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '@/app/store';
import {
  getTerrainHeight,
  mainPathSamplePoints,
  secondaryPathSamplePoints,
  runwaySamplePoints,
  getMinDistanceToPoints,
} from '../pathData';

// Custom Grass Shader with wind propagation and height color gradient
const GrassShader = {
  uniforms: {
    uTime: { value: 0 },
    uWindStrength: { value: 0.4 },
    uBaseColor: { value: new THREE.Color('#3B6E32') },
    uTipColor: { value: new THREE.Color('#98C944') },
    uSunTipColor: { value: new THREE.Color('#F0DA72') },
  },
  vertexShader: `
    uniform float uTime;
    uniform float uWindStrength;
    attribute float aRandom;
    varying vec2 vUv;
    varying float vRandom;
    varying vec3 vWorldPosition;

    void main() {
      vUv = uv;
      vRandom = aRandom;

      // Extract instance transform
      mat4 instanceMat = instanceMatrix;
      vec4 worldInstancePos = instanceMat * vec4(0.0, 0.0, 0.0, 1.0);
      
      // Wind wave calculations across world space
      float windWave1 = sin(worldInstancePos.x * 0.3 + worldInstancePos.z * 0.2 + uTime * 2.2);
      float windWave2 = cos(worldInstancePos.x * 0.6 - worldInstancePos.z * 0.4 + uTime * 1.6) * 0.5;
      float totalWind = (windWave1 + windWave2) * uWindStrength;

      // Height bend factor (root is static uv.y = 0, tip moves most uv.y = 1)
      float bend = pow(uv.y, 1.6) * totalWind * (0.6 + aRandom * 0.8);

      vec3 transformed = position;
      transformed.x += bend * 0.35;
      transformed.z += bend * 0.25;
      transformed.y -= abs(bend) * 0.08;

      vec4 worldPosition = instanceMat * vec4(transformed, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 uBaseColor;
    uniform vec3 uTipColor;
    uniform vec3 uSunTipColor;
    varying vec2 vUv;
    varying float vRandom;
    varying vec3 vWorldPosition;

    void main() {
      // Color gradient from base to tip
      vec3 tipC = mix(uTipColor, uSunTipColor, vRandom * 0.6);
      vec3 color = mix(uBaseColor, tipC, vUv.y);

      // Subtle ambient occlusion near base
      float ao = clamp(vUv.y * 1.4, 0.4, 1.0);
      color *= ao;

      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

function createPRNG(seed = 42891) {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export const GrassField: React.FC = () => {
  const qualityTier = useAppStore((s) => s.qualityTier);
  const grassMeshRef = useRef<THREE.InstancedMesh>(null);
  const flowersMeshRef = useRef<THREE.InstancedMesh>(null);
  const shaderMatRef = useRef<THREE.ShaderMaterial>(null);

  const instanceCount = qualityTier === 'high' ? 40000 : qualityTier === 'medium' ? 24000 : 12000;
  const flowerCount = qualityTier === 'high' ? 800 : qualityTier === 'medium' ? 450 : 200;

  // Single blade geometry (manicured, neat park lawn height)
  const bladeGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(0.085, 0.34, 1, 3);
    geo.translate(0, 0.17, 0); // origin at root
    return geo;
  }, []);

  // Scatter instances deterministically avoiding paths, runway, pond, gazebo, playground, and painters lawn
  const { grassMatrices, randoms } = useMemo(() => {
    const rng = createPRNG(133742);
    const matrices: THREE.Matrix4[] = [];
    const rands: number[] = [];
    const dummy = new THREE.Object3D();

    let seededCount = 0;
    const maxAttempts = instanceCount * 4;
    let attempts = 0;

    while (seededCount < instanceCount && attempts < maxAttempts) {
      attempts++;
      const x = (rng() - 0.5) * 65;
      const z = (rng() - 0.5) * 65;

      // Exclude Perimeter Runway (width ~ 3.8m -> margin ~ 2.2m)
      const dRunway = getMinDistanceToPoints(x, z, runwaySamplePoints);
      if (dRunway < 2.2) continue;

      // Exclude Main Cobblestone Path (width ~ 2.6m -> margin ~ 1.5m)
      const dMainPath = getMinDistanceToPoints(x, z, mainPathSamplePoints);
      if (dMainPath < 1.5) continue;

      // Exclude Secondary Cobblestone Path (width ~ 1.8m -> margin ~ 1.1m)
      const dSecPath = getMinDistanceToPoints(x, z, secondaryPathSamplePoints);
      if (dSecPath < 1.1) continue;

      // Exclude pond area (center ~ [8, 4], r ~ 5.5)
      const dPond = Math.hypot(x - 8, z - 4);
      if (dPond < 5.5) continue;

      // Exclude gazebo area (center ~ [-8, -10], r ~ 4.5)
      const dGazebo = Math.hypot(x - -8, z - -10);
      if (dGazebo < 4.5) continue;

      // Exclude playground area (center ~ [-13, 8], r ~ 6.5)
      const dPlayground = Math.hypot(x - -13, z - 8);
      if (dPlayground < 6.5) continue;

      // Exclude fountain area (center ~ [4, -8], r ~ 4)
      const dFountain = Math.hypot(x - 4, z - -8);
      if (dFountain < 4) continue;

      // Exclude painter 1 lawn mat area (center ~ [-3.2, 4.2], r ~ 2.4)
      const dPainter1 = Math.hypot(x - -3.2, z - 4.2);
      if (dPainter1 < 2.4) continue;

      // Exclude painter 2 stool area (center ~ [1.2, 6.4], r ~ 1.8)
      const dPainter2 = Math.hypot(x - 1.2, z - 6.4);
      if (dPainter2 < 1.8) continue;

      const y = getTerrainHeight(x, z);

      dummy.position.set(x, y, z);
      dummy.rotation.y = rng() * Math.PI * 2;
      dummy.rotation.x = (rng() - 0.5) * 0.1;
      dummy.rotation.z = (rng() - 0.5) * 0.1;
      const scale = 0.75 + rng() * 0.45;
      dummy.scale.set(scale, scale * (0.8 + rng() * 0.4), scale);
      dummy.updateMatrix();

      matrices.push(dummy.matrix.clone());
      rands.push(rng());
      seededCount++;
    }

    return { grassMatrices: matrices, randoms: rands };
  }, [instanceCount]);

  // Apply matrices to instanced mesh
  useEffect(() => {
    if (!grassMeshRef.current) return;
    for (let i = 0; i < grassMatrices.length; i++) {
      grassMeshRef.current.setMatrixAt(i, grassMatrices[i]);
    }
    grassMeshRef.current.instanceMatrix.needsUpdate = true;

    const randAttr = new THREE.InstancedBufferAttribute(new Float32Array(randoms), 1);
    bladeGeo.setAttribute('aRandom', randAttr);
  }, [grassMatrices, randoms, bladeGeo]);

  // Scatter flowers deterministically
  const flowerGeo = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.065, 4, 4);
    geo.translate(0, 0.22, 0);
    return geo;
  }, []);

  const flowerMatrices = useMemo(() => {
    const rng = createPRNG(98765);
    const matrices: THREE.Matrix4[] = [];
    const dummy = new THREE.Object3D();
    for (let i = 0; i < flowerCount; i++) {
      const x = (rng() - 0.5) * 55;
      const z = (rng() - 0.5) * 55;
      if (getMinDistanceToPoints(x, z, runwaySamplePoints) < 2.2) continue;
      if (getMinDistanceToPoints(x, z, mainPathSamplePoints) < 1.5) continue;
      if (getMinDistanceToPoints(x, z, secondaryPathSamplePoints) < 1.1) continue;
      if (Math.hypot(x - 8, z - 4) < 5.5) continue;
      if (Math.hypot(x - -3.2, z - 4.2) < 2.4) continue;

      const y = getTerrainHeight(x, z);
      dummy.position.set(x, y, z);
      dummy.rotation.y = rng() * Math.PI * 2;
      const s = 0.7 + rng() * 0.5;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      matrices.push(dummy.matrix.clone());
    }
    return matrices;
  }, [flowerCount]);


  useEffect(() => {
    if (!flowersMeshRef.current) return;
    const colors = [
      new THREE.Color('#FFDF00'), // Buttercup Yellow
      new THREE.Color('#FFFFFF'), // Daisy White
      new THREE.Color('#FF6B6B'), // Wild Poppy Pink/Red
      new THREE.Color('#9C27B0'), // Lavender Purple
    ];
    for (let i = 0; i < flowerMatrices.length; i++) {
      flowersMeshRef.current.setMatrixAt(i, flowerMatrices[i]);
      flowersMeshRef.current.setColorAt(i, colors[i % colors.length]);
    }
    flowersMeshRef.current.instanceMatrix.needsUpdate = true;
    if (flowersMeshRef.current.instanceColor) {
      flowersMeshRef.current.instanceColor.needsUpdate = true;
    }
  }, [flowerMatrices]);

  useFrame((_, delta) => {
    if (shaderMatRef.current) {
      shaderMatRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <group>
      <instancedMesh
        ref={grassMeshRef}
        args={[bladeGeo, undefined, grassMatrices.length]}
        receiveShadow
      >
        <shaderMaterial
          ref={shaderMatRef}
          args={[GrassShader]}
          side={THREE.DoubleSide}
        />
      </instancedMesh>

      <instancedMesh
        ref={flowersMeshRef}
        args={[flowerGeo, undefined, flowerMatrices.length]}
        castShadow
      >
        <meshStandardMaterial roughness={0.5} />
      </instancedMesh>
    </group>
  );
};
