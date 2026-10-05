import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useAppStore } from '@/app/store';

interface BuildingSpec {
  pos: [number, number, number];
  size: [number, number, number];
  rotY: number;
  roofType: 'flat' | 'spire' | 'stepped' | 'angled' | 'twin';
  color: string;
  windowDensity: number;
}

export const CitySkyline: React.FC = () => {
  const timeOfDay = useAppStore((s) => s.timeOfDay);
  const isNight = timeOfDay === 'night';
  const isSunset = timeOfDay === 'sunset';
  const isGolden = timeOfDay === 'golden';

  // Generate 360-degree city skyline clusters surrounding the park
  const buildings = useMemo(() => {
    const list: BuildingSpec[] = [];

    // Color palettes for building facades
    const facadeColors = [
      '#64748B', // Slate glass
      '#475569', // Steel grey
      '#334155', // Charcoal modern
      '#94A3B8', // Light limestone
      '#6B7280', // Concrete
      '#4B5563', // Deep slate
      '#374151', // Dark obsidian glass
    ];

    const roofTypes: ('flat' | 'spire' | 'stepped' | 'angled' | 'twin')[] = [
      'flat',
      'spire',
      'stepped',
      'angled',
      'twin',
    ];

    // 1. Inner Ring High-Rises (radius 46m - 62m)
    const innerCount = 36;
    for (let i = 0; i < innerCount; i++) {
      const angle = (i / innerCount) * Math.PI * 2 + ((i * 0.7) % 0.15);
      const radius = 48 + ((i * 3.7) % 12);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const w = 4.0 + ((i * 1.3) % 4.5);
      const d = 4.0 + ((i * 1.7) % 4.5);
      const h = 16.0 + ((i * 7.1) % 24.0); // 16m to 40m height

      list.push({
        pos: [x, h / 2 - 2.0, z],
        size: [w, h, d],
        rotY: angle + Math.PI / 2 + ((i % 3) - 1) * 0.2,
        roofType: roofTypes[i % roofTypes.length],
        color: facadeColors[i % facadeColors.length],
        windowDensity: 4 + (i % 4),
      });
    }

    // 2. Outer Ring Mega-Towers & Downtown Skylines (radius 68m - 95m)
    const outerCount = 42;
    for (let i = 0; i < outerCount; i++) {
      const angle = (i / outerCount) * Math.PI * 2 + ((i * 1.1) % 0.2);
      const radius = 70 + ((i * 4.3) % 22);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const w = 5.5 + ((i * 1.9) % 6.0);
      const d = 5.5 + ((i * 2.1) % 6.0);
      const h = 28.0 + ((i * 11.3) % 36.0); // 28m to 64m towering skyscrapers

      list.push({
        pos: [x, h / 2 - 2.0, z],
        size: [w, h, d],
        rotY: angle + Math.PI / 2 + ((i % 4) - 1.5) * 0.15,
        roofType: roofTypes[(i + 2) % roofTypes.length],
        color: facadeColors[(i + 3) % facadeColors.length],
        windowDensity: 6 + (i % 3),
      });
    }

    return list;
  }, []);

  // Shared Geometries & Materials
  const boxGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const spireGeo = useMemo(() => {
    const geo = new THREE.ConeGeometry(0.5, 6, 8);
    geo.translate(0, 3, 0);
    return geo;
  }, []);

  const antennaGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.04, 0.08, 8, 6);
    geo.translate(0, 4, 0);
    return geo;
  }, []);

  // Responsive time-of-day lighting materials
  const buildingMaterial = useMemo(() => {
    const emissiveColor = isNight
      ? new THREE.Color('#FFD166').multiplyScalar(0.4)
      : isSunset
      ? new THREE.Color('#FFA07A').multiplyScalar(0.15)
      : new THREE.Color('#000000');

    return new THREE.MeshStandardMaterial({
      color: isNight ? '#1E293B' : isSunset ? '#64748B' : isGolden ? '#78716C' : '#64748B',
      roughness: 0.35,
      metalness: 0.75,
      emissive: emissiveColor,
    });
  }, [isNight, isSunset, isGolden]);

  const glassMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: isNight ? '#0F172A' : '#38BDF8',
      roughness: 0.1,
      metalness: 0.9,
      emissive: isNight ? new THREE.Color('#FEF08A').multiplyScalar(0.35) : new THREE.Color(0),
    });
  }, [isNight]);

  const windowMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: isNight ? '#FEF08A' : isSunset ? '#FFEDD5' : '#E0F2FE',
      transparent: true,
      opacity: isNight ? 0.75 : 0.25,
    });
  }, [isNight, isSunset]);

  const beaconMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: '#EF4444',
    });
  }, []);

  return (
    <group name="citySkyline">
      {buildings.map((b, idx) => {
        const [w, h, d] = b.size;
        const [x, y, z] = b.pos;

        return (
          <group key={idx} position={[x, y, z]} rotation={[0, b.rotY, 0]}>
            {/* Main Skyscraper Tower Body */}
            <mesh
              scale={[w, h, d]}
              geometry={boxGeo}
              material={buildingMaterial}
              castShadow={false}
              receiveShadow
            />

            {/* Vertical Glass Ribbon Insets */}
            <mesh
              position={[0, 0, d / 2 + 0.05]}
              scale={[w * 0.65, h * 0.88, 0.05]}
              geometry={boxGeo}
              material={glassMaterial}
            />
            <mesh
              position={[0, 0, -d / 2 - 0.05]}
              scale={[w * 0.65, h * 0.88, 0.05]}
              geometry={boxGeo}
              material={glassMaterial}
            />
            <mesh
              position={[w / 2 + 0.05, 0, 0]}
              scale={[0.05, h * 0.88, d * 0.65]}
              geometry={boxGeo}
              material={glassMaterial}
            />
            <mesh
              position={[-w / 2 - 0.05, 0, 0]}
              scale={[0.05, h * 0.88, d * 0.65]}
              geometry={boxGeo}
              material={glassMaterial}
            />

            {/* Glowing Window Strips (Luminous Grid Bands) */}
            {isNight && (
              <group position={[0, 0, 0]}>
                {[-0.3, -0.1, 0.1, 0.3].map((offY, wIdx) => (
                  <mesh
                    key={wIdx}
                    position={[0, h * offY, d / 2 + 0.08]}
                    scale={[w * 0.8, h * 0.08, 0.02]}
                    geometry={boxGeo}
                    material={windowMaterial}
                  />
                ))}
              </group>
            )}

            {/* Architectural Rooftop Caps */}
            {b.roofType === 'spire' && (
              <group position={[0, h / 2, 0]}>
                <mesh
                  scale={[w * 0.5, 1, d * 0.5]}
                  geometry={spireGeo}
                  material={glassMaterial}
                />
                {/* Red Flashing Aviation Beacon on Apex */}
                <mesh position={[0, 6.2, 0]} scale={0.25} geometry={boxGeo} material={beaconMaterial} />
              </group>
            )}

            {b.roofType === 'stepped' && (
              <group position={[0, h / 2, 0]}>
                <mesh
                  position={[0, 1.5, 0]}
                  scale={[w * 0.7, 3.0, d * 0.7]}
                  geometry={boxGeo}
                  material={buildingMaterial}
                />
                <mesh
                  position={[0, 3.8, 0]}
                  scale={[w * 0.45, 2.2, d * 0.45]}
                  geometry={boxGeo}
                  material={glassMaterial}
                />
                <mesh
                  position={[0, 5.2, 0]}
                  geometry={antennaGeo}
                  material={buildingMaterial}
                />
                <mesh position={[0, 9.2, 0]} scale={0.22} geometry={boxGeo} material={beaconMaterial} />
              </group>
            )}

            {b.roofType === 'angled' && (
              <group position={[0, h / 2 + 1.2, 0]} rotation={[0.4, 0, 0]}>
                <mesh
                  scale={[w * 0.85, 2.4, d * 0.85]}
                  geometry={boxGeo}
                  material={glassMaterial}
                />
              </group>
            )}

            {b.roofType === 'twin' && (
              <group position={[0, h / 2 + 1.8, 0]}>
                <mesh position={[-w * 0.25, 0, 0]} scale={[w * 0.35, 3.6, d * 0.7]} geometry={boxGeo} material={glassMaterial} />
                <mesh position={[w * 0.25, 0, 0]} scale={[w * 0.35, 3.6, d * 0.7]} geometry={boxGeo} material={glassMaterial} />
                {/* Sky Bridge */}
                <mesh position={[0, 0.4, 0]} scale={[w * 0.3, 0.6, d * 0.4]} geometry={boxGeo} material={buildingMaterial} />
              </group>
            )}

            {b.roofType === 'flat' && (
              <group position={[0, h / 2, 0]}>
                {/* Helipad / Mechanical Penthouse */}
                <mesh position={[0, 0.6, 0]} scale={[w * 0.5, 1.2, d * 0.5]} geometry={boxGeo} material={buildingMaterial} />
                <mesh position={[0, 1.2, 0]} geometry={antennaGeo} material={buildingMaterial} />
                <mesh position={[0, 5.2, 0]} scale={0.2} geometry={boxGeo} material={beaconMaterial} />
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
};
