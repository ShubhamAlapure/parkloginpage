import React from 'react';
import { AuthPanel } from '@/features/auth/AuthPanel';
import { Scene } from '@/features/scene/Scene';
import { ViewControlsHUD } from '@/features/scene/ViewControlsHUD';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useQualityTier } from '@/hooks/useQualityTier';
import { useMouseParallax } from '@/hooks/useMouseParallax';

export const App: React.FC = () => {
  // Initialize device detection and interaction hooks
  useReducedMotion();
  useQualityTier();
  useMouseParallax();

  return (
    <main className="w-full h-full h-[100dvh] overflow-hidden relative bg-park-cream">
      {/* 3D Living Park Scene - full canvas edge-to-edge across entire window */}
      <div className="absolute inset-0 w-full h-full z-10">
        <Scene />
      </div>

      {/* Floating 360° Navigation & Reset HUD Overlay */}
      <ViewControlsHUD />

      {/* Left 30% Frosted Glass Auth Panel */}
      <div className="relative z-20 w-full lg:w-[450px] xl:w-[480px] h-full max-h-[100dvh] overflow-y-auto">
        <AuthPanel />
      </div>
    </main>
  );
};
