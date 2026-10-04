import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getTerrainHeight } from '../pathData';

export const Trees: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);

  // Generate strategic tree placements (perimeter forest + scattered park specimen trees)
  const treesData = useMemo(() => {
    const list: {
      pos: [number, number, number];
      scale: number;
      type: 'deciduous' | 'pine' | 'blossom';
      lean: number;
      foliageColor: string;
    }[] = [];

    // Perimeter trees (dense backdrop)
    const perimeterCount = 28;
    for (let i = 0; i < perimeterCount; i++) {
      const angle = (i / perimeterCount) * Math.PI * 2 + (Math.random() * 0.2);
      const radius = 32 + Math.random() * 8;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = getTerrainHeight(x, z);

      const type = i % 3 === 0 ? 'pine' : i % 3 === 1 ? 'deciduous' : 'blossom';
      const foliageColor =
        type === 'pine'
          ? '#234E35'
          : type === 'blossom'
          ? '#F7A8B8'
          : i % 2 === 0
          ? '#4E8A3C'
          : '#689C49';

      list.push({
        pos: [x, y, z],
        scale: 1.2 + Math.random() * 0.6,
        type,
        lean: (Math.random() - 0.5) * 0.08,
        foliageColor,
      });
    }

    // Interior park trees (carefully positioned not to obstruct key views)
    const interiorTrees: { pos: [number, number]; type: 'deciduous' | 'pine' | 'blossom'; color: string }[] = [
      { pos: [-18, 14], type: 'deciduous', color: '#4E8A3C' },
      { pos: [-16, 2], type: 'blossom', color: '#F7A8B8' },
      { pos: [-2, 16], type: 'deciduous', color: '#689C49' },
      { pos: [14, 16], type: 'blossom', color: '#F498AA' },
      { pos: [22, 6], type: 'pine', color: '#234E35' },
      { pos: [20, -12], type: 'deciduous', color: '#569442' },
      { pos: [10, -22], type: 'pine', color: '#2D5B3F' },
      { pos: [-14, -20], type: 'deciduous', color: '#4E8A3C' },
      { pos: [-20, -10], type: 'pine', color: '#234E35' },
      { pos: [2, 7], type: 'blossom', color: '#FFB2C3' }, // near pond/painters
      { pos: [16, -4], type: 'deciduous', color: '#689C49' },
      { pos: [-8, 20], type: 'pine', color: '#234E35' },
    ];

    interiorTrees.forEach((t) => {
      const y = getTerrainHeight(t.pos[0], t.pos[1]);
      list.push({
        pos: [t.pos[0], y, t.pos[1]],
        scale: 0.95 + Math.random() * 0.4,
        type: t.type,
        lean: (Math.random() - 0.5) * 0.06,
        foliageColor: t.color,
      });
    });

    return list;
  }, []);

  // Shared Geometries & Materials
  const trunkGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.2, 0.4, 3, 7);
    geo.translate(0, 1.5, 0);
    return geo;
  }, []);

  const pineTrunkGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.18, 0.35, 4.5, 6);
    geo.translate(0, 2.25, 0);
    return geo;
  }, []);

  const deciduousFoliageGeo = useMemo(() => new THREE.IcosahedronGeometry(1.6, 1), []);
  const pineTierGeo = useMemo(() => new THREE.ConeGeometry(1.8, 2.2, 6), []);
  const blossomFoliageGeo = useMemo(() => new THREE.DodecahedronGeometry(1.5, 1), []);

  const trunkMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#543D2B', roughness: 0.9 }),
    []
  );

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    // Wind sway on foliage children
    groupRef.current.children.forEach((tree, idx) => {
      const foliage = tree.getObjectByName('foliageGroup');
      if (foliage) {
        const sway = Math.sin(t * 1.8 + idx) * 0.035;
        foliage.rotation.z = sway;
        foliage.rotation.x = sway * 0.7;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {treesData.map((tree, idx) => (
        <group
          key={idx}
          position={tree.pos}
          scale={tree.scale}
          rotation={[tree.lean, idx * 0.7, 0]}
        >
          {tree.type === 'deciduous' && (
            <>
              {/* Trunk */}
              <mesh geometry={trunkGeo} material={trunkMaterial} castShadow receiveShadow />
              {/* Foliage Cluster */}
              <group name="foliageGroup" position={[0, 3, 0]}>
                <mesh geometry={deciduousFoliageGeo} castShadow receiveShadow>
                  <meshStandardMaterial color={tree.foliageColor} roughness={0.8} flatShading />
                </mesh>
                <mesh position={[0.7, 0.4, 0.5]} scale={0.65} geometry={deciduousFoliageGeo} castShadow receiveShadow>
                  <meshStandardMaterial color={tree.foliageColor} roughness={0.8} flatShading />
                </mesh>
                <mesh position={[-0.6, 0.3, -0.4]} scale={0.7} geometry={deciduousFoliageGeo} castShadow receiveShadow>
                  <meshStandardMaterial color={tree.foliageColor} roughness={0.8} flatShading />
                </mesh>
              </group>
            </>
          )}

          {tree.type === 'pine' && (
            <>
              {/* Trunk */}
              <mesh geometry={pineTrunkGeo} material={trunkMaterial} castShadow receiveShadow />
              {/* Pine Conical Tiers */}
              <group name="foliageGroup" position={[0, 2.8, 0]}>
                <mesh position={[0, 0, 0]} scale={[1.1, 1, 1.1]} geometry={pineTierGeo} castShadow receiveShadow>
                  <meshStandardMaterial color={tree.foliageColor} roughness={0.85} flatShading />
                </mesh>
                <mesh position={[0, 1.2, 0]} scale={[0.85, 0.9, 0.85]} geometry={pineTierGeo} castShadow receiveShadow>
                  <meshStandardMaterial color={tree.foliageColor} roughness={0.85} flatShading />
                </mesh>
                <mesh position={[0, 2.2, 0]} scale={[0.55, 0.75, 0.55]} geometry={pineTierGeo} castShadow receiveShadow>
                  <meshStandardMaterial color={tree.foliageColor} roughness={0.85} flatShading />
                </mesh>
              </group>
            </>
          )}

          {tree.type === 'blossom' && (
            <>
              {/* Dark bark trunk */}
              <mesh geometry={trunkGeo} castShadow receiveShadow>
                <meshStandardMaterial color="#4A3528" roughness={0.9} />
              </mesh>
              {/* Soft pink blossom clusters */}
              <group name="foliageGroup" position={[0, 3, 0]}>
                <mesh geometry={blossomFoliageGeo} castShadow receiveShadow>
                  <meshStandardMaterial color={tree.foliageColor} roughness={0.7} flatShading />
                </mesh>
                <mesh position={[0.8, 0.3, 0.4]} scale={0.65} geometry={blossomFoliageGeo} castShadow receiveShadow>
                  <meshStandardMaterial color="#FFC4D0" roughness={0.7} flatShading />
                </mesh>
                <mesh position={[-0.7, 0.5, -0.5]} scale={0.7} geometry={blossomFoliageGeo} castShadow receiveShadow>
                  <meshStandardMaterial color="#F59BAF" roughness={0.7} flatShading />
                </mesh>
                <mesh position={[0.1, 0.9, -0.2]} scale={0.6} geometry={blossomFoliageGeo} castShadow receiveShadow>
                  <meshStandardMaterial color="#FFE0E7" roughness={0.7} flatShading />
                </mesh>
              </group>
            </>
          )}
        </group>
      ))}
    </group>
  );
};
