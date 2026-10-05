import React, { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { getTerrainHeight } from '../pathData';

// Realistic Wind Shader Material for Tree Foliage
const FoliageShader = {
  uniforms: {
    uTime: { value: 0 },
    uWindStrength: { value: 0.35 },
    uTexture: { value: null },
    uColor: { value: new THREE.Color('#4E8A3C') },
    uSubsurfaceColor: { value: new THREE.Color('#94D845') },
  },
  vertexShader: `
    uniform float uTime;
    uniform float uWindStrength;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPos;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      
      // Wind sway effect proportional to height
      float heightFactor = clamp((position.y + 1.0) / 4.0, 0.0, 1.0);
      float sway = sin(worldPos.x * 0.4 + worldPos.z * 0.3 + uTime * 2.0) * uWindStrength * heightFactor;
      float swayFlutter = cos(worldPos.x * 1.2 - worldPos.z * 0.8 + uTime * 3.5) * (uWindStrength * 0.4) * heightFactor;
      
      vec3 transformed = position;
      transformed.x += (sway + swayFlutter) * 0.35;
      transformed.z += (sway * 0.8 - swayFlutter) * 0.25;
      
      vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
      gl_Position = projectionMatrix * viewMatrix * vec4(vWorldPos, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D uTexture;
    uniform vec3 uColor;
    uniform vec3 uSubsurfaceColor;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPos;

    void main() {
      vec4 texColor = texture2D(uTexture, vUv);
      
      // Calculate light direction from sun (approximate [25, 40, 25])
      vec3 lightDir = normalize(vec3(0.5, 0.8, 0.5));
      float nDotL = max(dot(vNormal, lightDir), 0.0);
      
      // Subsurface translucency simulation for leaves
      float backLight = max(dot(-vNormal, lightDir), 0.0) * 0.5;
      
      vec3 diffuse = mix(uColor * 0.65, uColor * 1.15, nDotL);
      vec3 subColor = mix(diffuse, uSubsurfaceColor, backLight);
      
      vec3 finalColor = texColor.rgb * subColor;
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
};

export const Trees: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);

  // Load realistic textures
  const [barkTex, oakTex, pineTex, sakuraTex] = useLoader(THREE.TextureLoader, [
    '/textures/tree_bark.jpg',
    '/textures/oak_leaves.jpg',
    '/textures/pine_needles.jpg',
    '/textures/sakura_leaves.jpg',
  ]);

  useMemo(() => {
    barkTex.wrapS = THREE.RepeatWrapping;
    barkTex.wrapT = THREE.RepeatWrapping;
    barkTex.repeat.set(1, 4);

    oakTex.wrapS = THREE.RepeatWrapping;
    oakTex.wrapT = THREE.RepeatWrapping;
    oakTex.repeat.set(2, 2);

    pineTex.wrapS = THREE.RepeatWrapping;
    pineTex.wrapT = THREE.RepeatWrapping;
    pineTex.repeat.set(2, 3);

    sakuraTex.wrapS = THREE.RepeatWrapping;
    sakuraTex.wrapT = THREE.RepeatWrapping;
    sakuraTex.repeat.set(2, 2);
  }, [barkTex, oakTex, pineTex, sakuraTex]);

  // Master materials
  const trunkMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: barkTex,
      roughness: 0.9,
      metalness: 0.05,
      bumpScale: 0.05,
    });
  }, [barkTex]);

  const oakMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: oakTex,
      color: new THREE.Color('#5E9E42'),
      roughness: 0.65,
      metalness: 0.05,
      flatShading: false,
    });
  }, [oakTex]);

  const pineMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: pineTex,
      color: new THREE.Color('#2C5738'),
      roughness: 0.8,
      metalness: 0.05,
      flatShading: false,
    });
  }, [pineTex]);

  const sakuraMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: sakuraTex,
      color: new THREE.Color('#FFB8C8'),
      roughness: 0.55,
      metalness: 0.05,
      flatShading: false,
    });
  }, [sakuraTex]);

  // Generate strategic tree placements (perimeter forest + interior specimen trees)
  const treesData = useMemo(() => {
    const list: {
      pos: [number, number, number];
      scale: number;
      type: 'oak' | 'pine' | 'blossom' | 'maple';
      rotation: number;
      lean: number;
    }[] = [];

    // Perimeter boundary trees (dense backdrop)
    const perimeterCount = 32;
    for (let i = 0; i < perimeterCount; i++) {
      const angle = (i / perimeterCount) * Math.PI * 2 + (Math.sin(i * 3.7) * 0.15);
      const radius = 33 + (i % 3 === 0 ? 4 : i % 3 === 1 ? 7 : 2);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = getTerrainHeight(x, z);

      const type = i % 4 === 0 ? 'pine' : i % 4 === 1 ? 'oak' : i % 4 === 2 ? 'maple' : 'blossom';

      list.push({
        pos: [x, y, z],
        scale: 1.25 + (Math.abs(Math.sin(i * 1.5)) * 0.5),
        type,
        rotation: (i * 1.37) % (Math.PI * 2),
        lean: (Math.sin(i * 2.1) * 0.06),
      });
    }

    // Interior park specimen trees (framing walkways, pond, gazebo, fountain, and painter lawn)
    const interiorTrees: { pos: [number, number]; type: 'oak' | 'pine' | 'blossom' | 'maple'; s: number }[] = [
      { pos: [-18, 14], type: 'oak', s: 1.3 },
      { pos: [-16, 2], type: 'blossom', s: 1.15 },
      { pos: [-2, 17], type: 'maple', s: 1.2 },
      { pos: [14, 16], type: 'blossom', s: 1.25 },
      { pos: [22, 6], type: 'pine', s: 1.4 },
      { pos: [20, -12], type: 'oak', s: 1.2 },
      { pos: [11, -22], type: 'pine', s: 1.35 },
      { pos: [-14, -20], type: 'maple', s: 1.2 },
      { pos: [-20, -10], type: 'pine', s: 1.3 },
      { pos: [2.5, 7.5], type: 'blossom', s: 1.1 }, // near pond & painters lawn
      { pos: [16, -4], type: 'oak', s: 1.25 },
      { pos: [-8, 20], type: 'pine', s: 1.35 },
      { pos: [-22, 12], type: 'oak', s: 1.1 },
      { pos: [8, 22], type: 'maple', s: 1.2 },
      { pos: [-10, -18], type: 'blossom', s: 1.05 },
    ];

    interiorTrees.forEach((t, idx) => {
      const y = getTerrainHeight(t.pos[0], t.pos[1]);
      list.push({
        pos: [t.pos[0], y, t.pos[1]],
        scale: t.s,
        type: t.type,
        rotation: idx * 1.1,
        lean: ((idx % 3) - 1) * 0.04,
      });
    });

    return list;
  }, []);

  // Shared Procedural Geometries for high performance & realistic volume
  const {
    oakTrunkGeo,
    pineTrunkGeo,
    oakCanopyGeo,
    subCanopyGeo,
    pineTier1Geo,
    pineTier2Geo,
    pineTier3Geo,
    pineTier4Geo,
    blossomCanopyGeo,
    rootFlareGeo,
  } = useMemo(() => {
    // 1. Organic Tapered Oak/Maple Trunk with root flare
    const oakTrunk = new THREE.CylinderGeometry(0.24, 0.48, 3.6, 12);
    oakTrunk.translate(0, 1.8, 0);

    // Root flare ring at base
    const rootFlare = new THREE.CylinderGeometry(0.48, 0.72, 0.6, 12);
    rootFlare.translate(0, 0.3, 0);

    // 2. Tall Pine Trunk
    const pineTrunk = new THREE.CylinderGeometry(0.18, 0.42, 5.2, 10);
    pineTrunk.translate(0, 2.6, 0);

    // 3. Volumetric Dense Foliage Geometries (smooth subdivided icosahedrons with natural deformation)
    const oakCanopy = new THREE.IcosahedronGeometry(2.1, 2);
    const pos = oakCanopy.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);
      const noise = 1.0 + Math.sin(vx * 3.0) * Math.cos(vz * 3.0) * 0.18;
      pos.setXYZ(i, vx * noise, vy * (noise * 0.95), vz * noise);
    }
    oakCanopy.computeVertexNormals();

    const subCanopy = new THREE.IcosahedronGeometry(1.4, 2);
    const sPos = subCanopy.attributes.position;
    for (let i = 0; i < sPos.count; i++) {
      const vx = sPos.getX(i);
      const vy = sPos.getY(i);
      const vz = sPos.getZ(i);
      const noise = 1.0 + Math.sin(vx * 4.0) * 0.15;
      sPos.setXYZ(i, vx * noise, vy * noise, vz * noise);
    }
    subCanopy.computeVertexNormals();

    // 4. Realistic Pine Needle Tiers (curved conical whorls)
    const pineTier1 = new THREE.ConeGeometry(2.3, 2.0, 10);
    pineTier1.translate(0, 1.0, 0);

    const pineTier2 = new THREE.ConeGeometry(1.85, 1.8, 10);
    pineTier2.translate(0, 0.9, 0);

    const pineTier3 = new THREE.ConeGeometry(1.35, 1.6, 10);
    pineTier3.translate(0, 0.8, 0);

    const pineTier4 = new THREE.ConeGeometry(0.85, 1.4, 8);
    pineTier4.translate(0, 0.7, 0);

    // 5. Blossom Organic Dodecahedron Canopy
    const blossomCanopy = new THREE.DodecahedronGeometry(1.8, 2);
    const bPos = blossomCanopy.attributes.position;
    for (let i = 0; i < bPos.count; i++) {
      const vx = bPos.getX(i);
      const vy = bPos.getY(i);
      const vz = bPos.getZ(i);
      const noise = 1.0 + Math.sin(vy * 3.5) * Math.sin(vx * 2.5) * 0.14;
      bPos.setXYZ(i, vx * noise, vy * noise, vz * noise);
    }
    blossomCanopy.computeVertexNormals();

    return {
      oakTrunkGeo: oakTrunk,
      pineTrunkGeo: pineTrunk,
      oakCanopyGeo: oakCanopy,
      subCanopyGeo: subCanopy,
      pineTier1Geo: pineTier1,
      pineTier2Geo: pineTier2,
      pineTier3Geo: pineTier3,
      pineTier4Geo: pineTier4,
      blossomCanopyGeo: blossomCanopy,
      rootFlareGeo: rootFlare,
    };
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    // Realistic wind sway on tree canopies
    const count = groupRef.current.children.length;
    for (let i = 0; i < count; i++) {
      const tree = groupRef.current.children[i];
      const foliage = tree.getObjectByName('foliageRoot');
      if (foliage) {
        const sway = Math.sin(t * 1.6 + i * 0.7) * 0.028;
        const roll = Math.cos(t * 1.2 + i * 0.5) * 0.02;
        foliage.rotation.z = sway;
        foliage.rotation.x = roll;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {treesData.map((tree, idx) => (
        <group
          key={idx}
          position={tree.pos}
          scale={tree.scale}
          rotation={[tree.lean, tree.rotation, 0]}
        >
          {/* OAK / MAPLE DECIDUOUS TREE */}
          {(tree.type === 'oak' || tree.type === 'maple') && (
            <>
              {/* Trunk & Root Flare */}
              <mesh geometry={oakTrunkGeo} material={trunkMat} castShadow receiveShadow />
              <mesh geometry={rootFlareGeo} material={trunkMat} castShadow receiveShadow />

              {/* Natural Branch Forks */}
              <mesh
                position={[0.4, 2.6, 0.2]}
                rotation={[0.35, 0.4, 0.5]}
                scale={[0.12, 1.2, 0.12]}
                geometry={oakTrunkGeo}
                material={trunkMat}
                castShadow
              />
              <mesh
                position={[-0.35, 2.8, -0.25]}
                rotation={[-0.3, -0.6, -0.45]}
                scale={[0.11, 1.1, 0.11]}
                geometry={oakTrunkGeo}
                material={trunkMat}
                castShadow
              />

              {/* Volumetric Lush Canopy */}
              <group name="foliageRoot" position={[0, 3.8, 0]}>
                {/* Main Upper Dome */}
                <mesh
                  geometry={oakCanopyGeo}
                  material={tree.type === 'oak' ? oakMat : oakMat}
                  castShadow
                  receiveShadow
                />
                {/* Side Volume Clusters */}
                <mesh
                  position={[1.2, -0.4, 0.6]}
                  scale={0.8}
                  geometry={subCanopyGeo}
                  material={oakMat}
                  castShadow
                  receiveShadow
                />
                <mesh
                  position={[-1.1, -0.3, -0.7]}
                  scale={0.85}
                  geometry={subCanopyGeo}
                  material={oakMat}
                  castShadow
                  receiveShadow
                />
                <mesh
                  position={[0.3, 0.8, -0.8]}
                  scale={0.7}
                  geometry={subCanopyGeo}
                  material={oakMat}
                  castShadow
                  receiveShadow
                />
                <mesh
                  position={[-0.4, 0.9, 0.7]}
                  scale={0.75}
                  geometry={subCanopyGeo}
                  material={oakMat}
                  castShadow
                  receiveShadow
                />
              </group>
            </>
          )}

          {/* EVERGREEN PINE / SPRUCE TREE */}
          {tree.type === 'pine' && (
            <>
              {/* Tall Pine Trunk */}
              <mesh geometry={pineTrunkGeo} material={trunkMat} castShadow receiveShadow />
              <mesh geometry={rootFlareGeo} scale={[0.8, 1, 0.8]} material={trunkMat} castShadow receiveShadow />

              {/* Conical Drooping Needle Tiers */}
              <group name="foliageRoot" position={[0, 2.0, 0]}>
                <mesh position={[0, 0, 0]} geometry={pineTier1Geo} material={pineMat} castShadow receiveShadow />
                <mesh position={[0, 1.4, 0]} geometry={pineTier2Geo} material={pineMat} castShadow receiveShadow />
                <mesh position={[0, 2.7, 0]} geometry={pineTier3Geo} material={pineMat} castShadow receiveShadow />
                <mesh position={[0, 3.9, 0]} geometry={pineTier4Geo} material={pineMat} castShadow receiveShadow />
              </group>
            </>
          )}

          {/* FLOWERING CHERRY BLOSSOM TREE */}
          {tree.type === 'blossom' && (
            <>
              {/* Dark Wood Trunk */}
              <mesh geometry={oakTrunkGeo} material={trunkMat} castShadow receiveShadow />
              <mesh geometry={rootFlareGeo} material={trunkMat} castShadow receiveShadow />

              {/* Natural Blossom Branch Forks */}
              <mesh
                position={[0.35, 2.5, 0.3]}
                rotation={[0.4, 0.3, 0.6]}
                scale={[0.1, 1.1, 0.1]}
                geometry={oakTrunkGeo}
                material={trunkMat}
                castShadow
              />
              <mesh
                position={[-0.4, 2.7, -0.2]}
                rotation={[-0.35, -0.5, -0.5]}
                scale={[0.1, 1.0, 0.1]}
                geometry={oakTrunkGeo}
                material={trunkMat}
                castShadow
              />

              {/* Soft Pink Blossom Clouds */}
              <group name="foliageRoot" position={[0, 3.6, 0]}>
                <mesh geometry={blossomCanopyGeo} material={sakuraMat} castShadow receiveShadow />
                <mesh
                  position={[1.1, -0.2, 0.5]}
                  scale={0.78}
                  geometry={blossomCanopyGeo}
                  material={sakuraMat}
                  castShadow
                  receiveShadow
                />
                <mesh
                  position={[-1.0, -0.1, -0.6]}
                  scale={0.82}
                  geometry={blossomCanopyGeo}
                  material={sakuraMat}
                  castShadow
                  receiveShadow
                />
                <mesh
                  position={[0.2, 0.7, -0.6]}
                  scale={0.7}
                  geometry={blossomCanopyGeo}
                  material={sakuraMat}
                  castShadow
                  receiveShadow
                />
                <mesh
                  position={[-0.3, 0.75, 0.6]}
                  scale={0.75}
                  geometry={blossomCanopyGeo}
                  material={sakuraMat}
                  castShadow
                  receiveShadow
                />
              </group>
            </>
          )}
        </group>
      ))}
    </group>
  );
};
