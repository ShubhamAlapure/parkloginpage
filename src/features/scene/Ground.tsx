import * as THREE from 'three';
import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { pathVectors, PATH_WIDTH } from './parkConstants';

export const windUniforms = {
  uTime: { value: 0 },
  uWind: { value: 1 },
};

export const windGLSL = `
  uniform float uTime;
  uniform float uWind;
  float windHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float windNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(windHash(i), windHash(i + vec2(1.0, 0.0)), u.x),
               mix(windHash(i + vec2(0.0, 1.0)), windHash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  vec2 windAt(vec2 xz) {
    float gust = windNoise(xz * 0.08 + vec2(uTime * 0.18, uTime * 0.05));
    float flutter = sin(uTime * 2.3 + xz.x * 0.9 + xz.y * 0.6) * 0.5 + 0.5;
    float strength = (0.35 + gust * 0.9) * uWind;
    return vec2(0.8, 0.35) * strength * (0.75 + 0.25 * flutter);
  }
`;

export function WindClock() {
  useFrame((_, delta) => {
    windUniforms.uTime.value += Math.min(delta, 0.1);
  });
  return null;
}

export function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    let t = (s = (s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    return (((t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

const gNoiseGLSL = `
  float gHash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 15731.743); }
  float gNoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(gHash(i), gHash(i + vec2(1, 0)), u.x), mix(gHash(i + vec2(0, 1)), gHash(i + vec2(1, 1)), u.x), u.y);
  }
  float gFbm(vec2 p) {
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * gNoise(p); p *= 2.07; a *= 0.5; }
    return v;
  }
`;

function GroundPlane() {
  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0 });
    mat.onBeforeCompile = shader => {
      shader.uniforms.uPath = { value: pathVectors };
      shader.uniforms.uPathWidth = { value: PATH_WIDTH };
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWorld;')
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;');

      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
          varying vec3 vWorld;
          uniform vec2 uPath[${pathVectors.length}];
          uniform float uPathWidth;
          ${gNoiseGLSL}
          float pathDistance(vec2 p) {
            float d = 1e5;
            for (int i = 0; i < ${pathVectors.length - 1}; i++) {
              vec2 a = uPath[i]; vec2 b = uPath[i + 1];
              vec2 ab = b - a;
              float t = clamp(dot(p - a, ab) / dot(ab, ab), 0.0, 1.0);
              d = min(d, length(a + ab * t - p));
            }
            return d;
          }`
        )
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
          vec2 xz = vWorld.xz;
          float n = gFbm(xz * 0.35);
          float fine = gNoise(xz * 9.0);
          vec3 grassDark = vec3(0.19, 0.29, 0.10);
          vec3 grassLight = vec3(0.39, 0.50, 0.20);
          vec3 dry = vec3(0.50, 0.49, 0.27);
          vec3 grass = mix(grassDark, grassLight, smoothstep(0.25, 0.8, n));
          grass = mix(grass, dry, smoothstep(0.62, 0.9, gFbm(xz * 0.12 + 7.0)) * 0.45);
          grass *= 0.9 + 0.2 * fine;

          float edgeNoise = (gNoise(xz * 2.5) - 0.5) * 0.28;
          float d = pathDistance(xz) + edgeNoise;
          float onPath = 1.0 - smoothstep(uPathWidth * 0.5 - 0.08, uPathWidth * 0.5 + 0.1, d);
          float worn = 1.0 - smoothstep(uPathWidth * 0.5, uPathWidth * 0.5 + 0.55, d);
          vec3 gravel = mix(vec3(0.62, 0.55, 0.44), vec3(0.74, 0.68, 0.57), gNoise(xz * 22.0));
          gravel *= 0.88 + 0.16 * gNoise(xz * 60.0);
          grass = mix(grass, mix(grass, vec3(0.45, 0.43, 0.3), 0.5), worn * 0.6);
          diffuseColor.rgb = mix(grass, gravel, onPath);`
        );
    };
    return mat;
  }, []);

  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow material={material}>
      <planeGeometry args={[90, 90, 1, 1]} />
    </mesh>
  );
}

