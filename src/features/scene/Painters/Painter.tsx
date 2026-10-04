import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Humanoid } from '../Characters/Humanoid';
import { Easel } from './Easel';
import { Palette, PALETTE_COLORS } from './Palette';
import { PaintingCanvasEngine } from './PaintingCanvasEngine';
import { getTerrainHeight } from '../pathData';
import { useAppStore } from '@/app/store';

export const Painters: React.FC = () => {
  // Global store bindings
  const setActivePainterColor = useAppStore((s) => s.setActivePainterColor);
  const activePainterColor = useAppStore((s) => s.activePainterColor);
  const setPainterProgress = useAppStore((s) => s.setPainterProgress);

  // Painter 1 & 2 Canvas engines
  const engine1 = useMemo(() => new PaintingCanvasEngine(), []);
  const engine2 = useMemo(() => new PaintingCanvasEngine(), []);

  useEffect(() => {
    return () => {
      engine1.dispose();
      engine2.dispose();
    };
  }, [engine1, engine2]);

  // Painter 1 Transform & Animation Refs
  const p1GroupRef = useRef<THREE.Group>(null);
  const brushTip1Ref = useRef<THREE.MeshStandardMaterial>(null);

  // Joint state for Painter 1
  const [p1Joints, setP1Joints] = useState({
    bodyBob: 0,
    spineTwist: 0,
    headPitch: 0,
    headYaw: 0,
    headRoll: 0,
    leftShoulderPitch: -0.55,
    leftShoulderRoll: 0.15,
    leftElbowFlex: 1.0,
    rightShoulderPitch: -0.4,
    rightShoulderRoll: -0.1,
    rightElbowFlex: 0.45,
    rightWristRoll: 0,
  });

  // Joint state for Painter 2
  const [p2Joints, setP2Joints] = useState({
    headPitch: 0.15,
    headYaw: 0.08,
    leftShoulderPitch: -0.5,
    leftElbowFlex: 0.9,
    rightShoulderPitch: -0.85,
    rightElbowFlex: 0.9,
  });

  // Internal state for Painter 1 timeline
  const p1State = useRef({
    cycleTime: 0,
    colorIndex: 0,
    currentProgress: 0,
  });

  // Painter 1 Position (framed near lawn edge & pond)
  const p1Pos = useMemo(() => {
    const x = -3.2;
    const z = 4.2;
    const y = getTerrainHeight(x, z);
    return new THREE.Vector3(x, y, z);
  }, []);

  // Painter 2 Position (further right, near pond)
  const p2Pos = useMemo(() => {
    const x = 1.2;
    const z = 6.4;
    const y = getTerrainHeight(x, z);
    return new THREE.Vector3(x, y, z);
  }, []);

  useFrame((_, delta) => {
    // ----------------------------------------------------
    // PAINTER 1 REALISTIC KINEMATICS & CHOREOGRAPHY
    // ----------------------------------------------------
    const s1 = p1State.current;
    s1.cycleTime += delta;
    const subCycle = s1.cycleTime % 12; // 12s per color stage
    const totalCycle = 84; // 7 colors * 12s
    s1.currentProgress = (s1.cycleTime % totalCycle) / totalCycle;

    // Determine current color from palette
    const colorIdx = Math.floor((s1.cycleTime % totalCycle) / 12);
    const targetColor = PALETTE_COLORS[colorIdx % PALETTE_COLORS.length];
    if (targetColor !== activePainterColor) {
      setActivePainterColor(targetColor);
      if (brushTip1Ref.current) {
        brushTip1Ref.current.color.set(targetColor);
      }
    }

    setPainterProgress(s1.currentProgress);

    let headYaw = 0;
    let headPitch = 0;
    let headRoll = 0;
    let spineTwist = 0;
    let bodyBob = Math.sin(s1.cycleTime * 1.5) * 0.008;
    let rightShoulderPitch = -0.3;
    let rightShoulderRoll = -0.1;
    let rightElbowFlex = 0.45;
    let rightWristRoll = 0;

    // Stage 1: Glance at landscape (0.0s to 2.5s)
    if (subCycle < 2.5) {
      const glanceP = subCycle / 2.5;
      headYaw = Math.sin(glanceP * Math.PI) * 0.55;
      headPitch = -0.06;
      spineTwist = headYaw * 0.25;
      rightShoulderPitch = -0.35;
      rightElbowFlex = 0.5;
      if (p1GroupRef.current) p1GroupRef.current.position.z = 0.85;
    }
    // Stage 2: Dip brush into chosen palette blob (2.5s to 5.0s)
    else if (subCycle < 5.0) {
      const dipP = (subCycle - 2.5) / 2.5;
      const dipArc = Math.sin(dipP * Math.PI);
      headYaw = -0.28;
      headPitch = 0.32;
      spineTwist = -0.12;
      rightShoulderPitch = -0.55 - dipArc * 0.35;
      rightShoulderRoll = -0.25 * dipArc;
      rightElbowFlex = 0.85 + dipArc * 0.35;
      rightWristRoll = -0.35 * dipArc;
    }
    // Stage 3: Apply fluid brush strokes on the canvas (5.0s to 9.5s)
    else if (subCycle < 9.5) {
      const paintP = (subCycle - 5.0) / 4.5;
      const strokeWave = Math.sin(paintP * 16);
      headYaw = 0.05;
      headPitch = 0.12 + Math.sin(paintP * 6) * 0.06;
      
      rightShoulderPitch = -1.15 + strokeWave * 0.16 + Math.cos(paintP * 4) * 0.1;
      rightShoulderRoll = -0.08;
      rightElbowFlex = 0.65 + Math.sin(paintP * 10) * 0.18;
      rightWristRoll = strokeWave * 0.25;

      const uvX = 0.18 + ((subCycle - 5.0) / 4.5) * 0.64 + Math.sin(paintP * 12) * 0.08;
      const uvY = 0.28 + (colorIdx / 7) * 0.5 + Math.cos(paintP * 10) * 0.08;
      engine1.drawDirectStroke(uvX, uvY, targetColor, 15);
      engine1.updatePaintingProgress(s1.currentProgress, targetColor);
    }
    // Stage 4: Step back and admire work with head tilt (9.5s to 12.0s)
    else {
      const stepP = (subCycle - 9.5) / 2.5;
      const stepArc = Math.sin(stepP * Math.PI);
      if (p1GroupRef.current) {
        p1GroupRef.current.position.z = 0.85 + stepArc * 0.24;
      }
      headPitch = -0.05;
      headRoll = stepArc * 0.18;
      rightShoulderPitch = -0.28;
      rightElbowFlex = 0.45;
    }

    setP1Joints({
      bodyBob,
      spineTwist,
      headPitch,
      headYaw,
      headRoll,
      leftShoulderPitch: -0.55,
      leftShoulderRoll: 0.15,
      leftElbowFlex: 1.05,
      rightShoulderPitch,
      rightShoulderRoll,
      rightElbowFlex,
      rightWristRoll,
    });

    // ----------------------------------------------------
    // PAINTER 2 (Seated Stool Artist Kinematics)
    // ----------------------------------------------------
    const t2 = s1.cycleTime * 0.75 + 4.0;
    const p2Cycle = t2 % 8;
    const stroke = Math.sin(p2Cycle * 6) * 0.15;
    setP2Joints({
      headPitch: 0.16 + stroke * 0.05,
      headYaw: 0.06,
      leftShoulderPitch: -0.55,
      leftElbowFlex: 0.95,
      rightShoulderPitch: -0.92 + stroke,
      rightElbowFlex: 0.75 + stroke * 0.4,
    });
    engine2.updatePaintingProgress((t2 % 60) / 60, '#3B82F6');
  });

  return (
    <group>
      {/* =================================================== */}
      {/* 1. HERO PAINTER 1 (Standing, Beret, Linen Smock)    */}
      {/* =================================================== */}
      <group position={[p1Pos.x, p1Pos.y, p1Pos.z]} rotation={[0, 0.4, 0]}>
        {/* Terracotta Painter's Rug */}
        <mesh position={[0, 0.02, 0.45]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[2.3, 2.3]} />
          <meshStandardMaterial color="#B0503D" roughness={0.85} />
        </mesh>

        {/* Anatomical Painter Model */}
        <group ref={p1GroupRef} position={[0, 0, 0.85]}>
          <Humanoid
            skinColor="#E5A97D"
            shirtColor="#F4ECE1" // Natural textured linen smock
            pantsColor="#334155" // Charcoal artists trousers
            shoesColor="#2B1E16"
            hairColor="#1E293B"
            hairStyle="short"
            hasHat={true}
            hatColor="#881337" // Burgundy French Beret
            hasWatch={true}
            scale={0.96}
            bodyBob={p1Joints.bodyBob}
            spineTwist={p1Joints.spineTwist}
            headPitch={p1Joints.headPitch}
            headYaw={p1Joints.headYaw}
            headRoll={p1Joints.headRoll}
            leftShoulderPitch={p1Joints.leftShoulderPitch}
            leftShoulderRoll={p1Joints.leftShoulderRoll}
            leftElbowFlex={p1Joints.leftElbowFlex}
            rightShoulderPitch={p1Joints.rightShoulderPitch}
            rightShoulderRoll={p1Joints.rightShoulderRoll}
            rightElbowFlex={p1Joints.rightElbowFlex}
            rightWristRoll={p1Joints.rightWristRoll}
            leftHandChildren={
              // Left Hand Palette rigidly attached to hand group
              <group position={[0.02, 0.02, 0.05]} rotation={[-0.4, 0.2, 0.1]}>
                <Palette activeColor={activePainterColor} />
              </group>
            }
            rightHandChildren={
              // Right Hand Fine Artist Paintbrush rigidly attached to hand group
              <group position={[-0.01, -0.02, 0.08]} rotation={[-Math.PI / 2 + 0.2, 0, 0]}>
                <mesh castShadow>
                  <cylinderGeometry args={[0.007, 0.012, 0.38, 8]} />
                  <meshStandardMaterial color="#78350F" roughness={0.6} />
                </mesh>
                <mesh position={[0, 0.19, 0]}>
                  <cylinderGeometry args={[0.011, 0.011, 0.045, 8]} />
                  <meshStandardMaterial color="#E5E7EB" metalness={0.95} roughness={0.15} />
                </mesh>
                <mesh position={[0, 0.235, 0]}>
                  <coneGeometry args={[0.014, 0.055, 8]} />
                  <meshStandardMaterial
                    ref={brushTip1Ref}
                    color={activePainterColor}
                    roughness={0.35}
                  />
                </mesh>
              </group>
            }
          />
        </group>

        {/* Easel 1 with Live Impressionist Masterwork Canvas */}
        <group position={[0, 0, 0]}>
          <Easel texture={engine1.texture} canvasWidth={1.25} canvasHeight={0.98} />
        </group>
      </group>

      {/* =================================================== */}
      {/* 2. PAINTER 2 (Seated Stool Artist)                  */}
      {/* =================================================== */}
      <group position={[p2Pos.x, p2Pos.y, p2Pos.z]} rotation={[0, -0.3, 0]}>
        {/* Handcrafted Walnut Stool */}
        <group position={[0, 0, 0.75]}>
          {/* Stool Round Seat */}
          <mesh position={[0, 0.44, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.22, 0.22, 0.04, 20]} />
            <meshStandardMaterial color="#5C381E" roughness={0.7} />
          </mesh>
          {/* 4 Angled Stool Legs */}
          {[-0.11, 0.11].map((x, i) =>
            [-0.11, 0.11].map((z, j) => (
              <mesh
                key={`${i}-${j}`}
                position={[x * 1.15, 0.21, z * 1.15]}
                rotation={[z > 0 ? -0.1 : 0.1, 0, x > 0 ? 0.1 : -0.1]}
                castShadow
              >
                <cylinderGeometry args={[0.02, 0.015, 0.44, 8]} />
                <meshStandardMaterial color="#5C381E" roughness={0.7} />
              </mesh>
            ))
          )}
          {/* Stool Leg Ring Stretcher */}
          <mesh position={[0, 0.16, 0]}>
            <torusGeometry args={[0.13, 0.012, 6, 16]} />
            <meshStandardMaterial color="#4A2D18" roughness={0.8} />
          </mesh>
        </group>

        {/* Seated Artist Model */}
        <group position={[0, 0, 0.75]}>
          <Humanoid
            isSitting={true}
            skinColor="#F5D0A9"
            shirtColor="#0284C7"
            pantsColor="#1E293B"
            shoesColor="#334155"
            hairColor="#78350F"
            hairStyle="bun"
            hasGlasses={true}
            scale={0.9}
            headPitch={p2Joints.headPitch}
            headYaw={p2Joints.headYaw}
            leftShoulderPitch={p2Joints.leftShoulderPitch}
            leftElbowFlex={p2Joints.leftElbowFlex}
            rightShoulderPitch={p2Joints.rightShoulderPitch}
            rightElbowFlex={p2Joints.rightElbowFlex}
            leftHandChildren={
              // Small wooden hand palette in left hand
              <group position={[0.02, 0.02, 0.04]} rotation={[-0.3, 0.15, 0]}>
                <Palette activeColor="#3B82F6" />
              </group>
            }
            rightHandChildren={
              // Fine Artist Paintbrush in right hand
              <group position={[-0.01, -0.02, 0.07]} rotation={[-Math.PI / 2 + 0.2, 0, 0]}>
                <mesh castShadow>
                  <cylinderGeometry args={[0.006, 0.01, 0.32, 8]} />
                  <meshStandardMaterial color="#6B4226" roughness={0.6} />
                </mesh>
                <mesh position={[0, 0.16, 0]}>
                  <cylinderGeometry args={[0.009, 0.009, 0.035, 8]} />
                  <meshStandardMaterial color="#E5E7EB" metalness={0.9} />
                </mesh>
                <mesh position={[0, 0.2, 0]}>
                  <coneGeometry args={[0.012, 0.045, 8]} />
                  <meshStandardMaterial color="#3B82F6" roughness={0.3} />
                </mesh>
              </group>
            }
          />
        </group>

        {/* Companion Easel 2 */}
        <group position={[0, 0, 0]} scale={0.88}>
          <Easel texture={engine2.texture} canvasWidth={0.98} canvasHeight={0.78} />
        </group>
      </group>
    </group>
  );
};
