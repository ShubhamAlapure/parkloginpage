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

// Realistic High-Fidelity Grass Shader with Wind Waves and Sun Subsurface Scatter
const GrassShader = {
  uniforms: {
    uTime: { value: 0 },
    uWindStrength: { value: 0.45 },
    uBaseColor: { value: new THREE.Color('#2D5422') },     // Deep rich root green
    uMidColor: { value: new THREE.Color('#5E9E38') },      // Meadow spring green
    uTipColor: { value: new THREE.Color('#9CD845') },      // Sunlit lush tip green
    uHighlightColor: { value: new THREE.Color('#F2E278') },// Golden sun highlight
  },
  vertexShader: `
    uniform float uTime;
    uniform float uWindStrength;
    attribute float aRandom;
    varying vec2 vUv;
    varying float vRandom;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;

    void main() {
      vUv = uv;
      vRandom = aRandom;

      // Extract instance transform
      mat4 instanceMat = instanceMatrix;
      vec4 worldInstancePos = instanceMat * vec4(0.0, 0.0, 0.0, 1.0);
      
      // Dual harmonic traveling wind wave
      float wave1 = sin(worldInstancePos.x * 0.22 + worldInstancePos.z * 0.18 + uTime * 2.4);
      float wave2 = cos(worldInstancePos.x * 0.55 - worldInstancePos.z * 0.35 + uTime * 1.7) * 0.6;
      float gust = sin(worldInstancePos.x * 0.08 + worldInstancePos.z * 0.06 + uTime * 0.9) * 0.4;
      
      float totalWind = (wave1 + wave2 + gust) * uWindStrength;

      // Parabolic bend from root (uv.y = 0) to tip (uv.y = 1)
      float bendFactor = pow(uv.y, 1.8) * totalWind * (0.75 + aRandom * 0.5);

      vec3 transformed = position;
      transformed.x += bendFactor * 0.42;
      transformed.z += bendFactor * 0.32;
      transformed.y -= abs(bendFactor) * 0.12;

      vec4 worldPosition = instanceMat * vec4(transformed, 1.0);
      vWorldPosition = worldPosition.xyz;
      vNormal = normalize((instanceMat * vec4(normal, 0.0)).xyz);
      
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 uBaseColor;
    uniform vec3 uMidColor;
    uniform vec3 uTipColor;
    uniform vec3 uHighlightColor;
    varying vec2 vUv;
    varying float vRandom;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;

    void main() {
      // Base-to-tip multi-tier organic gradient
      vec3 col;
      if (vUv.y < 0.45) {
        col = mix(uBaseColor, uMidColor, vUv.y / 0.45);
      } else {
        vec3 tipBlend = mix(uTipColor, uHighlightColor, vRandom * 0.45);
        col = mix(uMidColor, tipBlend, (vUv.y - 0.45) / 0.55);
      }

      // Root Ambient Occlusion (soil shadow depth)
      float ao = clamp(pow(vUv.y, 0.6) * 1.35, 0.35, 1.0);
      col *= ao;

      // Sunlit specular rim lighting simulation
      vec3 lightDir = normalize(vec3(0.5, 0.8, 0.5));
      float sunGlint = pow(max(dot(vNormal, lightDir), 0.0), 4.0) * 0.25 * vUv.y;
      col += sunGlint;

      gl_FragColor = vec4(col, 1.0);
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

  const instanceCount = qualityTier === 'high' ? 42000 : qualityTier === 'medium' ? 26000 : 14000;
  const flowerCount = qualityTier === 'high' ? 900 : qualityTier === 'medium' ? 500 : 250;

  // Realistic Curved Grass Blade Geometry (2 crossed tapered blades for full 3D volume)
  const bladeGeo = useMemo(() => {
    // Single curved tapered quad blade
    const shape = new THREE.BufferGeometry();
    const positions = new Float32Array([
      // Plane 1 (Facing forward)
      -0.05, 0.0, 0.0,   // 0: base left
       0.05, 0.0, 0.0,   // 1: base right
      -0.038, 0.16, 0.02,// 2: mid left
       0.038, 0.16, 0.02,// 3: mid right
       0.0, 0.36, 0.06,  // 4: tip

      // Plane 2 (Crossed at 60 degrees)
      -0.045, 0.0, -0.02,
       0.045, 0.0, 0.02,
      -0.032, 0.15, -0.01,
       0.032, 0.15, 0.03,
       0.0, 0.32, 0.04,
    ]);

    const uvs = new Float32Array([
      // Plane 1 UVs
      0.0, 0.0,
      1.0, 0.0,
      0.0, 0.45,
      1.0, 0.45,
      0.5, 1.0,

      // Plane 2 UVs
      0.0, 0.0,
      1.0, 0.0,
      0.0, 0.45,
      1.0, 0.45,
      0.5, 1.0,
    ]);

    const indices = [
      // Plane 1
      0, 1, 2,  1, 3, 2,
      2, 3, 4,
      // Plane 2
      5, 6, 7,  6, 8, 7,
      7, 8, 9,
    ];

    shape.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    shape.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    shape.setIndex(indices);
    shape.computeVertexNormals();

    return shape;
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
      const x = (rng() - 0.5) * 66;
      const z = (rng() - 0.5) * 66;

      // Exclude Perimeter Runway (margin ~ 2.2m)
      if (getMinDistanceToPoints(x, z, runwaySamplePoints) < 2.2) continue;

      // Exclude Main Cobblestone Path (margin ~ 1.5m)
      if (getMinDistanceToPoints(x, z, mainPathSamplePoints) < 1.5) continue;

      // Exclude Secondary Cobblestone Path (margin ~ 1.1m)
      if (getMinDistanceToPoints(x, z, secondaryPathSamplePoints) < 1.1) continue;

      // Exclude pond area (center ~ [8, 4], r ~ 5.5)
      if (Math.hypot(x - 8, z - 4) < 5.5) continue;

      // Exclude gazebo area (center ~ [-8, -10], r ~ 4.5)
      if (Math.hypot(x - -8, z - -10) < 4.5) continue;

      // Exclude playground area (center ~ [-13, 8], r ~ 6.5)
      if (Math.hypot(x - -13, z - 8) < 6.5) continue;

      // Exclude fountain area (center ~ [4, -8], r ~ 4)
      if (Math.hypot(x - 4, z - -8) < 4) continue;

      // Exclude painter 1 lawn mat area (center ~ [-3.2, 4.2], r ~ 2.4)
      if (Math.hypot(x - -3.2, z - 4.2) < 2.4) continue;

      // Exclude painter 2 stool area (center ~ [1.2, 6.4], r ~ 1.8)
      if (Math.hypot(x - 1.2, z - 6.4) < 1.8) continue;

      const y = getTerrainHeight(x, z);

      dummy.position.set(x, y, z);
      dummy.rotation.y = rng() * Math.PI * 2;
      dummy.rotation.x = (rng() - 0.5) * 0.12;
      dummy.rotation.z = (rng() - 0.5) * 0.12;
      const scale = 0.85 + rng() * 0.45;
      dummy.scale.set(scale, scale * (0.85 + rng() * 0.4), scale);
      dummy.updateMatrix();

      matrices.push(dummy.matrix.clone());
      rands.push(rng());
      seededCount++;
    }

    return { grassMatrices: matrices, randoms: rands };
  }, [instanceCount]);

  useEffect(() => {
    if (!grassMeshRef.current) return;
    for (let i = 0; i < grassMatrices.length; i++) {
      grassMeshRef.current.setMatrixAt(i, grassMatrices[i]);
    }
    grassMeshRef.current.instanceMatrix.needsUpdate = true;

    const randAttr = new THREE.InstancedBufferAttribute(new Float32Array(randoms), 1);
    bladeGeo.setAttribute('aRandom', randAttr);
  }, [grassMatrices, randoms, bladeGeo]);

  // Scatter realistic flowers with petal geometry
  const flowerGeo = useMemo(() => {
    // 5-petal flower disc
    const geo = new THREE.CylinderGeometry(0.08, 0.02, 0.04, 6);
    geo.translate(0, 0.28, 0);
    return geo;
  }, []);

  const flowerMatrices = useMemo(() => {
    const rng = createPRNG(98765);
    const matrices: THREE.Matrix4[] = [];
    const dummy = new THREE.Object3D();
    for (let i = 0; i < flowerCount; i++) {
      const x = (rng() - 0.5) * 56;
      const z = (rng() - 0.5) * 56;
      if (getMinDistanceToPoints(x, z, runwaySamplePoints) < 2.2) continue;
      if (getMinDistanceToPoints(x, z, mainPathSamplePoints) < 1.5) continue;
      if (getMinDistanceToPoints(x, z, secondaryPathSamplePoints) < 1.1) continue;
      if (Math.hypot(x - 8, z - 4) < 5.5) continue;
      if (Math.hypot(x - -3.2, z - 4.2) < 2.4) continue;

      const y = getTerrainHeight(x, z);
      dummy.position.set(x, y, z);
      dummy.rotation.y = rng() * Math.PI * 2;
      dummy.rotation.x = (rng() - 0.5) * 0.2;
      dummy.rotation.z = (rng() - 0.5) * 0.2;
      const s = 0.8 + rng() * 0.5;
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
      new THREE.Color('#FF6584'), // Meadow Poppy Pink
      new THREE.Color('#A855F7'), // Lavender Violet
      new THREE.Color('#38BDF8'), // Wild Bluebell
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
        <meshStandardMaterial roughness={0.4} metalness={0.1} />
      </instancedMesh>
    </group>
  );
};
