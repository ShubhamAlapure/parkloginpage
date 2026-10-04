import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface DogProps {
  furColor?: string;
  collarColor?: string;
  speedMultiplier?: number;
}

export const Dog: React.FC<DogProps> = ({
  furColor = '#C88A4A',
  collarColor = '#DC2626',
  speedMultiplier = 1.0,
}) => {
  const tailGroupRef = useRef<THREE.Group>(null);
  const earLRef = useRef<THREE.Group>(null);
  const earRRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const legFLRef = useRef<THREE.Group>(null);
  const legFRRef = useRef<THREE.Group>(null);
  const legBLRef = useRef<THREE.Group>(null);
  const legBRRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 7.5 * speedMultiplier;

    // 1. Natural Sinusoidal Wagging Tail
    if (tailGroupRef.current) {
      tailGroupRef.current.rotation.y = Math.sin(t * 2.4) * 0.55;
      tailGroupRef.current.rotation.z = Math.cos(t * 2.4) * 0.15;
    }

    // 2. Realistic 4-Leg Diagonal Trotting Gait (RF + BL forward, LF + BR backward)
    const legAmp = 0.55;
    const kneeAmp = 0.45;

    // Front Left Leg
    if (legFLRef.current) {
      const fl = Math.sin(t);
      legFLRef.current.rotation.x = fl * legAmp;
      const lower = legFLRef.current.children[1];
      if (lower) lower.rotation.x = Math.max(0, -fl) * kneeAmp;
    }

    // Front Right Leg
    if (legFRRef.current) {
      const fr = -Math.sin(t);
      legFRRef.current.rotation.x = fr * legAmp;
      const lower = legFRRef.current.children[1];
      if (lower) lower.rotation.x = Math.max(0, -fr) * kneeAmp;
    }

    // Back Left Leg
    if (legBLRef.current) {
      const bl = -Math.sin(t);
      legBLRef.current.rotation.x = bl * legAmp;
      const lower = legBLRef.current.children[1];
      if (lower) lower.rotation.x = Math.max(0, bl) * kneeAmp;
    }

    // Back Right Leg
    if (legBRRef.current) {
      const br = Math.sin(t);
      legBRRef.current.rotation.x = br * legAmp;
      const lower = legBRRef.current.children[1];
      if (lower) lower.rotation.x = Math.max(0, -br) * kneeAmp;
    }

    // 3. Body Bob & Trot Spine Motion
    if (bodyRef.current) {
      bodyRef.current.position.y = Math.abs(Math.sin(t * 2)) * 0.045;
      bodyRef.current.rotation.z = Math.sin(t) * 0.04;
    }

    // 4. Inertial Floppy Ear Jiggle
    const earJiggle = Math.sin(t * 2) * 0.2;
    if (earLRef.current) earLRef.current.rotation.z = 0.3 + earJiggle;
    if (earRRef.current) earRRef.current.rotation.z = -0.3 - earJiggle;

    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.4) * 0.15;
    }
  });

  return (
    <group scale={0.46}>
      <group ref={bodyRef}>
        {/* Chest & Ribcage (Muscular Golden Retriever build) */}
        <mesh position={[0, 0.46, 0.1]} castShadow>
          <boxGeometry args={[0.28, 0.32, 0.36]} />
          <meshStandardMaterial color={furColor} roughness={0.7} />
        </mesh>
        {/* Flank / Waist Taper */}
        <mesh position={[0, 0.44, -0.18]} castShadow>
          <boxGeometry args={[0.24, 0.28, 0.32]} />
          <meshStandardMaterial color={furColor} roughness={0.7} />
        </mesh>
        {/* Haunches */}
        <mesh position={[0, 0.47, -0.32]} castShadow>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshStandardMaterial color={furColor} roughness={0.7} />
        </mesh>

        {/* Neck with muscular slope */}
        <mesh position={[0, 0.62, 0.26]} rotation={[0.45, 0, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.13, 0.26, 10]} />
          <meshStandardMaterial color={furColor} roughness={0.7} />
        </mesh>

        {/* Collar & Golden Tag */}
        <group position={[0, 0.58, 0.24]} rotation={[0.45, 0, 0]}>
          <mesh>
            <torusGeometry args={[0.115, 0.02, 8, 16]} />
            <meshStandardMaterial color={collarColor} roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.12, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.005, 8]} />
            <meshStandardMaterial color="#FBBF24" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>

        {/* Head & Facial Anatomy */}
        <group ref={headRef} position={[0, 0.74, 0.38]}>
          {/* Skull */}
          <mesh castShadow>
            <boxGeometry args={[0.22, 0.2, 0.24]} />
            <meshStandardMaterial color={furColor} roughness={0.7} />
          </mesh>
          {/* Snout with bridge */}
          <mesh position={[0, -0.04, 0.16]} castShadow>
            <boxGeometry args={[0.13, 0.12, 0.18]} />
            <meshStandardMaterial color={furColor} roughness={0.7} />
          </mesh>
          {/* Wet Black Leather Nose */}
          <mesh position={[0, -0.01, 0.26]}>
            <sphereGeometry args={[0.038, 8, 8]} />
            <meshStandardMaterial color="#171717" roughness={0.15} metalness={0.2} />
          </mesh>
          {/* Expressive Eyes */}
          {[-0.065, 0.065].map((ex, i) => (
            <mesh key={`eye-${i}`} position={[ex, 0.04, 0.115]}>
              <sphereGeometry args={[0.018, 6, 6]} />
              <meshStandardMaterial color="#1A0D00" roughness={0.1} />
            </mesh>
          ))}

          {/* Floppy Golden Retriever Ears */}
          <group ref={earLRef} position={[-0.12, 0.04, -0.02]}>
            <mesh position={[0, -0.1, 0]} rotation={[0.2, 0, 0.1]} castShadow>
              <boxGeometry args={[0.05, 0.2, 0.1]} />
              <meshStandardMaterial color="#B07238" roughness={0.8} />
            </mesh>
          </group>
          <group ref={earRRef} position={[0.12, 0.04, -0.02]}>
            <mesh position={[0, -0.1, 0]} rotation={[0.2, 0, -0.1]} castShadow>
              <boxGeometry args={[0.05, 0.2, 0.1]} />
              <meshStandardMaterial color="#B07238" roughness={0.8} />
            </mesh>
          </group>
        </group>

        {/* Feathered Golden Retriever Tail */}
        <group ref={tailGroupRef} position={[0, 0.54, -0.34]} rotation={[-0.5, 0, 0]}>
          <mesh position={[0, 0.14, -0.08]} castShadow>
            <cylinderGeometry args={[0.025, 0.05, 0.32, 8]} />
            <meshStandardMaterial color={furColor} roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.22, -0.09]}>
            <sphereGeometry args={[0.045, 6, 6]} />
            <meshStandardMaterial color="#E8AF6A" roughness={0.8} />
          </mesh>
        </group>
      </group>

      {/* Articulated Legs with Paws */}
      {/* Front Left Leg */}
      <group ref={legFLRef} position={[-0.11, 0.34, 0.18]}>
        <mesh position={[0, -0.1, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.038, 0.2, 8]} />
          <meshStandardMaterial color={furColor} roughness={0.7} />
        </mesh>
        <group position={[0, -0.2, 0]}>
          <mesh position={[0, -0.08, 0.02]} castShadow>
            <cylinderGeometry args={[0.035, 0.03, 0.16, 8]} />
            <meshStandardMaterial color={furColor} roughness={0.7} />
          </mesh>
          {/* Paw */}
          <mesh position={[0, -0.15, 0.04]} castShadow>
            <boxGeometry args={[0.065, 0.04, 0.09]} />
            <meshStandardMaterial color="#B07238" roughness={0.8} />
          </mesh>
        </group>
      </group>

      {/* Front Right Leg */}
      <group ref={legFRRef} position={[0.11, 0.34, 0.18]}>
        <mesh position={[0, -0.1, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.038, 0.2, 8]} />
          <meshStandardMaterial color={furColor} roughness={0.7} />
        </mesh>
        <group position={[0, -0.2, 0]}>
          <mesh position={[0, -0.08, 0.02]} castShadow>
            <cylinderGeometry args={[0.035, 0.03, 0.16, 8]} />
            <meshStandardMaterial color={furColor} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.15, 0.04]} castShadow>
            <boxGeometry args={[0.065, 0.04, 0.09]} />
            <meshStandardMaterial color="#B07238" roughness={0.8} />
          </mesh>
        </group>
      </group>

      {/* Back Left Leg */}
      <group ref={legBLRef} position={[-0.11, 0.34, -0.24]}>
        <mesh position={[0, -0.1, -0.02]} rotation={[-0.2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.055, 0.042, 0.2, 8]} />
          <meshStandardMaterial color={furColor} roughness={0.7} />
        </mesh>
        <group position={[0, -0.2, 0]}>
          <mesh position={[0, -0.08, 0.03]} rotation={[0.2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.038, 0.032, 0.18, 8]} />
            <meshStandardMaterial color={furColor} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.16, 0.05]} castShadow>
            <boxGeometry args={[0.065, 0.04, 0.09]} />
            <meshStandardMaterial color="#B07238" roughness={0.8} />
          </mesh>
        </group>
      </group>

      {/* Back Right Leg */}
      <group ref={legBRRef} position={[0.11, 0.34, -0.24]}>
        <mesh position={[0, -0.1, -0.02]} rotation={[-0.2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.055, 0.042, 0.2, 8]} />
          <meshStandardMaterial color={furColor} roughness={0.7} />
        </mesh>
        <group position={[0, -0.2, 0]}>
          <mesh position={[0, -0.08, 0.03]} rotation={[0.2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.038, 0.032, 0.18, 8]} />
            <meshStandardMaterial color={furColor} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.16, 0.05]} castShadow>
            <boxGeometry args={[0.065, 0.04, 0.09]} />
            <meshStandardMaterial color="#B07238" roughness={0.8} />
          </mesh>
        </group>
      </group>
    </group>
  );
};
