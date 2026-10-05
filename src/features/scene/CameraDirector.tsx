import * as THREE from 'three';
import React, { useRef, useEffect, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { CAMERA } from './parkConstants';
import { WorldContextType } from './ParkActors';

export interface FocusState {
  hover: any | null;
  follow: string | null;
  groups: any[];
}

export function SceneLighting() {
  const dirLightRef = useRef<THREE.DirectionalLight>(null);

  useEffect(() => {
    if (dirLightRef.current) {
      dirLightRef.current.target.position.set(0, 0, 0);
      dirLightRef.current.target.updateMatrixWorld();
    }
  }, []);

  return (
    <>
      <hemisphereLight args={['#d9e8f2', '#5d6b3c', 1.15]} />
      <directionalLight
        ref={dirLightRef}
        position={[-9, 11, 7]}
        intensity={2.6}
        color="#fff1d8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.035}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-10}
        shadow-camera-near={1}
        shadow-camera-far={40}
      />
      <directionalLight position={[6, 4, -8]} intensity={0.35} color="#bcd4ff" />
    </>
  );
}

export function FloatingTooltip({
  world,
  focusRef,
  labelRef,
}: {
  world: WorldContextType;
  focusRef: React.MutableRefObject<FocusState>;
  labelRef: React.RefObject<HTMLDivElement | null>;
}) {
  const gl = useThree(s => s.gl);
  const pointerPos = useRef<{ x: number; y: number } | null>(null);
  const tooltipState = useRef({ text: '', shown: 0, id: null as string | null });

  useEffect(() => {
    const el = gl.domElement;
    const onPointerMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      pointerPos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onPointerLeave = () => {
      pointerPos.current = null;
    };
    el.addEventListener('pointermove', onPointerMove, { passive: true });
    el.addEventListener('pointerleave', onPointerLeave);
    return () => {
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [gl]);

  useFrame(({ camera, size, gl: contextGl }, delta) => {
    const fs = focusRef.current;
    const groups = world.groups();
    fs.groups = groups;

    const rightDir = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const projectPoint = (pos: THREE.Vector3) => {
      const proj = pos.clone().project(camera);
      return {
        x: ((proj.x + 1) / 2) * size.width,
        y: ((1 - proj.y) / 2) * size.height,
        behind: proj.z > 1,
      };
    };

    const getGroupScreenBounds = (g: any) => {
      const centerProj = projectPoint(g.center);
      const edgeProj = projectPoint(g.center.clone().addScaledVector(rightDir, g.radius));
      return {
        ...centerProj,
        r: Math.max(40, Math.hypot(edgeProj.x - centerProj.x, edgeProj.y - centerProj.y)),
      };
    };

    let closestGroup: any = null;
    let minDist = Infinity;
    const ptr = pointerPos.current;
    if (ptr) {
      for (const g of groups) {
        const bounds = getGroupScreenBounds(g);
        if (bounds.behind) continue;
        const dist = Math.hypot(ptr.x - bounds.x, ptr.y - bounds.y);
        if (dist < bounds.r && dist < minDist) {
          closestGroup = g;
          minDist = dist;
        }
      }
    }

    fs.hover = closestGroup;
    const canvasStyle = contextGl.domElement.style;
    if (canvasStyle.cursor !== 'grabbing') {
      canvasStyle.setProperty('cursor', closestGroup ? 'pointer' : 'grab');
    }

    const labelEl = labelRef.current;
    if (!labelEl) return;

    const activeSubject = closestGroup ?? groups.find(g => g.id === fs.follow) ?? null;
    const ts = tooltipState.current;
    ts.shown = THREE.MathUtils.damp(ts.shown, +!!activeSubject, activeSubject ? 8 : 5, delta);
    if (activeSubject) ts.id = activeSubject.id;

    const displaySubject = activeSubject ?? groups.find(g => g.id === ts.id);
    if (!displaySubject || ts.shown < 0.01) {
      labelEl.style.visibility = 'hidden';
      return;
    }

    const labelText = fs.follow === displaySubject.id ? `${displaySubject.label} · following` : displaySubject.label;
    if (labelText !== ts.text) {
      ts.text = labelText;
      labelEl.textContent = labelText;
    }

    const b = getGroupScreenBounds(displaySubject);
    labelEl.style.visibility = 'visible';
    labelEl.style.opacity = String(ts.shown);
    labelEl.style.transform = `translate(${b.x}px, ${Math.min(b.y + 0.85 * b.r, size.height - 56)}px) translate(-50%, 0)`;
  });

  return null;
}

export function GroundFocusRing({ focusRef }: { focusRef: React.MutableRefObject<FocusState> }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringState = useRef({
    shown: 0,
    radius: 1,
    id: null as string | null,
    follow: null as string | null,
    pop: 0,
    center: new THREE.Vector3(),
  });
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const rs = ringState.current;
    const fs = focusRef.current;
    const followGroup = fs.follow ? fs.groups.find(g => g.id === fs.follow) : null;
    const targetGroup = fs.hover ?? followGroup;

    if (fs.follow && fs.follow !== rs.follow) rs.pop = 1;
    rs.follow = fs.follow;
    rs.pop = Math.max(0, rs.pop - 1.8 * delta);
    rs.shown = THREE.MathUtils.damp(rs.shown, +!!targetGroup, targetGroup ? 7 : 4, delta);

    if (targetGroup) {
      if (rs.id !== targetGroup.id) rs.center.copy(targetGroup.center);
      rs.id = targetGroup.id;
      rs.center.lerp(targetGroup.center, 1 - Math.exp(-10 * delta));
      rs.radius = THREE.MathUtils.damp(rs.radius, 0.85 * targetGroup.radius, 8, delta);
    }

    mesh.visible = rs.shown > 0.01;
    if (!mesh.visible) return;

    const pulse = targetGroup && !followGroup ? 1 : 0;
    const breathing = 1 + 0.05 * Math.sin(4 * clock.elapsedTime) * pulse;
    const popScale = 1 + 0.35 * rs.pop * rs.pop;

    mesh.position.set(rs.center.x, 0.03, rs.center.z);
    mesh.scale.setScalar(rs.radius * breathing * popScale);
    if (matRef.current) {
      matRef.current.opacity = rs.shown * (0.55 + 0.25 * rs.pop);
    }
  });

  return (
    <mesh ref={meshRef} rotation-x={-Math.PI / 2} renderOrder={2} visible={false}>
      <ringGeometry args={[0.86, 1, 64]} />
      <meshBasicMaterial ref={matRef} color="#e8ffd9" transparent opacity={0} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

const clamp = THREE.MathUtils.clamp;
const AGE_DELAY = 1.6;

function initCameraController(stateRef: React.MutableRefObject<any>, initVantage: any) {
  if (!stateRef.current) {
    stateRef.current = {
      target: initVantage.target.clone(),
      goalTarget: initVantage.target.clone(),
      yaw: initVantage.yaw + 0.35,
      goalYaw: initVantage.yaw,
      pitch: initVantage.pitch + 0.45,
      goalPitch: initVantage.pitch,
      dist: 1.9 * initVantage.dist,
      goalDist: initVantage.dist,
      keys: new Set<string>(),
      drag: null as { x: number; y: number; moved: number } | null,
      follow: null as string | null,
      followInit: null as string | null,
      pointer: { x: 0, y: 0 },
      look: { x: 0, y: 0 },
      age: -AGE_DELAY,
    };
  }
  return stateRef.current;
}

export function InteractiveCameraDirector({
  focusRef,
  controlsRef,
  onInteract,
}: {
  focusRef: React.MutableRefObject<FocusState>;
  controlsRef?: React.RefObject<{ zoom: (f: number) => void; reset: () => void } | null>;
  onInteract?: () => void;
}) {
  const gl = useThree(s => s.gl);
  const baseVantage = useMemo(() => {
    const camVals = [...CAMERA.position, ...CAMERA.target];
    const target = new THREE.Vector3(camVals[3], camVals[4], camVals[5]);
    const offset = new THREE.Vector3(camVals[0], camVals[1], camVals[2]).sub(target);
    const dist = offset.length();
    return {
      target,
      dist,
      yaw: Math.atan2(offset.x, offset.z),
      pitch: Math.asin(offset.y / dist),
    };
  }, []);

  const stateRef = useRef<any>(null);

  useEffect(() => {
    const s = initCameraController(stateRef, baseVantage);
    const canvas = gl.domElement;
    const notifyInteract = () => onInteract?.();

    const resetCam = () => {
      s.follow = null;
      s.goalTarget.copy(baseVantage.target);
      s.goalYaw = baseVantage.yaw;
      s.goalPitch = baseVantage.pitch;
      s.goalDist = baseVantage.dist;
    };

    const zoomCam = (scale: number) => {
      s.goalDist = clamp(s.goalDist * scale, 2.6, 13);
      notifyInteract();
    };

    if (controlsRef) {
      (controlsRef as any).current = { reset: resetCam, zoom: zoomCam };
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.button === 0) {
        canvas.setPointerCapture(e.pointerId);
        s.drag = { x: e.clientX, y: e.clientY, moved: 0 };
        canvas.style.setProperty('cursor', 'grabbing');
        canvas.focus({ preventScroll: true });
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      s.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      s.pointer.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      if (!s.drag) return;
      const dx = e.clientX - s.drag.x;
      const dy = e.clientY - s.drag.y;
      s.drag.x = e.clientX;
      s.drag.y = e.clientY;
      s.drag.moved += Math.abs(dx) + Math.abs(dy);
      s.goalYaw -= 0.0045 * dx;
      s.goalPitch += 0.0035 * dy;
      if (s.drag.moved > 4) notifyInteract();
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!s.drag) return;
      const wasClick = s.drag.moved < 5;
      s.drag = null;
      canvas.style.removeProperty('cursor');
      if (canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
      if (wasClick) {
        const hoverSubject = focusRef.current.hover;
        s.follow = hoverSubject ? hoverSubject.id : null;
        notifyInteract();
      }
    };

    const onPointerLeave = () => {
      s.pointer.x = 0;
      s.pointer.y = 0;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomCam(Math.exp(0.0012 * e.deltaY));
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.closest?.("input, textarea, select, [contenteditable='true']") || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'q', 'e', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        s.keys.add(k);
        if (k.startsWith('arrow')) e.preventDefault();
        if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
          s.follow = null;
        }
        notifyInteract();
      } else if (k === '+' || k === '=') {
        zoomCam(0.85);
      } else if (k === '-' || k === '_') {
        zoomCam(1.18);
      } else if (k === 'r' || k === 'escape' || k === 'home') {
        resetCam();
        notifyInteract();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => s.keys.delete(e.key.toLowerCase());
    const onBlur = () => s.keys.clear();

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [gl, baseVantage, controlsRef, focusRef, onInteract]);

  useFrame(({ clock, camera }, delta) => {
    const s = initCameraController(stateRef, baseVantage);
    const keys = s.keys;
    const fwdInput = (keys.has('w') || keys.has('arrowup') ? 1 : 0) - (keys.has('s') || keys.has('arrowdown') ? 1 : 0);
    const sideInput = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);
    const rotInput = (keys.has('e') ? 1 : 0) - (keys.has('q') ? 1 : 0);

    if (fwdInput || sideInput) {
      const fwd = new THREE.Vector3(-Math.sin(s.yaw), 0, -Math.cos(s.yaw));
      const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
      s.goalTarget.addScaledVector(fwd, 3.2 * fwdInput * delta).addScaledVector(right, 3.2 * sideInput * delta);
    }
    if (rotInput) {
      s.goalYaw -= 1.2 * rotInput * delta;
    }

    const followGroup = s.follow ? focusRef.current.groups?.find(g => g.id === s.follow) : null;
    if (s.follow && !followGroup) s.follow = null;

    if (followGroup) {
      s.goalTarget.copy(followGroup.center);
      const idealDist = clamp(2.8 * followGroup.radius + 2, 2.6, 8);
      if (!s.followInit || s.followInit !== s.follow) {
        s.goalDist = idealDist;
        s.goalPitch = Math.max(s.goalPitch, 0.16);
        s.followInit = s.follow;
      }
    } else {
      s.followInit = null;
    }

    focusRef.current.follow = s.follow;
    s.goalYaw = clamp(s.goalYaw, baseVantage.yaw - 0.95, baseVantage.yaw + 0.95);
    s.goalPitch = clamp(s.goalPitch, 0.04, 0.62);
    s.goalTarget.x = clamp(s.goalTarget.x, -5.5, 6.5);
    s.goalTarget.z = clamp(s.goalTarget.z, -7.5, 6.5);
    if (!followGroup) {
      s.goalTarget.y = THREE.MathUtils.damp(s.goalTarget.y, baseVantage.target.y, 2, delta);
    }

    if (focusRef.current.groups.length) {
      s.age += delta;
    } else {
      s.age = -AGE_DELAY;
    }

    const introProgress = THREE.MathUtils.smoothstep(s.age, 0, 3.6);
    const activeMult = s.age < 0 ? 0 : 1;
    const easeRate = (1 - Math.exp(-delta * THREE.MathUtils.lerp(1.1, 5, introProgress))) * activeMult;

    s.target.lerp(s.goalTarget, (1 - Math.exp(-delta * (followGroup ? 3 : 6))) * activeMult);
    s.yaw += (s.goalYaw - s.yaw) * easeRate;
    s.pitch += (s.goalPitch - s.pitch) * easeRate;
    s.dist += (s.goalDist - s.dist) * (1 - Math.exp(-delta * THREE.MathUtils.lerp(1.1, 4, introProgress))) * activeMult;

    const lookParallax = s.drag || followGroup ? 0 : introProgress;
    const lookDamp = 1 - Math.exp(-2.5 * delta);
    s.look.x += (s.pointer.x * lookParallax - s.look.x) * lookDamp;
    s.look.y += (s.pointer.y * lookParallax - s.look.y) * lookDamp;

    const finalYaw = s.yaw - 0.14 * s.look.x;
    const finalPitch = clamp(s.pitch + 0.07 * s.look.y, 0.04, 1.02);
    const elapsed = clock.elapsedTime;
    const breatheSway = new THREE.Vector3(0.06 * Math.sin(0.13 * elapsed), 0.03 * Math.sin(0.21 * elapsed), 0);

    const cosPitch = Math.cos(finalPitch);
    camera.position
      .set(Math.sin(finalYaw) * cosPitch, Math.sin(finalPitch), Math.cos(finalYaw) * cosPitch)
      .multiplyScalar(s.dist)
      .add(s.target)
      .add(breatheSway);

    camera.position.setY(Math.max(camera.position.y, 0.45));
    camera.lookAt(s.target);
  });

  return null;
}
