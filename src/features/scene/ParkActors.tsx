import * as THREE from 'three';
import React, { useMemo, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useActor, ActorHandle } from './useActor';
import {
  EASEL_SPOT,
  EASEL_BACK,
  VIEW_SPOT,
  TABLE_SPOT,
  CHASE_LOOP,
  BALL_A,
  BALL_B,
  BENCH,
  ONLOOKERS,
} from './parkConstants';
import { EASEL_CANVAS_CONF, JAR_TRAY_OFFSET, JAR_TABLE_POS, SwingSeat } from './ParkProps';
import { SketchBoard } from './SketchBoard';

const vTempA = new THREE.Vector3();
const vTempB = new THREE.Vector3();
const vTempC = new THREE.Vector3();
const vTempD = new THREE.Vector3();
const qTempA = new THREE.Quaternion();
const qTempB = new THREE.Quaternion();

function setBoneWorldQuat(bone: THREE.Object3D, worldQuat: THREE.Quaternion) {
  bone.parent!.getWorldQuaternion(qTempB);
  bone.quaternion.copy(qTempB.invert().multiply(worldQuat));
  bone.updateMatrixWorld(true);
}

function solveTwoBoneIK(
  rootBone: THREE.Object3D,
  midBone: THREE.Object3D,
  endBone: THREE.Object3D,
  targetPos: THREE.Vector3,
  poleTarget: THREE.Vector3,
  weight = 1
) {
  if (weight <= 0.001) return;
  rootBone.updateMatrixWorld(true);
  const pA = rootBone.getWorldPosition(vTempA);
  const pB = midBone.getWorldPosition(vTempB);
  const pC = endBone.getWorldPosition(vTempC);

  const lenA = pA.distanceTo(pB);
  const lenB = pB.distanceTo(pC);
  const target = vTempD.copy(targetPos);
  const dist = THREE.MathUtils.clamp(pA.distanceTo(target), 0.01, (lenA + lenB) * 0.999);

  const curAngleA = Math.acos(THREE.MathUtils.clamp(pC.clone().sub(pA).normalize().dot(pB.clone().sub(pA).normalize()), -1, 1));
  const curAngleB = Math.acos(THREE.MathUtils.clamp(pA.clone().sub(pB).normalize().dot(pC.clone().sub(pB).normalize()), -1, 1));
  const targetAngleA = Math.acos(THREE.MathUtils.clamp((lenB * lenB - lenA * lenA - dist * dist) / (-2 * lenA * dist), -1, 1));
  const targetAngleB = Math.acos(THREE.MathUtils.clamp((dist * dist - lenA * lenA - lenB * lenB) / (-2 * lenA * lenB), -1, 1));

  let planeNorm = pC.clone().sub(pA).cross(pB.clone().sub(pA));
  if (planeNorm.lengthSq() < 1e-8) {
    planeNorm.copy(poleTarget.clone().sub(pA).cross(target.clone().sub(pA)));
  }
  planeNorm.normalize();

  const rotA = rootBone.getWorldQuaternion(new THREE.Quaternion());
  const rotB = midBone.getWorldQuaternion(new THREE.Quaternion());
  const deltaA = new THREE.Quaternion().setFromAxisAngle(planeNorm, targetAngleA - curAngleA);
  const deltaB = new THREE.Quaternion().setFromAxisAngle(planeNorm, targetAngleB - curAngleB);

  const blendQuat = (q: THREE.Quaternion) => (weight < 1 ? q.slerp(new THREE.Quaternion(), 1 - weight) : q);
  setBoneWorldQuat(rootBone, blendQuat(deltaA).multiply(rotA));
  setBoneWorldQuat(midBone, blendQuat(deltaB).multiply(rotB));

  const curEndDir = endBone.getWorldPosition(new THREE.Vector3()).sub(pA);
  const targetEndDir = target.clone().sub(pA);
  const aimQuat = qTempA.setFromUnitVectors(curEndDir.clone().normalize(), targetEndDir.clone().normalize());
  if (weight < 1) aimQuat.slerp(new THREE.Quaternion(), 1 - weight);
  setBoneWorldQuat(rootBone, aimQuat.multiply(rootBone.getWorldQuaternion(new THREE.Quaternion())));

  const midPos = midBone.getWorldPosition(new THREE.Vector3());
  const endDir = endBone.getWorldPosition(new THREE.Vector3()).sub(pA).normalize();
  const projMid = midPos.clone().sub(pA).projectOnPlane(endDir);
  const projPole = poleTarget.clone().sub(pA).projectOnPlane(endDir);

  if (projMid.lengthSq() > 1e-8 && projPole.lengthSq() > 1e-8) {
    const twistQuat = new THREE.Quaternion().setFromUnitVectors(projMid.normalize(), projPole.normalize());
    if (weight < 1) twistQuat.slerp(new THREE.Quaternion(), 1 - weight);
    setBoneWorldQuat(rootBone, twistQuat.multiply(rootBone.getWorldQuaternion(new THREE.Quaternion())));
  }
}

function solveLookAtIK(
  neckBone: THREE.Object3D,
  headBone: THREE.Object3D,
  targetPos: THREE.Vector3,
  weight = 1,
  maxYaw = 1.1,
  maxPitch = 0.55
) {
  if (weight <= 0.001) return;
  headBone.updateMatrixWorld(true);
  const headPos = headBone.getWorldPosition(new THREE.Vector3());

  let actorRoot: THREE.Object3D = neckBone;
  while (actorRoot.parent && !actorRoot.userData.actorRoot) {
    actorRoot = actorRoot.parent;
  }
  const rootQuat = actorRoot.getWorldQuaternion(new THREE.Quaternion());
  const localDir = targetPos.clone().sub(headPos).normalize().applyQuaternion(rootQuat.clone().invert());
  const yaw = THREE.MathUtils.clamp(Math.atan2(localDir.x, localDir.z), -maxYaw, maxYaw) * weight;
  const pitch = THREE.MathUtils.clamp(-Math.asin(THREE.MathUtils.clamp(localDir.y, -1, 1)), -maxPitch, maxPitch) * weight;

  const euler = new THREE.Euler(pitch, yaw, 0, 'YXZ');
  const targetWorldQuat = rootQuat.clone().multiply(new THREE.Quaternion().setFromEuler(euler)).multiply(rootQuat.clone().invert());

  for (const [bone, fraction] of [
    [neckBone, 0.4],
    [headBone, 0.6],
  ] as const) {
    const blended = new THREE.Quaternion().slerp(targetWorldQuat, fraction);
    const curQ = bone.getWorldQuaternion(new THREE.Quaternion());
    setBoneWorldQuat(bone, blended.multiply(curQ));
  }
}

function rotateBoneTowards(bone: THREE.Object3D, childBone: THREE.Object3D, axis: THREE.Vector3, angle: number) {
  if (Math.abs(angle) < 1e-4) return;
  const pA = bone.getWorldPosition(new THREE.Vector3());
  const pB = childBone.getWorldPosition(new THREE.Vector3()).sub(pA).normalize();
  const cross = new THREE.Vector3().crossVectors(pB, axis);
  if (cross.lengthSq() < 1e-8) return;
  cross.normalize();
  const q = new THREE.Quaternion().setFromAxisAngle(cross, angle);
  setBoneWorldQuat(bone, q.multiply(bone.getWorldQuaternion(new THREE.Quaternion())));
}

