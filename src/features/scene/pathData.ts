import * as THREE from 'three';

// Winding main path waypoints through the interior park
export const pathPoints = [
  new THREE.Vector3(-22, 0.05, 14),
  new THREE.Vector3(-14, 0.05, 8),
  new THREE.Vector3(-6, 0.05, 2),
  new THREE.Vector3(4, 0.05, 0),
  new THREE.Vector3(14, 0.05, -3),
  new THREE.Vector3(22, 0.05, -8),
  new THREE.Vector3(18, 0.05, -18),
  new THREE.Vector3(6, 0.05, -20),
  new THREE.Vector3(-6, 0.05, -15),
  new THREE.Vector3(-16, 0.05, -6),
  new THREE.Vector3(-20, 0.05, 4),
  new THREE.Vector3(-22, 0.05, 14),
];

export const mainParkCurve = new THREE.CatmullRomCurve3(pathPoints, true, 'centripetal', 0.5);

// Secondary pathway loop around playground and pond
export const secondaryPathPoints = [
  new THREE.Vector3(-6, 0.05, 2),
  new THREE.Vector3(-2, 0.05, 8),
  new THREE.Vector3(6, 0.05, 12),
  new THREE.Vector3(12, 0.05, 8),
  new THREE.Vector3(14, 0.05, -3),
  new THREE.Vector3(4, 0.05, 0),
];
export const secondaryParkCurve = new THREE.CatmullRomCurve3(secondaryPathPoints, true, 'catmullrom', 0.5);

// Grand Perimeter Athletic Tiled Runway Loop around the whole park perimeter
export const runwayPoints = [
  new THREE.Vector3(-28, 0.05, 22),
  new THREE.Vector3(-12, 0.05, 26),
  new THREE.Vector3(12, 0.05, 26),
  new THREE.Vector3(28, 0.05, 20),
  new THREE.Vector3(34, 0.05, 4),
  new THREE.Vector3(32, 0.05, -16),
  new THREE.Vector3(18, 0.05, -28),
  new THREE.Vector3(-12, 0.05, -28),
  new THREE.Vector3(-28, 0.05, -20),
  new THREE.Vector3(-34, 0.05, 0),
  new THREE.Vector3(-28, 0.05, 22),
];
export const perimeterRunwayCurve = new THREE.CatmullRomCurve3(runwayPoints, true, 'centripetal', 0.5);

// Sample points for fast distance checking
export const mainPathSamplePoints = mainParkCurve.getPoints(120);
export const secondaryPathSamplePoints = secondaryParkCurve.getPoints(80);
export const runwaySamplePoints = perimeterRunwayCurve.getPoints(160);

// Helper to calculate minimum 2D distance to a set of points
export function getMinDistanceToPoints(x: number, z: number, points: THREE.Vector3[]): number {
  let minD = Infinity;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const dx = x - p.x;
    const dz = z - p.z;
    const d = dx * dx + dz * dz;
    if (d < minD) {
      minD = d;
    }
  }
  return Math.sqrt(minD);
}

// Elevation function for rolling terrain
export function getTerrainHeight(x: number, z: number): number {
  // Flatten near runway perimeter (r ~ 26-36)
  const dCenter = Math.sqrt(x * x + z * z);
  const mound1 = Math.sin(x * 0.08) * Math.cos(z * 0.08) * 0.7;
  const mound2 = Math.sin(x * 0.15 + 1.2) * Math.sin(z * 0.12) * 0.4;
  
  // Flatten near pond (pond is located around [8, 0, 4])
  const dPond = Math.hypot(x - 8, z - 4);
  const pondDip = dPond < 6 ? -Math.cos((dPond / 6) * (Math.PI / 2)) * 0.4 : 0;

  const baseHeight = (mound1 + mound2) * 0.5 + pondDip;

  // Level out the outer runway track
  if (dCenter > 24) {
    const fade = Math.min(1.0, (dCenter - 24) / 8);
    return baseHeight * (1 - fade);
  }

  return baseHeight;
}

