import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Humanoid, HumanoidRef } from './Humanoid';
import { Dog } from './Dog';
import { mainParkCurve, secondaryParkCurve, perimeterRunwayCurve, getTerrainHeight } from '../pathData';

interface CharacterConfig {
  id: string;
  speed: number;
  offset: number;
  laneOffset: number;
  curve: THREE.CatmullRomCurve3;
  skin: string;
  shirt: string;
  pants: string;
  shoes: string;
  hair: string;
  hairStyle: 'short' | 'long' | 'curly' | 'bun' | 'ponytail';
  hasHat?: boolean;
  hatColor?: string;
  hasGlasses?: boolean;
  hasWatch?: boolean;
  hasBag?: boolean;
  scale: number;
  mode: 'sprint' | 'jog' | 'power-walk' | 'walk' | 'couple-left' | 'couple-right' | 'dog-walker' | 'stroller';
}

const WalkerAgent: React.FC<{ cfg: CharacterConfig; index: number }> = ({ cfg, index }) => {
  const groupRef = useRef<THREE.Group>(null);
  const humanoidRef = useRef<HumanoidRef>(null);
  const progressRef = useRef(cfg.offset);
  const currentYawRef = useRef(0);
  const isInitialized = useRef(false);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    // 1. Advance position along spline smoothly
    progressRef.current = (progressRef.current + cfg.speed * delta) % 1.0;
    const prog = progressRef.current;

    const pt = cfg.curve.getPointAt(prog);
    const tangent = cfg.curve.getTangentAt(prog).normalize();
    const normal = new THREE.Vector3(0, 1, 0);
    const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

    const finalPos = pt.clone().addScaledVector(binormal, cfg.laneOffset);
    finalPos.y = getTerrainHeight(finalPos.x, finalPos.z) + 0.05;

    groupRef.current.position.copy(finalPos);

    // 2. Compute smooth yaw orientation without gimbal snapping
    const targetYaw = Math.atan2(tangent.x, tangent.z);
    if (!isInitialized.current) {
      currentYawRef.current = targetYaw;
      isInitialized.current = true;
    } else {
      // Smooth angle interpolation handling wrap-around
      let diff = targetYaw - currentYawRef.current;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      currentYawRef.current += diff * Math.min(1.0, 10.0 * delta);
    }

    const isRunning = cfg.mode === 'sprint' || cfg.mode === 'jog';
    const pitchLean = cfg.mode === 'sprint' ? 0.22 : cfg.mode === 'jog' ? 0.14 : 0.04;

    groupRef.current.rotation.set(pitchLean, currentYawRef.current, 0, 'YXZ');

    // 3. Biomechanical Gait Kinematics
    const cadence = cfg.mode === 'sprint' ? 14.5 : cfg.mode === 'jog' ? 11.8 : 5.4;
    const phase = t * cadence + index * 2.1;

    let bob = 0;
    let pelvisSway = 0;
    let pelvisYaw = 0;
    let spineTwist = 0;
    let leftHipPitch = 0;
    let rightHipPitch = 0;
    let leftKneeFlex = 0;
    let rightKneeFlex = 0;
    let leftAnklePitch = 0;
    let rightAnklePitch = 0;
    let leftShoulderPitch = 0;
    let rightShoulderPitch = 0;
    let leftElbowFlex = 0.25;
    let rightElbowFlex = 0.25;
    let headYaw = 0;
    let headPitch = 0;
    let headRoll = 0;

    if (isRunning) {
      const isSprint = cfg.mode === 'sprint';

      // Flight suspension bounce (high at mid-air, drops on foot strike)
      bob = Math.abs(Math.sin(phase)) * (isSprint ? 0.095 : 0.07);

      // Pelvic tilt and twist
      pelvisSway = Math.sin(phase) * (isSprint ? 0.05 : 0.035);
      pelvisYaw = Math.sin(phase) * (isSprint ? 0.1 : 0.07);
      spineTwist = -pelvisYaw * 1.2;

      // Leg stride kinematics
      const hipRange = isSprint ? 0.72 : 0.58;
      leftHipPitch = Math.sin(phase) * hipRange;
      rightHipPitch = -leftHipPitch;

      // Knee flexion during backswing & high front lift
      leftKneeFlex = Math.max(0.1, (Math.sin(phase - 0.7) + 0.25) * (isSprint ? 1.5 : 1.2));
      rightKneeFlex = Math.max(0.1, (Math.sin(phase + Math.PI - 0.7) + 0.25) * (isSprint ? 1.5 : 1.2));

      // Ankle push-off vs heel landing
      leftAnklePitch = Math.sin(phase + 0.3) * (isSprint ? 0.32 : 0.24);
      rightAnklePitch = Math.sin(phase + Math.PI + 0.3) * (isSprint ? 0.32 : 0.24);

      // Reciprocal 90° arm drive
      leftShoulderPitch = -leftHipPitch * 1.05;
      rightShoulderPitch = -rightHipPitch * 1.05;
      leftElbowFlex = isSprint ? 1.45 : 1.25;
      rightElbowFlex = isSprint ? 1.45 : 1.25;

      headPitch = -0.08;
      headYaw = Math.sin(t * 1.2) * 0.06;
    } else {
      const isPower = cfg.mode === 'power-walk';

      // Gentle walking bob
      bob = Math.abs(Math.sin(phase)) * (isPower ? 0.038 : 0.026);
      pelvisSway = Math.sin(phase) * 0.045;
      pelvisYaw = Math.sin(phase) * 0.055;
      spineTwist = -pelvisYaw * 1.1;

      const maxHip = isPower ? 0.48 : 0.38;
      leftHipPitch = Math.sin(phase) * maxHip;
      rightHipPitch = -leftHipPitch;

      // Smooth knee flexion on swing leg
      leftKneeFlex = Math.max(0.04, Math.sin(phase - 0.65) * (isPower ? 0.75 : 0.58));
      rightKneeFlex = Math.max(0.04, Math.sin(phase + Math.PI - 0.65) * (isPower ? 0.75 : 0.58));

      // Ankle rolling through stride
      leftAnklePitch = Math.sin(phase + 0.35) * 0.22;
      rightAnklePitch = Math.sin(phase + Math.PI + 0.35) * 0.22;

      // Natural pendulum arm swing
      leftShoulderPitch = -leftHipPitch * 0.72;
      rightShoulderPitch = -rightHipPitch * 0.72;
      leftElbowFlex = 0.25 + Math.max(0, leftShoulderPitch) * 0.45;
      rightElbowFlex = 0.25 + Math.max(0, rightShoulderPitch) * 0.45;

      // Mode-specific upper body gestures
      if (cfg.mode === 'stroller') {
        leftShoulderPitch = -0.55;
        rightShoulderPitch = -0.55;
        leftElbowFlex = 0.9;
        rightElbowFlex = 0.9;
      } else if (cfg.mode === 'dog-walker') {
        rightShoulderPitch = -0.45;
        rightElbowFlex = 0.62;
      } else if (cfg.mode === 'couple-left') {
        headYaw = 0.32 + Math.sin(t * 1.4) * 0.1;
        headPitch = Math.sin(t * 2.0) * 0.06;
      } else if (cfg.mode === 'couple-right') {
        headYaw = -0.32 + Math.sin(t * 1.4 + 0.3) * 0.08;
        headRoll = 0.06;
      } else {
        // Natural curious head looking at scenery
        headYaw = Math.sin(t * 0.8 + index) * 0.18;
        headPitch = Math.sin(t * 1.1 + index) * 0.06;
      }
    }

    humanoidRef.current?.setPose({
      bob,
      pelvisSway,
      pelvisYaw,
      spineTwist,
      headPitch,
      headYaw,
      headRoll,
      leftShoulderPitch,
      leftElbowFlex,
      rightShoulderPitch,
      rightElbowFlex,
      leftHipPitch,
      leftKneeFlex,
      leftAnklePitch,
      rightHipPitch,
      rightKneeFlex,
      rightAnklePitch,
    });
  });

  return (
    <group ref={groupRef}>
      <Humanoid
        ref={humanoidRef}
        skinColor={cfg.skin}
        shirtColor={cfg.shirt}
        pantsColor={cfg.pants}
        shoesColor={cfg.shoes}
        hairColor={cfg.hair}
        hairStyle={cfg.hairStyle}
        scale={cfg.scale}
        hasHat={cfg.hasHat}
        hatColor={cfg.hatColor}
        hasGlasses={cfg.hasGlasses}
        hasWatch={cfg.hasWatch}
        hasBag={cfg.hasBag}
      />

      {/* Dog Walker Leash & Animated Trotting Golden Retriever */}
      {cfg.mode === 'dog-walker' && (
        <group position={[-0.7, 0, 0.45]}>
          <Dog furColor="#D49B5A" />
          <mesh position={[0.35, 0.42, -0.22]} rotation={[0.42, 0.28, 0.65]}>
            <cylinderGeometry args={[0.006, 0.006, 0.95, 6]} />
            <meshStandardMaterial color="#1E293B" roughness={0.4} />
          </mesh>
        </group>
      )}

      {/* Stroller Pram */}
      {cfg.mode === 'stroller' && (
        <group position={[0, 0, 0.72]} scale={0.72}>
          <mesh position={[0, 0.56, 0]} castShadow>
            <boxGeometry args={[0.48, 0.32, 0.68]} />
            <meshStandardMaterial color="#0284C7" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.74, -0.12]} rotation={[0.38, 0, 0]} castShadow>
            <boxGeometry args={[0.49, 0.18, 0.38]} />
            <meshStandardMaterial color="#0369A1" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.82, -0.44]} rotation={[-0.62, 0, 0]} castShadow>
            <cylinderGeometry args={[0.018, 0.018, 0.65, 8]} />
            <meshStandardMaterial color="#333333" metalness={0.8} />
          </mesh>
          {[
            [-0.26, 0.14, 0.26],
            [0.26, 0.14, 0.26],
            [-0.26, 0.14, -0.26],
            [0.26, 0.14, -0.26],
          ].map(([wx, wy, wz], wIdx) => (
            <group key={wIdx} position={[wx, wy, wz]}>
              <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.13, 0.13, 0.055, 16]} />
                <meshStandardMaterial color="#111827" roughness={0.8} />
              </mesh>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.06, 0.06, 0.06, 12]} />
                <meshStandardMaterial color="#9CA3AF" metalness={0.9} />
              </mesh>
            </group>
          ))}
        </group>
      )}
    </group>
  );
};

