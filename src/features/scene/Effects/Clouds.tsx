import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const Clouds: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);

  const cloudsData = useMemo(() => {
    return [
      { pos: [-25, 24, -20] as [number, number, number], scale: 3.2, speed: 0.4 },
      { pos: [10, 28, -30] as [number, number, number], scale: 4.0, speed: 0.35 },
      { pos: [-5, 22, 10] as [number, number, number], scale: 2.8, speed: 0.5 },
      { pos: [28, 26, 5] as [number, number, number], scale: 3.5, speed: 0.38 },
      { pos: [-35, 30, 25] as [number, number, number], scale: 4.2, speed: 0.32 },
    ];
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((cloud, idx) => {
      const spd = cloudsData[idx].speed;
      cloud.position.x += spd * delta * 1.5;
      if (cloud.position.x > 55) {
        cloud.position.x = -55;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {cloudsData.map((c, i) => (
        <group key={i} position={c.pos} scale={c.scale}>
          {/* Stylized puffy cloud clusters */}
          <mesh castShadow={false}>
            <sphereGeometry args={[1.0, 7, 7]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.9} transparent opacity={0.92} flatShading />
          </mesh>
          <mesh position={[0.8, -0.2, 0]} scale={0.75}>
            <sphereGeometry args={[1.0, 7, 7]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.9} transparent opacity={0.92} flatShading />
          </mesh>
          <mesh position={[-0.8, -0.25, 0]} scale={0.7}>
            <sphereGeometry args={[1.0, 7, 7]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.9} transparent opacity={0.92} flatShading />
          </mesh>
          <mesh position={[0.2, 0.4, -0.1]} scale={0.65}>
            <sphereGeometry args={[1.0, 7, 7]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.9} transparent opacity={0.92} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
};