function GrassField({ count = 26000 }: { count?: number }) {
  const { geometry, material } = useMemo(() => {
    const basePlane = new THREE.PlaneGeometry(0.014, 1, 1, 3);
    basePlane.translate(0, 0.5, 0);
    const posAttr = basePlane.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const y = posAttr.getY(i);
      posAttr.setX(i, posAttr.getX(i) * (1 - 0.85 * y));
    }
    basePlane.computeVertexNormals();

    const bladeData = new Float32Array(4 * count);
    const rand = mulberry32(7);
    let validCount = 0;
    let attempts = 0;

    const calcDistToPath = (px: number, pz: number) => {
      const pt = new THREE.Vector2(px, pz);
      let minD = Infinity;
      for (let i = 0; i < pathVectors.length - 1; i++) {
        const a = pathVectors[i];
        const ab = pathVectors[i + 1].clone().sub(a);
        const t = THREE.MathUtils.clamp(pt.clone().sub(a).dot(ab) / ab.lengthSq(), 0, 1);
        minD = Math.min(minD, a.clone().addScaledVector(ab, t).distanceTo(pt));
      }
      return minD;
    };

    while (validCount < count && attempts++ < 6 * count) {
      const z = THREE.MathUtils.lerp(7.6, -7, Math.pow(rand(), 1.35));
      const spread = THREE.MathUtils.mapLinear(z, 7.6, -7, 4.5, 11);
      const x = (2 * rand() - 1) * spread + 0.4;
      if (calcDistToPath(x, z) >= 0.725) {
        bladeData.set([x, z, 0.06 + 0.07 * rand(), rand() * Math.PI * 2], 4 * validCount);
        validCount++;
      }
    }

    const instancedGeo = new THREE.InstancedBufferGeometry();
    instancedGeo.index = basePlane.index;
    instancedGeo.attributes.position = basePlane.attributes.position;
    instancedGeo.attributes.normal = basePlane.attributes.normal;
    instancedGeo.attributes.uv = basePlane.attributes.uv;
    instancedGeo.setAttribute('aBlade', new THREE.InstancedBufferAttribute(bladeData.subarray(0, 4 * validCount), 4));
    instancedGeo.instanceCount = validCount;
    instancedGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 60);

    const mat = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.9 });
    mat.onBeforeCompile = shader => {
      Object.assign(shader.uniforms, windUniforms);
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
          attribute vec4 aBlade;
          varying float vTip;
          varying float vShade;
          ${windGLSL}`
        )
        .replace(
          '#include <beginnormal_vertex>',
          `#include <beginnormal_vertex>
          float ang = aBlade.w;
          mat2 rot = mat2(cos(ang), -sin(ang), sin(ang), cos(ang));
          objectNormal.xz = rot * objectNormal.xz;
          objectNormal = normalize(mix(objectNormal, vec3(0.0, 1.0, 0.0), 0.85));`
        )
        .replace(
          '#include <begin_vertex>',
          `vec3 transformed = vec3(position);
          transformed.y *= aBlade.z;
          transformed.xz = rot * transformed.xz;
          float h = position.y;
          vec2 w = windAt(aBlade.xy);
          transformed.xz += w * h * h * aBlade.z * 0.9;
          transformed.y -= length(w) * h * h * aBlade.z * 0.25;
          transformed.xz += aBlade.xy;
          vTip = h;
          vShade = fract(sin(dot(aBlade.xy, vec2(12.9, 78.2))) * 437.5);`
        );

      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
          varying float vTip;
          varying float vShade;`
        )
        .replace(
          '#include <normal_fragment_begin>',
          `#include <normal_fragment_begin>
          normal = normalize(vNormal);`
        )
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
          vec3 base = vec3(0.2, 0.3, 0.1);
          vec3 tip = mix(vec3(0.36, 0.48, 0.18), vec3(0.5, 0.55, 0.26), vShade);
          diffuseColor.rgb = mix(base, tip, smoothstep(0.0, 1.0, vTip));`
        );
    };

    return { geometry: instancedGeo, material: mat };
  }, [count]);

  return <mesh geometry={geometry} material={material} receiveShadow frustumCulled={false} />;
}

export function Ground({ grass = 26000 }: { grass?: number }) {
  return (
    <group>
      <GroundPlane />
      {grass > 0 && <GrassField count={grass} />}
    </group>
  );
}