const FINGER_NAMES = ['index', 'middle', 'ring', 'pinky'];
function curlFingers(bones: Record<string, THREE.Bone>, side: 'l' | 'r', curlAmount: number) {
  if (curlAmount <= 0.001) return;
  const hand = bones[`hand_${side}`];
  const idxBone = bones[`index_01_${side}`];
  const pinkyBone = bones[`pinky_01_${side}`];
  if (!hand || !idxBone || !pinkyBone) return;

  const handPos = hand.getWorldPosition(new THREE.Vector3());
  const fwd = idxBone.getWorldPosition(new THREE.Vector3()).add(pinkyBone.getWorldPosition(new THREE.Vector3())).multiplyScalar(0.5).sub(handPos).normalize();
  const sideVec = pinkyBone.getWorldPosition(new THREE.Vector3()).sub(idxBone.getWorldPosition(new THREE.Vector3())).normalize();
  const axis = new THREE.Vector3().crossVectors(fwd, sideVec).multiplyScalar(side === 'l' ? -1 : 1).normalize();

  for (const fName of FINGER_NAMES) {
    for (let seg = 1; seg <= 3; seg++) {
      const b = bones[`${fName}_0${seg}_${side}`];
      const nextB = bones[`${fName}_0${seg + 1}_${side}`] ?? b?.children.find((c: any) => c.isBone);
      if (b && nextB) {
        rotateBoneTowards(b, nextB as THREE.Object3D, axis, curlAmount * (seg === 1 ? 1.1 : 1.3));
      }
    }
  }
  const t2 = bones[`thumb_02_${side}`];
  const t3 = bones[`thumb_03_${side}`];
  if (t2 && t3) {
    rotateBoneTowards(t2, t3, axis, 0.6 * curlAmount);
  }
}

function dampAngle(current: number, target: number, lambda: number, delta: number) {
  let diff = target - current;
  diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  return current + diff * (1 - Math.exp(-lambda * delta));
}

function waitMs(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('aborted', 'AbortError'));
    });
  });
}

const randomRange = (min: number, max: number) => min + Math.random() * (max - min);
const randomChance = (prob: number) => Math.random() < prob;
const UP_AXIS = new THREE.Vector3(0, 1, 0);

class ActorNavigator {
  actor: ActorHandle;
  position: THREE.Vector3;
  heading: number;
  gait: { clip: string; speed: number };
  idle: string;
  speed: number;
  goal: { point: THREE.Vector3; resolve: () => void; face?: number; arriveClip?: string } | null;
  turnGoal: { heading: number; resolve: () => void; stepping: boolean } | null;

  constructor(actor: ActorHandle, { position, heading = 0, gait = { clip: 'Walk_Loop', speed: 0.8 }, idle = 'Stand' }: any) {
    this.actor = actor;
    this.position = new THREE.Vector3(...position);
    this.heading = heading;
    this.gait = gait;
    this.idle = idle;
    this.speed = 0;
    this.goal = null;
    this.turnGoal = null;
    this.apply();
  }

  apply() {
    this.actor.root.position.copy(this.position);
    this.actor.root.quaternion.setFromAxisAngle(UP_AXIS, this.heading);
  }

  get forward() {
    return new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
  }

  walkTo(point: [number, number, number] | number[], { gait = this.gait, face, arriveClip }: any = {}) {
    this.gait = gait;
    this.actor.play(gait.clip, { fade: 0.4 });
    return new Promise<void>(resolve => {
      this.goal = { point: new THREE.Vector3(...point), resolve, face, arriveClip };
    });
  }

  turnTo(targetHeading: number) {
    return new Promise<void>(resolve => {
      let diff = targetHeading - this.heading;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      if (Math.abs(diff) < 0.08) {
        resolve();
      } else {
        if (Math.abs(diff) > 0.6) {
          this.actor.play(this.gait.clip, { fade: 0.3, timeScale: 0.55 });
        }
        this.turnGoal = { heading: targetHeading, resolve, stepping: Math.abs(diff) > 0.6 };
      }
    });
  }

  update(delta: number) {
    if (this.goal) {
      const diff = this.goal.point.clone().sub(this.position).setY(0);
      const dist = diff.length();
      const targetHeading = Math.atan2(diff.x, diff.z);
      this.heading = dampAngle(this.heading, targetHeading, dist > 0.3 ? 5 : 2, delta);

      let angleDiff = targetHeading - this.heading;
      angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
      const fwdAlignment = THREE.MathUtils.clamp(Math.cos(angleDiff), 0, 1);
      const slowDown = THREE.MathUtils.smoothstep(dist, 0.02, 0.7);
      const targetSpeed = this.gait.speed * (0.25 + 0.75 * fwdAlignment) * Math.max(slowDown, 0.25);

      this.speed = THREE.MathUtils.damp(this.speed, targetSpeed, 3.5, delta);
      const step = Math.min(this.speed * delta, dist);
      this.position.addScaledVector(this.forward, step * Math.max(fwdAlignment, 0.2));
      this.actor.setSpeed(THREE.MathUtils.clamp(this.speed / this.gait.speed, 0.45, 1.25));

      if (dist < 0.06) {
        const goal = this.goal;
        this.goal = null;
        this.speed = 0;
        this.actor.play(goal.arriveClip ?? this.idle, { fade: 0.45 });
        if (goal.face !== undefined) {
          this.turnTo(goal.face).then(goal.resolve);
        } else {
          goal.resolve();
        }
      }
    } else if (this.turnGoal) {
      const rate = this.turnGoal.stepping ? 2.2 : 1.6;
      const prevH = this.heading;
      this.heading = dampAngle(this.heading, this.turnGoal.heading, rate, delta);
      let diff = this.turnGoal.heading - this.heading;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      if (Math.abs(diff) < 0.03 || Math.abs(this.heading - prevH) < 1e-4) {
        this.heading = this.turnGoal.heading;
        const tg = this.turnGoal;
        this.turnGoal = null;
        if (tg.stepping) this.actor.play(this.idle, { fade: 0.35 });
        tg.resolve();
      }
    }
    this.apply();
  }
}

export interface WorldContextType {
  set: (id: string, pos: THREE.Vector3) => void;
  interests: () => THREE.Vector3[];
  group: (id: string, center: THREE.Vector3, radius: number, label: string) => void;
  groups: () => { id: string; center: THREE.Vector3; radius: number; label: string }[];
}

export function createWorldContext(): WorldContextType {
  const points = new Map<string, THREE.Vector3>();
  const focusGroups = new Map<string, { id: string; center: THREE.Vector3; radius: number; label: string }>();

  return {
    set(id, pos) {
      if (!points.has(id)) points.set(id, new THREE.Vector3());
      points.get(id)!.copy(pos);
    },
    interests: () => (points.size ? [...points.values()] : [new THREE.Vector3(0, 1, 0)]),
    group(id, center, radius, label) {
      let g = focusGroups.get(id);
      if (!g) {
        g = { id, center: new THREE.Vector3(), radius, label };
        focusGroups.set(id, g);
      }
      g.center.copy(center);
      g.radius = radius;
      g.label = label;
    },
    groups: () => [...focusGroups.values()],
  };
}

