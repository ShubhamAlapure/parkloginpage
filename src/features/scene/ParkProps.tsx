import * as THREE from 'three';
import React, { useMemo } from 'react';
import { EASEL, TABLE, BENCH, SWINGS, SLIDE } from './parkConstants';
import { SketchBoard } from './SketchBoard';

export const matWood = new THREE.MeshStandardMaterial({ color: '#9a7452', roughness: 0.8 });
export const matDarkWood = new THREE.MeshStandardMaterial({ color: '#6d4f37', roughness: 0.85 });
export const matMetalDark = new THREE.MeshStandardMaterial({ color: '#3d4a4f', roughness: 0.45, metalness: 0.6 });
export const matMetalGreen = new THREE.MeshStandardMaterial({ color: '#2f6b5e', roughness: 0.5, metalness: 0.3 });
export const matYellow = new THREE.MeshStandardMaterial({ color: '#e0a23a', roughness: 0.4 });

export function BoxMesh({
  size,
  position,
  rotation,
  material = matWood,
}: {
  size: [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  material?: THREE.Material;
}) {
  return (
    <mesh position={position} rotation={rotation} material={material} castShadow receiveShadow>
      <boxGeometry args={size} />
    </mesh>
  );
}

export function CylSegment({
  from,
  to,
  radius = 0.02,
  material = matMetalDark,
}: {
  from: [number, number, number];
  to: [number, number, number];
  radius?: number;
  material?: THREE.Material;
}) {
  const { position, quaternion, length } = useMemo(() => {
    const pA = new THREE.Vector3(...from);
    const pB = new THREE.Vector3(...to);
    const diff = pB.clone().sub(pA);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), diff.clone().normalize());
    return {
      position: pA.clone().add(pB).multiplyScalar(0.5),
      quaternion: q,
      length: diff.length(),
    };
  }, [from, to]);

  return (
    <mesh position={position} quaternion={quaternion} material={material} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, length, 8]} />
    </mesh>
  );
}

export const EASEL_CANVAS_CONF = {
  center: [0, 1.02, 0.09] as [number, number, number],
  size: [0.52, 0.65] as [number, number],
  tilt: -0.12,
};

export const JAR_TRAY_OFFSET: [number, number, number] = [0.2, 0.735, 0.15];
export const JAR_TABLE_POS: [number, number, number] = (() => {
  const [tx, , tz] = TABLE.position;
  const [ox, oz] = [0.22, 0.16];
  const cos = Math.cos(TABLE.rotation);
  const sin = Math.sin(TABLE.rotation);
  return [tx + ox * cos + oz * sin, 0.615, tz - ox * sin + oz * cos];
})();

export function EaselStructure({
  board,
  canvasRef,
}: {
  board: SketchBoard;
  canvasRef: React.RefObject<THREE.Group | null>;
}) {
  const { center, size, tilt } = EASEL_CANVAS_CONF;
  return (
    <group position={EASEL.position} rotation-y={EASEL.rotation}>
      <CylSegment from={[-0.3, 0, 0.1]} to={[-0.05, 1.5, -0.02]} radius={0.018} material={matWood} />
      <CylSegment from={[0.3, 0, 0.1]} to={[0.05, 1.5, -0.02]} radius={0.018} material={matWood} />
      <CylSegment from={[0, 0, -0.5]} to={[0, 1.42, -0.04]} radius={0.016} material={matWood} />
      <BoxMesh size={[0.62, 0.035, 0.08]} position={[0, center[1] - size[1] / 2 - 0.02, 0.14]} />
      <group ref={canvasRef as any} position={center} rotation-x={tilt}>
        <BoxMesh size={[size[0] + 0.02, size[1] + 0.02, 0.012]} position={[0, 0, -0.008]} material={matDarkWood} />
        <mesh castShadow receiveShadow>
          <planeGeometry args={size} />
          <meshStandardMaterial map={board.texture} roughness={0.95} />
        </mesh>
      </group>
    </group>
  );
}

const PAINT_COLORS = ['#d8493b', '#f0c237', '#3f7fc4', '#4fa150', '#f4f1ea'];

