import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getTerrainHeight } from '../pathData';

export const Fountain: React.FC = () => {
  const posX = 4;
  const posZ = -8;
  const posY = getTerrainHeight(posX, posZ);

  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 120;

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel: { x: number; y: number; z: number }[] = [];

    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = 0;
      pos[i * 3 + 1] = 1.9;
      pos[i * 3 + 2] = 0;

      const angle = Math.random() * Math.PI * 2;
      const speed = 0.4 + Math.random() * 0.8;
      vel.push({
        x: Math.cos(angle) * speed * 0.4,
        y: 1.5 + Math.random() * 1.2,
        z: Math.sin(angle) * speed * 0.4,
      });
    }
    return { positions: pos, velocities: vel };
  }, []);

  useFrame((_, delta) => {
    if (!particlesRef.current) return;
    const posAttr = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      posArray[idx] += velocities[i].x * delta;
      posArray[idx + 1] += velocities[i].y * delta;
      posArray[idx + 2] += velocities[i].z * delta;

      velocities[i].y -= 3.8 * delta; // Gravity

      // Reset when falling into lower basin
      if (posArray[idx + 1] < 0.4) {
        posArray[idx] = (Math.random() - 0.5) * 0.1;
        posArray[idx + 1] = 1.9;
        posArray[idx + 2] = (Math.random() - 0.5) * 0.1;
        
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 0.9;
        velocities[i].x = Math.cos(angle) * speed * 0.45;
        velocities[i].y = 1.6 + Math.random() * 1.3;
        velocities[i].z = Math.sin(angle) * speed * 0.45;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <group position={[posX, posY, posZ]}>
      {/* Outer Basin */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.5, 2.7, 0.5, 24]} />
        <meshStandardMaterial color="#CBC5B6" roughness={0.7} flatShading />
      </mesh>

      {/* Outer Water Surface */}
      <mesh position={[0, 0.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.3, 24]} />
        <meshStandardMaterial color="#4FA89B" roughness={0.1} metalness={0.2} transparent opacity={0.85} />
      </mesh>

      {/* Center Pedestal Base */}
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.6, 0.8, 0.8, 16]} />
        <meshStandardMaterial color="#BDB5A4" roughness={0.7} />
      </mesh>

      {/* Middle Tier Basin */}
      <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.3, 0.9, 0.3, 16]} />
        <meshStandardMaterial color="#CBC5B6" roughness={0.7} />
      </mesh>

      {/* Middle Water Surface */}
      <mesh position={[0, 1.38, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.2, 16]} />
        <meshStandardMaterial color="#4FA89B" roughness={0.1} transparent opacity={0.9} />
      </mesh>

      {/* Center Spout Column */}
      <mesh position={[0, 1.65, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, 0.6, 12]} />
        <meshStandardMaterial color="#BDB5A4" roughness={0.7} />
      </mesh>

      {/* Water Spray Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.12}
          color="#E0F7FA"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
};
