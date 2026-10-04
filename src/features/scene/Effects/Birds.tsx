import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getTerrainHeight } from '../pathData';

export const Birds: React.FC = () => {
  const flyingGroupRef = useRef<THREE.Group>(null);
  const perchedGroupRef = useRef<THREE.Group>(null);

  // 1. Visible Mid-Altitude Swallows & Doves Swooping Across Park
  const flyingBirds = useMemo(() => [
    { offset: [0, 0, 0], speed: 1.0, scale: 0.72, phase: 0 },
    { offset: [3.2, -0.8, 2.4], speed: 1.02, scale: 0.68, phase: 0.8 },
    { offset: [-2.8, 0.6, 3.2], speed: 0.98, scale: 0.74, phase: 1.6 },
    { offset: [5.0, 0.4, 4.5], speed: 0.96, scale: 0.65, phase: 2.4 },
    { offset: [-4.2, -0.5, 5.0], speed: 1.04, scale: 0.7, phase: 3.2 },
  ], []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // 1. Large Graceful Thermal Orbit High in the Sky (16m - 24m altitude)
    if (flyingGroupRef.current) {
      const flightAngle = t * 0.18;
      const radiusX = 24;
      const radiusZ = 22;
      
      const cx = Math.cos(flightAngle) * radiusX;
      const cz = Math.sin(flightAngle) * radiusZ - 8.0;
      // High thermal soaring above the whole park
      const cy = 18.5 + Math.sin(t * 0.4) * 2.5;

      flyingGroupRef.current.position.set(cx, cy, cz);
      
      // Flight bank & heading
      const heading = -flightAngle + Math.PI / 2;
      flyingGroupRef.current.rotation.y = heading;
      flyingGroupRef.current.rotation.z = -0.24; // Inward bank into thermal turn
      flyingGroupRef.current.rotation.x = Math.cos(t * 0.4) * 0.06;

      // Wing Flapping Burst & Gliding Cycles
      flyingGroupRef.current.children.forEach((bird, idx) => {
        const wingL = bird.children[0];
        const wingR = bird.children[1];
        const tail = bird.children[3];

        // 2.5s flap burst followed by 3.5s locked-wing graceful glide
        const cycle = (t * 2.2 + idx * 0.7) % 6.0;
        const isFlapping = cycle < 2.5;
        const flap = isFlapping ? Math.sin(t * 14 + idx) * 0.6 : 0.04;

        if (wingL) {
          wingL.rotation.z = 0.12 + flap;
          wingL.rotation.y = -Math.abs(flap) * 0.15;
        }
        if (wingR) {
          wingR.rotation.z = -0.12 - flap;
          wingR.rotation.y = Math.abs(flap) * 0.15;
        }
        if (tail) {
          tail.rotation.y = Math.sin(t * 1.8 + idx) * 0.15;
        }
      });
    }

    // 2. Perched Birds (Twitching heads & breathing)
    if (perchedGroupRef.current) {
      perchedGroupRef.current.children.forEach((pBird, pIdx) => {
        const head = pBird.children[1];
        const tail = pBird.children[3];
        // Quick bird-like head twitches
        const twitchTime = Math.floor(t * 1.5 + pIdx * 2);
        if (head) {
          head.rotation.y = Math.sin(twitchTime * 3) * 0.5;
          head.rotation.x = 0.1 + Math.sin(t * 3) * 0.05;
        }
        if (tail) {
          tail.rotation.x = 0.2 + Math.sin(t * 4) * 0.08;
        }
      });
    }
  });

  return (
    <group>
      {/* 1. FLYING MID-ALTITUDE FLOCK */}
      <group ref={flyingGroupRef}>
        {flyingBirds.map((b, i) => (
          <group key={i} position={b.offset as [number, number, number]} scale={b.scale}>
            {/* Left Feathered Wing */}
            <group position={[-0.12, 0.04, 0.08]}>
              {/* Inner Wing */}
              <mesh position={[-0.32, 0, 0]} rotation={[0, 0, 0.1]} castShadow>
                <boxGeometry args={[0.55, 0.025, 0.28]} />
                <meshStandardMaterial color="#2B3A2E" roughness={0.6} />
              </mesh>
              {/* Outer Primary Feathers */}
              <mesh position={[-0.68, 0.06, -0.04]} rotation={[0, -0.2, 0.2]} castShadow>
                <boxGeometry args={[0.42, 0.02, 0.22]} />
                <meshStandardMaterial color="#1E2922" roughness={0.6} />
              </mesh>
            </group>

            {/* Right Feathered Wing */}
            <group position={[0.12, 0.04, 0.08]}>
              <mesh position={[0.32, 0, 0]} rotation={[0, 0, -0.1]} castShadow>
                <boxGeometry args={[0.55, 0.025, 0.28]} />
                <meshStandardMaterial color="#2B3A2E" roughness={0.6} />
              </mesh>
              <mesh position={[0.68, 0.06, -0.04]} rotation={[0, 0.2, -0.2]} castShadow>
                <boxGeometry args={[0.42, 0.02, 0.22]} />
                <meshStandardMaterial color="#1E2922" roughness={0.6} />
              </mesh>
            </group>

            {/* Aerodynamic Contoured Body */}
            <mesh position={[0, 0, 0]} castShadow>
              <sphereGeometry args={[0.16, 12, 12]} />
              <meshStandardMaterial color="#334155" roughness={0.5} />
            </mesh>
            {/* White/Grey Breast Underbelly */}
            <mesh position={[0, -0.04, 0.06]}>
              <sphereGeometry args={[0.14, 10, 10]} />
              <meshStandardMaterial color="#F1F5F9" roughness={0.6} />
            </mesh>

            {/* Head & Golden Beak */}
            <group position={[0, 0.08, 0.18]}>
              <mesh castShadow>
                <sphereGeometry args={[0.09, 10, 10]} />
                <meshStandardMaterial color="#1E293B" roughness={0.5} />
              </mesh>
              {/* Sharp Beak */}
              <mesh position={[0, -0.01, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
                <coneGeometry args={[0.028, 0.09, 6]} />
                <meshStandardMaterial color="#FBBF24" roughness={0.2} />
              </mesh>
            </group>

            {/* Fanned Tail Rudder */}
            <group position={[0, 0.02, -0.22]}>
              <mesh rotation={[-0.15, 0, 0]} castShadow>
                <boxGeometry args={[0.22, 0.015, 0.32]} />
                <meshStandardMaterial color="#1E293B" roughness={0.6} />
              </mesh>
            </group>
          </group>
        ))}
      </group>

      {/* 2. PERCHED BIRDS IN VISIBLE PARK LANDMARKS */}
      <group ref={perchedGroupRef}>
        {/* Dove A: Perched on Gazebo Top Finial ([-8, y+5.8, -10]) */}
        <group
          position={[-8, getTerrainHeight(-8, -10) + 5.8, -10]}
          scale={0.55}
          rotation={[0, 0.8, 0]}
        >
          {/* Folded Wings & Body */}
          <mesh position={[0, 0.12, 0]} castShadow>
            <sphereGeometry args={[0.18, 10, 10]} />
            <meshStandardMaterial color="#F8FAFC" roughness={0.4} />
          </mesh>
          {/* Head */}
          <group position={[0, 0.24, 0.14]}>
            <mesh castShadow>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshStandardMaterial color="#F8FAFC" roughness={0.4} />
            </mesh>
            <mesh position={[0, -0.01, 0.09]} rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.025, 0.08, 6]} />
              <meshStandardMaterial color="#F59E0B" />
            </mesh>
          </group>
          {/* Folded Wing Shell */}
          <mesh position={[0, 0.16, -0.08]} rotation={[-0.3, 0, 0]}>
            <boxGeometry args={[0.24, 0.12, 0.3]} />
            <meshStandardMaterial color="#E2E8F0" roughness={0.5} />
          </mesh>
          {/* Tail */}
          <group position={[0, 0.08, -0.22]}>
            <mesh rotation={[-0.35, 0, 0]}>
              <boxGeometry args={[0.18, 0.015, 0.28]} />
              <meshStandardMaterial color="#CBD5E1" />
            </mesh>
          </group>
        </group>

        {/* Dove B: Perched on Foreground Lamp Post ([0, y+3.7, 1]) */}
        <group
          position={[0, getTerrainHeight(0, 1) + 3.2, 1]}
          scale={0.52}
          rotation={[0, -1.2, 0]}
        >
          <mesh position={[0, 0.12, 0]} castShadow>
            <sphereGeometry args={[0.18, 10, 10]} />
            <meshStandardMaterial color="#F8FAFC" roughness={0.4} />
          </mesh>
          <group position={[0, 0.24, 0.14]}>
            <mesh castShadow>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshStandardMaterial color="#F8FAFC" roughness={0.4} />
            </mesh>
            <mesh position={[0, -0.01, 0.09]} rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.025, 0.08, 6]} />
              <meshStandardMaterial color="#F59E0B" />
            </mesh>
          </group>
          <mesh position={[0, 0.16, -0.08]} rotation={[-0.3, 0, 0]}>
            <boxGeometry args={[0.24, 0.12, 0.3]} />
            <meshStandardMaterial color="#E2E8F0" roughness={0.5} />
          </mesh>
          <group position={[0, 0.08, -0.22]}>
            <mesh rotation={[-0.35, 0, 0]}>
              <boxGeometry args={[0.18, 0.015, 0.28]} />
              <meshStandardMaterial color="#CBD5E1" />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
};
