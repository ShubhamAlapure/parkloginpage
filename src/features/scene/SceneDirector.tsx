import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls as DreiOrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { useAppStore } from '@/app/store';

export const SceneDirector: React.FC = () => {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const cameraFocusTarget = useAppStore((s) => s.cameraFocusTarget);
  const isSuccess = useAppStore((s) => s.isSuccess);
  const mousePos = useAppStore((s) => s.mousePos);
  const reducedMotion = useAppStore((s) => s.reducedMotion);

  // Default overview position & target
  const defaultCamPos = useRef(new THREE.Vector3(-14, 11, 24));
  const defaultTarget = useRef(new THREE.Vector3(0, 1.5, 0));

  // Desired targets for smooth kinematic transitions
  const targetCamPos = useRef(new THREE.Vector3(-14, 11, 24));
  const targetLookAt = useRef(new THREE.Vector3(0, 1.5, 0));

  // State flags
  const isInteracting = useRef(false);
  const interactionCooldown = useRef<number | null>(null);
  const lastFocus = useRef<string | null>(null);
  const isInitialized = useRef(false);

  // Keyboard navigation state
  const keys = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    // Set initial camera view once
    camera.position.set(-14, 11, 24);
    camera.lookAt(0, 1.5, 0);
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 1.5, 0);
      controlsRef.current.update();
    }
    isInitialized.current = true;
  }, [camera]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      keys.current[e.key.toLowerCase()] = true;
      isInteracting.current = true;
      if (interactionCooldown.current) clearTimeout(interactionCooldown.current);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
      if (interactionCooldown.current) clearTimeout(interactionCooldown.current);
      interactionCooldown.current = window.setTimeout(() => {
        isInteracting.current = false;
      }, 5000);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Listen to mouse/touch drag on OrbitControls
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const onStart = () => {
      isInteracting.current = true;
      if (interactionCooldown.current) clearTimeout(interactionCooldown.current);
    };

    const onEnd = () => {
      if (interactionCooldown.current) clearTimeout(interactionCooldown.current);
      interactionCooldown.current = window.setTimeout(() => {
        isInteracting.current = false;
      }, 6000);
    };

    controls.addEventListener('start', onStart);
    controls.addEventListener('end', onEnd);

    return () => {
      controls.removeEventListener('start', onStart);
      controls.removeEventListener('end', onEnd);
    };
  }, []);

  // Handle focus changes
  useEffect(() => {
    if (cameraFocusTarget !== lastFocus.current) {
      lastFocus.current = cameraFocusTarget;
      isInteracting.current = false; // Transition to focused region
    }
  }, [cameraFocusTarget]);

  // Expose Reset & Zoom Camera functions
  useEffect(() => {
    (window as any).__resetParkCamera = () => {
      isInteracting.current = false;
      targetCamPos.current.set(-14, 11, 24);
      targetLookAt.current.set(0, 1.5, 0);
    };

    (window as any).__zoomParkCamera = (factor: number) => {
      if (controlsRef.current) {
        isInteracting.current = true;
        if (factor > 0) {
          controlsRef.current.dollyIn(1 + factor);
        } else {
          controlsRef.current.dollyOut(1 + Math.abs(factor));
        }
        controlsRef.current.update();
        if (interactionCooldown.current) clearTimeout(interactionCooldown.current);
        interactionCooldown.current = window.setTimeout(() => {
          isInteracting.current = false;
        }, 3000);
      }
    };

    return () => {
      delete (window as any).__resetParkCamera;
      delete (window as any).__zoomParkCamera;
    };
  }, []);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const controls = controlsRef.current;
    if (!controls) return;

    // 1. Keyboard Navigation (WASD / Arrows / Q / E)
    const k = keys.current;
    const rotSpeed = 1.6 * delta;

    if (k['w'] || k['arrowup']) {
      controls.dollyIn(1 + 0.8 * delta);
      controls.update();
      isInteracting.current = true;
    }
    if (k['s'] || k['arrowdown']) {
      controls.dollyOut(1 + 0.8 * delta);
      controls.update();
      isInteracting.current = true;
    }
    if (k['a'] || k['arrowleft']) {
      const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      spherical.theta -= rotSpeed;
      offset.setFromSpherical(spherical);
      camera.position.copy(controls.target).add(offset);
      controls.update();
      isInteracting.current = true;
    }
    if (k['d'] || k['arrowright']) {
      const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      spherical.theta += rotSpeed;
      offset.setFromSpherical(spherical);
      camera.position.copy(controls.target).add(offset);
      controls.update();
      isInteracting.current = true;
    }
    if (k['q']) {
      const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      spherical.phi = Math.max(0.18, spherical.phi - rotSpeed * 0.7);
      offset.setFromSpherical(spherical);
      camera.position.copy(controls.target).add(offset);
      controls.update();
      isInteracting.current = true;
    }
    if (k['e']) {
      const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      spherical.phi = Math.min(Math.PI / 2 - 0.05, spherical.phi + rotSpeed * 0.7);
      offset.setFromSpherical(spherical);
      camera.position.copy(controls.target).add(offset);
      controls.update();
      isInteracting.current = true;
    }

    // 2. If user is actively orbiting or typing, allow OrbitControls full control
    if (isInteracting.current) {
      controls.update();
      return;
    }

    // 3. Cinematic choreography based on focus
    if (isSuccess) {
      targetCamPos.current.set(-16, 14, 30);
      targetLookAt.current.set(0, 2, 0);
    } else if (cameraFocusTarget === 'email') {
      targetCamPos.current.set(-11, 8.5, 18);
      targetLookAt.current.set(-2.5, 1.8, 3.5);
    } else if (cameraFocusTarget === 'password') {
      targetCamPos.current.set(-15, 10, 20);
      targetLookAt.current.set(-8, 2, 4);
    } else if (cameraFocusTarget === 'name') {
      targetCamPos.current.set(-10, 9, 21);
      targetLookAt.current.set(2, 2, -2);
    } else {
      // Gentle ambient drift
      if (!reducedMotion) {
        const driftAngle = Math.sin(t * 0.1) * 0.04;
        const driftY = Math.sin(t * 0.18) * 0.3;
        targetCamPos.current.set(
          defaultCamPos.current.x + Math.sin(driftAngle) * 2.0 + mousePos.x * 1.0,
          defaultCamPos.current.y + driftY + mousePos.y * 0.6,
          defaultCamPos.current.z - mousePos.x * 0.6
        );
        targetLookAt.current.set(
          defaultTarget.current.x + mousePos.x * 0.4,
          defaultTarget.current.y + mousePos.y * 0.2,
          defaultTarget.current.z
        );
      } else {
        targetCamPos.current.copy(defaultCamPos.current);
        targetLookAt.current.copy(defaultTarget.current);
      }
    }

    const factor = Math.min(1.0, 2.0 * delta);
    camera.position.lerp(targetCamPos.current, factor);
    controls.target.lerp(targetLookAt.current, factor);
    controls.update();
  });

  return (
    <DreiOrbitControls
      ref={controlsRef}
      enableDamping={true}
      dampingFactor={0.07}
      minDistance={6}
      maxDistance={65}
      maxPolarAngle={Math.PI / 2 - 0.03}
      minPolarAngle={0.12}
      rotateSpeed={0.75}
      panSpeed={0.8}
      zoomSpeed={0.85}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
    />
  );
};