function createArtistProps() {
  const pencil = new THREE.Mesh(
    new THREE.CylinderGeometry(0.004, 0.004, 0.14, 6).rotateX(Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: '#e2b53c', roughness: 0.6 })
  );
  const brush = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0035, 0.005, 0.2, 6).rotateX(Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: '#8a5a34', roughness: 0.5 })
  );
  const brushTip = new THREE.Mesh(
    new THREE.ConeGeometry(0.007, 0.03, 8).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: '#3f7fc4', roughness: 0.4 })
  );
  brushTip.position.z = 0.11;
  brush.add(brushTip);

  const jar = new THREE.Group();
  const jarBody = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 16), new THREE.MeshStandardMaterial({ color: '#3f7fc4', roughness: 0.35 }));
  const jarRim = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.014, 16), new THREE.MeshStandardMaterial({ color: '#e8e2d6', roughness: 0.6 }));
  jarRim.position.y = 0.046;
  jar.add(jarBody, jarRim);

  [pencil, brush, jarBody, jarRim].forEach(m => (m.castShadow = true));
  pencil.visible = false;
  brush.visible = false;

  return { pencil, brush, jar };
}

export function ArtistActor({
  board,
  canvasRef,
  world,
}: {
  board: SketchBoard;
  canvasRef: React.RefObject<THREE.Group | null>;
  world: WorldContextType;
}) {
  const actor = useActor('artist');
  const nav = useMemo(
    () => new ActorNavigator(actor, { position: EASEL_SPOT.position, heading: EASEL_SPOT.facing, gait: { clip: 'Walk_Loop', speed: 0.78 } }),
    [actor]
  );
  const props = useMemo(createArtistProps, []);
  const state = useMemo(
    () => ({
      mode: 'idle' as 'idle' | 'sketch' | 'paint',
      acc: 0,
      pause: 0,
      pen: null as [number, number] | null,
      ik: 0,
      ikOn: false,
      look: 0,
      lookOn: false,
      lookTarget: new THREE.Vector3(0, 1, 0),
      jar: 'table' as 'table' | 'hands' | 'tray',
      stroke: 0,
      activity: 'Sketching the park',
      tip: null as THREE.Vector3 | null,
    }),
    []
  );

  useEffect(() => {
    const ctrl = new AbortController();
    const { signal } = ctrl;

    const walkToSpot = (spot: { position: [number, number, number]; facing: number }) =>
      nav.walkTo(spot.position, { face: spot.facing });

    const lookAround = async (duration: number) => {
      const end = performance.now() + duration;
      while (performance.now() < end) {
        const list = world.interests();
        state.lookTarget.copy(list[Math.floor(Math.random() * list.length)]);
        state.lookOn = true;
        await waitMs(randomRange(1200, 2600), signal);
        if (randomChance(0.4)) {
          state.lookOn = false;
          await waitMs(randomRange(600, 1400), signal);
        }
      }
      state.lookOn = false;
    };

    const doPaintingSession = async (mode: 'sketch' | 'paint', seconds: number) => {
      state.activity = mode === 'sketch' ? 'Sketching the park' : 'Painting in watercolour';
      await walkToSpot(EASEL_SPOT);
      props.pencil.visible = mode === 'sketch';
      props.brush.visible = mode === 'paint';
      state.mode = mode;
      state.ikOn = true;
      state.lookOn = true;
      await waitMs(1000 * seconds, signal);
      state.mode = 'idle';
      state.pen = null;
      state.ikOn = false;
      await waitMs(500, signal);
      props.pencil.visible = false;
      props.brush.visible = false;
      state.lookOn = false;
    };

    const admireArtwork = async () => {
      state.activity = 'Looking at her drawing';
      await walkToSpot(EASEL_BACK);
      if (randomChance(0.5)) actor.play('Idle_FoldArms_Loop', { fade: 0.5 });
      canvasRef.current?.getWorldPosition(state.lookTarget);
      state.lookOn = true;
      await waitMs(randomRange(2500, 4500), signal);
      if (randomChance(0.4)) await actor.play('Yes', { loop: false, fade: 0.3 });
      actor.play('Stand', { fade: 0.5 });
      state.lookOn = false;
    };

    const takeInView = async () => {
      state.activity = 'Taking in the view';
      await walkToSpot(VIEW_SPOT);
      await lookAround(randomRange(4000, 7000));
    };

    const fetchPaint = async () => {
      state.activity = 'Fetching paint';
      await walkToSpot(TABLE_SPOT);
      const pickAction = actor.play('PickUp_Table', { loop: false, fade: 0.3 });
      await waitMs(450 * actor.duration('PickUp_Table'), signal);
      state.jar = 'hands';
      await pickAction;
      nav.walkTo(EASEL_SPOT.position, { gait: { clip: 'Walk_Carry_Loop', speed: 0.62 }, face: EASEL_SPOT.facing });
      await new Promise<void>(res => {
        const check = () => (nav.goal || nav.turnGoal ? requestAnimationFrame(check) : res());
        check();
      });
      nav.gait = { clip: 'Walk_Loop', speed: 0.78 };
      await actor.play('Interact', { loop: false, fade: 0.25 });
      state.jar = 'tray';
      actor.play('Stand', { fade: 0.4 });
    };

    const returnPaint = async () => {
      state.activity = 'Putting the paint back';
      await walkToSpot(EASEL_SPOT);
      await actor.play('Interact', { loop: false, fade: 0.25 });
      state.jar = 'hands';
      actor.play('Stand', { fade: 0.3 });
      await nav.walkTo(TABLE_SPOT.position, { gait: { clip: 'Walk_Carry_Loop', speed: 0.62 }, face: TABLE_SPOT.facing });
      nav.gait = { clip: 'Walk_Loop', speed: 0.78 };
      await actor.play('Interact', { loop: false, fade: 0.25 });
      state.jar = 'table';
      actor.play('Stand', { fade: 0.4 });
    };

    const startFreshSheet = async () => {
      state.activity = 'Starting a fresh sheet';
      await walkToSpot(EASEL_SPOT);
      await actor.play('Interact', { loop: false, fade: 0.25 });
      board.reset();
      actor.play('Stand', { fade: 0.4 });
      await waitMs(900, signal);
    };

    (async () => {
      actor.play('Stand', { fade: 0 });
      await waitMs(600, signal);
      while (true) {
        if (board.sketchDone) {
          if (board.paintDone) {
            await admireArtwork();
            await returnPaint();
            if (randomChance(0.5)) await takeInView();
            await startFreshSheet();
          } else {
            if (state.jar !== 'tray') await fetchPaint();
            await doPaintingSession('paint', randomRange(10, 18));
            if (!board.paintDone && randomChance(0.5)) await admireArtwork();
          }
        } else {
          await doPaintingSession('sketch', randomRange(12, 22));
          if (board.sketchDone) continue;
          const roll = Math.random();
          if (roll < 0.45) await admireArtwork();
          else if (roll < 0.7) await takeInView();
          else await lookAround(randomRange(1500, 3000));
        }
      }
    })().catch(err => {
      if (err.name !== 'AbortError') throw err;
    });

    return () => ctrl.abort();
  }, [actor, nav, board, canvasRef, props, state, world]);

  const pFwd = useMemo(() => new THREE.Vector3(), []);
  const pPos = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    nav.update(delta);
    const bones = actor.bones;
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (state.mode === 'sketch' || state.mode === 'paint') {
      if (state.pause > 0) {
        state.pause -= delta;
      } else {
        state.acc += delta * (state.mode === 'sketch' ? 36 : 7);
        const steps = Math.floor(state.acc);
        if (steps > 0) {
          state.acc -= steps;
          const prevIdx = board.strokeIndex;
          const pt = state.mode === 'sketch' ? board.sketch(steps) : board.paint(steps);
          if (pt) state.pen = pt;
          if (state.mode === 'sketch' && board.strokeIndex !== prevIdx) {
            const lastStroke = board.strokes[board.strokeIndex - 1];
            state.pause = lastStroke && lastStroke.points.length > 10 ? randomRange(0.25, 0.7) : randomRange(0.03, 0.12);
          }
          if (state.mode === 'paint' && randomChance(0.08)) {
            state.pause = randomRange(0.3, 0.8);
          }
        }
      }
    }

    const norm = pFwd.set(0, 0, 1).transformDirection(canvas.matrixWorld);
    if (state.pen) {
      const [u, v] = state.pen;
      const [w, h] = EASEL_CANVAS_CONF.size;
      const targetLocal = pPos.set((u - 0.5) * w, (0.5 - v) * h, 0.004);
      const worldTip = canvas.localToWorld(targetLocal);
      worldTip.addScaledVector(norm, 0.05 * (state.pause > 0 ? 1 : 0));
      state.tip = (state.tip ?? worldTip.clone()).lerp(worldTip, 1 - Math.exp(-14 * delta));
    }

    state.ik = THREE.MathUtils.damp(state.ik, state.ikOn && state.pen ? 1 : 0, 4, delta);
    if (state.ik > 0.001 && state.tip && bones.upperarm_r && bones.lowerarm_r && bones.hand_r) {
      const shoulderPos = bones.upperarm_r.getWorldPosition(new THREE.Vector3());
      const offset = state.mode === 'paint' ? 0.15 : 0.1;
      const reachTarget = state.tip.clone().add(shoulderPos.clone().sub(state.tip).normalize().multiplyScalar(offset));
      const rightVec = new THREE.Vector3(-1, 0, 0).applyQuaternion(actor.root.quaternion);
      const polePos = shoulderPos.clone().add(new THREE.Vector3(0, -0.45, 0)).addScaledVector(rightVec, 0.3).addScaledVector(norm, 0.2);
      solveTwoBoneIK(bones.upperarm_r, bones.lowerarm_r, bones.hand_r, reachTarget, polePos, state.ik);

      const tool = state.mode === 'paint' ? props.brush : props.pencil;
      const handPos = bones.hand_r.getWorldPosition(new THREE.Vector3());
      const toolDir = state.tip.clone().sub(handPos).normalize();
      tool.position.copy(state.tip).addScaledVector(toolDir, state.mode === 'paint' ? -0.1 : -0.07);
      tool.lookAt(state.tip);
    }

    if (state.ik > 0.3 && state.tip) {
      state.lookTarget.lerp(state.tip, 1 - Math.exp(-6 * delta));
    }
    state.look = THREE.MathUtils.damp(state.look, +state.lookOn, 3, delta);
    if (bones.neck_01 && bones.Head) {
      solveLookAtIK(bones.neck_01, bones.Head, state.lookTarget, 0.9 * state.look);
    }

    if (state.jar === 'hands' && bones.hand_l && bones.hand_r) {
      const hL = bones.hand_l.getWorldPosition(new THREE.Vector3());
      const hR = bones.hand_r.getWorldPosition(new THREE.Vector3());
      props.jar.position.copy(hL).lerp(hR, 0.5).add(new THREE.Vector3(0, -0.03, 0));
    } else if (state.jar === 'tray' && canvas.parent) {
      canvas.parent.localToWorld(props.jar.position.set(...JAR_TRAY_OFFSET));
    } else {
      props.jar.position.set(...JAR_TABLE_POS);
    }

    if (bones.pelvis) {
      const pelvisPos = bones.pelvis.getWorldPosition(new THREE.Vector3());
      const easelPos = canvas.getWorldPosition(new THREE.Vector3());
      const dist = Math.hypot(pelvisPos.x - easelPos.x, pelvisPos.z - easelPos.z);
      world.group('artist', pelvisPos.clone().lerp(easelPos, dist < 1.5 ? 0.4 : 0.1), 0.75 + 0.4 * Math.min(dist, 1.5), state.activity);
    }
  });

  return (
    <>
      <primitive object={actor.root} />
      <primitive object={props.pencil} />
      <primitive object={props.brush} />
      <primitive object={props.jar} />
    </>
  );
}

