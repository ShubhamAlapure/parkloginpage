import React, { useMemo } from 'react';
import * as THREE from 'three';

export interface PaletteProps {
  activeColor?: string;
  onColorChange?: (color: string) => void;
}

export const PALETTE_COLORS = [
  '#E5484D', // Crimson Red
  '#F59E0B', // Ochre Yellow
  '#2563EB', // Cobalt Blue
  '#16A34A', // Emerald Green
  '#D9765B', // Burnt Sienna / Terracotta
  '#9333EA', // Royal Purple
  '#FFFFFF', // Titanium White
];

export const Palette: React.FC<PaletteProps> = ({ activeColor = '#D9765B' }) => {
  // Paint blobs positions around the curved edge of palette
  const blobs = useMemo(() => {
    return PALETTE_COLORS.map((color, idx) => {
      const angle = -1.8 + (idx / (PALETTE_COLORS.length - 1)) * 2.6;
      const rx = 0.2;
      const rz = 0.16;
      return {
        color,
        x: Math.cos(angle) * rx,
        z: Math.sin(angle) * rz,
      };
    });
  }, []);

  return (
    <group scale={0.75}>
      {/* Solid Polished Birch Palette Board */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.26, 0.26, 0.014, 24]} />
        <meshStandardMaterial color="#D4A373" roughness={0.65} metalness={0.05} />
      </mesh>

      {/* Thumb grip hole */}
      <mesh position={[-0.14, 0.001, -0.06]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.016, 16]} />
        <meshStandardMaterial color="#3E2723" roughness={0.8} />
      </mesh>

      {/* Paint Color Blobs */}
      {blobs.map((b, idx) => {
        const isSelected = b.color === activeColor;
        return (
          <group key={idx} position={[b.x, 0.012, b.z]}>
            <mesh castShadow scale={isSelected ? 1.3 : 1.0}>
              <sphereGeometry args={[0.032, 10, 10, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
              <meshStandardMaterial color={b.color} roughness={0.25} metalness={0.08} />
            </mesh>
            {/* Active Highlight ring */}
            {isSelected && (
              <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.036, 0.046, 16]} />
                <meshBasicMaterial color="#FFFFFF" transparent opacity={0.85} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
};
