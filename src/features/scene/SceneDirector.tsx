import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '@/app/store';

export const SceneDirector: React.FC = () => {
  const { camera } = useThree();
  const cameraFocusTarget = useAppStore((s) => s.cameraFocusTarget);
  const isSuccess = useAppStore((s) => s.isSuccess);
  const mousePos = useAppStore((s) => s.mousePos);
  const reducedMotion = useAppStore((s) => s.reducedMotion);

  // Default cinematic 3/4 diorama camera position & target
  const defaultPos = new THREE.Vector3(-14, 11, 24);
  const defaultLookAt = new THREE.Vector3(0, 1.5, 0);

  // Target vectors for lerping
  const targetCamPos = useRef(new THREE.Vector3(-18, 22, 34)); // Initial intro position (high & wide)
  const targetCamLookAt = useRef(new THREE.Vector3(0, 1.5, 0));

  // Current interpolated values
  const currentLookAt = useRef(new THREE.Vector3(0, 1.5, 0));

  // Intro choreography timer
  const introTimer = useRef(0);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    introTimer.current += delta;

    // 1. Calculate base camera target according to UI state
    if (isSuccess) {
      // Pull back wide to celebrate
      targetCamPos.current.set(-16, 14, 30);
      targetCamLookAt.current.set(0, 2, 0);
    } else if (cameraFocusTarget === 'email') {
      // Nudge slightly closer toward the hero painter on left lawn
      targetCamPos.current.set(-11, 8.5, 18);
      targetCamLookAt.current.set(-2.5, 1.8, 3.5);
    } else if (cameraFocusTarget === 'password') {
      // Nudge toward playground & children
      targetCamPos.current.set(-15, 10, 20);
      targetCamLookAt.current.set(-8, 2, 4);
    } else if (cameraFocusTarget === 'name') {
      // Shift toward fountain & center
      targetCamPos.current.set(-10, 9, 21);
      targetCamLookAt.current.set(2, 2, -2);
    } else {
      // Default view: calculate subtle ambient orbit drift if reducedMotion is false
      if (!reducedMotion && introTimer.current > 2.0) {
        const driftAngle = Math.sin(t * 0.15) * 0.08;
        const driftY = Math.sin(t * 0.25) * 0.4;
        const baseDist = 28;
        const camX = defaultPos.x + Math.sin(driftAngle) * 3 + (mousePos.x * 1.5);
        const camY = defaultPos.y + driftY + (mousePos.y * 1.2);
        const camZ = defaultPos.z + (mousePos.x * -1.0);

        targetCamPos.current.set(camX, camY, camZ);
        targetCamLookAt.current.set(
          defaultLookAt.x + mousePos.x * 0.8,
          defaultLookAt.y + mousePos.y * 0.5,
          defaultLookAt.z
        );
      } else {
        targetCamPos.current.copy(defaultPos);
        targetCamLookAt.current.copy(defaultLookAt);
      }
    }

    // 2. Smoothly damp camera position & lookAt
    const lerpSpeed = introTimer.current < 2.5 ? 1.4 * delta : 2.5 * delta;
    camera.position.lerp(targetCamPos.current, lerpSpeed);
    currentLookAt.current.lerp(targetCamLookAt.current, lerpSpeed);
    camera.lookAt(currentLookAt.current);
  });

  return null;
};