const SWING_FREQ = Math.sqrt(9.81 / 1.84);

export function SwingerActor({ world }: { world: WorldContextType }) {
  const actor = useActor('swinger');
  const pivotA = useRef<THREE.Group>(null);
  const pivotB = useRef<THREE.Group>(null);
  const swingState = useRef({ t: 0, amp: 0.45, goal: 0.45, nextChange: 6, pump: 0 });

  useEffect(() => {
    swingState.current.t = 10 * Math.random();
    actor.play('Sitting_Idle_Loop', { fade: 0 });
    actor.root.position.set(0, -1.84 - 0.19, 0.12);
    actor.root.rotation.set(0, 0, 0);
  }, [actor]);

  useFrame((_, delta) => {
    const s = swingState.current;
    s.t += delta;
    s.nextChange -= delta;
    if (s.nextChange < 0) {
      s.goal = 0.32 + 0.22 * Math.random();
      s.nextChange = 6 + 8 * Math.random();
    }
    s.amp = THREE.MathUtils.damp(s.amp, s.goal, 0.3, delta);
    const phase = SWING_FREQ * s.t;
    const angle = s.amp * Math.sin(phase);
    const pumpDir = -Math.cos(phase);

    if (pivotA.current) pivotA.current.rotation.x = angle;
    if (pivotB.current) pivotB.current.rotation.x = 0.04 * Math.sin(0.98 * phase + 1.3);

    const pivot = pivotA.current;
    if (!pivot) return;
    const bones = actor.bones;
    s.pump = THREE.MathUtils.damp(s.pump, pumpDir, 6, delta);
    const pump = s.pump;

    const pivotQuat = pivot.getWorldQuaternion(new THREE.Quaternion());
    const zDir = new THREE.Vector3(0, 0, 1).applyQuaternion(pivotQuat);
    const yDir = new THREE.Vector3(0, 1, 0).applyQuaternion(pivotQuat);
    const negZ = zDir.clone().negate();
    const negY = yDir.clone().negate();

    if (bones.spine_01 && bones.spine_02) rotateBoneTowards(bones.spine_01, bones.spine_02, negZ, 0.16 * Math.max(pump, 0) - 0.08 * Math.max(-pump, 0));
    if (bones.spine_02 && bones.spine_03) rotateBoneTowards(bones.spine_02, bones.spine_03, negZ, 0.08 * pump);

    for (const side of ['l', 'r'] as const) {
      const thigh = bones[`thigh_${side}`];
      const calf = bones[`calf_${side}`];
      const foot = bones[`foot_${side}`];
      if (thigh && calf) rotateBoneTowards(thigh, calf, yDir, 0.12 * Math.max(pump, 0));
      if (calf && foot) rotateBoneTowards(calf, foot, zDir, pump > 0 ? 0.85 * pump : 0.45 * pump);
    }

    for (const [side, xOff] of [
      ['l', 0.215],
      ['r', -0.215],
    ] as const) {
      const gripPos = pivot.localToWorld(new THREE.Vector3(xOff, -1.56, 0));
      const shoulder = bones[`upperarm_${side}`];
      if (shoulder && bones[`lowerarm_${side}`] && bones[`hand_${side}`]) {
        const shoulderPos = shoulder.getWorldPosition(new THREE.Vector3());
        const armDir = gripPos.clone().sub(shoulderPos).projectOnPlane(yDir).normalize();
        const pole = shoulderPos.clone().addScaledVector(negY, 0.5).addScaledVector(armDir, 0.15).addScaledVector(zDir, 0.05);
        solveTwoBoneIK(shoulder, bones[`lowerarm_${side}`], bones[`hand_${side}`], gripPos, pole, 1);
        curlFingers(bones, side, 1);
      }
    }

    const lookSpot = pivot.localToWorld(new THREE.Vector3(0, -1.84 + 0.9, 3));
    lookSpot.y -= 0.4 + 0.3 * Math.max(pump, 0);
    if (bones.neck_01 && bones.Head) {
      solveLookAtIK(bones.neck_01, bones.Head, lookSpot, 0.6);
      world.set('swinger', bones.Head.getWorldPosition(new THREE.Vector3()));
    }
    if (bones.spine_02) {
      world.group('swing', bones.spine_02.getWorldPosition(new THREE.Vector3()), 0.95, 'On the swing');
    }
  });

  return (
    <>
      <SwingSeat offset={-0.55} pivotRef={pivotA}>
        <primitive object={actor.root} />
      </SwingSeat>
      <SwingSeat offset={0.55} pivotRef={pivotB} />
    </>
  );
}