export function SupplyTable() {
  return (
    <group position={TABLE.position} rotation-y={TABLE.rotation}>
      <BoxMesh size={[1.2, 0.04, 0.66]} position={[0, 0.53, 0]} />
      {[
        [-0.55, -0.28],
        [0.55, -0.28],
        [-0.55, 0.28],
        [0.55, 0.28],
      ].map(([x, z]) => (
        <BoxMesh key={`${x}${z}`} size={[0.05, 0.51, 0.05]} position={[x, 0.255, z]} material={matDarkWood} />
      ))}
      {PAINT_COLORS.map((c, idx) => (
        <group key={c} position={[-0.42 + 0.12 * idx, 0.55 + 0.035, -0.1]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.035, 0.035, 0.07, 14]} />
            <meshStandardMaterial color={c} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.037, 0.037, 0.012, 14]} />
            <meshStandardMaterial color="#e8e2d6" roughness={0.6} />
          </mesh>
        </group>
      ))}
      <mesh position={[0.3, 0.551, -0.1]} rotation-x={-Math.PI / 2} castShadow receiveShadow>
        <circleGeometry args={[0.13, 24]} />
        <meshStandardMaterial color="#efe6d4" roughness={0.7} />
      </mesh>
      {PAINT_COLORS.slice(0, 4).map((c, idx) => (
        <mesh key={c} position={[0.3 + 0.07 * Math.cos(1.4 * idx), 0.553, -0.1 + 0.07 * Math.sin(1.4 * idx)]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[0.022, 12]} />
          <meshStandardMaterial color={c} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0.45, 0.55 + 0.055, 0.18]} castShadow>
        <cylinderGeometry args={[0.04, 0.035, 0.11, 12]} />
        <meshStandardMaterial color="#c9d6d8" roughness={0.2} transparent opacity={0.75} />
      </mesh>
      {[0, 1, 2].map(i => (
        <CylSegment
          key={i}
          from={[0.45 + (i - 1) * 0.012, 0.56, 0.18]}
          to={[0.45 + (i - 1) * 0.04, 0.75, 0.18 + (i - 1) * 0.02]}
          radius={0.005}
          material={matDarkWood}
        />
      ))}
      <BoxMesh size={[0.3, 0.02, 0.22]} position={[-0.2, 0.56, 0.12]} rotation={[0, 0.3, 0]} material={new THREE.MeshStandardMaterial({ color: '#f7f3ea', roughness: 0.9 })} />
    </group>
  );
}

export function ParkBench() {
  return (
    <group position={BENCH.position} rotation-y={BENCH.rotation}>
      {[0, 1, 2].map(i => (
        <BoxMesh key={`s${i}`} size={[1.7, 0.035, 0.1]} position={[0, 0.45, -0.13 + 0.13 * i]} />
      ))}
      {[0, 1].map(i => (
        <BoxMesh key={`b${i}`} size={[1.7, 0.1, 0.03]} position={[0, 0.62 + 0.14 * i, -0.24]} rotation={[-0.15, 0, 0]} />
      ))}
      {[-0.7, 0.7].map(x => (
        <group key={x} position={[x, 0, 0]}>
          <BoxMesh size={[0.05, 0.45, 0.05]} position={[0, 0.22, 0.12]} material={matMetalDark} />
          <BoxMesh size={[0.05, 0.85, 0.05]} position={[0, 0.42, -0.2]} rotation={[-0.12, 0, 0]} material={matMetalDark} />
          <BoxMesh size={[0.05, 0.04, 0.4]} position={[0, 0.43, -0.03]} material={matMetalDark} />
        </group>
      ))}
    </group>
  );
}

export function SwingsFrame() {
  return (
    <group position={SWINGS.position} rotation-y={SWINGS.rotation}>
      {[-1.3, 1.3].map(x => (
        <group key={x}>
          <CylSegment from={[x, 0, -0.75]} to={[x, 2.3, 0]} radius={0.045} material={matMetalGreen} />
          <CylSegment from={[x, 0, 0.75]} to={[x, 2.3, 0]} radius={0.045} material={matMetalGreen} />
        </group>
      ))}
      <CylSegment from={[-1.35, 2.3, 0]} to={[1.35, 2.3, 0]} radius={0.05} material={matMetalGreen} />
    </group>
  );
}

