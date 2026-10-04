import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const RealisticWaterShader = {
  uniforms: {
    uTime: { value: 0 },
    uColorDeep: { value: new THREE.Color('#0E3848') },
    uColorShallow: { value: new THREE.Color('#388B82') },
    uColorSunReflection: { value: new THREE.Color('#FFF5D0') },
  },
  vertexShader: `
    uniform float uTime;
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;

    void main() {
      vUv = uv;
      vec3 pos = position;
      
      // Multi-frequency natural water swells
      float wave1 = sin(pos.x * 2.2 + uTime * 2.5) * cos(pos.y * 2.2 + uTime * 2.0) * 0.04;
      float wave2 = sin(pos.x * 6.0 - uTime * 1.8 + pos.y * 4.0) * 0.02;
      float wave3 = cos(pos.x * 12.0 + uTime * 3.5) * 0.01;
      pos.z += wave1 + wave2 + wave3;

      vNormal = normalize(normalMatrix * vec3((wave1 + wave2) * 2.5, (wave2 + wave3) * 2.5, 1.0));
      vec4 worldPos = modelMatrix * vec4(pos, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: `
    uniform vec3 uColorDeep;
    uniform vec3 uColorShallow;
    uniform vec3 uColorSunReflection;
    uniform float uTime;
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;

    void main() {
      float dist = length(vUv - vec2(0.5));
      vec3 waterColor = mix(uColorDeep, uColorShallow, dist * 1.4);
      
      // Fine water caustics pattern
      float c1 = sin(vUv.x * 40.0 + uTime * 2.2) * sin(vUv.y * 40.0 + uTime * 1.8);
      float c2 = cos(vUv.x * 70.0 - uTime * 2.8) * cos(vUv.y * 70.0 + uTime * 2.4);
      float caustic = pow(clamp((c1 + c2) * 0.5 + 0.5, 0.0, 1.0), 3.0);
      waterColor += uColorSunReflection * caustic * 0.25;

      // Fresnel reflection of golden sky
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.5);
      vec3 skyGlow = mix(vec3(0.95, 0.85, 0.7), vec3(0.7, 0.88, 1.0), vUv.y);
      vec3 finalColor = mix(waterColor, skyGlow, fresnel * 0.65);

      // Specular sun highlight
      vec3 sunDir = normalize(vec3(30.0, 24.0, 38.0));
      vec3 halfVec = normalize(sunDir + viewDir);
      float spec = pow(max(dot(vNormal, halfVec), 0.0), 64.0);
      finalColor += uColorSunReflection * spec * 0.8;

      gl_FragColor = vec4(finalColor, 0.92);
    }
  `,
};

export const Pond: React.FC = () => {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((_, delta) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += delta;
    }
  });

  // Lily pads and lotus positions
  const lilyPads = useMemo(() => {
    return [
      { pos: [7.2, 0.03, 3.2] as [number, number, number], rot: 0.4, scale: 0.45 },
      { pos: [7.8, 0.03, 4.8] as [number, number, number], rot: 1.2, scale: 0.6 },
      { pos: [9.1, 0.03, 3.8] as [number, number, number], rot: 2.1, scale: 0.5 },
      { pos: [8.4, 0.03, 2.5] as [number, number, number], rot: -0.8, scale: 0.55 },
      { pos: [6.8, 0.03, 4.2] as [number, number, number], rot: 3.0, scale: 0.38 },
      { pos: [8.9, 0.03, 5.2] as [number, number, number], rot: 1.6, scale: 0.42 },
    ];
  }, []);

  // Stones border around the pond with varied granite colors
  const stones = useMemo(() => {
    const arr = [];
    const radiusX = 4.3;
    const radiusZ = 3.3;
    const count = 32;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = 8 + Math.cos(angle) * radiusX + (Math.sin(i * 3) * 0.25);
      const z = 4 + Math.sin(angle) * radiusZ + (Math.cos(i * 4) * 0.25);
      const scale = 0.38 + (Math.sin(i * 7) * 0.15 + 0.15);
      const color = i % 3 === 0 ? '#7A8076' : i % 3 === 1 ? '#91968C' : '#5E665A';
      arr.push({ pos: [x, 0.08, z] as [number, number, number], scale, rot: i, color });
    }
    return arr;
  }, []);

  return (
    <group>
      {/* Water Body */}
      <mesh position={[8, 0.01, 4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[4.2, 48]} />
        <shaderMaterial
          ref={matRef}
          args={[RealisticWaterShader]}
          transparent={true}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Realistic Lily Pads & Lotus Flowers */}
      {lilyPads.map((pad, idx) => (
        <group key={idx} position={pad.pos} rotation={[0, pad.rot, 0]} scale={pad.scale}>
          {/* Lily Pad Leaf */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <ringGeometry args={[0.04, 1, 24, 1, 0, Math.PI * 1.85]} />
            <meshStandardMaterial color="#25592E" roughness={0.3} metalness={0.1} side={THREE.DoubleSide} />
          </mesh>
          {/* Lotus Bloom */}
          {idx % 2 === 0 && (
            <group position={[0.2, 0.12, 0.1]} scale={0.45}>
              <mesh position={[0, 0.12, 0]}>
                <sphereGeometry args={[0.28, 12, 12]} />
                <meshStandardMaterial color="#FF6B93" roughness={0.3} />
              </mesh>
              <mesh position={[0, 0.24, 0]}>
                <sphereGeometry args={[0.14, 8, 8]} />
                <meshStandardMaterial color="#FFE66D" roughness={0.2} />
              </mesh>
            </group>
          )}
        </group>
      ))}

      {/* Pond Edge Stones */}
      {stones.map((s, idx) => (
        <mesh key={idx} position={s.pos} scale={[s.scale * 1.3, s.scale * 0.75, s.scale]} castShadow receiveShadow>
          <dodecahedronGeometry args={[0.55, 1]} />
          <meshStandardMaterial color={s.color} roughness={0.75} />
        </mesh>
      ))}

      {/* Weathered Wooden Footbridge */}
      <group position={[11.8, 0.16, 4]} rotation={[0, -0.4, 0]}>
        {[-0.8, -0.4, 0, 0.4, 0.8].map((offset, i) => (
          <mesh key={i} position={[offset, Math.cos(offset * 1.2) * 0.16, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.34, 0.09, 1.7]} />
            <meshStandardMaterial color="#6B4628" roughness={0.7} />
          </mesh>
        ))}
        {[-0.8, 0.8].map((zPos, j) => (
          <group key={j} position={[0, 0.32, zPos]}>
            <mesh castShadow>
              <boxGeometry args={[2.0, 0.07, 0.07]} />
              <meshStandardMaterial color="#4A2E17" roughness={0.7} />
            </mesh>
            {[-0.8, 0, 0.8].map((xPost, k) => (
              <mesh key={k} position={[xPost, -0.18, 0]} castShadow>
                <cylinderGeometry args={[0.045, 0.045, 0.42, 8]} />
                <meshStandardMaterial color="#4A2E17" roughness={0.7} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
};