const GRAVITY = new THREE.Vector3(0, -9.81, 0);
const BALL_SPOTS: [number, number, number][] = [BALL_A.position, BALL_B.position];
const angleBetween = (a: [number, number, number], b: [number, number, number]) => Math.atan2(b[0] - a[0], b[2] - a[2]);
const flattenXZ = (v: THREE.Vector3) => new THREE.Vector3(v.x, 0, v.z);

export function CatchActors({ world }: { world: WorldContextType }) {
  const actorA = useActor('thrower_a');
  const actorB = useActor('thrower_b');
  const actors = useMemo(() => [actorA, actorB], [actorA, actorB]);
  const navs = useMemo(
    () => [
      new ActorNavigator(actorA, { position: BALL_SPOTS[0], heading: angleBetween(BALL_SPOTS[0], BALL_SPOTS[1]), gait: { clip: 'Walk_Loop', speed: 0.8 } }),
      new ActorNavigator(actorB, { position: BALL_SPOTS[1], heading: angleBetween(BALL_SPOTS[1], BALL_SPOTS[0]), gait: { clip: 'Walk_Loop', speed: 0.8 } }),
    ],
    [actorA, actorB]
  );

  const ballMesh = useRef<THREE.Mesh>(null);
  const catchState = useRef({
    mode: 'held' as 'held' | 'hand' | 'flight' | 'loose' | 'crouch' | 'pass' | 'dribble',
    holder: 0,
    flight: null as any,
    vel: new THREE.Vector3(),
    grip: [1, 0],
    reachTarget: [null, null] as (THREE.Vector3 | null)[],
    passT: 0,
    dribbleT: 0,
    onFlightEnd: null as ((res: string) => void) | null,
  });

  useEffect(() => {
    const ctrl = new AbortController();
    const { signal } = ctrl;
    const s = catchState.current;

    actorA.play('Stand', { fade: 0 });
    actorB.play('Stand', { fade: 0, from: 1.1 });

    const getCatcherTarget = (throwerIdx: number, catcherIdx: number, quality: string) => {
      const { upperarm_l, upperarm_r } = actors[catcherIdx].bones;
      const chestPos = upperarm_l.getWorldPosition(new THREE.Vector3()).lerp(upperarm_r.getWorldPosition(new THREE.Vector3()), 0.5).addScaledVector(navs[catcherIdx].forward, 0.27).add(new THREE.Vector3(0, -0.11, 0));
      const rightDir = new THREE.Vector3().crossVectors(navs[catcherIdx].forward, UP_AXIS);

      if (quality === 'good') {
        chestPos.addScaledVector(rightDir, randomRange(-0.12, 0.12)).add(new THREE.Vector3(0, randomRange(-0.08, 0.08), 0));
      } else if (quality === 'wide') {
        chestPos.addScaledVector(rightDir, (randomChance(0.5) ? 1 : -1) * randomRange(0.26, 0.42)).add(new THREE.Vector3(0, randomRange(-0.12, 0.3), 0));
      } else {
        const toCatcher = flattenXZ(navs[catcherIdx].position.clone().sub(navs[throwerIdx].position)).normalize();
        chestPos.copy(navs[catcherIdx].position).addScaledVector(toCatcher, -randomRange(1, 1.8)).setY(0.1);
      }
      return chestPos;
    };

    const tossBall = (from: THREE.Vector3, to: THREE.Vector3, speed: number, catcher: number, quality: string) =>
      new Promise<string>(resolve => {
        const time = from.distanceTo(to) / speed + (quality === 'short' ? 0.25 : 0.1);
        const vel = to.clone().sub(from).addScaledVector(GRAVITY, -0.5 * time * time).divideScalar(time);
        s.flight = { from: from.clone(), to, v: vel, t: 0, T: time, catcher, quality, fumble: quality === 'wide' && randomChance(0.25) };
        s.mode = 'flight';
        s.onFlightEnd = resolve;
      });

    const throwOverhand = async (thrower: number, catcher: number, quality: string) => {
      const a = actors[thrower];
      s.mode = 'hand';
      const action = a.action('OverhandThrow');
      action.reset();
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      action.time = 0.12;
      action.setEffectiveTimeScale(1);
      action.play();
      action.fadeIn(0.22);
      a.action('Stand').setEffectiveWeight(0.55);
      while (action.time < 0.34) await waitMs(16, signal);
      setTimeout(() => {
        action.fadeOut(0.45);
        a.action('Stand').setEffectiveWeight(1);
      }, 160);
      return tossBall(ballMesh.current!.position, getCatcherTarget(thrower, catcher, quality), 7, catcher, quality);
    };

    const throwUnderhand = async (thrower: number, catcher: number, quality: string) => {
      s.mode = 'pass';
      s.passT = 0;
      while (s.passT < 0.42) await waitMs(16, signal);
      return tossBall(ballMesh.current!.position, getCatcherTarget(thrower, catcher, quality), 5.5, catcher, quality);
    };

    const dribbleBall = async (count: number) => {
      s.mode = 'dribble';
      s.dribbleT = 0;
      await waitMs(0.62 * count * 1000, signal);
      s.mode = 'held';
    };

    const fetchFumbledBall = async (catcher: number) => {
      const other = 1 - catcher;
      actors[other].play('Idle_FoldArms_Loop', { fade: 0.5 });
      await waitMs(randomRange(500, 900), signal);
      const bPos = ballMesh.current!.position;
      const cPos = navs[catcher].position;
      const diff = flattenXZ(bPos.clone().sub(cPos));
      const dist = diff.length();
      const pickupSpot = cPos.clone().addScaledVector(diff.normalize(), Math.max(0, dist - 0.4));
      await navs[catcher].walkTo([pickupSpot.x, 0, pickupSpot.z], { gait: dist > 2 ? { clip: 'Jog_Fwd_Loop', speed: 1.8 } : { clip: 'Walk_Loop', speed: 0.8 } });
      actors[catcher].play('Crouch_Idle_Loop', { fade: 0.3 });
      s.holder = catcher;
      s.mode = 'crouch';
      await waitMs(700, signal);
      s.mode = 'held';
      await waitMs(250, signal);
      actors[catcher].play('Stand', { fade: 0.4 });
      await waitMs(350, signal);
      await navs[catcher].walkTo(BALL_SPOTS[catcher], { gait: { clip: 'Walk_Loop', speed: 0.8 }, face: angleBetween(BALL_SPOTS[catcher], BALL_SPOTS[1 - catcher]) });
      actors[other].play('Stand', { fade: 0.5 });
    };

    (async () => {
      await waitMs(randomRange(800, 1600), signal);
      while (true) {
        const holder = s.holder;
        const other = 1 - holder;
        await waitMs(randomRange(900, 2200), signal);
        if (randomChance(0.3)) await dribbleBall(randomChance(0.5) ? 1 : 2);
        const roll = Math.random();
        const quality = roll < 0.12 ? 'short' : roll < 0.34 ? 'wide' : 'good';
        const outcome = randomChance(0.35) ? await throwUnderhand(holder, other, quality) : await throwOverhand(holder, other, quality);
        if (outcome === 'caught') {
          s.holder = other;
          if (randomChance(0.25)) {
            await waitMs(400, signal);
            actors[holder].play('Yes', { loop: false, fade: 0.3 }).then(() => actors[holder].play('Stand', { fade: 0.4 }));
          }
        } else {
          await fetchFumbledBall(other);
        }
      }
    })().catch(err => {
      if (err.name !== 'AbortError') throw err;
    });

    return () => ctrl.abort();
  }, [actorA, actorB, actors, navs]);

  useFrame((_, delta) => {
    const s = catchState.current;
    const ball = ballMesh.current;
    if (!ball) return;
    navs[0].update(delta);
    navs[1].update(delta);

    const getChestPos = (idx: number) => {
      const { upperarm_l, upperarm_r } = actors[idx].bones;
      return upperarm_l.getWorldPosition(new THREE.Vector3()).lerp(upperarm_r.getWorldPosition(new THREE.Vector3()), 0.5).addScaledVector(navs[idx].forward, 0.27).add(new THREE.Vector3(0, -0.11, 0));
    };

    if (s.mode === 'flight') {
      const f = s.flight;
      f.t += delta;
      ball.position.copy(f.from).addScaledVector(f.v, f.t).addScaledVector(GRAVITY, 0.5 * f.t * f.t);
      ball.rotation.x += 9 * delta;

      const arrived = f.quality !== 'short' && f.t >= f.T;
      if (arrived && f.fumble) {
        s.vel.copy(f.v).addScaledVector(GRAVITY, f.t).multiplyScalar(-0.25).add(new THREE.Vector3(randomRange(-0.8, 0.8), 1.4, randomRange(-0.8, 0.8)));
        s.mode = 'loose';
        s.flight = null;
        s.onFlightEnd?.('ground');
      } else if (arrived) {
        s.mode = 'held';
        s.holder = f.catcher;
        s.grip[f.catcher] = 1;
        s.flight = null;
        s.onFlightEnd?.('caught');
      } else if (ball.position.y <= 0.1) {
        s.vel.copy(f.v).addScaledVector(GRAVITY, f.t);
        s.mode = 'loose';
        s.flight = null;
        s.onFlightEnd?.('ground');
      }
    } else if (s.mode === 'loose') {
      s.vel.addScaledVector(GRAVITY, delta);
      ball.position.addScaledVector(s.vel, delta);
      if (ball.position.y < 0.1) {
        ball.position.y = 0.1;
        if (s.vel.y < -0.6) {
          s.vel.y = -0.55 * s.vel.y;
          s.vel.x *= 0.75;
          s.vel.z *= 0.75;
        } else {
          s.vel.y = 0;
          const decay = Math.exp(-2.2 * delta);
          s.vel.x *= decay;
          s.vel.z *= decay;
        }
      }
      ball.rotation.x += (Math.hypot(s.vel.x, s.vel.z) / 0.1) * delta;
    }

    for (let i = 0; i < 2; i++) {
      const bones = actors[i].bones;
      const fwd = navs[i].forward;
      const right = new THREE.Vector3(-1, 0, 0).applyQuaternion(actors[i].root.quaternion);
      const isHolder = s.holder === i;
      let reachTarget: THREE.Vector3 | null = null;
      let gripGoal = 0;
      let spineAim: THREE.Vector3 | null = null;

      if (isHolder && s.mode === 'held') {
        reachTarget = getChestPos(i);
        gripGoal = 1;
      } else if (isHolder && s.mode === 'pass') {
        s.passT += delta;
        const pt = s.passT;
        const fwdPush = pt < 0.15 ? -((pt / 0.15) * 0.08) : -0.08 + 0.52 * THREE.MathUtils.smoothstep(pt, 0.15, 0.42);
        reachTarget = getChestPos(i).addScaledVector(fwd, fwdPush).add(new THREE.Vector3(0, 0.04, 0));
        gripGoal = 1;
        spineAim = fwd.clone();
      } else if (isHolder && s.mode === 'dribble') {
        s.dribbleT += delta;
        const normT = (s.dribbleT % 0.62) / 0.62;
        const chest = getChestPos(i);
        const topH = chest.y - 0.08;
        const handRest = chest.addScaledVector(fwd, 0.08).addScaledVector(right, 0.14);
        ball.position.set(handRest.x, 0.1 + (topH - 0.1) * (1 - 2 * normT) ** 2, handRest.z);
        ball.rotation.x += 4 * delta;
        const armTarget = ball.position.clone().add(new THREE.Vector3(0, 0.13, 0));
        armTarget.y = Math.max(armTarget.y, topH - 0.1);
        const pole = getChestPos(i).add(new THREE.Vector3(0, -0.4, 0)).addScaledVector(right, 0.4);
        if (bones.upperarm_r && bones.lowerarm_r && bones.hand_r) {
          solveTwoBoneIK(bones.upperarm_r, bones.lowerarm_r, bones.hand_r, armTarget, pole, 1);
        }
      } else if (isHolder && s.mode === 'crouch') {
        reachTarget = ball.position.clone();
        gripGoal = 1;
      } else if (s.mode === 'flight' && s.flight.catcher === i && s.flight.quality !== 'short') {
        const timeLeft = s.flight.T - s.flight.t;
        reachTarget = s.flight.to.clone().lerp(ball.position, 0.25);
        gripGoal = THREE.MathUtils.smoothstep(0.55 - timeLeft, 0, 0.45);
        spineAim = flattenXZ(s.flight.to.clone().sub(getChestPos(i)));
      }

      s.grip[i] = THREE.MathUtils.damp(s.grip[i], gripGoal, gripGoal > s.grip[i] ? 9 : 5, delta);
      if (reachTarget) s.reachTarget[i] = reachTarget;
      const g = s.grip[i];

      if (g > 0.001 && s.reachTarget[i] && bones.spine_03) {
        const spinePos = bones.spine_03.getWorldPosition(new THREE.Vector3());
        for (const [side, sideSign] of [
          ['l', -1],
          ['r', 1],
        ] as const) {
          const armTarget = s.reachTarget[i]!.clone().addScaledVector(right, 0.13 * sideSign).addScaledVector(fwd, -0.03);
          const pole = spinePos.clone().addScaledVector(new THREE.Vector3(0, -1, 0), 0.45).addScaledVector(right, 0.35 * sideSign).addScaledVector(fwd, -0.1);
          if (bones[`upperarm_${side}`] && bones[`lowerarm_${side}`] && bones[`hand_${side}`]) {
            solveTwoBoneIK(bones[`upperarm_${side}`], bones[`lowerarm_${side}`], bones[`hand_${side}`], armTarget, pole, g);
            curlFingers(bones, side, 0.35 * g);
          }
        }
      }

      if (spineAim && spineAim.lengthSq() > 0.01 && bones.spine_01 && bones.spine_02) {
        rotateBoneTowards(bones.spine_01, bones.spine_02, spineAim.normalize(), 0.12 * g);
      }

      if (isHolder && ['held', 'pass', 'crouch'].includes(s.mode) && g > 0.6 && bones.hand_l && bones.hand_r) {
        const hL = bones.hand_l.getWorldPosition(new THREE.Vector3());
        const hR = bones.hand_r.getWorldPosition(new THREE.Vector3());
        ball.position.copy(hL).lerp(hR, 0.5).addScaledVector(fwd, 0.05);
      } else if (isHolder && s.mode === 'hand' && bones.hand_r && bones.middle_01_r) {
        const hR = bones.hand_r.getWorldPosition(new THREE.Vector3());
        const midR = bones.middle_01_r.getWorldPosition(new THREE.Vector3());
        ball.position.copy(hR).lerp(midR, 0.8);
      }

      if (bones.neck_01 && bones.Head) {
        solveLookAtIK(bones.neck_01, bones.Head, ball.position, 0.85);
      }
    }

    world.set('ball', ball.position);
    if (actors[0].bones.pelvis && actors[1].bones.pelvis) {
      const pA = actors[0].bones.pelvis.getWorldPosition(new THREE.Vector3());
      const pB = actors[1].bones.pelvis.getWorldPosition(new THREE.Vector3());
      const center = pA.clone().add(pB).add(ball.position).divideScalar(3);
      const rad = Math.max(center.distanceTo(pA), center.distanceTo(pB), center.distanceTo(ball.position)) + 0.55;
      const label = s.mode === 'loose' || s.mode === 'crouch' ? 'Fetching the ball' : s.mode === 'dribble' ? 'Bouncing the ball' : 'Playing catch';
      world.group('catch', center, rad, label);
    }
  });

  return (
    <>
      <primitive object={actorA.root} />
      <primitive object={actorB.root} />
      <mesh ref={ballMesh} castShadow>
        <sphereGeometry args={[0.1, 24, 16]} />
        <meshStandardMaterial color="#d9483b" roughness={0.55} />
      </mesh>
    </>
  );
}

