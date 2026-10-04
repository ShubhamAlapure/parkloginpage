import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getTerrainHeight } from '../pathData';

export const Playground: React.FC = () => {
  const posX = -13;
  const posZ = 8;
  const posY = getTerrainHeight(posX, posZ);

  const seesawRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (seesawRef.current) {
      const t = clock.getElapsedTime();
      seesawRef.current.rotation.z = Math.sin(t * 1.8) * 0.18;
    }
  });

  return (
    <group position={[posX, posY, posZ]}>
      {/* 1. SWING SET */}
      <group position={[-2.5, 0, 0]}>
        {/* Left A-Frame */}
        <group position={[-1.6, 0, 0]}>
          <mesh position={[-0.4, 1.4, 0.45]} rotation={[0.25, 0, -0.2]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 3.0, 8]} />
            <meshStandardMaterial color="#D9534F" roughness={0.5} />
          </mesh>
          <mesh position={[-0.4, 1.4, -0.45]} rotation={[-0.25, 0, -0.2]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 3.0, 8]} />
            <meshStandardMaterial color="#D9534F" roughness={0.5} />
          </mesh>
        </group>

        {/* Right A-Frame */}
        <group position={[1.6, 0, 0]}>
          <mesh position={[0.4, 1.4, 0.45]} rotation={[0.25, 0, 0.2]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 3.0, 8]} />
            <meshStandardMaterial color="#D9534F" roughness={0.5} />
          </mesh>
          <mesh position={[0.4, 1.4, -0.45]} rotation={[-0.25, 0, 0.2]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 3.0, 8]} />
            <meshStandardMaterial color="#D9534F" roughness={0.5} />
          </mesh>
        </group>

        {/* Top Crossbar */}
        <mesh position={[0, 2.75, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 3.8, 8]} />
          <meshStandardMaterial color="#337AB7" roughness={0.5} />
        </mesh>
      </group>

      {/* 2. SLIDE */}
      <group position={[2.8, 0, -1]} rotation={[0, -0.4, 0]}>
        {/* Platform Tower */}
        <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.2, 0.1, 1.2]} />
          <meshStandardMaterial color="#F0AD4E" roughness={0.6} />
        </mesh>
        {/* 4 Platform Legs */}
        {[
          [-0.5, -0.5],
          [0.5, -0.5],
          [-0.5, 0.5],
          [0.5, 0.5],
        ].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.6, z]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 1.2, 6]} />
            <meshStandardMaterial color="#5CB85C" roughness={0.6} />
          </mesh>
        ))}

        {/* Ladder */}
        <group position={[0, 0.6, 0.6]} rotation={[0.2, 0, 0]}>
          {[-0.3, 0.3].map((x, i) => (
            <mesh key={i} position={[x, 0, 0]} castShadow>
              <cylinderGeometry args={[0.03, 0.03, 1.4, 6]} />
              <meshStandardMaterial color="#337AB7" roughness={0.6} />
            </mesh>
          ))}
          {[-0.4, -0.15, 0.1, 0.35].map((y, j) => (
            <mesh key={j} position={[0, y, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.025, 0.025, 0.6, 6]} />
              <meshStandardMaterial color="#337AB7" roughness={0.6} />
            </mesh>
          ))}
        </group>

        {/* Slide Chute */}
        <group position={[0, 0.6, -1.2]} rotation={[-0.5, 0, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.65, 0.08, 2.5]} />
            <meshStandardMaterial color="#D9534F" roughness={0.3} metalness={0.2} />
          </mesh>
          {/* Side Rails */}
          {[-0.35, 0.35].map((x, k) => (
            <mesh key={k} position={[x, 0.15, 0]} castShadow>
              <boxGeometry args={[0.06, 0.22, 2.5]} />
              <meshStandardMaterial color="#C9302C" roughness={0.4} />
            </mesh>
          ))}
        </group>
      </group>

      {/* 3. SEESAW */}
      <group position={[0.5, 0, 2.5]} rotation={[0, 0.3, 0]}>
        {/* Base Pivot Post */}
        <mesh position={[0, 0.35, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.15, 0.7, 8]} />
          <meshStandardMaterial color="#337AB7" roughness={0.6} />
        </mesh>
        {/* Animated Seesaw Plank */}
        <group ref={seesawRef} position={[0, 0.65, 0]}>
          <mesh castShadow>
            <boxGeometry args={[3.2, 0.08, 0.35]} />
            <meshStandardMaterial color="#F0AD4E" roughness={0.5} />
          </mesh>
          {/* Handles */}
          {[-1.3, 1.3].map((x, i) => (
            <group key={i} position={[x, 0.18, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.02, 0.02, 0.28, 6]} />
                <meshStandardMaterial color="#333333" />
              </mesh>
              <mesh position={[0, 0.14, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.02, 0.02, 0.25, 6]} />
                <meshStandardMaterial color="#D9534F" />
              </mesh>
            </group>
          ))}
        </group>
      </group>

      {/* 4. SANDBOX */}
      <group position={[-2.8, 0.1, -2.8]}>
        {/* Wooden Border */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.5, 0.2, 2.5]} />
          <meshStandardMaterial color="#A06A42" roughness={0.8} />
        </mesh>
        {/* Sand Fill */}
        <mesh position={[0, 0.05, 0]} receiveShadow>
          <boxGeometry args={[2.2, 0.15, 2.2]} />
          <meshStandardMaterial color="#E8D8A0" roughness={0.9} />
        </mesh>
        {/* Small sand castle mound */}
        <mesh position={[0.4, 0.2, 0.3]} castShadow>
          <cylinderGeometry args={[0.2, 0.35, 0.3, 8]} />
          <meshStandardMaterial color="#DFC888" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
};
