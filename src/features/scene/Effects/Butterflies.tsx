import React, { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { getTerrainHeight } from '../pathData';

interface ButterflyData {
  id: string;
  type: 'monarch' | 'morpho' | 'emerald' | 'sulphur';
  home: [number, number];
  radius: number;
  speed: number;
  heightOffset: number;
  scale: number;
  phase: number;
  perchTimer: number;
}

export const Butterflies: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);

  // Load realistic butterfly wings texture
  const wingTexture = useLoader(THREE.TextureLoader, '/textures/butterfly_wings.jpg');

  // Strategic placements around foreground, pond, flowerbeds, and painters
  const butterflies = useMemo<ButterflyData[]>(() => [
    // Near Hero Painter & Easel (Foreground Left)
    { id: 'b1', type: 'monarch', home: [-2.8, 3.8], radius: 1.8, speed: 1.9, heightOffset: 0.9, scale: 0.38, phase: 0, perchTimer: 0 },
    // Near Pond Lily Pads (Foreground Center)
    { id: 'b2', type: 'morpho', home: [7.2, 3.5], radius: 2.2, speed: 2.2, heightOffset: 0.6, scale: 0.42, phase: 1.8, perchTimer: 0 },
    // Near Flowerbed beside path
    { id: 'b3', type: 'emerald', home: [-0.5, 4.5], radius: 2.0, speed: 1.7, heightOffset: 0.85, scale: 0.36, phase: 3.2, perchTimer: 0 },
    // Circling Blossom Tree
    { id: 'b4', type: 'morpho', home: [2.0, 7.0], radius: 2.6, speed: 2.0, heightOffset: 1.4, scale: 0.44, phase: 4.5, perchTimer: 0 },
    // Near Gazebo Garden
    { id: 'b5', type: 'monarch', home: [-6.5, -7.5], radius: 2.4, speed: 1.8, heightOffset: 0.95, scale: 0.4, phase: 2.1, perchTimer: 0 },
    // Near Fountain Splash
    { id: 'b6', type: 'sulphur', home: [4.2, -6.5], radius: 2.1, speed: 2.4, heightOffset: 1.1, scale: 0.35, phase: 0.8, perchTimer: 0 },
    // Foreground Center Meadow
    { id: 'b7', type: 'monarch', home: [0.8, 2.2], radius: 1.9, speed: 2.1, heightOffset: 0.75, scale: 0.38, phase: 5.1, perchTimer: 0 },
  ], []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    groupRef.current.children.forEach((bObj, idx) => {
      const b = butterflies[idx];
      const time = t * b.speed * 0.6 + b.phase;

      // Erratic natural butterfly flight trajectory (Lissajous curves)
      const x = b.home[0] + Math.sin(time) * b.radius + Math.sin(time * 2.3) * 0.4;
      const z = b.home[1] + Math.cos(time * 0.8) * b.radius + Math.cos(time * 1.7) * 0.35;
      
      // Vertical undulation with fluttering air pockets
      const groundY = getTerrainHeight(x, z);
      const flutterBob = Math.sin(t * 9 + b.phase) * 0.14 + Math.sin(t * 3.5) * 0.08;
      const y = groundY + b.heightOffset + flutterBob;

      bObj.position.set(x, y, z);

      // Orientation follows velocity vector with organic banked roll
      const nextX = b.home[0] + Math.sin(time + 0.05) * b.radius;
      const nextZ = b.home[1] + Math.cos((time + 0.05) * 0.8) * b.radius;
      const heading = Math.atan2(nextX - x, nextZ - z);
      bObj.rotation.y = heading;
      bObj.rotation.z = Math.sin(t * 4 + b.phase) * 0.22; // Banked flight roll
      bObj.rotation.x = -Math.cos(t * 3 + b.phase) * 0.12; // Pitch

      // Authentic Butterfly Wing Flapping (Rapid clap + glide cycle)
      const flapCycle = Math.sin(t * 22 + b.phase);
      const flapAngle = flapCycle > 0.2 ? flapCycle * 1.1 : flapCycle * 0.4; // rapid up-clap, soft down-stroke

      const leftWingGroup = bObj.children[0];
      const rightWingGroup = bObj.children[1];

      if (leftWingGroup) leftWingGroup.rotation.y = 0.2 + flapAngle;
      if (rightWingGroup) rightWingGroup.rotation.y = -0.2 - flapAngle;
    });
  });

  return (
    <group ref={groupRef}>
      {butterflies.map((b, i) => {
        // Color tints & wing texture UV offsets for Monarch (left) vs Morpho (right)
        const isMonarch = b.type === 'monarch' || b.type === 'sulphur';
        const wingColor =
          b.type === 'morpho'
            ? '#38BDF8'
            : b.type === 'emerald'
            ? '#34D399'
            : b.type === 'sulphur'
            ? '#FDE047'
            : '#FB923C';

        return (
          <group key={b.id} scale={b.scale}>
            {/* 1. LEFT WING GROUP (Forewing + Hindwing) */}
            <group position={[-0.03, 0, 0]}>
              {/* Forewing */}
              <mesh position={[-0.42, 0.15, 0.08]} rotation={[-0.1, 0, 0.25]} castShadow>
                <planeGeometry args={[0.75, 0.9]} />
                <meshStandardMaterial
                  map={wingTexture}
                  color={wingColor}
                  roughness={0.4}
                  side={THREE.DoubleSide}
                  transparent
                  opacity={0.96}
                />
              </mesh>
              {/* Hindwing */}
              <mesh position={[-0.34, -0.22, -0.06]} rotation={[0.1, 0, -0.15]} castShadow>
                <planeGeometry args={[0.55, 0.65]} />
                <meshStandardMaterial
                  map={wingTexture}
                  color={wingColor}
                  roughness={0.4}
                  side={THREE.DoubleSide}
                  transparent
                  opacity={0.94}
                />
              </mesh>
            </group>

            {/* 2. RIGHT WING GROUP (Forewing + Hindwing) */}
            <group position={[0.03, 0, 0]}>
              {/* Forewing */}
              <mesh position={[0.42, 0.15, 0.08]} rotation={[-0.1, 0, -0.25]} castShadow>
                <planeGeometry args={[0.75, 0.9]} />
                <meshStandardMaterial
                  map={wingTexture}
                  color={wingColor}
                  roughness={0.4}
                  side={THREE.DoubleSide}
                  transparent
                  opacity={0.96}
                />
              </mesh>
              {/* Hindwing */}
              <mesh position={[0.34, -0.22, -0.06]} rotation={[0.1, 0, 0.15]} castShadow>
                <planeGeometry args={[0.55, 0.65]} />
                <meshStandardMaterial
                  map={wingTexture}
                  color={wingColor}
                  roughness={0.4}
                  side={THREE.DoubleSide}
                  transparent
                  opacity={0.94}
                />
              </mesh>
            </group>

            {/* 3. SLENDER ANATOMICAL BUTTERFLY BODY */}
            {/* Thorax & Abdomen */}
            <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.035, 0.02, 0.52, 8]} />
              <meshStandardMaterial color="#18181B" roughness={0.6} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 0.02, 0.28]} castShadow>
              <sphereGeometry args={[0.045, 8, 8]} />
              <meshStandardMaterial color="#18181B" roughness={0.4} />
            </mesh>
            {/* Delicate Antennae with Club Tips */}
            {[-0.025, 0.025].map((ax, ai) => (
              <group key={`ant-${ai}`} position={[ax, 0.04, 0.3]} rotation={[-0.4, ai === 0 ? -0.3 : 0.3, 0]}>
                <mesh position={[0, 0.08, 0]}>
                  <cylinderGeometry args={[0.003, 0.003, 0.16, 4]} />
                  <meshStandardMaterial color="#111827" />
                </mesh>
                <mesh position={[0, 0.16, 0]}>
                  <sphereGeometry args={[0.009, 4, 4]} />
                  <meshStandardMaterial color="#111827" />
                </mesh>
              </group>
            ))}
          </group>
        );
      })}
    </group>
  );
};
