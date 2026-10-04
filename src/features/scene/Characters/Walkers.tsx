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

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    // 1. Advance position along spline
    progressRef.current = (progressRef.current + cfg.speed * delta) % 1.0;
    const prog = progressRef.current;

    const pt = cfg.curve.getPointAt(prog);
    const tangent = cfg.curve.getTangentAt(prog).normalize();
    const normal = new THREE.Vector3(0, 1, 0);
    const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

    const finalPos = pt.clone().addScaledVector(binormal, cfg.laneOffset);
    finalPos.y = getTerrainHeight(finalPos.x, finalPos.z) + 0.05;

    groupRef.current.position.copy(finalPos);

    // Orientation with forward pitch for runners
    const lookTarget = finalPos.clone().add(tangent);
    groupRef.current.lookAt(lookTarget);

    const isRunning = cfg.mode === 'sprint' || cfg.mode === 'jog';
    if (cfg.mode === 'sprint') {
      groupRef.current.rotation.x += 0.26; // 15° forward sprint torso drive
    } else if (cfg.mode === 'jog') {
      groupRef.current.rotation.x += 0.16; // 9° forward jog lean
    }

    // 2. Compute Biomechanical Gait Kinematics
    const cadence = cfg.mode === 'sprint' ? 15.5 : cfg.mode === 'jog' ? 12.5 : 5.8;
    const phase = t * cadence + index * 1.8;

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

      // Flight suspension bounce
      bob = Math.abs(Math.sin(phase)) * (isSprint ? 0.1 : 0.075);

      // Pelvic tilt and twist
      pelvisSway = Math.sin(phase) * (isSprint ? 0.06 : 0.04);
      pelvisYaw = Math.sin(phase) * (isSprint ? 0.12 : 0.08);
      spineTwist = -pelvisYaw * 1.25;

      // High knee drive and deep backwards knee flexion
      const hipRange = isSprint ? 0.78 : 0.62;
      leftHipPitch = Math.sin(phase) * hipRange;
      rightHipPitch = -leftHipPitch;

      leftKneeFlex = Math.max(0.08, (Math.sin(phase - 0.75) + 0.2) * (isSprint ? 1.65 : 1.3));
      rightKneeFlex = Math.max(0.08, (Math.sin(phase + Math.PI - 0.75) + 0.2) * (isSprint ? 1.65 : 1.3));

      // Ankle push-off vs heel landing
      leftAnklePitch = Math.sin(phase + 0.35) * (isSprint ? 0.36 : 0.26);
      rightAnklePitch = Math.sin(phase + Math.PI + 0.35) * (isSprint ? 0.36 : 0.26);

      // 90° arm drive
      leftShoulderPitch = -leftHipPitch * (isSprint ? 1.18 : 1.0);
      rightShoulderPitch = -rightHipPitch * (isSprint ? 1.18 : 1.0);
      leftElbowFlex = isSprint ? 1.5 : 1.3;
      rightElbowFlex = isSprint ? 1.5 : 1.3;

      headPitch = -0.1;
    } else {
      const isPower = cfg.mode === 'power-walk';

      bob = Math.abs(Math.sin(phase)) * (isPower ? 0.04 : 0.028);
      pelvisSway = Math.sin(phase) * 0.05;
      pelvisYaw = Math.sin(phase) * 0.06;
      spineTwist = -pelvisYaw * 1.15;

      const maxHip = isPower ? 0.52 : 0.42;
      leftHipPitch = Math.sin(phase) * maxHip;
      rightHipPitch = -leftHipPitch;

      leftKneeFlex = Math.max(0.04, Math.sin(phase - 0.7) * (isPower ? 0.82 : 0.65));
      rightKneeFlex = Math.max(0.04, Math.sin(phase + Math.PI - 0.7) * (isPower ? 0.82 : 0.65));

      leftAnklePitch = Math.sin(phase + 0.4) * 0.24;
      rightAnklePitch = Math.sin(phase + Math.PI + 0.4) * 0.24;

      leftShoulderPitch = -leftHipPitch * 0.75;
      rightShoulderPitch = -rightHipPitch * 0.75;
      leftElbowFlex = 0.25 + Math.max(0, leftShoulderPitch) * 0.5;
      rightElbowFlex = 0.25 + Math.max(0, rightShoulderPitch) * 0.5;

      if (cfg.mode === 'stroller') {
        leftShoulderPitch = -0.58;
        rightShoulderPitch = -0.58;
        leftElbowFlex = 0.92;
        rightElbowFlex = 0.92;
      } else if (cfg.mode === 'dog-walker') {
        rightShoulderPitch = -0.48;
        rightElbowFlex = 0.65;
      } else if (cfg.mode === 'couple-left') {
        headYaw = 0.35 + Math.sin(t * 1.6) * 0.12;
        headPitch = Math.sin(t * 2.2) * 0.08;
        if (Math.sin(t * 0.7) > 0.25) {
          leftShoulderPitch = -0.65 + Math.sin(t * 3) * 0.2;
          leftElbowFlex = 1.15;
        }
      } else if (cfg.mode === 'couple-right') {
        headYaw = -0.35 + Math.sin(t * 1.6 + 0.4) * 0.1;
        headRoll = 0.08;
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
  // Define character specifications distributed between the Perimeter Athletic Runway and Interior Paths
  const charactersConfig: CharacterConfig[] = useMemo(() => [
    // ==========================================
    // A. PERIMETER RUNWAY TRACK ATHLETES
    // ==========================================
    // 1. Lead Marathon Sprinter
    {
      id: 'runway-runner-1',
      speed: 0.058,
      offset: 0.05,
      laneOffset: -0.9,
      curve: perimeterRunwayCurve,
      skin: '#C68642',
      shirt: '#DC2626',
      pants: '#111827',
      shoes: '#F97316',
      hair: '#1F2937',
      hairStyle: 'short',
      hasHat: true,
      hatColor: '#DC2626',
      hasWatch: true,
      scale: 1.0,
      mode: 'sprint',
    },
    // 2. Pace Runner with Ponytail
    {
      id: 'runway-runner-2',
      speed: 0.048,
      offset: 0.42,
      laneOffset: 0.8,
      curve: perimeterRunwayCurve,
      skin: '#E5A97D',
      shirt: '#0284C7',
      pants: '#1E293B',
      shoes: '#F43F5E',
      hair: '#78350F',
      hairStyle: 'ponytail',
      hasWatch: true,
      scale: 0.94,
      mode: 'jog',
    },
    // 3. Steady Endurance Jogger
    {
      id: 'runway-runner-3',
      speed: 0.045,
      offset: 0.78,
      laneOffset: -0.3,
      curve: perimeterRunwayCurve,
      skin: '#8D5524',
      shirt: '#10B981',
      pants: '#374151',
      shoes: '#FDE047',
      hair: '#111827',
      hairStyle: 'short',
      hasWatch: true,
      scale: 0.98,
      mode: 'jog',
    },
    // 4. Power Walker on the Runway
    {
      id: 'runway-walker-1',
      speed: 0.026,
      offset: 0.22,
      laneOffset: 1.2,
      curve: perimeterRunwayCurve,
      skin: '#F0C29E',
      shirt: '#F59E0B',
      pants: '#1E293B',
      shoes: '#FFFFFF',
      hair: '#D97706',
      hairStyle: 'bun',
      scale: 0.95,
      mode: 'power-walk',
    },

    // ==========================================
    // B. INTERIOR COBBLESTONE PATH WALKERS
    // ==========================================
    // 5. Conversing Couple - Partner A
    {
      id: 'couple-1',
      speed: 0.016,
      offset: 0.12,
      laneOffset: -0.45,
      curve: mainParkCurve,
      skin: '#E5A97D',
      shirt: '#3B82F6',
      pants: '#1E293B',
      shoes: '#2B1E16',
      hair: '#3E2723',
      hairStyle: 'short',
      hasWatch: true,
      scale: 0.95,
      mode: 'couple-left',
    },
    // 6. Conversing Couple - Partner B
    {
      id: 'couple-2',
      speed: 0.016,
      offset: 0.12,
      laneOffset: 0.45,
      curve: mainParkCurve,
      skin: '#F0C29E',
      shirt: '#EC4899',
      pants: '#FAF5FF',
      shoes: '#FFFFFF',
      hair: '#D97706',
      hairStyle: 'long',
      hasBag: true,
      scale: 0.9,
      mode: 'couple-right',
    },
    // 7. Dog Walker with Golden Retriever
    {
      id: 'dog-walker',
      speed: 0.02,
      offset: 0.68,
      laneOffset: -0.45,
      curve: mainParkCurve,
      skin: '#E8B98A',
      shirt: '#059669',
      pants: '#374151',
      shoes: '#4A3B32',
      hair: '#6B7280',
      hairStyle: 'short',
      hasGlasses: true,
      scale: 0.96,
      mode: 'dog-walker',
    },
    // 8. Parent pushing Baby Stroller
    {
      id: 'stroller-parent',
      speed: 0.015,
      offset: 0.35,
      laneOffset: 0.35,
      curve: mainParkCurve,
      skin: '#D4A373',
      shirt: '#7C3AED',
      pants: '#4B5563',
      shoes: '#FFFFFF',
      hair: '#4A2810',
      hairStyle: 'bun',
      scale: 0.94,
      mode: 'stroller',
    },
    // 9. Secondary Path Stroller near Pond
    {
      id: 'sec-walker-1',
      speed: 0.022,
      offset: 0.25,
      laneOffset: 0.2,
      curve: secondaryParkCurve,
      skin: '#F5D0A9',
      shirt: '#84CC16',
      pants: '#1E293B',
      shoes: '#333333',
      hair: '#1E1B4B',
      hairStyle: 'curly',
      scale: 0.95,
      mode: 'walk',
    },
    // 10. Secondary Path Walker
    {
      id: 'sec-walker-2',
      speed: 0.02,
      offset: 0.72,
      laneOffset: -0.25,
      curve: secondaryParkCurve,
      skin: '#C68642',
      shirt: '#F43F5E',
      pants: '#475569',
      shoes: '#4A3B32',
      hair: '#292524',
      hairStyle: 'short',
      scale: 0.96,
      mode: 'walk',
    },
  ], []);

  return (
    <group>
      {/* 1. Track Runners & Path Walkers */}
      {charactersConfig.map((cfg, idx) => (
        <WalkerAgent key={cfg.id} cfg={cfg} index={idx} />
      ))}

      {/* 2. Shaded Grove Bench Reader */}
      <group position={[-4, getTerrainHeight(-4, 3.8), 3.8]} rotation={[0, 0.3, 0]}>
        <group position={[0.2, 0.05, 0]}>
          <Humanoid
            isSitting={true}
            skinColor="#E5A97D"
            shirtColor="#059669"
            pantsColor="#1E293B"
            shoesColor="#38281C"
            hairColor="#522504"
            hairStyle="short"
            hasGlasses={true}
            scale={0.92}
            headPitch={0.35}
            headYaw={0.15}
            leftShoulderPitch={-0.65}
            leftElbowFlex={1.3}
            rightShoulderPitch={-0.65}
            rightElbowFlex={1.3}
          />
          <group position={[0.05, 0.62, 0.32]} rotation={[0.42, 0, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.28, 0.025, 0.19]} />
              <meshStandardMaterial color="#FEF08A" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.015, 0]}>
              <boxGeometry args={[0.26, 0.015, 0.17]} />
              <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
};
