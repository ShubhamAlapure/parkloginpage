import React from 'react';
import { EffectComposer, Bloom, Vignette, SMAA, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useAppStore } from '@/app/store';

export const PostFX: React.FC = () => {
  const qualityTier = useAppStore((s) => s.qualityTier);

  if (qualityTier === 'low') {
    return null;
  }

  if (qualityTier === 'high') {
    return (
      <EffectComposer multisampling={4}>
        <Bloom
          luminanceThreshold={0.82}
          luminanceSmoothing={0.35}
          intensity={0.4}
          mipmapBlur={true}
        />
        <ChromaticAberration
          offset={new THREE.Vector2(0.0006, 0.0006)}
          radialModulation={true}
          modulationOffset={0.2}
        />
        <Vignette eskil={false} offset={0.2} darkness={0.45} />
        <SMAA />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        luminanceThreshold={0.82}
        luminanceSmoothing={0.35}
        intensity={0.35}
        mipmapBlur={true}
      />
      <Vignette eskil={false} offset={0.2} darkness={0.4} />
    </EffectComposer>
  );
};
