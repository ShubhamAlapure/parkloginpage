import React, { useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { getTerrainHeight, mainParkCurve, secondaryParkCurve, perimeterRunwayCurve } from './pathData';

export const Terrain: React.FC = () => {
  // Load realistic textures
  const [grassTex, cobbleTex, runwayTex] = useLoader(THREE.TextureLoader, [
    '/textures/grass_ground.jpg',
    '/textures/cobblestone.jpg',
    '/textures/runway_tiles.jpg',
  ]);

  useMemo(() => {
    grassTex.wrapS = THREE.RepeatWrapping;
    grassTex.wrapT = THREE.RepeatWrapping;
    grassTex.repeat.set(16, 16);

    cobbleTex.wrapS = THREE.RepeatWrapping;
    cobbleTex.wrapT = THREE.RepeatWrapping;
    cobbleTex.repeat.set(24, 1.5);

    runwayTex.wrapS = THREE.RepeatWrapping;
    runwayTex.wrapT = THREE.RepeatWrapping;
    runwayTex.repeat.set(36, 1);
  }, [grassTex, cobbleTex, runwayTex]);

  // 1. Generate undulating terrain ground mesh
  const terrainGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(100, 100, 100, 100);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = getTerrainHeight(x, z);
      pos.setY(i, y);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // 2. Generate smooth path ribbons for Cobblestone and Perimeter Tiled Runway
  const { pathGeo, secondaryGeo, runwayGeo, curbInnerGeo, curbOuterGeo } = useMemo(() => {
    const createPathRibbon = (curve: THREE.CatmullRomCurve3, width: number, divisions = 200, uvRepeat = 14) => {
      const points = curve.getPoints(divisions);
      const positions: number[] = [];
      const normals: number[] = [];
      const uvs: number[] = [];
      const indices: number[] = [];

      for (let i = 0; i < points.length; i++) {
        const pt = points[i];
        const nextPt = points[(i + 1) % points.length];
        const tangent = new THREE.Vector3().subVectors(nextPt, pt).normalize();
        const normal = new THREE.Vector3(0, 1, 0);
        const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

        const p1 = new THREE.Vector3().copy(pt).addScaledVector(binormal, width / 2);
        const p2 = new THREE.Vector3().copy(pt).addScaledVector(binormal, -width / 2);

        p1.y = getTerrainHeight(p1.x, p1.z) + 0.05;
        p2.y = getTerrainHeight(p2.x, p2.z) + 0.05;

        positions.push(p1.x, p1.y, p1.z);
        positions.push(p2.x, p2.y, p2.z);

        normals.push(0, 1, 0, 0, 1, 0);
        const progress = i / divisions;
        uvs.push(0, progress * uvRepeat);
        uvs.push(1, progress * uvRepeat);

        if (i < points.length - 1) {
          const v0 = i * 2;
          const v1 = i * 2 + 1;
          const v2 = (i + 1) * 2;
          const v3 = (i + 1) * 2 + 1;

          indices.push(v0, v1, v2);
          indices.push(v1, v3, v2);
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      return geo;
    };

    // Concrete curb border lines along the runway edges
    const createCurbLine = (curve: THREE.CatmullRomCurve3, offsetSide: number, width = 0.18, divisions = 200) => {
      const points = curve.getPoints(divisions);
      const positions: number[] = [];
      const indices: number[] = [];

      for (let i = 0; i < points.length; i++) {
        const pt = points[i];
        const nextPt = points[(i + 1) % points.length];
        const tangent = new THREE.Vector3().subVectors(nextPt, pt).normalize();
        const normal = new THREE.Vector3(0, 1, 0);
        const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

        const baseCenter = new THREE.Vector3().copy(pt).addScaledVector(binormal, offsetSide);
        const p1 = new THREE.Vector3().copy(baseCenter).addScaledVector(binormal, width / 2);
        const p2 = new THREE.Vector3().copy(baseCenter).addScaledVector(binormal, -width / 2);

        p1.y = getTerrainHeight(p1.x, p1.z) + 0.07;
        p2.y = getTerrainHeight(p2.x, p2.z) + 0.07;

        positions.push(p1.x, p1.y, p1.z);
        positions.push(p2.x, p2.y, p2.z);

        if (i < points.length - 1) {
          const v0 = i * 2;
          const v1 = i * 2 + 1;
          const v2 = (i + 1) * 2;
          const v3 = (i + 1) * 2 + 1;
          indices.push(v0, v1, v2);
          indices.push(v1, v3, v2);
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      return geo;
    };

    return {
      pathGeo: createPathRibbon(mainParkCurve, 2.6, 180, 14),
      secondaryGeo: createPathRibbon(secondaryParkCurve, 1.7, 90, 8),
      runwayGeo: createPathRibbon(perimeterRunwayCurve, 3.8, 220, 36),
      curbInnerGeo: createCurbLine(perimeterRunwayCurve, -1.9, 0.16, 220),
      curbOuterGeo: createCurbLine(perimeterRunwayCurve, 1.9, 0.16, 220),
    };
  }, []);

  return (
    <group>
      {/* 1. Natural Grass Lawn Meadow */}
      <mesh geometry={terrainGeo} receiveShadow>
        <meshStandardMaterial
          map={grassTex}
          roughness={0.88}
          metalness={0.02}
          color="#A4C784"
        />
      </mesh>

      {/* 2. Perimeter Athletic Tiled Runway (Wide Terracotta Tiles with White Lane Stripes) */}
      <mesh geometry={runwayGeo} receiveShadow>
        <meshStandardMaterial
          map={runwayTex}
          roughness={0.65}
          metalness={0.12}
          bumpMap={runwayTex}
          bumpScale={0.03}
        />
      </mesh>

      {/* Runway Curbs (Clean Cast Concrete Borders) */}
      <mesh geometry={curbInnerGeo} receiveShadow>
        <meshStandardMaterial color="#E2E8F0" roughness={0.7} />
      </mesh>
      <mesh geometry={curbOuterGeo} receiveShadow>
        <meshStandardMaterial color="#E2E8F0" roughness={0.7} />
      </mesh>

      {/* 3. Interior Cobblestone Strolling Paths */}
      <mesh geometry={pathGeo} receiveShadow>
        <meshStandardMaterial
          map={cobbleTex}
          roughness={0.78}
          metalness={0.08}
          bumpMap={cobbleTex}
          bumpScale={0.04}
        />
      </mesh>

      <mesh geometry={secondaryGeo} receiveShadow>
        <meshStandardMaterial
          map={cobbleTex}
          roughness={0.82}
          metalness={0.06}
          bumpMap={cobbleTex}
          bumpScale={0.03}
        />
      </mesh>
    </group>
  );
};
