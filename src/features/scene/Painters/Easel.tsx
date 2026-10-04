import React from 'react';
import * as THREE from 'three';

interface EaselProps {
  texture?: THREE.CanvasTexture;
  canvasWidth?: number;
  canvasHeight?: number;
  tiltAngle?: number;
}

export const Easel: React.FC<EaselProps> = ({
  texture,
  canvasWidth = 1.1,
  canvasHeight = 0.9,
  tiltAngle = -0.14,
}) => {
  return (
    <group>
      {/* 1. Tripod A-Frame & Rear Strut */}
      {/* Rear Support Strut (Tilts backwards to floor) */}
      <mesh position={[0, 0.95, -0.36]} rotation={[-0.38, 0, 0]} castShadow>
        <boxGeometry args={[0.045, 2.15, 0.045]} />
        <meshStandardMaterial color="#6B4226" roughness={0.75} />
      </mesh>

      {/* Front Main Tilted Mast & Legs Assembly */}
      <group position={[0, 0, 0]} rotation={[tiltAngle, 0, 0]}>
        {/* Central Vertical Mast */}
        <mesh position={[0, 1.15, 0]} castShadow>
          <boxGeometry args={[0.06, 2.3, 0.045]} />
          <meshStandardMaterial color="#7A4E24" roughness={0.75} />
        </mesh>

        {/* Front Left A-Frame Leg */}
        <mesh position={[-0.32, 1.05, 0]} rotation={[0, 0, -0.18]} castShadow>
          <boxGeometry args={[0.045, 2.25, 0.045]} />
          <meshStandardMaterial color="#7A4E24" roughness={0.75} />
        </mesh>

        {/* Front Right A-Frame Leg */}
        <mesh position={[0.32, 1.05, 0]} rotation={[0, 0, 0.18]} castShadow>
          <boxGeometry args={[0.045, 2.25, 0.045]} />
          <meshStandardMaterial color="#7A4E24" roughness={0.75} />
        </mesh>

        {/* Horizontal Lower Cross Brace */}
        <mesh position={[0, 0.35, 0]} castShadow>
          <boxGeometry args={[0.78, 0.04, 0.04]} />
          <meshStandardMaterial color="#6B4226" roughness={0.8} />
        </mesh>

        {/* Adjustable Shelf Support (Extends forward to cradle the canvas) */}
        <group position={[0, 0.82, 0.05]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[canvasWidth + 0.18, 0.06, 0.12]} />
            <meshStandardMaterial color="#5C381E" roughness={0.75} />
          </mesh>
          {/* Front lip of shelf to prevent canvas from slipping */}
          <mesh position={[0, 0.035, 0.05]} castShadow>
            <boxGeometry args={[canvasWidth + 0.18, 0.03, 0.02]} />
            <meshStandardMaterial color="#5C381E" roughness={0.75} />
          </mesh>
        </group>

        {/* 2. Canvas Board (Resting on shelf, in front of all legs) */}
        <group position={[0, 0.85 + canvasHeight / 2, 0.06]}>
          {/* Canvas Stretcher Frame (Beveled wood border) */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[canvasWidth, canvasHeight, 0.035]} />
            <meshStandardMaterial color="#EAE0D0" roughness={0.9} />
          </mesh>

          {/* Masterpiece Canvas Painting Face */}
          <mesh position={[0, 0, 0.019]}>
            <planeGeometry args={[canvasWidth - 0.03, canvasHeight - 0.03]} />
            {texture ? (
              <meshStandardMaterial map={texture} roughness={0.75} />
            ) : (
              <meshStandardMaterial color="#F7F1E6" roughness={0.85} />
            )}
          </mesh>
        </group>

        {/* Top Clamp Holding Canvas Upper Edge */}
        <mesh position={[0, 0.88 + canvasHeight, 0.06]} castShadow>
          <boxGeometry args={[0.22, 0.05, 0.1]} />
          <meshStandardMaterial color="#5C381E" roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
};
