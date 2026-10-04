import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Humanoid } from './Humanoid';
import { getTerrainHeight } from '../pathData';

export const Kids: React.FC = () => {
  const pgX = -13;
  const pgZ = 8;
  const pgY = getTerrainHeight(pgX, pgZ);

  // Animation References
  const swingGroupRef = useRef<THREE.Group>(null);
  const slideKidRef = useRef<THREE.Group>(null);
  const tagKid1Ref = useRef<THREE.Group>(null);
  const tagKid2Ref = useRef<THREE.Group>(null);
  const ballKid1Ref = useRef<THREE.Group>(null);
  const ballKid2Ref = useRef<THREE.Group>(null);
  const ballRef = useRef<THREE.Group>(null);
  const kiteKidRef = useRef<THREE.Group>(null);
  const kiteObjRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // 1. SWING KID (Realistic Pendulum Kinetics & Leg Extension)
    if (swingGroupRef.current) {
      const swingAngle = Math.sin(t * 2.3) * 0.58;
      swingGroupRef.current.rotation.x = swingAngle;

      const humanoid = swingGroupRef.current.getObjectByName('humanoid');
      if (humanoid) {
        // Legs pump forward on front upswing, pull back on down/backswing
        const legExtension = -swingAngle * 0.85;
        const leftLeg = humanoid.children[0]?.children[0]?.children[2]; // left leg
        const rightLeg = humanoid.children[0]?.children[0]?.children[3]; // right leg
        if (leftLeg) leftLeg.rotation.x = legExtension;
        if (rightLeg) rightLeg.rotation.x = legExtension;
      }
    }

    // 2. SLIDE KID (Cycle: 0-3.5s climb rungs, 3.5-5.2s slide with arms raised, 5.2-7.5s run back)
    if (slideKidRef.current) {
      const cycle = (t * 0.55) % 7.5;
      if (cycle < 3.2) {
        // Climbing ladder
        const climbP = cycle / 3.2;
        slideKidRef.current.position.set(2.8, 0.2 + climbP * 1.05, -0.4 + (1 - climbP) * 0.6);
        slideKidRef.current.rotation.set(0, Math.PI, 0);
      } else if (cycle < 5.0) {
        // Sliding down with arms raised
        const slideP = (cycle - 3.2) / 1.8;
        slideKidRef.current.position.set(2.8, 1.25 - slideP * 1.05, -1.0 - slideP * 1.45);
        slideKidRef.current.rotation.set(-0.52, 0, 0);
      } else {
        // Running back to ladder
        const runP = (cycle - 5.0) / 2.5;
        slideKidRef.current.position.set(
          2.8 + Math.sin(runP * Math.PI) * 0.8,
          0.1,
          -2.45 + runP * 2.65
        );
        slideKidRef.current.rotation.set(0, 0, 0);
      }
    }

    // 3. TAG CHASE KIDS (Leaning into arcs with lively kid gaits)
    const tagCenter = new THREE.Vector2(-8, 14);
    const tagSpeed = t * 1.5;
    if (tagKid1Ref.current) {
      const r1 = 3.4 + Math.sin(t * 0.9) * 0.5;
      const x1 = tagCenter.x + Math.cos(tagSpeed) * r1;
      const z1 = tagCenter.y + Math.sin(tagSpeed) * r1;
      const y1 = getTerrainHeight(x1, z1);
      tagKid1Ref.current.position.set(x1, y1, z1);
      tagKid1Ref.current.rotation.y = -tagSpeed + Math.PI / 2;
      tagKid1Ref.current.rotation.z = -0.15; // Centripetal inward lean
    }
    if (tagKid2Ref.current) {
      const tagLag = tagSpeed - 0.65;
      const r2 = 3.2 + Math.sin(t * 0.9 + 0.4) * 0.5;
      const x2 = tagCenter.x + Math.cos(tagLag) * r2;
      const z2 = tagCenter.y + Math.sin(tagLag) * r2;
      const y2 = getTerrainHeight(x2, z2);
      tagKid2Ref.current.position.set(x2, y2, z2);
      tagKid2Ref.current.rotation.y = -tagLag + Math.PI / 2;
      tagKid2Ref.current.rotation.z = -0.15;
    }

    // 4. BALL GAME (Realistic Parabolic Arc with Dynamic Player Kicks & Receptions)
    const k1Pos = new THREE.Vector3(-2, getTerrainHeight(-2, 11), 11);
    const k2Pos = new THREE.Vector3(3, getTerrainHeight(3, 13), 13);
    if (ballKid1Ref.current) ballKid1Ref.current.position.copy(k1Pos);
    if (ballKid2Ref.current) ballKid2Ref.current.position.copy(k2Pos);

    if (ballRef.current) {
      const ballCycle = (t * 1.3) % 2;
      const isForward = ballCycle < 1;
      const frac = isForward ? ballCycle : ballCycle - 1;
      const start = isForward ? k1Pos : k2Pos;
      const target = isForward ? k2Pos : k1Pos;

      const currentX = THREE.MathUtils.lerp(start.x, target.x, frac);
      const currentZ = THREE.MathUtils.lerp(start.z, target.z, frac);
      const arcHeight = Math.sin(frac * Math.PI) * 1.75;
      const groundY = getTerrainHeight(currentX, currentZ);
      const currentY = groundY + 0.15 + arcHeight;

      ballRef.current.position.set(currentX, currentY, currentZ);
      ballRef.current.rotation.x += isForward ? 0.25 : -0.25;
      ballRef.current.rotation.y += 0.1;
    }

    // 5. KITE FLYER (Running on lawn, looking back up at high fluttering kite)
    if (kiteKidRef.current && kiteObjRef.current) {
      const kiteRunAngle = t * 0.55;
      const kx = 10 + Math.cos(kiteRunAngle) * 7.5;
      const kz = -14 + Math.sin(kiteRunAngle) * 5.5;
      const ky = getTerrainHeight(kx, kz);

      kiteKidRef.current.position.set(kx, ky, kz);
      kiteKidRef.current.rotation.y = -kiteRunAngle + Math.PI / 2;

      // High Fluttering Diamond Kite
      const kiteHighX = kx - Math.sin(kiteRunAngle) * 4.5;
      const kiteHighY = ky + 8.5 + Math.sin(t * 3.2) * 0.45;
      const kiteHighZ = kz + Math.cos(kiteRunAngle) * 4.5;
      kiteObjRef.current.position.set(kiteHighX, kiteHighY, kiteHighZ);
      kiteObjRef.current.rotation.set(0.35, kiteRunAngle, Math.sin(t * 4.5) * 0.25);
    }
  });

  const t = typeof window !== 'undefined' ? Date.now() * 0.001 : 0;
  const ballCycle = (t * 1.3) % 2;
  const isKicking1 = ballCycle < 0.3;
  const isKicking2 = ballCycle >= 1.0 && ballCycle < 1.3;

  return (
    <group>
      {/* 1. SWING KID WITH HANDS GRIPPING CHAINS */}
      <group position={[pgX - 2.5, pgY + 2.75, pgZ]}>
        <group ref={swingGroupRef}>
          {/* Swing Chains */}
          {[-0.22, 0.22].map((x, i) => (
            <mesh key={i} position={[x, -1.05, 0]}>
              <cylinderGeometry args={[0.007, 0.007, 2.1, 6]} />
              <meshStandardMaterial color="#475569" metalness={0.8} />
            </mesh>
          ))}
          {/* Wooden Seat */}
          <mesh position={[0, -2.08, 0]} castShadow>
            <boxGeometry args={[0.58, 0.045, 0.24]} />
            <meshStandardMaterial color="#8A5A36" roughness={0.7} />
          </mesh>
          {/* Child sitting on swing */}
          <group position={[0, -2.08, 0]} name="humanoid">
            <Humanoid
              isSitting={true}
              scale={0.68}
              skinColor="#F5D0A9"
              shirtColor="#EC4899"
              pantsColor="#3B82F6"
              shoesColor="#FFFFFF"
              hairColor="#D97706"
              hairStyle="ponytail"
              leftShoulderPitch={-1.1}
              leftElbowFlex={0.8}
              rightShoulderPitch={-1.1}
              rightElbowFlex={0.8}
            />
          </group>
        </group>
      </group>

      {/* 2. SLIDE KID */}
      <group position={[pgX, pgY, pgZ]}>
        <group ref={slideKidRef}>
          <Humanoid
            scale={0.65}
            skinColor="#E5A97D"
            shirtColor="#FBBF24"
            pantsColor="#1E293B"
            shoesColor="#EF4444"
            hairColor="#374151"
            hairStyle="short"
            leftShoulderPitch={-1.2}
            leftElbowFlex={0.4}
            rightShoulderPitch={-1.2}
            rightElbowFlex={0.4}
          />
        </group>
      </group>

      {/* 3. TAG CHASE KIDS */}
      <group ref={tagKid1Ref}>
        <Humanoid
          scale={0.68}
          skinColor="#E0AC69"
          shirtColor="#EF4444"
          pantsColor="#475569"
          shoesColor="#FFFFFF"
          hairColor="#451A03"
          hairStyle="short"
          hasHat={true}
          hatColor="#FCD34D"
          leftShoulderPitch={-0.6}
          leftElbowFlex={0.85}
          rightShoulderPitch={0.5}
          rightElbowFlex={0.85}
          leftHipPitch={0.45}
          leftKneeFlex={0.6}
          rightHipPitch={-0.45}
          rightKneeFlex={0.2}
        />
      </group>
      <group ref={tagKid2Ref}>
        <Humanoid
          scale={0.65}
          skinColor="#F0C29E"
          shirtColor="#10B981"
          pantsColor="#1E293B"
          shoesColor="#3B82F6"
          hairColor="#1F2937"
          hairStyle="curly"
          leftShoulderPitch={0.5}
          leftElbowFlex={0.85}
          rightShoulderPitch={-0.6}
          rightElbowFlex={0.85}
          leftHipPitch={-0.45}
          leftKneeFlex={0.2}
          rightHipPitch={0.45}
          rightKneeFlex={0.6}
        />
      </group>

      {/* 4. BALL GAME KIDS & SOCCER BALL */}
      {/* Player 1 (Purple Shirt, White Shorts) in Athletic Ready Stance & Kick Motion */}
      <group ref={ballKid1Ref} rotation={[0, 0.72, 0]}>
        <Humanoid
          scale={0.72}
          skinColor="#C68642"
          shirtColor="#8B5CF6"
          pantsColor="#F1F5F9"
          shoesColor="#1E293B"
          hairColor="#18181B"
          hairStyle="short"
          headPitch={-0.15}
          headYaw={0.12}
          leftShoulderPitch={-0.55}
          leftShoulderRoll={0.2}
          leftElbowFlex={0.95}
          rightShoulderPitch={-0.45}
          rightShoulderRoll={-0.2}
          rightElbowFlex={0.85}
          leftHipPitch={-0.12}
          leftKneeFlex={0.25}
          rightHipPitch={isKicking1 ? 0.65 : 0.18}
          rightKneeFlex={isKicking1 ? 0.12 : 0.35}
        />
      </group>

      {/* Player 2 (Cyan Shirt, Dark Shorts) in Receiving Stance */}
      <group ref={ballKid2Ref} rotation={[0, -2.38, 0]}>
        <Humanoid
          scale={0.72}
          skinColor="#E5A97D"
          shirtColor="#06B6D4"
          pantsColor="#334155"
          shoesColor="#FFFFFF"
          hairColor="#78350F"
          hairStyle="short"
          headPitch={-0.15}
          headYaw={-0.1}
          leftShoulderPitch={-0.5}
          leftShoulderRoll={0.2}
          leftElbowFlex={0.9}
          rightShoulderPitch={-0.5}
          rightShoulderRoll={-0.2}
          rightElbowFlex={0.9}
          leftHipPitch={isKicking2 ? 0.65 : 0.15}
          leftKneeFlex={isKicking2 ? 0.12 : 0.32}
          rightHipPitch={-0.1}
          rightKneeFlex={0.25}
        />
      </group>

      {/* Realistic Patterned Soccer Ball */}
      <group ref={ballRef}>
        <mesh castShadow>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.3} metalness={0.1} />
        </mesh>
        {/* Black Pentagon patches */}
        {[-0.14, 0.14].map((px, i) => (
          <mesh key={i} position={[px, 0.08, 0.12]}>
            <dodecahedronGeometry args={[0.07, 0]} />
            <meshStandardMaterial color="#111827" roughness={0.4} />
          </mesh>
        ))}
      </group>

      {/* 5. SANDBOX KID (Sitting playing with sand bucket & shovel) */}
      <group position={[pgX - 2.8, pgY + 0.1, pgZ - 2.8]}>
        <group position={[0.2, 0.08, -0.1]} rotation={[0.4, 0.25, 0]}>
          <Humanoid
            scale={0.62}
            isSitting={true}
            skinColor="#F5D0A9"
            shirtColor="#14B8A6"
            pantsColor="#E2E8F0"
            shoesColor="#3B82F6"
            hairColor="#B45309"
            hairStyle="short"
            headPitch={0.4} // Looking down at sandcastle
            leftShoulderPitch={-0.6}
            leftElbowFlex={1.1}
            rightShoulderPitch={-0.7}
            rightElbowFlex={1.2}
          />
          {/* Toy Sand Bucket & Shovel */}
          <mesh position={[-0.2, 0.1, 0.2]} castShadow>
            <cylinderGeometry args={[0.08, 0.06, 0.14, 10]} />
            <meshStandardMaterial color="#3B82F6" roughness={0.5} />
          </mesh>
          <mesh position={[0.18, 0.12, 0.22]} rotation={[0.6, 0.4, 0]} castShadow>
            <boxGeometry args={[0.035, 0.18, 0.07]} />
            <meshStandardMaterial color="#EF4444" roughness={0.5} />
          </mesh>
        </group>
      </group>

      {/* 6. KITE RUNNER & FLUTTERING KITE */}
      <group ref={kiteKidRef}>
        <Humanoid
          scale={0.72}
          skinColor="#F0C29E"
          shirtColor="#F97316"
          pantsColor="#1E293B"
          shoesColor="#FFFFFF"
          hairColor="#4A2810"
          hairStyle="short"
          headPitch={-0.45} // Looking up at sky
          headYaw={-0.5}   // Looking back at trailing kite
          rightShoulderPitch={-1.5} // Right arm raised holding kite line
          rightElbowFlex={0.4}
        />
        {/* String Spool in Right Hand */}
        <mesh position={[0.18, 0.88, 0.12]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.03, 0.03, 0.06, 8]} />
          <meshStandardMaterial color="#854D0E" />
        </mesh>
      </group>

      {/* Trailing High-Flying Diamond Kite */}
      <group ref={kiteObjRef}>
        <mesh rotation={[0, 0, Math.PI / 4]} castShadow>
          <planeGeometry args={[0.95, 0.95]} />
          <meshStandardMaterial color="#EF4444" roughness={0.5} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 4]} position={[0, 0, 0.01]}>
          <planeGeometry args={[0.48, 0.48]} />
          <meshStandardMaterial color="#FBBF24" roughness={0.5} side={THREE.DoubleSide} />
        </mesh>
        {/* Fluttering Tail Bows */}
        {[1, 2, 3, 4, 5].map((bowIdx) => (
          <mesh key={bowIdx} position={[0, -bowIdx * 0.38, 0]} scale={0.16}>
            <dodecahedronGeometry args={[0.55, 0]} />
            <meshStandardMaterial color={bowIdx % 2 === 0 ? '#3B82F6' : '#10B981'} />
          </mesh>
        ))}
      </group>
    </group>
  );
};
