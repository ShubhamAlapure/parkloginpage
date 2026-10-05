import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import { Lighting } from './Lighting';
import { Terrain } from './Terrain';
import { Pond } from './Pond';
import { GrassField } from './Grass/GrassField';
import { Trees } from './Trees/Trees';
import { Gazebo } from './Props/Gazebo';
import { Fountain } from './Props/Fountain';
import { Playground } from './Props/Playground';
import { ParkProps } from './Props/ParkProps';
import { Walkers } from './Characters/Walkers';
import { Kids } from './Characters/Kids';
import { Painters } from './Painters/Painter';
import { Clouds } from './Effects/Clouds';
import { Particles } from './Effects/Particles';
import { Birds } from './Effects/Birds';
import { CitySkyline } from './CitySkyline';
import { PostFX } from './Effects/PostFX';
import { SceneDirector } from './SceneDirector';
import { useAppStore } from '@/app/store';

const SceneLoader: React.FC = () => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-park-cream z-10 space-y-4">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-park-sage/30 border-t-park-forest animate-spin" />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-8 h-8 text-park-forest animate-pulse"
        >
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
      </div>
      <p className="font-serif text-sm font-semibold text-park-forest tracking-wide">
        Loading Masterwork Park Haven...
      </p>
    </div>
  );
};

export const Scene: React.FC = () => {
  const qualityTier = useAppStore((s) => s.qualityTier);
  const setQualityTier = useAppStore((s) => s.setQualityTier);

  return (
    <div className="w-full h-full relative overflow-hidden bg-park-cream select-none">
      <Suspense fallback={<SceneLoader />}>
        <Canvas
          shadows={qualityTier !== 'low' ? 'soft' : false}
          camera={{ position: [-18, 22, 34], fov: 40, near: 0.1, far: 250 }}
          dpr={[1, qualityTier === 'high' ? 1.75 : 1.25]}
          gl={{
            powerPreference: 'high-performance',
            antialias: qualityTier !== 'low',
            alpha: false,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.15,
          }}
        >
          <SceneDirector />
          <Lighting />

          {/* Park Environment with Perimeter Runway */}
          <Terrain />
          <Pond />
          <GrassField />
          <Trees />

          {/* Architectural & Play Props */}
          <Gazebo />
          <Fountain />
          <Playground />
          <ParkProps />

          {/* Animated Inhabitants */}
          <Walkers />
          <Kids />

          {/* Focal Interactive Painters */}
          <Painters />

          {/* Sky & Atmosphere (with Birds & City Skyline) */}
          <CitySkyline />
          <Clouds />
          <Particles />
          <Birds />

          {/* Post Processing Passes */}
          <PostFX />
        </Canvas>
      </Suspense>
    </div>
  );
};
