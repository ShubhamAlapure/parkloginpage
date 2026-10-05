import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Humanoid, HumanoidRef } from './Humanoid';
import { getTerrainHeight } from '../pathData';

export const Kids: React.FC = () => {
  const pgX = -13;
  const pgZ = 8;
  const pgY = getTerrainHeight(pgX, pgZ);

  // Animation References
  const swingGroupRef = useRef<THREE.Group>(null);
  const swingKidRef = useRef<HumanoidRef>(null);

  const slideKidRef = useRef<THREE.Group>(null);
  const slideKidHumRef = useRef<HumanoidRef>(null);

  const tagKid1Ref = useRef<THREE.Group>(null);
  const tagKid1HumRef = useRef<HumanoidRef>(null);

  const tagKid2Ref = useRef<THREE.Group>(null);
  const tagKid2HumRef = useRef<HumanoidRef>(null);

  const ballKid1Ref = useRef<THREE.Group>(null);
  const ballKid1HumRef = useRef<HumanoidRef>(null);

  const ballKid2Ref = useRef<THREE.Group>(null);
  const ballKid2HumRef = useRef<HumanoidRef>(null);

  const ballRef = useRef<THREE.Group>(null);

  const kiteKidRef = useRef<THREE.Group>(null);
  const kiteKidHumRef = useRef<HumanoidRef>(null);
  const kiteObjRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // 1. SWING KID (Pendulum physics & leg pumping)
    if (swingGroupRef.current) {
      const swingAngle = Math.sin(t * 2.2) * 0.55;
      swingGroupRef.current.rotation.x = swingAngle;

      const legExtension = -swingAngle * 0.9;
      swingKidRef.current?.setPose({
        leftHipPitch: Math.PI / 2 + legExtension,
        rightHipPitch: Math.PI / 2 + legExtension,
        leftKneeFlex: Math.max(0.1, -swingAngle * 0.6),
        rightKneeFlex: Math.max(0.1, -swingAngle * 0.6),
        leftShoulderPitch: -1.1 + swingAngle * 0.2,
        rightShoulderPitch: -1.1 + swingAngle * 0.2,
        leftElbowFlex: 0.8,
        rightElbowFlex: 0.8,
      });
    }

    // 2. SLIDE KID (Climb -> Slide -> Run cycle)
    if (slideKidRef.current) {
      const cycle = (t * 0.5) % 8.0;
      if (cycle < 3.2) {
        // Climbing ladder
        const climbP = cycle / 3.2;
        const climbStep = Math.sin(cycle * 12);
        slideKidRef.current.position.set(2.8, 0.2 + climbP * 1.05, -0.4 + (1 - climbP) * 0.6);
        slideKidRef.current.rotation.set(0, Math.PI, 0);

        slideKidHumRef.current?.setPose({
          leftHipPitch: climbStep * 0.4,
          rightHipPitch: -climbStep * 0.4,
          leftKneeFlex: Math.max(0.2, climbStep * 0.8),
          rightKneeFlex: Math.max(0.2, -climbStep * 0.8),
          leftShoulderPitch: -0.9 - climbStep * 0.3,
          rightShoulderPitch: -0.9 + climbStep * 0.3,
          leftElbowFlex: 1.0,
          rightElbowFlex: 1.0,
        });
      } else if (cycle < 5.0) {
        // Sliding down with arms raised joyfully
        const slideP = (cycle - 3.2) / 1.8;
        slideKidRef.current.position.set(2.8, 1.25 - slideP * 1.05, -1.0 - slideP * 1.45);
        slideKidRef.current.rotation.set(-0.52, 0, 0);

        slideKidHumRef.current?.setPose({
          leftHipPitch: 1.1,
          rightHipPitch: 1.1,
          leftKneeFlex: 0.2,
          rightKneeFlex: 0.2,
          leftShoulderPitch: -1.6,
          rightShoulderPitch: -1.6,
          leftElbowFlex: 0.3,
          rightElbowFlex: 0.3,
          headPitch: 0.2,
        });
      } else {
        // Running back to ladder
        const runP = (cycle - 5.0) / 3.0;
        const runPhase = t * 14.0;
        slideKidRef.current.position.set(
          2.8 + Math.sin(runP * Math.PI) * 0.7,
          0.1,
          -2.45 + runP * 2.65
        );
        slideKidRef.current.rotation.set(0, 0, 0);

        slideKidHumRef.current?.setPose({
          bob: Math.abs(Math.sin(runPhase)) * 0.05,
          leftHipPitch: Math.sin(runPhase) * 0.6,
          rightHipPitch: -Math.sin(runPhase) * 0.6,
          leftKneeFlex: Math.max(0.1, Math.sin(runPhase - 0.7) * 1.2),
          rightKneeFlex: Math.max(0.1, Math.sin(runPhase + Math.PI - 0.7) * 1.2),
          leftShoulderPitch: -Math.sin(runPhase) * 0.8,
          rightShoulderPitch: Math.sin(runPhase) * 0.8,
          leftElbowFlex: 1.1,
          rightElbowFlex: 1.1,
        });
      }
    }

    // 3. TAG CHASE KIDS (Dynamic arc running)
    const tagCenter = new THREE.Vector2(-8, 14);
    const tagSpeed = t * 1.4;
    const tagRunCadence = t * 13.0;

    if (tagKid1Ref.current) {
      const r1 = 3.4 + Math.sin(t * 0.8) * 0.5;
      const x1 = tagCenter.x + Math.cos(tagSpeed) * r1;
      const z1 = tagCenter.y + Math.sin(tagSpeed) * r1;
      const y1 = getTerrainHeight(x1, z1);
      tagKid1Ref.current.position.set(x1, y1, z1);
      tagKid1Ref.current.rotation.y = -tagSpeed + Math.PI / 2;
      tagKid1Ref.current.rotation.z = -0.12;

      tagKid1HumRef.current?.setPose({
        bob: Math.abs(Math.sin(tagRunCadence)) * 0.06,
        leftHipPitch: Math.sin(tagRunCadence) * 0.65,
        rightHipPitch: -Math.sin(tagRunCadence) * 0.65,
        leftKneeFlex: Math.max(0.1, Math.sin(tagRunCadence - 0.7) * 1.3),
        rightKneeFlex: Math.max(0.1, Math.sin(tagRunCadence + Math.PI - 0.7) * 1.3),
        leftShoulderPitch: -Math.sin(tagRunCadence) * 0.9,
        rightShoulderPitch: Math.sin(tagRunCadence) * 0.9,
        leftElbowFlex: 1.2,
        rightElbowFlex: 1.2,
      });
    }

    if (tagKid2Ref.current) {
      const tagLag = tagSpeed - 0.65;
      const r2 = 3.2 + Math.sin(t * 0.8 + 0.4) * 0.5;
      const x2 = tagCenter.x + Math.cos(tagLag) * r2;
      const z2 = tagCenter.y + Math.sin(tagLag) * r2;
      const y2 = getTerrainHeight(x2, z2);
      tagKid2Ref.current.position.set(x2, y2, z2);
      tagKid2Ref.current.rotation.y = -tagLag + Math.PI / 2;
      tagKid2Ref.current.rotation.z = -0.12;

      tagKid2HumRef.current?.setPose({
        bob: Math.abs(Math.sin(tagRunCadence + 1.2)) * 0.06,
        leftHipPitch: Math.sin(tagRunCadence + 1.2) * 0.65,
        rightHipPitch: -Math.sin(tagRunCadence + 1.2) * 0.65,
        leftKneeFlex: Math.max(0.1, Math.sin(tagRunCadence + 0.5) * 1.3),
        rightKneeFlex: Math.max(0.1, Math.sin(tagRunCadence + Math.PI + 0.5) * 1.3),
        leftShoulderPitch: -Math.sin(tagRunCadence + 1.2) * 0.9,
        rightShoulderPitch: Math.sin(tagRunCadence + 1.2) * 0.9,
        leftElbowFlex: 1.2,
        rightElbowFlex: 1.2,
      });
    }

    // 4. BALL GAME (Soccer ball pass with kicking poses)
    const k1Pos = new THREE.Vector3(-2, getTerrainHeight(-2, 11), 11);
    const k2Pos = new THREE.Vector3(3, getTerrainHeight(3, 13), 13);
    if (ballKid1Ref.current) ballKid1Ref.current.position.copy(k1Pos);
    if (ballKid2Ref.current) ballKid2Ref.current.position.copy(k2Pos);

    if (ballRef.current) {
      const ballCycle = (t * 1.2) % 2.0;
      const isForward = ballCycle < 1.0;
      const frac = isForward ? ballCycle : ballCycle - 1.0;
      const start = isForward ? k1Pos : k2Pos;
      const end = isForward ? k2Pos : k1Pos;

      const currentX = THREE.MathUtils.lerp(start.x, end.x, frac);
      const currentZ = THREE.MathUtils.lerp(start.z, end.z, frac);
      const groundY = getTerrainHeight(currentX, currentZ);
      const arcHeight = Math.sin(frac * Math.PI) * 1.6;

      ballRef.current.position.set(currentX, groundY + 0.16 + arcHeight, currentZ);
      ballRef.current.rotation.x += 12 * 0.016;
      ballRef.current.rotation.z += 8 * 0.016;

      // Animate kicker vs receiver
      if (frac < 0.25) {
        if (isForward) {
          ballKid1HumRef.current?.setPose({
            rightHipPitch: -0.6,
            rightKneeFlex: 0.8,
            leftShoulderPitch: 0.4,
            rightShoulderPitch: -0.5,
          });
        } else {
          ballKid2HumRef.current?.setPose({
            rightHipPitch: -0.6,
            rightKneeFlex: 0.8,
            leftShoulderPitch: 0.4,
            rightShoulderPitch: -0.5,
          });
        }
      } else {
        ballKid1HumRef.current?.setPose({
          rightHipPitch: 0.1,
          rightKneeFlex: 0.15,
          leftShoulderPitch: 0.1,
          rightShoulderPitch: -0.1,
        });
        ballKid2HumRef.current?.setPose({
          rightHipPitch: 0.1,
          rightKneeFlex: 0.15,
          leftShoulderPitch: 0.1,
          rightShoulderPitch: -0.1,
        });
      }
    }

    // 5. KITE FLYER KID
    if (kiteKidRef.current) {
      const kiteX = 16 + Math.sin(t * 0.6) * 4;
      const kiteZ = 2 + Math.cos(t * 0.6) * 3;
      const kiteY = getTerrainHeight(kiteX, kiteZ);
      kiteKidRef.current.position.set(kiteX, kiteY, kiteZ);
      kiteKidRef.current.rotation.y = t * 0.6 + Math.PI / 2;

      const kiteRun = t * 9.0;
      kiteKidHumRef.current?.setPose({
        bob: Math.abs(Math.sin(kiteRun)) * 0.04,
        leftHipPitch: Math.sin(kiteRun) * 0.45,
        rightHipPitch: -Math.sin(kiteRun) * 0.45,
        leftKneeFlex: Math.max(0.1, Math.sin(kiteRun - 0.6) * 0.9),
        rightKneeFlex: Math.max(0.1, Math.sin(kiteRun + Math.PI - 0.6) * 0.9),
        rightShoulderPitch: -1.4, // Right arm high holding kite string
        rightElbowFlex: 0.4,
        leftShoulderPitch: 0.3,
        leftElbowFlex: 0.5,
        headPitch: 0.3, // Looking up at kite
      });

      if (kiteObjRef.current) {
        const kx = kiteX - 6 + Math.sin(t * 1.5) * 1.2;
        const kz = kiteZ + 5 + Math.cos(t * 1.3) * 1.2;
        const ky = kiteY + 7.5 + Math.sin(t * 2.0) * 0.8;
        kiteObjRef.current.position.set(kx, ky, kz);
        kiteObjRef.current.rotation.z = Math.sin(t * 2.5) * 0.25;
        kiteObjRef.current.rotation.x = Math.sin(t * 1.8) * 0.2;
      }
    }
  });

  return (
    <group>
      {/* 1. SWING KID */}
      <group position={[pgX + 3.5, pgY, pgZ + 1.2]}>
        <group ref={swingGroupRef} position={[0, 2.4, 0]}>
          {/* Swing Ropes */}
          {[-0.22, 0.22].map((rx, ri) => (
            <mesh key={`rope-${ri}`} position={[rx, -1.04, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 2.08, 6]} />
              <meshStandardMaterial color="#B08968" roughness={0.9} />
            </mesh>
          ))}
          {/* Wooden Seat */}
          <mesh position={[0, -2.08, 0]} castShadow>
            <boxGeometry args={[0.58, 0.045, 0.24]} />
            <meshStandardMaterial color="#8A5A36" roughness={0.7} />
          </mesh>
          {/* Child sitting on swing */}
          <group position={[0, -2.08, 0]}>
            <Humanoid
              ref={swingKidRef}
              isSitting={true}
              scale={0.68}
              skinColor="#F5D0A9"
              shirtColor="#EC4899"
              pantsColor="#3B82F6"
              shoesColor="#FFFFFF"
              hairColor="#D97706"
              hairStyle="ponytail"
            />
          </group>
        </group>
      </group>

      {/* 2. SLIDE KID */}
      <group position={[pgX, pgY, pgZ]}>
        <group ref={slideKidRef}>
          <Humanoid
            ref={slideKidHumRef}
            scale={0.65}
            skinColor="#E5A97D"
            shirtColor="#FBBF24"
            pantsColor="#1E293B"
            shoesColor="#EF4444"
            hairColor="#374151"
            hairStyle="short"
          />
        </group>
      </group>

      {/* 3. TAG CHASE KIDS */}
      <group ref={tagKid1Ref}>
        <Humanoid
          ref={tagKid1HumRef}
          scale={0.68}
          skinColor="#E0AC69"
          shirtColor="#EF4444"
          pantsColor="#475569"
          shoesColor="#FFFFFF"
          hairColor="#451A03"
          hairStyle="short"
          hasHat={true}
          hatColor="#FCD34D"
        />
      </group>
      <group ref={tagKid2Ref}>
        <Humanoid
          ref={tagKid2HumRef}
          scale={0.65}
          skinColor="#F0C29E"
          shirtColor="#10B981"
          pantsColor="#1E293B"
          shoesColor="#3B82F6"
          hairColor="#1F2937"
          hairStyle="curly"
        />
      </group>

      {/* 4. BALL GAME KIDS & SOCCER BALL */}
      <group ref={ballKid1Ref} rotation={[0, 0.72, 0]}>
        <Humanoid
          ref={ballKid1HumRef}
          scale={0.72}
          skinColor="#C68642"
          shirtColor="#8B5CF6"
          pantsColor="#F1F5F9"
          shoesColor="#1E293B"
          hairColor="#18181B"
          hairStyle="short"
        />
      </group>

      <group ref={ballKid2Ref} rotation={[0, -2.4, 0]}>
        <Humanoid
          ref={ballKid2HumRef}
          scale={0.7}
          skinColor="#F5D0A9"
          shirtColor="#06B6D4"
          pantsColor="#334155"
          shoesColor="#F59E0B"
          hairColor="#78350F"
          hairStyle="short"
          hasHat={true}
          hatColor="#0284C7"
        />
      </group>

      {/* Soccer Ball */}
      <group ref={ballRef}>
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.16, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
        </mesh>
        {/* Black Pentagon patches */}
        {[
          [0, 0.16, 0],
          [0, -0.16, 0],
          [0.15, 0.05, 0],
          [-0.15, 0.05, 0],
          [0, 0.05, 0.15],
          [0, 0.05, -0.15],
        ].map(([px, py, pz], pi) => (
          <mesh key={pi} position={[px, py, pz]}>
            <sphereGeometry args={[0.045, 6, 6]} />
            <meshStandardMaterial color="#0F172A" roughness={0.3} />
          </mesh>
        ))}
      </group>

      {/* 5. KITE FLYER KID */}
      <group ref={kiteKidRef}>
        <Humanoid
          ref={kiteKidHumRef}
          scale={0.7}
          skinColor="#E0AC69"
          shirtColor="#F97316"
          pantsColor="#1E293B"
          shoesColor="#10B981"
          hairColor="#29180E"
          hairStyle="short"
          hasHat={true}
          hatColor="#E11D48"
        />
      </group>

      {/* Flying Diamond Kite */}
      <group ref={kiteObjRef}>
        <mesh castShadow>
          <boxGeometry args={[0.95, 0.015, 0.95]} />
          <meshStandardMaterial color="#EF4444" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.01, 0]}>
          <boxGeometry args={[0.55, 0.018, 0.55]} />
          <meshStandardMaterial color="#FACC15" roughness={0.5} />
        </mesh>
        {/* Kite Tail Ribbons */}
        {[0.6, 1.1, 1.6, 2.1].map((ty, ti) => (
          <mesh key={ti} position={[0, -ty, ty * 0.4]} rotation={[0.4, 0, Math.sin(ti) * 0.4]}>
            <boxGeometry args={[0.18, 0.08, 0.01]} />
            <meshStandardMaterial color={ti % 2 === 0 ? '#3B82F6' : '#10B981'} />
          </mesh>
        ))}
      </group>
    </group>
  );
};
