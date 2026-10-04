import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';

export interface HumanoidPose {
  bob?: number;
  bodyBob?: number;
  pelvisSway?: number;
  pelvisYaw?: number;
  spineTwist?: number;
  headPitch?: number;
  headYaw?: number;
  headRoll?: number;
  leftShoulderPitch?: number;
  leftShoulderRoll?: number;
  leftElbowFlex?: number;
  leftWristRoll?: number;
  rightShoulderPitch?: number;
  rightShoulderRoll?: number;
  rightElbowFlex?: number;
  rightWristRoll?: number;
  leftHipPitch?: number;
  leftHipRoll?: number;
  leftKneeFlex?: number;
  leftAnklePitch?: number;
  rightHipPitch?: number;
  rightHipRoll?: number;
  rightKneeFlex?: number;
  rightAnklePitch?: number;
}

export interface HumanoidRef {
  setPose: (pose: HumanoidPose) => void;
  root: THREE.Group | null;
}

export interface HumanoidProps extends HumanoidPose {
  skinColor?: string;
  shirtColor?: string;
  pantsColor?: string;
  shoesColor?: string;
  hairColor?: string;
  hairStyle?: 'short' | 'long' | 'curly' | 'bun' | 'ponytail';
  hasHat?: boolean;
  hatColor?: string;
  hasGlasses?: boolean;
  hasWatch?: boolean;
  hasBag?: boolean;
  scale?: number;
  isSitting?: boolean;
  leftHandChildren?: React.ReactNode;
  rightHandChildren?: React.ReactNode;
}

