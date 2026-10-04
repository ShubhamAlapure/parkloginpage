import React, { useMemo } from 'react';
import * as THREE from 'three';
import { getTerrainHeight } from '../pathData';
import { useAppStore } from '@/app/store';

export const ParkProps: React.FC = () => {
  const timeOfDay = useAppStore((s) => s.timeOfDay);
  const isNightOrDusk = timeOfDay === 'night' || timeOfDay === 'sunset' || timeOfDay === 'golden';

  // 1. Benches alongside pathways
  const benches = useMemo(() => [
    { pos: [-4, 3.8] as [number, number], rot: 0.3 },
    { pos: [2, 1.8] as [number, number], rot: -0.2 },
    { pos: [12, -1] as [number, number], rot: 1.4 },
    { pos: [16, -14] as [number, number], rot: 2.8 },
    { pos: [-12, -8] as [number, number], rot: -1.2 },
  ], []);

  // 2. Lamp posts along main pathway
  const lampPosts = useMemo(() => [
    { pos: [-18, 11] as [number, number] },
    { pos: [-10, 5] as [number, number] },
    { pos: [0, 1] as [number, number] },
    { pos: [10, -1] as [number, number] },
    { pos: [20, -12] as [number, number] },
    { pos: [10, -19] as [number, number] },
    { pos: [-2, -18] as [number, number] },
    { pos: [-18, -2] as [number, number] },
  ], []);

  // 3. Flower bushes and boulders
  const bushes = useMemo(() => [
    { pos: [5, 6] as [number, number], scale: 1.1, color: '#447C38' },
    { pos: [11, 2] as [number, number], scale: 0.9, color: '#3B6B30' },
    { pos: [-3, -4] as [number, number], scale: 1.3, color: '#4D8C40' },
    { pos: [15, -10] as [number, number], scale: 1.2, color: '#447C38' },
    { pos: [-16, -14] as [number, number], scale: 1.0, color: '#3B6B30' },
    { pos: [1, -12] as [number, number], scale: 1.4, color: '#4D8C40' },
  ], []);

  const rocks = useMemo(() => [
    { pos: [13, 6] as [number, number], scale: 1.2, rot: 0.4 },
    { pos: [4, 7] as [number, number], scale: 0.8, rot: 1.2 },
    { pos: [-15, 12] as [number, number], scale: 1.4, rot: 2.1 },
    { pos: [21, -6] as [number, number], scale: 1.1, rot: 0.8 },
    { pos: [-7, -15] as [number, number], scale: 0.9, rot: 3.0 },
  ], []);

  return (
    <group>
      {/* 1. Benches */}
      {benches.map((b, i) => {
        const y = getTerrainHeight(b.pos[0], b.pos[1]);
        return (
          <group key={`bench-${i}`} position={[b.pos[0], y, b.pos[1]]} rotation={[0, b.rot, 0]} scale={0.9}>
            {/* Wooden Seat Slats */}
            {[-0.12, 0, 0.12].map((zOffset, k) => (
              <mesh key={`seat-${k}`} position={[0, 0.45, zOffset]} castShadow receiveShadow>
                <boxGeometry args={[1.6, 0.04, 0.09]} />
                <meshStandardMaterial color="#8B5A2B" roughness={0.7} />
              </mesh>
            ))}
            {/* Wooden Backrest Slats */}
            {[0.65, 0.78].map((yOffset, m) => (
              <mesh key={`back-${m}`} position={[0, yOffset, -0.18]} castShadow receiveShadow>
                <boxGeometry args={[1.6, 0.09, 0.04]} />
                <meshStandardMaterial color="#8B5A2B" roughness={0.7} />
              </mesh>
            ))}
            {/* Metal Frame Legs */}
            {[-0.7, 0.7].map((xOffset, n) => (
              <group key={`leg-${n}`} position={[xOffset, 0.25, 0]}>
                <mesh castShadow>
                  <boxGeometry args={[0.06, 0.5, 0.4]} />
                  <meshStandardMaterial color="#2B3A2E" roughness={0.5} metalness={0.8} />
                </mesh>
                <mesh position={[0, 0.35, -0.18]} castShadow>
                  <boxGeometry args={[0.06, 0.45, 0.06]} />
                  <meshStandardMaterial color="#2B3A2E" roughness={0.5} metalness={0.8} />
                </mesh>
              </group>
            ))}
          </group>
        );
      })}

      {/* 2. Lamp Posts */}
      {lampPosts.map((l, i) => {
        const y = getTerrainHeight(l.pos[0], l.pos[1]);
        return (
          <group key={`lamp-${i}`} position={[l.pos[0], y, l.pos[1]]} scale={0.85}>
            {/* Cast Iron Pole */}
            <mesh position={[0, 1.8, 0]} castShadow>
              <cylinderGeometry args={[0.05, 0.1, 3.6, 8]} />
              <meshStandardMaterial color="#1E2A22" roughness={0.4} metalness={0.9} />
            </mesh>
            {/* Pedestal Base */}
            <mesh position={[0, 0.2, 0]} castShadow>
              <cylinderGeometry args={[0.18, 0.28, 0.4, 8]} />
              <meshStandardMaterial color="#1E2A22" roughness={0.4} metalness={0.9} />
            </mesh>
            {/* Lantern Housing */}
            <mesh position={[0, 3.7, 0]} castShadow>
              <coneGeometry args={[0.3, 0.25, 6]} />
              <meshStandardMaterial color="#1E2A22" roughness={0.4} metalness={0.9} />
            </mesh>
            {/* Glass Bulb / Glow */}
            <mesh position={[0, 3.5, 0]}>
              <sphereGeometry args={[0.16, 8, 8]} />
              <meshStandardMaterial
                color="#FFF1C2"
                emissive={isNightOrDusk ? '#FFA834' : '#FFF0D0'}
                emissiveIntensity={isNightOrDusk ? 2.5 : 0.4}
                roughness={0.1}
              />
            </mesh>
            {/* Warm light emitting onto ground */}
            {isNightOrDusk && (
              <pointLight
                position={[0, 3.4, 0]}
                color="#FFAA44"
                intensity={timeOfDay === 'night' ? 4 : 1.5}
                distance={12}
                decay={2}
              />
            )}
          </group>
        );
      })}

      {/* 3. Picnic Spot (Blanket, Basket, Food) */}
      <group position={[-5, getTerrainHeight(-5, 6), 6]} rotation={[0, 0.4, 0]}>
        {/* Checkered Picnic Blanket */}
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[2.4, 2.4]} />
          <meshStandardMaterial color="#D9534F" roughness={0.8} />
        </mesh>
        {/* Woven Picnic Basket */}
        <group position={[-0.6, 0.2, -0.4]} rotation={[0, 0.3, 0]} scale={0.7}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.8, 0.45, 0.55]} />
            <meshStandardMaterial color="#A06A42" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.25, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.28, 0.28, 0.55, 8, 1, false, 0, Math.PI]} />
            <meshStandardMaterial color="#8A5A36" roughness={0.9} />
          </mesh>
        </group>
        {/* Scattered Apples */}
        {[
          [0.2, 0.3],
          [0.4, 0.2],
          [0.35, 0.45],
        ].map(([ax, az], k) => (
          <mesh key={`apple-${k}`} position={[ax, 0.08, az]} castShadow scale={0.6}>
            <sphereGeometry args={[0.08, 6, 6]} />
            <meshStandardMaterial color="#CC2B2B" roughness={0.3} />
          </mesh>
        ))}
      </group>

      {/* 4. Flower Bushes */}
      {bushes.map((b, i) => {
        const y = getTerrainHeight(b.pos[0], b.pos[1]);
        return (
          <group key={`bush-${i}`} position={[b.pos[0], y, b.pos[1]]} scale={b.scale}>
            <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
              <dodecahedronGeometry args={[0.65, 1]} />
              <meshStandardMaterial color={b.color} roughness={0.8} flatShading />
            </mesh>
            <mesh position={[0.3, 0.4, 0.2]} scale={0.7} castShadow receiveShadow>
              <dodecahedronGeometry args={[0.55, 1]} />
              <meshStandardMaterial color={b.color} roughness={0.8} flatShading />
            </mesh>
          </group>
        );
      })}

      {/* 5. Rocks */}
      {rocks.map((r, i) => {
        const y = getTerrainHeight(r.pos[0], r.pos[1]);
        return (
          <mesh
            key={`rock-${i}`}
            position={[r.pos[0], y + 0.1, r.pos[1]]}
            rotation={[0, r.rot, 0]}
            scale={r.scale}
            castShadow
            receiveShadow
          >
            <dodecahedronGeometry args={[0.7, 1]} />
            <meshStandardMaterial color="#8C9184" roughness={0.85} flatShading />
          </mesh>
        );
      })}
    </group>
  );
};
