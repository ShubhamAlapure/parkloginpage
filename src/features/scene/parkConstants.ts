import * as THREE from 'three';

export const EASEL = { position: [1.55, 0, 3.05] as [number, number, number], rotation: -0.93 };
export const angleToEasel = (x: number, z: number) => Math.atan2(EASEL.position[0] - x, EASEL.position[2] - z);

export const ONLOOKERS = [
  { name: 'onlooker_a', position: [-0.45, 0, 3.72] as [number, number, number], facing: angleToEasel(-0.45, 3.72) },
  { name: 'onlooker_b', position: [-0.02, 0, 4.2] as [number, number, number], facing: angleToEasel(-0.02, 4.2) },
];

export const PATH: [number, number][] = [
  [-6.5, 9],
  [-3.6, 6.4],
  [-0.9, 5.9],
  [1, 4.3],
  [1.2, 1.6],
  [2.4, -1],
  [5, -2.2],
  [8, -4.8],
  [11, -9],
];

export const PATH_WIDTH = 1.35;
export const BALL_A = { position: [3, 0, -1.6] as [number, number, number] };
export const BALL_B = { position: [4.6, 0, -4.6] as [number, number, number] };
export const BENCH = { position: [-0.6, 0, -0.6] as [number, number, number], rotation: -2.39 };
export const CAMERA = { position: [0.4, 1.5, 9.4] as [number, number, number], target: [0, 1, 0] as [number, number, number], fov: 40 };

export const CHASE_LOOP: [number, number, number][] = [
  [-0.8, 0, -1.9],
  [1.2, 0, -2.4],
  [1.8, 0, -4.4],
  [1, 0, -7.2],
  [-0.8, 0, -7.4],
  [-1.5, 0, -4.6],
];

export const EASEL_BACK = { position: [0.78, 0, 3.66] as [number, number, number], facing: 2.214 };
export const EASEL_SPOT = { position: [1.2, 0, 3.32] as [number, number, number], facing: 2.214 };
export const SLIDE = { position: [-5.4, 0, -8.5] as [number, number, number], rotation: 0.6 };
export const SWINGS = { position: [-3.4, 0, -3.6] as [number, number, number], rotation: 1.25 };
export const TABLE = { position: [-1.35, 0, 2.6] as [number, number, number], rotation: 0.25 };
export const TABLE_SPOT = { position: [-1.2, 0, 3.25] as [number, number, number], facing: Math.PI + 0.25 };
export const VIEW_SPOT = { position: [1.8, 0, 5.1] as [number, number, number], facing: -0.35 };

export const TREES = [
  { position: [-8.2, 0, -4.5] as [number, number, number], scale: 1.25, seed: 1 },
  { position: [-9.5, 0, 1.5] as [number, number, number], scale: 1.4, seed: 2 },
  { position: [-7.5, 0, -12.5] as [number, number, number], scale: 1.5, seed: 3 },
  { position: [8.6, 0, -2.6] as [number, number, number], scale: 1.2, seed: 4 },
  { position: [9.8, 0, -7.5] as [number, number, number], scale: 1.6, seed: 5 },
  { position: [2.5, 0, -18.5] as [number, number, number], scale: 1.7, seed: 6 },
  { position: [-2.8, 0, -20.5] as [number, number, number], scale: 1.6, seed: 7 },
  { position: [8.2, 0, -16.5] as [number, number, number], scale: 1.5, seed: 8 },
  { position: [-11.5, 0, -8.5] as [number, number, number], scale: 1.6, seed: 9 },
  { position: [7.8, 0, 3.4] as [number, number, number], scale: 1.05, seed: 10 },
  { position: [-12.5, 0, 6.5] as [number, number, number], scale: 1.5, seed: 11 },
  { position: [-6.2, 0, -15.8] as [number, number, number], scale: 1.45, seed: 12 },
  { position: [-10.4, 0, -14.6] as [number, number, number], scale: 1.55, seed: 13 },
  { position: [5.6, 0, -14.2] as [number, number, number], scale: 1.4, seed: 14 },
  { position: [12.2, 0, -12.4] as [number, number, number], scale: 1.6, seed: 15 },
  { position: [-14.4, 0, -12.2] as [number, number, number], scale: 1.5, seed: 16 },
  { position: [0.2, 0, -15.6] as [number, number, number], scale: 1.35, seed: 17 },
  { position: [-12, 0, -27] as [number, number, number], scale: 1.8, seed: 18 },
  { position: [-4.2, 0, -28.5] as [number, number, number], scale: 1.9, seed: 19 },
  { position: [3.4, 0, -27.2] as [number, number, number], scale: 1.75, seed: 20 },
  { position: [10.2, 0, -26] as [number, number, number], scale: 1.85, seed: 21 },
  { position: [16.4, 0, -23.5] as [number, number, number], scale: 1.7, seed: 22 },
  { position: [-18.5, 0, -22] as [number, number, number], scale: 1.8, seed: 23 },
];

export const pathVectors = PATH.map(([x, z]) => new THREE.Vector2(x, z));