export function TagActors({ world }: { world: WorldContextType }) {
  const actorA = useActor('runner_a');
  const actorB = useActor('runner_b');
  const spline = useMemo(() => new THREE.CatmullRomCurve3(CHASE_LOOP.map(pt => new THREE.Vector3(...pt)), true, 'centripetal'), []);
  const loopLen = useMemo(() => spline.getLength(), [spline]);

  const tagState = useRef({
    runners: [
      { d: 3.2, speed: 0, goal: 2.1, heading: 0, clip: '', pause: 0, actor: actorA },
      { d: 0, speed: 0, goal: 2.3, heading: 0, clip: '', pause: 0, actor: actorB },
    ],
    it: 1,
    wobble: 0,
  });

  useFrame((_, delta) => {
    const s = tagState.current;
    s.runners[0].actor = actorA;
    s.runners[1].actor = actorB;
    s.wobble += delta;

    const [rA, rB] = s.runners;
    const itRunner = s.runners[s.it];
    const chaser = s.runners[1 - s.it];

    const distGap = (((chaser.d - itRunner.d) % loopLen) + loopLen) % loopLen;
    if (distGap < 0.55 && itRunner.pause <= 0 && chaser.pause <= 0) {
      chaser.pause = randomRange(1.6, 2.4);
      itRunner.pause = 0.6;
      s.it = 1 - s.it;
    }

    for (const r of [rA, rB]) {
      const isIt = r === s.runners[s.it];
      if (r.pause > 0) {
        r.pause -= delta;
        r.goal = 0;
      } else {
        r.goal = 2 + 0.35 * Math.sin(0.37 * s.wobble + (isIt ? 0 : 2.1)) + (isIt ? 0.25 : 0);
      }
      r.speed = THREE.MathUtils.damp(r.speed, r.goal, r.goal > r.speed ? 1.8 : 3.5, delta);
      r.d = (r.d + r.speed * delta) % loopLen;

      const normT = r.d / loopLen;
      const pt = spline.getPointAt(normT);
      const tangent = spline.getTangentAt(normT);
      const targetHead = Math.atan2(tangent.x, tangent.z);
      r.heading = dampAngle(r.heading || targetHead, targetHead, 8, delta);
      r.actor.root.position.set(pt.x, 0, pt.z);
      r.actor.root.rotation.set(0, r.heading, 0);

      const gaitClip = r.speed < 0.25 ? 'Stand' : r.speed < 1.2 ? 'Walk_Loop' : r.speed < 2.6 ? 'Jog_Fwd_Loop' : 'Sprint_Loop';
      if (gaitClip !== r.clip) {
        r.actor.play(gaitClip, { fade: 0.35 });
        r.clip = gaitClip;
      }
      const baseSpd = gaitClip === 'Walk_Loop' ? 0.8 : gaitClip === 'Jog_Fwd_Loop' ? 1.9 : 3;
      if (gaitClip !== 'Stand') {
        r.actor.setSpeed(THREE.MathUtils.clamp(r.speed / baseSpd, 0.6, 1.3));
      }
      const otherHead = (r === rA ? rB : rA).actor.bones.Head?.getWorldPosition(new THREE.Vector3());
      if (otherHead && r.actor.bones.neck_01 && r.actor.bones.Head) {
        solveLookAtIK(r.actor.bones.neck_01, r.actor.bones.Head, otherHead, r.pause > 0 ? 0.9 : 0.55);
      }
    }

    world.set('runner', rA.actor.root.position.clone().setY(1));
    const pA = rA.actor.root.position.clone().setY(0.7);
    const pB = rB.actor.root.position.clone().setY(0.7);
    const tagged = rA.pause > 0 || rB.pause > 0;
    world.group('tag', pA.clone().lerp(pB, 0.5), Math.min(pA.distanceTo(pB) / 2 + 0.7, 3), tagged ? "Tagged — you're it!" : 'Playing tag');
  });

  return (
    <>
      <primitive object={actorA.root} />
      <primitive object={actorB.root} />
    </>
  );
}