export function SwingSeat({
  offset,
  pivotRef,
  children,
}: {
  offset: number;
  pivotRef: React.RefObject<THREE.Group | null>;
  children?: React.ReactNode;
}) {
  return (
    <group position={SWINGS.position} rotation-y={SWINGS.rotation}>
      <group ref={pivotRef as any} position={[offset, 2.3, 0]}>
        <CylSegment from={[-0.22, 0, 0]} to={[-0.22, -1.82, 0]} radius={0.008} material={matMetalDark} />
        <CylSegment from={[0.22, 0, 0]} to={[0.22, -1.82, 0]} radius={0.008} material={matMetalDark} />
        <BoxMesh size={[0.5, 0.03, 0.2]} position={[0, -1.84, 0]} material={new THREE.MeshStandardMaterial({ color: '#232526', roughness: 0.7 })} />
        {children}
      </group>
    </group>
  );
}

export function PlaygroundSlide() {
  return (
    <group position={SLIDE.position} rotation-y={SLIDE.rotation}>
      <BoxMesh size={[0.7, 0.06, 0.7]} position={[0, 1.5, 0]} material={matWood} />
      {[
        [-0.33, -0.33],
        [0.33, -0.33],
        [-0.33, 0.33],
        [0.33, 0.33],
      ].map(([x, z]) => (
        <BoxMesh key={`${x}${z}`} size={[0.07, 2.1, 0.07]} position={[x, 1.05, z]} material={matMetalGreen} />
      ))}
      <BoxMesh size={[0.7, 0.3, 0.03]} position={[0, 1.72, -0.34]} material={matMetalGreen} />
      {[0, 1, 2, 3, 4].map(i => (
        <BoxMesh key={i} size={[0.5, 0.03, 0.08]} position={[0, 0.25 + 0.28 * i, -0.6 + 0.05 * i]} material={matWood} />
      ))}
      <CylSegment from={[-0.27, 0, -0.62]} to={[-0.27, 1.5, -0.38]} radius={0.025} material={matMetalGreen} />
      <CylSegment from={[0.27, 0, -0.62]} to={[0.27, 1.5, -0.38]} radius={0.025} material={matMetalGreen} />
      <group position={[0, 0.8, 1.35]} rotation-x={0.62}>
        <BoxMesh size={[0.55, 0.03, 2.3]} position={[0, 0, 0]} material={matYellow} />
        <BoxMesh size={[0.03, 0.12, 2.3]} position={[-0.28, 0.06, 0]} material={matYellow} />
        <BoxMesh size={[0.03, 0.12, 2.3]} position={[0.28, 0.06, 0]} material={matYellow} />
      </group>
    </group>
  );
}

export function ParkProps() {
  const bushMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#35512a', roughness: 0.95 }), []);

  return (
    <group>
      {/* Lamp post */}
      <group position={[5.4, 0, -0.8]}>
        <CylSegment from={[0, 0, 0]} to={[0, 3.2, 0]} radius={0.05} material={matMetalDark} />
        <mesh position={[0, 3.3, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.16, 0.28, 8]} />
          <meshStandardMaterial color="#2c3538" roughness={0.5} metalness={0.5} />
        </mesh>
      </group>

      {/* Trash can */}
      <group position={[3.4, 0, 1.2]}>
        <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.24, 0.22, 0.8, 16]} />
          <meshStandardMaterial color="#3a4b45" roughness={0.6} metalness={0.2} />
        </mesh>
      </group>

      {/* Boundary hedge bushes */}
      {Array.from({ length: 16 }, (_, i) => (
        <mesh
          key={i}
          position={[-18 + 2.4 * i, 0.55, -23 + 0.8 * Math.sin(1.7 * i)]}
          scale={[1.6, 0.8, 1]}
          material={bushMat}
          castShadow
        >
          <sphereGeometry args={[1, 12, 10]} />
        </mesh>
      ))}
    </group>
  );
}