export const Humanoid = forwardRef<HumanoidRef, HumanoidProps>(({
  skinColor = '#E0AC69',
  shirtColor = '#2563EB',
  pantsColor = '#1E293B',
  shoesColor = '#38281C',
  hairColor = '#2A1B0E',
  hairStyle = 'short',
  hasHat = false,
  hatColor = '#991B1B',
  hasGlasses = false,
  hasWatch = false,
  hasBag = false,
  scale = 1.0,
  bob = 0,
  bodyBob = 0,
  pelvisSway = 0,
  pelvisYaw = 0,
  spineTwist = 0,
  headPitch = 0,
  headYaw = 0,
  headRoll = 0,
  leftShoulderPitch = 0,
  leftShoulderRoll = 0,
  leftElbowFlex = 0.2,
  leftWristRoll = 0,
  rightShoulderPitch = 0,
  rightShoulderRoll = 0,
  rightElbowFlex = 0.2,
  rightWristRoll = 0,
  leftHipPitch = 0,
  leftHipRoll = 0,
  leftKneeFlex = 0,
  leftAnklePitch = 0,
  rightHipPitch = 0,
  rightHipRoll = 0,
  rightKneeFlex = 0,
  rightAnklePitch = 0,
  isSitting = false,
  leftHandChildren,
  rightHandChildren,
}, ref) => {
  const rootRef = useRef<THREE.Group>(null);
  const pelvisRef = useRef<THREE.Group>(null);
  const spineRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftShoulderRef = useRef<THREE.Group>(null);
  const leftElbowRef = useRef<THREE.Group>(null);
  const rightShoulderRef = useRef<THREE.Group>(null);
  const rightElbowRef = useRef<THREE.Group>(null);
  const leftHipRef = useRef<THREE.Group>(null);
  const leftKneeRef = useRef<THREE.Group>(null);
  const leftAnkleRef = useRef<THREE.Group>(null);
  const rightHipRef = useRef<THREE.Group>(null);
  const rightKneeRef = useRef<THREE.Group>(null);
  const rightAnkleRef = useRef<THREE.Group>(null);

  useImperativeHandle(ref, () => ({
    root: rootRef.current,
    setPose: (pose: HumanoidPose) => {
      const b = pose.bodyBob !== undefined ? pose.bodyBob : pose.bob;
      if (rootRef.current && b !== undefined) rootRef.current.position.y = b;
      if (pelvisRef.current) {
        if (pose.pelvisYaw !== undefined) pelvisRef.current.rotation.y = pose.pelvisYaw;
        if (pose.pelvisSway !== undefined) pelvisRef.current.rotation.z = pose.pelvisSway;
      }
      if (spineRef.current && pose.spineTwist !== undefined) spineRef.current.rotation.y = pose.spineTwist;
      if (headRef.current) {
        if (pose.headPitch !== undefined) headRef.current.rotation.x = pose.headPitch;
        if (pose.headYaw !== undefined) headRef.current.rotation.y = pose.headYaw;
        if (pose.headRoll !== undefined) headRef.current.rotation.z = pose.headRoll;
      }
      if (leftShoulderRef.current) {
        if (pose.leftShoulderPitch !== undefined) leftShoulderRef.current.rotation.x = pose.leftShoulderPitch;
        if (pose.leftShoulderRoll !== undefined) leftShoulderRef.current.rotation.z = pose.leftShoulderRoll;
      }
      if (leftElbowRef.current && pose.leftElbowFlex !== undefined) leftElbowRef.current.rotation.x = pose.leftElbowFlex;
      if (rightShoulderRef.current) {
        if (pose.rightShoulderPitch !== undefined) rightShoulderRef.current.rotation.x = pose.rightShoulderPitch;
        if (pose.rightShoulderRoll !== undefined) rightShoulderRef.current.rotation.z = pose.rightShoulderRoll;
      }
      if (rightElbowRef.current && pose.rightElbowFlex !== undefined) rightElbowRef.current.rotation.x = pose.rightElbowFlex;
      if (leftHipRef.current && pose.leftHipPitch !== undefined) leftHipRef.current.rotation.x = pose.leftHipPitch;
      if (leftKneeRef.current && pose.leftKneeFlex !== undefined) leftKneeRef.current.rotation.x = -Math.abs(pose.leftKneeFlex);
      if (leftAnkleRef.current && pose.leftAnklePitch !== undefined) leftAnkleRef.current.rotation.x = pose.leftAnklePitch;
      if (rightHipRef.current && pose.rightHipPitch !== undefined) rightHipRef.current.rotation.x = pose.rightHipPitch;
      if (rightKneeRef.current && pose.rightKneeFlex !== undefined) rightKneeRef.current.rotation.x = -Math.abs(pose.rightKneeFlex);
      if (rightAnkleRef.current && pose.rightAnklePitch !== undefined) rightAnkleRef.current.rotation.x = pose.rightAnklePitch;
    },
  }));

  return (
    <group ref={rootRef} scale={scale} position={[0, bodyBob || bob, 0]}>
      {/* 1. PELVIS / ROOT (Governs natural hip sway and twist) */}
      <group
        ref={pelvisRef}
        position={[0, isSitting ? 0.48 : 0.88, 0]}
        rotation={[0, pelvisYaw, pelvisSway]}
      >
        {/* Pelvis Shape (Tapered hip with belt contour) */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.28, 0.14, 0.18]} />
          <meshStandardMaterial color={pantsColor} roughness={0.7} />
        </mesh>
        {/* Belt */}
        <mesh position={[0, 0.06, 0]}>
          <boxGeometry args={[0.29, 0.03, 0.19]} />
          <meshStandardMaterial color="#1F1B18" roughness={0.6} />
        </mesh>
        {/* Metallic Belt Buckle */}
        <mesh position={[0, 0.06, 0.098]}>
          <boxGeometry args={[0.05, 0.035, 0.01]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* 2. SPINE & TORSO (Spine counter-twists relative to pelvis for natural organic motion) */}
        <group ref={spineRef} position={[0, 0.07, 0]} rotation={[0, spineTwist, 0]}>
          {/* Lower Abdomen */}
          <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.13, 0.135, 0.18, 10]} />
            <meshStandardMaterial color={shirtColor} roughness={0.6} />
          </mesh>

          {/* Upper Chest / Ribcage */}
          <group position={[0, 0.24, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.34, 0.22, 0.2]} />
              <meshStandardMaterial color={shirtColor} roughness={0.6} />
            </mesh>
            {/* Shirt Collar V-neck / button band */}
            <mesh position={[0, 0.08, 0.102]}>
              <boxGeometry args={[0.08, 0.07, 0.005]} />
              <meshStandardMaterial color={skinColor} roughness={0.5} />
            </mesh>

            {/* Optional Messenger Bag Strap */}
            {hasBag && (
              <group position={[0, 0, 0]} rotation={[0, 0, 0.6]}>
                <mesh position={[0, 0, 0.105]}>
                  <boxGeometry args={[0.04, 0.42, 0.01]} />
                  <meshStandardMaterial color="#5C3B1E" roughness={0.8} />
                </mesh>
                <mesh position={[-0.15, -0.3, 0.12]}>
                  <boxGeometry args={[0.18, 0.15, 0.06]} />
                  <meshStandardMaterial color="#5C3B1E" roughness={0.8} />
                </mesh>
              </group>
            )}

            {/* 3. NECK & HEAD */}
            <group position={[0, 0.13, 0]}>
              {/* Neck with realistic cylinder taper */}
              <mesh position={[0, 0.05, 0]} castShadow>
                <cylinderGeometry args={[0.055, 0.065, 0.1, 10]} />
                <meshStandardMaterial color={skinColor} roughness={0.5} />
              </mesh>

              {/* Head with dynamic pitch, yaw, roll */}
              <group
                ref={headRef}
                position={[0, 0.16, 0]}
                rotation={[headPitch, headYaw, headRoll]}
              >
                {/* Cranium / Face structure */}
                <mesh castShadow>
                  <sphereGeometry args={[0.135, 16, 16]} />
                  <meshStandardMaterial color={skinColor} roughness={0.5} />
                </mesh>
                {/* Jaw / Chin contour */}
                <mesh position={[0, -0.04, 0.04]} castShadow>
                  <boxGeometry args={[0.11, 0.09, 0.11]} />
                  <meshStandardMaterial color={skinColor} roughness={0.5} />
                </mesh>
                {/* Nose bridge */}
                <mesh position={[0, 0.01, 0.14]} rotation={[Math.PI / 2, 0, 0]}>
                  <coneGeometry args={[0.02, 0.045, 6]} />
                  <meshStandardMaterial color={skinColor} roughness={0.5} />
                </mesh>
                {/* Subtle stylized eyes */}
                {[-0.042, 0.042].map((x, i) => (
                  <mesh key={`eye-${i}`} position={[x, 0.03, 0.125]}>
                    <sphereGeometry args={[0.014, 8, 8]} />
                    <meshStandardMaterial color="#1E293B" roughness={0.2} />
                  </mesh>
                ))}

                {/* Glasses */}
                {hasGlasses && (
                  <group position={[0, 0.03, 0.13]}>
                    {[-0.042, 0.042].map((gx, gi) => (
                      <mesh key={`glass-${gi}`} position={[gx, 0, 0]}>
                        <torusGeometry args={[0.024, 0.004, 6, 16]} />
                        <meshStandardMaterial color="#1E1E1E" metalness={0.8} />
                      </mesh>
                    ))}
                    <mesh position={[0, 0, 0]}>
                      <boxGeometry args={[0.03, 0.005, 0.005]} />
                      <meshStandardMaterial color="#1E1E1E" metalness={0.8} />
                    </mesh>
                  </group>
                )}

                {/* Hair Variations */}
                <group position={[0, 0.04, -0.02]}>
                  {hairStyle === 'short' && (
                    <mesh position={[0, 0.02, 0]} castShadow>
                      <sphereGeometry args={[0.145, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
                      <meshStandardMaterial color={hairColor} roughness={0.8} />
                    </mesh>
                  )}
                  {hairStyle === 'long' && (
                    <group>
                      <mesh position={[0, 0.02, 0]} castShadow>
                        <sphereGeometry args={[0.145, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
                        <meshStandardMaterial color={hairColor} roughness={0.8} />
                      </mesh>
                      {/* Flowing locks */}
                      {[-0.09, 0.09, 0].map((hx, hi) => (
                        <mesh key={`lock-${hi}`} position={[hx, -0.12, -0.04]} castShadow>
                          <cylinderGeometry args={[0.035, 0.025, 0.22, 8]} />
                          <meshStandardMaterial color={hairColor} roughness={0.8} />
                        </mesh>
                      ))}
                    </group>
                  )}
                  {hairStyle === 'bun' && (
                    <group>
                      <mesh position={[0, 0.02, 0]} castShadow>
                        <sphereGeometry args={[0.145, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
                        <meshStandardMaterial color={hairColor} roughness={0.8} />
                      </mesh>
                      <mesh position={[0, 0.12, -0.08]} castShadow>
                        <sphereGeometry args={[0.055, 8, 8]} />
                        <meshStandardMaterial color={hairColor} roughness={0.8} />
                      </mesh>
                    </group>
                  )}
                  {hairStyle === 'ponytail' && (
                    <group>
                      <mesh position={[0, 0.02, 0]} castShadow>
                        <sphereGeometry args={[0.145, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
                        <meshStandardMaterial color={hairColor} roughness={0.8} />
                      </mesh>
                      <mesh position={[0, 0.02, -0.16]} rotation={[-0.4, 0, 0]} castShadow>
                        <coneGeometry args={[0.04, 0.22, 8]} />
                        <meshStandardMaterial color={hairColor} roughness={0.8} />
                      </mesh>
                    </group>
                  )}
                </group>

                {/* Hat (Beret, Cap, or Sun Hat) */}
                {hasHat && (
                  <group position={[0, 0.1, 0]} rotation={[-0.1, 0, 0]}>
                    <mesh castShadow>
                      <cylinderGeometry args={[0.18, 0.15, 0.06, 16]} />
                      <meshStandardMaterial color={hatColor} roughness={0.7} />
                    </mesh>
                    {/* Crown puff */}
                    <mesh position={[0, 0.04, 0]} castShadow>
                      <sphereGeometry args={[0.12, 10, 10, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
                      <meshStandardMaterial color={hatColor} roughness={0.7} />
                    </mesh>
                  </group>
                )}
              </group>
            </group>

            {/* 4. LEFT ARM HIERARCHY */}
            <group position={[-0.2, 0.06, 0]}>
              <group ref={leftShoulderRef} rotation={[leftShoulderPitch, 0, leftShoulderRoll]}>
                <mesh position={[0, -0.04, 0]} castShadow>
                  <sphereGeometry args={[0.055, 8, 8]} />
                  <meshStandardMaterial color={shirtColor} roughness={0.6} />
                </mesh>
                <mesh position={[0, -0.14, 0]} castShadow>
                  <cylinderGeometry args={[0.045, 0.04, 0.18, 8]} />
                  <meshStandardMaterial color={shirtColor} roughness={0.6} />
                </mesh>

                <group ref={leftElbowRef} position={[0, -0.24, 0]} rotation={[leftElbowFlex, 0, 0]}>
                  <mesh position={[0, 0, 0]}>
                    <sphereGeometry args={[0.038, 6, 6]} />
                    <meshStandardMaterial color={skinColor} roughness={0.5} />
                  </mesh>
                  <mesh position={[0, -0.11, 0]} castShadow>
                    <cylinderGeometry args={[0.038, 0.032, 0.2, 8]} />
                    <meshStandardMaterial color={skinColor} roughness={0.5} />
                  </mesh>

                  {hasWatch && (
                    <mesh position={[0, -0.19, 0]}>
                      <cylinderGeometry args={[0.036, 0.036, 0.02, 8]} />
                      <meshStandardMaterial color="#1E293B" metalness={0.7} />
                    </mesh>
                  )}

                  <group position={[0, -0.23, 0]} rotation={[0, 0, leftWristRoll]}>
                    <mesh position={[0, -0.03, 0.01]} castShadow>
                      <boxGeometry args={[0.045, 0.065, 0.025]} />
                      <meshStandardMaterial color={skinColor} roughness={0.5} />
                    </mesh>
                    <mesh position={[0.025, -0.02, 0.015]} rotation={[0, 0, -0.4]}>
                      <cylinderGeometry args={[0.008, 0.007, 0.035, 6]} />
                      <meshStandardMaterial color={skinColor} roughness={0.5} />
                    </mesh>
                    {leftHandChildren}
                  </group>
                </group>
              </group>
            </group>

            {/* 5. RIGHT ARM HIERARCHY */}
            <group position={[0.2, 0.06, 0]}>
              <group ref={rightShoulderRef} rotation={[rightShoulderPitch, 0, rightShoulderRoll]}>
                <mesh position={[0, -0.04, 0]} castShadow>
                  <sphereGeometry args={[0.055, 8, 8]} />
                  <meshStandardMaterial color={shirtColor} roughness={0.6} />
                </mesh>
                <mesh position={[0, -0.14, 0]} castShadow>
                  <cylinderGeometry args={[0.045, 0.04, 0.18, 8]} />
                  <meshStandardMaterial color={shirtColor} roughness={0.6} />
                </mesh>

                <group ref={rightElbowRef} position={[0, -0.24, 0]} rotation={[rightElbowFlex, 0, 0]}>
                  <mesh position={[0, 0, 0]}>
                    <sphereGeometry args={[0.038, 6, 6]} />
                    <meshStandardMaterial color={skinColor} roughness={0.5} />
                  </mesh>
                  <mesh position={[0, -0.11, 0]} castShadow>
                    <cylinderGeometry args={[0.038, 0.032, 0.2, 8]} />
                    <meshStandardMaterial color={skinColor} roughness={0.5} />
                  </mesh>

                  <group position={[0, -0.23, 0]} rotation={[0, 0, rightWristRoll]}>
                    <mesh position={[0, -0.03, 0.01]} castShadow>
                      <boxGeometry args={[0.045, 0.065, 0.025]} />
                      <meshStandardMaterial color={skinColor} roughness={0.5} />
                    </mesh>
                    <mesh position={[-0.025, -0.02, 0.015]} rotation={[0, 0, 0.4]}>
                      <cylinderGeometry args={[0.008, 0.007, 0.035, 6]} />
                      <meshStandardMaterial color={skinColor} roughness={0.5} />
                    </mesh>
                    {rightHandChildren}
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>

        {/* 6. LEFT LEG HIERARCHY */}
        <group position={[-0.09, -0.04, 0]}>
          <group ref={leftHipRef} rotation={[isSitting ? Math.PI / 2 : leftHipPitch, 0, leftHipRoll]}>
            <mesh position={[0, -0.18, 0]} castShadow>
              <cylinderGeometry args={[0.065, 0.055, 0.36, 10]} />
              <meshStandardMaterial color={pantsColor} roughness={0.7} />
            </mesh>

            <group ref={leftKneeRef} position={[0, -0.36, 0]} rotation={[isSitting ? -Math.PI / 2 : -Math.abs(leftKneeFlex), 0, 0]}>
              <mesh position={[0, 0, 0.02]} castShadow>
                <sphereGeometry args={[0.045, 8, 8]} />
                <meshStandardMaterial color={pantsColor} roughness={0.7} />
              </mesh>
              <mesh position={[0, -0.18, 0]} castShadow>
                <cylinderGeometry args={[0.05, 0.042, 0.36, 10]} />
                <meshStandardMaterial color={pantsColor} roughness={0.7} />
              </mesh>

              <group ref={leftAnkleRef} position={[0, -0.38, 0]} rotation={[leftAnklePitch, 0, 0]}>
                <mesh position={[0, 0.03, 0.05]} castShadow>
                  <boxGeometry args={[0.08, 0.07, 0.18]} />
                  <meshStandardMaterial color={shoesColor} roughness={0.6} />
                </mesh>
                <mesh position={[0, -0.015, 0.05]} castShadow>
                  <boxGeometry args={[0.086, 0.025, 0.19]} />
                  <meshStandardMaterial color="#EAEAEA" roughness={0.4} />
                </mesh>
              </group>
            </group>
          </group>
        </group>

        {/* 7. RIGHT LEG HIERARCHY */}
        <group position={[0.09, -0.04, 0]}>
          <group ref={rightHipRef} rotation={[isSitting ? Math.PI / 2 : rightHipPitch, 0, rightHipRoll]}>
            <mesh position={[0, -0.18, 0]} castShadow>
              <cylinderGeometry args={[0.065, 0.055, 0.36, 10]} />
              <meshStandardMaterial color={pantsColor} roughness={0.7} />
            </mesh>

            <group ref={rightKneeRef} position={[0, -0.36, 0]} rotation={[isSitting ? -Math.PI / 2 : -Math.abs(rightKneeFlex), 0, 0]}>
              <mesh position={[0, 0, 0.02]} castShadow>
                <sphereGeometry args={[0.045, 8, 8]} />
                <meshStandardMaterial color={pantsColor} roughness={0.7} />
              </mesh>
              <mesh position={[0, -0.18, 0]} castShadow>
                <cylinderGeometry args={[0.05, 0.042, 0.36, 10]} />
                <meshStandardMaterial color={pantsColor} roughness={0.7} />
              </mesh>

              <group ref={rightAnkleRef} position={[0, -0.38, 0]} rotation={[rightAnklePitch, 0, 0]}>
                <mesh position={[0, 0.03, 0.05]} castShadow>
                  <boxGeometry args={[0.08, 0.07, 0.18]} />
                  <meshStandardMaterial color={shoesColor} roughness={0.6} />
                </mesh>
                <mesh position={[0, -0.015, 0.05]} castShadow>
                  <boxGeometry args={[0.086, 0.025, 0.19]} />
                  <meshStandardMaterial color="#EAEAEA" roughness={0.4} />
                </mesh>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
});

Humanoid.displayName = 'Humanoid';