const BENCH_FEET: [number, number, number][] = [
  [0.12, 0.01, 0.3],
  [-0.13, 0.01, 0.27],
];

export function ParentActor({ world }: { world: WorldContextType }) {
  const actor = useActor('parent');
  const parentState = useMemo(() => ({ target: new THREE.Vector3(-3.6, 1, -3.4), look: 0, smooth: null as THREE.Vector3 | null }), []);

  useEffect(() => {
    const ctrl = new AbortController();
    const { signal } = ctrl;
    const [bx, , bz] = BENCH.position;
    const fwd = new THREE.Vector3(Math.sin(BENCH.rotation), 0, Math.cos(BENCH.rotation));
    actor.root.position.set(bx, 0.07, bz).addScaledVector(fwd, 0.19);
    actor.root.rotation.set(0, BENCH.rotation, 0);
    actor.play('Sitting_Idle_Loop', { fade: 0 });

    (async () => {
      while (true) {
        const list = world.interests();
        parentState.target.copy(list[Math.floor(Math.random() * list.length)]);
        await waitMs(randomRange(2500, 6000), signal);
        if (Math.random() < 0.12) {
          actor.play('Sitting_Talking_Loop', { fade: 0.8 });
          await waitMs(randomRange(3000, 5000), signal);
          actor.play('Sitting_Idle_Loop', { fade: 0.8 });
        }
      }
    })().catch(err => {
      if (err.name !== 'AbortError') throw err;
    });

    return () => ctrl.abort();
  }, [actor, parentState, world]);

  useFrame((_, delta) => {
    const bones = actor.bones;
    const root = actor.root;
    const negZ = new THREE.Vector3(0, 0, -1).applyQuaternion(root.quaternion);

    if (bones.spine_01 && bones.spine_02) rotateBoneTowards(bones.spine_01, bones.spine_02, negZ, 0.2);
    if (bones.spine_02 && bones.spine_03) rotateBoneTowards(bones.spine_02, bones.spine_03, negZ, 0.1);

    BENCH_FEET.forEach(([x, y, z], idx) => {
      const side = idx === 0 ? 'l' : 'r';
      const footTarget = root.localToWorld(new THREE.Vector3(x, y, z));
      const kneePole = root.localToWorld(new THREE.Vector3(1.2 * x, 0.5, 1));
      if (bones[`thigh_${side}`] && bones[`calf_${side}`] && bones[`foot_${side}`]) {
        solveTwoBoneIK(bones[`thigh_${side}`], bones[`calf_${side}`], bones[`foot_${side}`], footTarget, kneePole, 1);
      }
    });

    for (const side of ['l', 'r'] as const) {
      const thigh = bones[`thigh_${side}`];
      const calf = bones[`calf_${side}`];
      if (thigh && calf && bones[`upperarm_${side}`] && bones[`lowerarm_${side}`] && bones[`hand_${side}`]) {
        const restPos = thigh.getWorldPosition(new THREE.Vector3()).lerp(calf.getWorldPosition(new THREE.Vector3()), 0.55);
        restPos.y += 0.09;
        const polePos = root.localToWorld(new THREE.Vector3(side === 'l' ? 0.35 : -0.35, 0.55, -0.3));
        solveTwoBoneIK(bones[`upperarm_${side}`], bones[`lowerarm_${side}`], bones[`hand_${side}`], restPos, polePos, 1);
      }
    }

    parentState.look = THREE.MathUtils.damp(parentState.look, 1, 1, delta);
    parentState.smooth = (parentState.smooth ?? parentState.target.clone()).lerp(parentState.target, 1 - Math.exp(-2.5 * delta));
    if (bones.neck_01 && bones.Head) {
      solveLookAtIK(bones.neck_01, bones.Head, parentState.smooth, 0.8 * parentState.look);
    }
    if (bones.spine_02) {
      world.group('parent', bones.spine_02.getWorldPosition(new THREE.Vector3()), 0.85, 'Watching from the bench');
    }
  });

  return <primitive object={actor.root} />;
}

