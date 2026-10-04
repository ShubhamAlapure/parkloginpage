import React, { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '@/app/store';

export const Lighting: React.FC = () => {
  const timeOfDay = useAppStore((s) => s.timeOfDay);
  const qualityTier = useAppStore((s) => s.qualityTier);
  const dirLightRef = useRef<THREE.DirectionalLight>(null);

  // Load high-res 360 sky panorama textures
  const [goldenSky, nightSky] = useLoader(THREE.TextureLoader, [
    '/textures/sky_golden.jpg',
    '/textures/sky_night.jpg',
  ]);

  useMemo(() => {
    goldenSky.mapping = THREE.EquirectangularReflectionMapping;
    nightSky.mapping = THREE.EquirectangularReflectionMapping;
  }, [goldenSky, nightSky]);

  // Realistic lighting profiles
  const config = {
    day: {
      sunPos: [35, 50, 30] as [number, number, number],
      sunColor: '#FFF8E7',
      sunIntensity: 2.2,
      hemiSky: '#D6EAF8',
      hemiGround: '#4D6B3C',
      hemiIntensity: 0.9,
      fogColor: '#CBE5F5',
      fogNear: 35,
      fogFar: 140,
      skyTexture: goldenSky,
      envPreset: 'park' as const,
    },
    golden: {
      sunPos: [30, 24, 38] as [number, number, number],
      sunColor: '#FFAE5C',
      sunIntensity: 2.8,
      hemiSky: '#FDE2A6',
      hemiGround: '#3B522F',
      hemiIntensity: 0.85,
      fogColor: '#F3D1A5',
      fogNear: 30,
      fogFar: 130,
      skyTexture: goldenSky,
      envPreset: 'sunset' as const,
    },
    sunset: {
      sunPos: [40, 12, 25] as [number, number, number],
      sunColor: '#FF6B4A',
      sunIntensity: 3.0,
      hemiSky: '#FFA07A',
      hemiGround: '#2B3D23',
      hemiIntensity: 0.75,
      fogColor: '#E68568',
      fogNear: 25,
      fogFar: 120,
      skyTexture: goldenSky,
      envPreset: 'sunset' as const,
    },
    night: {
      sunPos: [15, 35, 15] as [number, number, number],
      sunColor: '#6B8CFF',
      sunIntensity: 0.8,
      hemiSky: '#0B132B',
      hemiGround: '#070D18',
      hemiIntensity: 0.4,
      fogColor: '#0A1124',
      fogNear: 20,
      fogFar: 95,
      skyTexture: nightSky,
      envPreset: 'night' as const,
    },
  }[timeOfDay];

  useFrame((_, delta) => {
    if (dirLightRef.current) {
      dirLightRef.current.position.lerp(new THREE.Vector3(...config.sunPos), delta * 2.5);
    }
  });

  const shadowMapSize = qualityTier === 'high' ? 2048 : 1024;
  const castShadows = qualityTier !== 'low';

  return (
    <>
      <color attach="background" args={[config.fogColor]} />
      <fog attach="fog" args={[config.fogColor, config.fogNear, config.fogFar]} />

      {/* Realistic Environment IBL Lighting */}
      <Environment preset={config.envPreset} background={false} />

      <hemisphereLight
        color={config.hemiSky}
        groundColor={config.hemiGround}
        intensity={config.hemiIntensity}
      />

      {/* Primary Directional Sunlight with Soft Shadow Map */}
      <directionalLight
        ref={dirLightRef}
        position={config.sunPos}
        intensity={config.sunIntensity}
        color={config.sunColor}
        castShadow={castShadows}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-near={5}
        shadow-camera-far={160}
        shadow-camera-left={-42}
        shadow-camera-right={42}
        shadow-camera-top={42}
        shadow-camera-bottom={-42}
        shadow-bias={-0.0002}
        shadow-normalBias={0.03}
      />

      {/* Photorealistic 360 Sky Panorama Dome */}
      <mesh position={[0, 0, 0]} scale={[-140, -140, -140]}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial
          map={config.skyTexture}
          side={THREE.BackSide}
          toneMapped={true}
        />
      </mesh>
    </>
  );
};