export const Walkers: React.FC = () => {
  const charactersConfig: CharacterConfig[] = useMemo(() => [
    // RUNNERS ON PERIMETER RUNWAY
    {
      id: 'runner-marathoner',
      speed: 0.038,
      offset: 0.05,
      laneOffset: 0.55,
      curve: perimeterRunwayCurve,
      skin: '#C68642',
      shirt: '#DC2626',
      pants: '#0F172A',
      shoes: '#FACC15',
      hair: '#171717',
      hairStyle: 'short',
      hasWatch: true,
      scale: 1.02,
      mode: 'sprint',
    },
    {
      id: 'runner-jogger-fast',
      speed: 0.032,
      offset: 0.35,
      laneOffset: -0.5,
      curve: perimeterRunwayCurve,
      skin: '#F1C27D',
      shirt: '#0284C7',
      pants: '#1E293B',
      shoes: '#FFFFFF',
      hair: '#8D5524',
      hairStyle: 'ponytail',
      hasHat: true,
      hatColor: '#FFFFFF',
      scale: 0.98,
      mode: 'jog',
    },
    {
      id: 'runner-tempo',
      speed: 0.029,
      offset: 0.68,
      laneOffset: 0.25,
      curve: perimeterRunwayCurve,
      skin: '#8D5524',
      shirt: '#10B981',
      pants: '#0F172A',
      shoes: '#FB923C',
      hair: '#111827',
      hairStyle: 'short',
      hasWatch: true,
      scale: 1.0,
      mode: 'jog',
    },
    {
      id: 'runner-power-walk',
      speed: 0.022,
      offset: 0.88,
      laneOffset: -0.6,
      curve: perimeterRunwayCurve,
      skin: '#E0AC69',
      shirt: '#8B5CF6',
      pants: '#334155',
      shoes: '#E2E8F0',
      hair: '#4A2E18',
      hairStyle: 'curly',
      scale: 0.97,
      mode: 'power-walk',
    },

    // STROLLER PARENT ON MAIN PATH
    {
      id: 'walker-stroller',
      speed: 0.014,
      offset: 0.12,
      laneOffset: 0.45,
      curve: mainParkCurve,
      skin: '#F5D0A9',
      shirt: '#EA580C',
      pants: '#1E293B',
      shoes: '#F8FAFC',
      hair: '#3B2219',
      hairStyle: 'bun',
      hasGlasses: true,
      scale: 0.98,
      mode: 'stroller',
    },

    // DOG WALKER ON MAIN PATH
    {
      id: 'walker-dog',
      speed: 0.016,
      offset: 0.52,
      laneOffset: -0.4,
      curve: mainParkCurve,
      skin: '#C68642',
      shirt: '#0D9488',
      pants: '#475569',
      shoes: '#38281C',
      hair: '#171717',
      hairStyle: 'short',
      hasHat: true,
      hatColor: '#1E293B',
      scale: 1.0,
      mode: 'dog-walker',
    },

    // ROMANTIC COUPLE ON MAIN PATH
    {
      id: 'couple-man',
      speed: 0.012,
      offset: 0.78,
      laneOffset: 0.32,
      curve: mainParkCurve,
      skin: '#E0AC69',
      shirt: '#4F46E5',
      pants: '#1E293B',
      shoes: '#451A03',
      hair: '#29180E',
      hairStyle: 'short',
      scale: 1.02,
      mode: 'couple-left',
    },
    {
      id: 'couple-woman',
      speed: 0.012,
      offset: 0.78,
      laneOffset: -0.32,
      curve: mainParkCurve,
      skin: '#F1C27D',
      shirt: '#EC4899',
      pants: '#F8FAFC',
      shoes: '#F43F5E',
      hair: '#C4823F',
      hairStyle: 'long',
      scale: 0.95,
      mode: 'couple-right',
    },

    // CASUAL STROLLERS ON SECONDARY PATH
    {
      id: 'walker-flaneur',
      speed: 0.013,
      offset: 0.28,
      laneOffset: 0.0,
      curve: secondaryParkCurve,
      skin: '#D29B62',
      shirt: '#D97706',
      pants: '#334155',
      shoes: '#1E293B',
      hair: '#1F2937',
      hairStyle: 'curly',
      hasBag: true,
      hasGlasses: true,
      scale: 0.99,
      mode: 'walk',
    },
    {
      id: 'walker-student',
      speed: 0.015,
      offset: 0.65,
      laneOffset: 0.2,
      curve: secondaryParkCurve,
      skin: '#F5D0A9',
      shirt: '#059669',
      pants: '#1E293B',
      shoes: '#FFFFFF',
      hair: '#3B2219',
      hairStyle: 'ponytail',
      hasBag: true,
      scale: 0.96,
      mode: 'walk',
    },
  ], []);

  return (
    <group>
      {charactersConfig.map((cfg, idx) => (
        <WalkerAgent key={cfg.id} cfg={cfg} index={idx} />
      ))}
    </group>
  );
};