function OnlookerActor({
  spot,
  index,
  canvasRef,
  world,
  selfRef,
  peerRef,
}: {
  spot: (typeof ONLOOKERS)[0];
  index: number;
  canvasRef: React.RefObject<THREE.Group | null>;
  world: WorldContextType;
  selfRef: React.MutableRefObject<ActorHandle | null>;
  peerRef: React.MutableRefObject<ActorHandle | null>;
}) {
  const actor = useActor(spot.name);
  const lookState = useRef({ mode: 'sheet' as 'sheet' | 'artist' | 'peer', smooth: null as THREE.Vector3 | null });

  useEffect(() => {
    const ctrl = new AbortController();
    const { signal } = ctrl;
    actor.root.position.set(...spot.position);
    actor.root.rotation.set(0, spot.facing, 0);
    actor.play('Stand', { fade: 0, from: 1.3 * index });
    selfRef.current = actor;

    (async () => {
      await waitMs(randomRange(500, 2500), signal);
      while (true) {
        await waitMs(randomRange(3000, 7000), signal);
        const roll = Math.random();
        if (roll < 0.3) {
          actor.play('Idle_FoldArms_Loop', { fade: 0.7 });
          await waitMs(randomRange(4000, 8000), signal);
          actor.play('Stand', { fade: 0.7 });
        } else if (roll < 0.5) {
          await actor.play('Yes', { loop: false, fade: 0.35 });
          actor.play('Stand', { fade: 0.5 });
        } else if (roll < 0.75) {
          lookState.current.mode = randomChance(0.5) ? 'artist' : 'peer';
          await waitMs(randomRange(1500, 3000), signal);
          lookState.current.mode = 'sheet';
        }
      }
    })().catch(err => {
      if (err.name !== 'AbortError') throw err;
    });

    return () => ctrl.abort();
  }, [actor, spot, index, selfRef]);

  useFrame((_, delta) => {
    const bones = actor.bones;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ls = lookState.current;
    let target = canvas.getWorldPosition(new THREE.Vector3());

    const artistGroup = world.groups().find(g => g.id === 'artist');
    if (ls.mode === 'artist' && artistGroup) {
      target = artistGroup.center.clone().add(new THREE.Vector3(0, 0.35, 0));
    } else if (ls.mode === 'peer' && peerRef.current?.bones.Head) {
      target = peerRef.current.bones.Head.getWorldPosition(new THREE.Vector3());
    }

    ls.smooth = (ls.smooth ?? target.clone()).lerp(target, 1 - Math.exp(-3 * delta));
    if (bones.neck_01 && bones.Head) {
      solveLookAtIK(bones.neck_01, bones.Head, ls.smooth, 0.85);
    }
  });

  return <primitive object={actor.root} />;
}

export function OnlookersGroup({
  canvasRef,
  world,
}: {
  canvasRef: React.RefObject<THREE.Group | null>;
  world: WorldContextType;
}) {
  const refA = useRef<ActorHandle | null>(null);
  const refB = useRef<ActorHandle | null>(null);

  useFrame(() => {
    if (!refA.current?.bones.spine_02 || !refB.current?.bones.spine_02) return;
    const pA = refA.current.bones.spine_02.getWorldPosition(new THREE.Vector3());
    const pB = refB.current.bones.spine_02.getWorldPosition(new THREE.Vector3());
    world.group('onlookers', pA.clone().lerp(pB, 0.5), pA.distanceTo(pB) / 2 + 0.45, 'Admiring the painting');
  });

  return (
    <>
      <OnlookerActor spot={ONLOOKERS[0]} index={0} canvasRef={canvasRef} world={world} selfRef={refA} peerRef={refB} />
      <OnlookerActor spot={ONLOOKERS[1]} index={1} canvasRef={canvasRef} world={world} selfRef={refB} peerRef={refA} />
    </>
  );
}

export function ParkActors({
  board,
  canvasRef,
  world,
}: {
  board: SketchBoard;
  canvasRef: React.RefObject<THREE.Group | null>;
  world: WorldContextType;
}) {
  return (
    <>
      <ArtistActor board={board} canvasRef={canvasRef} world={world} />
      <SwingerActor world={world} />
      <CatchActors world={world} />
      <TagActors world={world} />
      <ParentActor world={world} />
      <OnlookersGroup canvasRef={canvasRef} world={world} />
    </>
  );
}
