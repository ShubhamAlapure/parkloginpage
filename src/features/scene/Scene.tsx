import * as THREE from 'three';
import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Ground, WindClock } from './Ground';
import { Trees, SkyDome } from './Trees';
import { EaselStructure, SupplyTable, ParkBench, SwingsFrame, PlaygroundSlide, ParkProps } from './ParkProps';
import { SketchBoard } from './SketchBoard';
import { ParkActors, createWorldContext, WorldContextType } from './ParkActors';
import {
  InteractiveCameraDirector,
  FloatingTooltip,
  GroundFocusRing,
  SceneLighting,
  FocusState,
} from './CameraDirector';
import { CAMERA } from './parkConstants';

interface SceneContentProps {
  board: SketchBoard;
  labelRef: React.RefObject<HTMLDivElement | null>;
  controlsRef?: React.RefObject<{ zoom: (f: number) => void; reset: () => void } | null>;
  onInteract?: () => void;
  world: WorldContextType;
}

function SceneContent({ board, labelRef, controlsRef, onInteract, world }: SceneContentProps) {
  const canvasRef = useRef<THREE.Group>(null);
  const focusRef = useRef<FocusState>({ hover: null, follow: null, groups: [] });

  return (
    <>
      <WindClock />
      <InteractiveCameraDirector focusRef={focusRef} controlsRef={controlsRef} onInteract={onInteract} />
      <FloatingTooltip world={world} focusRef={focusRef} labelRef={labelRef} />
      <GroundFocusRing focusRef={focusRef} />
      <SceneLighting />
      <SkyDome />
      <fog attach="fog" args={['#e6e6da', 24, 75]} />
      <Ground grass={26000} />
      <Trees />
      <SwingsFrame />
      <PlaygroundSlide />
      <ParkBench />
      <SupplyTable />
      <EaselStructure board={board} canvasRef={canvasRef} />
      <ParkProps />
      <Suspense fallback={null}>
        <ParkActors board={board} canvasRef={canvasRef} world={world} />
      </Suspense>
    </>
  );
}

export interface ParkSceneProps {
  labelRef: React.RefObject<HTMLDivElement | null>;
  controlsRef?: React.RefObject<{ zoom: (f: number) => void; reset: () => void } | null>;
  onInteract?: () => void;
  onReady?: () => void;
}

export function ParkScene({ labelRef, controlsRef, onInteract, onReady }: ParkSceneProps) {
  const [board] = useState(() => new SketchBoard());
  const [world] = useState(createWorldContext);
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => () => board.dispose(), [board]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0 }}>
      <Canvas
        shadows
        dpr={[1, 1.5]}
        frameloop={inView ? 'always' : 'never'}
        camera={{ position: CAMERA.position, fov: CAMERA.fov, near: 0.1, far: 200 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          onReady?.();
        }}
      >
        <SceneContent board={board} labelRef={labelRef} controlsRef={controlsRef} onInteract={onInteract} world={world} />
      </Canvas>
    </div>
  );
}

export default ParkScene;
