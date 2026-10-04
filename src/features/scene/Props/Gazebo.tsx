import React from 'react';
import * as THREE from 'three';
import { getTerrainHeight } from '../pathData';

export const Gazebo: React.FC = () => {
  const posX = -8;
  const posZ = -10;
  const posY = getTerrainHeight(posX, posZ);

  return (
    <group position={[posX, posY, posZ]} scale={1.2}>
      {/* Octagonal Stone Base */}
      <mesh position={[0, 0.15, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[2.6, 2.8, 0.3, 8]} />
        <meshStandardMaterial color="#D6CEB8" roughness={0.8} flatShading />
      </mesh>

      {/* Wooden Deck Floor */}
      <mesh position={[0, 0.32, 0]} receiveShadow>
        <cylinderGeometry args={[2.5, 2.5, 0.05, 8]} />
        <meshStandardMaterial color="#8A5A36" roughness={0.7} />
      </mesh>

      {/* 8 Columns */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const angle = (i / 8) * Math.PI * 2;
        const cx = Math.cos(angle) * 2.2;
        const cz = Math.sin(angle) * 2.2;
        return (
          <group key={i} position={[cx, 1.45, cz]}>
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[0.08, 0.08, 2.2, 6]} />
              <meshStandardMaterial color="#FAFAFA" roughness={0.5} />
            </mesh>
            {/* Base & capital collars */}
            <mesh position={[0, -1.05, 0]}>
              <boxGeometry args={[0.24, 0.1, 0.24]} />
              <meshStandardMaterial color="#E8E8E8" roughness={0.6} />
            </mesh>
            <mesh position={[0, 1.05, 0]}>
              <boxGeometry args={[0.24, 0.1, 0.24]} />
              <meshStandardMaterial color="#E8E8E8" roughness={0.6} />
            </mesh>
          </group>
        );
      })}

      {/* Perimeter Railing segments */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        // Skip index 7 for the gazebo entrance
        const angle1 = (i / 8) * Math.PI * 2;
        const angle2 = ((i + 1) / 8) * Math.PI * 2;
        const mx = (Math.cos(angle1) + Math.cos(angle2)) * 1.1;
        const mz = (Math.sin(angle1) + Math.sin(angle2)) * 1.1;
        const rotY = Math.atan2(Math.sin(angle1) - Math.sin(angle2), Math.cos(angle1) - Math.cos(angle2));

        return (
          <group key={i} position={[mx, 0.7, mz]} rotation={[0, -rotY, 0]}>
            <mesh castShadow>
              <boxGeometry args={[1.5, 0.06, 0.06]} />
              <meshStandardMaterial color="#FAFAFA" roughness={0.6} />
            </mesh>
            {[-0.5, -0.25, 0, 0.25, 0.5].map((x, j) => (
              <mesh key={j} position={[x, -0.18, 0]} castShadow>
                <cylinderGeometry args={[0.02, 0.02, 0.36, 4]} />
                <meshStandardMaterial color="#FAFAFA" roughness={0.6} />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* Roof Entablature & Roof Cone */}
      <mesh position={[0, 2.65, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.5, 2.3, 0.2, 8]} />
        <meshStandardMaterial color="#EBEBEB" roughness={0.6} />
      </mesh>

      {/* Conical Shingled Roof */}
      <mesh position={[0, 3.7, 0]} castShadow receiveShadow>
        <coneGeometry args={[2.9, 1.9, 8]} />
        <meshStandardMaterial color="#3A5F43" roughness={0.7} flatShading />
      </mesh>

      {/* Roof Top Finial */}
      <mesh position={[0, 4.8, 0]} castShadow>
        <sphereGeometry args={[0.16, 8, 8]} />
        <meshStandardMaterial color="#D9A74A" roughness={0.3} metalness={0.8} />
      </mesh>
    </group>
  );
};
