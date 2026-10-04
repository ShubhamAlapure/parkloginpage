import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '@/app/store';

export const Particles: React.FC = () => {
  const isSuccess = useAppStore((s) => s.isSuccess);
  const ambientPointsRef = useRef<THREE.Points>(null);
  const celebrationPointsRef = useRef<THREE.Points>(null);

  // 1. Ambient Floating Pollen & Drifting Blossom Petals
  const count = 300;
  const { ambientPos, ambientVel } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel: { x: number; y: number; z: number }[] = [];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = 0.5 + Math.random() * 12;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 50;

      vel.push({
        x: 0.3 + Math.random() * 0.4,
        y: -0.15 - Math.random() * 0.25,
        z: 0.2 + Math.random() * 0.3,
      });
    }
    return { ambientPos: pos, ambientVel: vel };
  }, []);

  // 2. Celebration Petal Burst (triggers on login success)
  const celebCount = 400;
  const { celebPos, celebVel, celebColors } = useMemo(() => {
    const pos = new Float32Array(celebCount * 3);
    const cols = new Float32Array(celebCount * 3);
    const vel: { x: number; y: number; z: number }[] = [];

    const palette = [
      new THREE.Color('#D9765B'),
      new THREE.Color('#F2C879'),
      new THREE.Color('#9DB59A'),
      new THREE.Color('#FFB2C3'),
      new THREE.Color('#BFE3F2'),
    ];

    for (let i = 0; i < celebCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 4;
      pos[i * 3 + 1] = 0.2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4;

      const c = palette[i % palette.length];
      cols[i * 3] = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;

      const angle = Math.random() * Math.PI * 2;
      const spd = 2.0 + Math.random() * 4.0;
      vel.push({
        x: Math.cos(angle) * spd,
        y: 4.0 + Math.random() * 5.0,
        z: Math.sin(angle) * spd,
      });
    }
    return { celebPos: pos, celebVel: vel, celebColors: cols };
  }, []);

  useFrame((_, delta) => {
    // Animate ambient drifting pollen/petals
    if (ambientPointsRef.current) {
      const posAttr = ambientPointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;

      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        arr[idx] += ambientVel[i].x * delta;
        arr[idx + 1] += ambientVel[i].y * delta;
        arr[idx + 2] += ambientVel[i].z * delta;

        // Wrap around bounds
        if (arr[idx + 1] < 0.2) {
          arr[idx + 1] = 12;
          arr[idx] = (Math.random() - 0.5) * 50;
          arr[idx + 2] = (Math.random() - 0.5) * 50;
        }
        if (arr[idx] > 25) arr[idx] = -25;
        if (arr[idx + 2] > 25) arr[idx + 2] = -25;
      }
      posAttr.needsUpdate = true;
    }

    // Animate celebration burst if active
    if (celebrationPointsRef.current && isSuccess) {
      const cPosAttr = celebrationPointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const cArr = cPosAttr.array as Float32Array;

      for (let i = 0; i < celebCount; i++) {
        const idx = i * 3;
        cArr[idx] += celebVel[i].x * delta;
        cArr[idx + 1] += celebVel[i].y * delta;
        cArr[idx + 2] += celebVel[i].z * delta;

        celebVel[i].y -= 4.5 * delta; // Gravity

        if (cArr[idx + 1] < 0.1) {
          cArr[idx + 1] = 0.1;
          celebVel[i].x *= 0.9;
          celebVel[i].z *= 0.9;
        }
      }
      cPosAttr.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Ambient Pollen / Blossom Petals */}
      <points ref={ambientPointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={ambientPos}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.16}
          color="#FFE5B4"
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Celebration Petal Burst */}
      {isSuccess && (
        <points ref={celebrationPointsRef} position={[-2, 0, 4]}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={celebCount}
              array={celebPos}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              count={celebCount}
              array={celebColors}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.28}
            vertexColors={true}
            transparent
            opacity={0.9}
          />
        </points>
      )}
    </group>
  );
};
