import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useEffect } from 'react';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';

const regexLegs = /^(thigh|calf|foot|ball)_/;
const regexHands = /^(thumb|index|middle|ring|pinky)_/;
const regexSpine = /^(spine_0[123]|neck_01|Head|clavicle_[lr])$/;

function copyRestPose(restMap: Map<THREE.Object3D, [THREE.Vector3, THREE.Quaternion, THREE.Vector3]>) {
  for (const [bone, [pos, quat, scale]] of restMap) {
    bone.position.copy(pos);
    bone.quaternion.copy(quat);
    bone.scale.copy(scale);
  }
}

export interface ActorHandle {
  root: THREE.Group;
  bones: Record<string, THREE.Bone>;
  restQuats: Record<string, THREE.Quaternion>;
  mixer: THREE.AnimationMixer;
  update: (delta: number) => void;
  action: (clipName: string) => THREE.AnimationAction;
  play: (clipName: string, options?: { fade?: number; loop?: boolean; timeScale?: number; from?: number }) => Promise<void>;
  setSpeed: (spd: number) => void;
  duration: (clipName: string) => number;
  currentName: () => string | undefined;
  clipTime: () => number;
}

export function useActor(name: string, { tints = {} }: { tints?: Record<string, string> } = {}): ActorHandle {
  const modelUrl = `/models/humans/${name}.glb`;
  const charGltf = useGLTF(modelUrl);
  const anim1 = useGLTF('/models/anims-1.glb');
  const anim2 = useGLTF('/models/anims-2.glb');

  const animData = useMemo(() => {
    const clips: Record<string, THREE.AnimationClip> = {};
    for (const clip of [...anim1.animations, ...anim2.animations]) {
      clips[clip.name] = clip;
    }
    const skeleton = anim1.scene;
    const rest = new Map<THREE.Object3D, [THREE.Vector3, THREE.Quaternion, THREE.Vector3]>();
    skeleton.traverse(obj => rest.set(obj, [obj.position.clone(), obj.quaternion.clone(), obj.scale.clone()]));

    const idleClip = clips.Idle_Loop;
    if (idleClip) {
      const boneMap: Record<string, THREE.Object3D> = {};
      skeleton.traverse(obj => { boneMap[obj.name] = obj; });
      const qA = new THREE.Quaternion();
      const qB = new THREE.Quaternion();
      const tracks = idleClip.tracks.map(track => {
        const [boneName, prop] = track.name.split('.');
        const bone = boneMap[boneName];
        if (prop === 'quaternion' && bone && regexLegs.test(boneName)) {
          const q = bone.quaternion;
          return new THREE.QuaternionKeyframeTrack(track.name, [0], [q.x, q.y, q.z, q.w]);
        }
        if (prop === 'quaternion' && bone && regexSpine.test(boneName)) {
          const vals = track.values.slice();
          for (let i = 0; i < vals.length; i += 4) {
            qA.fromArray(vals, i).slerp(qB.copy(bone.quaternion), 0.45).toArray(vals, i);
          }
          return new THREE.QuaternionKeyframeTrack(track.name, track.times, vals);
        }
        if (prop === 'quaternion' && bone && regexHands.test(boneName)) {
          const vals = track.values.slice();
          for (let i = 0; i < vals.length; i += 4) {
            qA.fromArray(vals, i).slerp(qB.copy(bone.quaternion), 0.55).toArray(vals, i);
          }
          return new THREE.QuaternionKeyframeTrack(track.name, track.times, vals);
        }
        if (prop === 'position' && boneName === 'pelvis' && bone) {
          const vals = track.values.slice();
          const base = vals.slice(0, 3);
          for (let i = 0; i < vals.length; i += 3) {
            for (let j = 0; j < 3; j++) {
              vals[i + j] = bone.position.getComponent(j) + (vals[i + j] - base[j]) * 0.35;
            }
          }
          return new THREE.VectorKeyframeTrack(track.name, track.times, vals);
        }
        return track.clone();
      });
      clips.Stand = new THREE.AnimationClip('Stand', idleClip.duration, tracks);
    }
    return { clips, skeleton, rest };
  }, [anim1, anim2]);

  const actor = useMemo(() => {
    const root = new THREE.Group();
    root.userData.actorRoot = true;
    const sceneClone = cloneSkeleton(charGltf.scene);
    root.add(sceneClone);

    const hairRegex = /hair|brow|lash|ponytail|braid|bob0|short0|long0|afro/;
    root.traverse(child => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.frustumCulled = false;
        const mat = (mesh.material as THREE.Material).clone() as THREE.MeshStandardMaterial;
        const matName = `${mesh.name} ${mat.name}`.toLowerCase();
        mat.metalnessMap = null;
        mat.roughnessMap = null;
        mat.metalness = 0;
        mat.transparent = false;
        mat.depthWrite = true;
        if (hairRegex.test(matName)) {
          mat.alphaTest = 0.5;
          mat.side = THREE.DoubleSide;
          mat.roughness = 0.75;
          mesh.castShadow = !/brow|lash/.test(matName);
        } else if (/low-poly|eye/.test(matName)) {
          mat.roughness = 0.2;
          mesh.castShadow = false;
        } else {
          mat.alphaTest = 0;
          mat.roughness = /body|base/.test(matName) ? 0.62 : 0.88;
        }
        for (const [tintKey, tintColor] of Object.entries(tints)) {
          if (matName.includes(tintKey)) {
            mat.color = new THREE.Color(tintColor);
          }
        }
        mesh.material = mat;
      }
    });

    const bones: Record<string, THREE.Bone> = {};
    root.traverse(child => {
      if ((child as THREE.Bone).isBone) {
        bones[child.name] = child as THREE.Bone;
      }
    });

    const restQuats: Record<string, THREE.Quaternion> = {};
    for (const [bName, bObj] of Object.entries(bones)) {
      restQuats[bName] = bObj.quaternion.clone();
    }

    const retarget = (function(targetBones: Record<string, THREE.Bone>, animInfo: typeof animData) {
      const { clips, skeleton: srcSkeleton, rest: srcRest } = animInfo;
      copyRestPose(srcRest);
      srcSkeleton.updateMatrixWorld(true);
      root.updateMatrixWorld(true);

      const srcBones: Record<string, THREE.Object3D> = {};
      srcSkeleton.traverse(obj => {
        if ((obj as THREE.Bone).isBone || obj.type === 'Object3D' || obj.type === 'Bone') {
          srcBones[obj.name] = obj;
        }
      });

      const matchedBones: string[] = [];
      root.traverse(obj => {
        if ((obj as THREE.Bone).isBone && srcBones[obj.name]) {
          matchedBones.push(obj.name);
        }
      });

      const boneData: Record<string, any> = {};
      const decomposeRel = (parentObj: THREE.Object3D, childObj: THREE.Object3D, outQuat: THREE.Quaternion, outPos: THREE.Vector3) => {
        const mat = new THREE.Matrix4().copy(parentObj.matrixWorld).invert().multiply(childObj.matrixWorld);
        mat.decompose(outPos, outQuat, new THREE.Vector3());
      };

      for (const bName of matchedBones) {
        const sQ0 = new THREE.Quaternion();
        const sP0 = new THREE.Vector3();
        const tQ0 = new THREE.Quaternion();
        const tP0 = new THREE.Vector3();
        decomposeRel(srcSkeleton, srcBones[bName], sQ0, sP0);
        decomposeRel(root, targetBones[bName], tQ0, tP0);
        boneData[bName] = { sQ0, sP0, tQ0, tP0, align: null };
      }

      for (const bName of matchedBones) {
        const childBone = targetBones[bName].children.find(c => (c as THREE.Bone).isBone && boneData[c.name]) as THREE.Bone | undefined;
        if (!childBone) continue;
        const sDir = boneData[childBone.name].sP0.clone().sub(boneData[bName].sP0).normalize();
        const tDir = boneData[childBone.name].tP0.clone().sub(boneData[bName].tP0).normalize();
        boneData[bName].align = new THREE.Quaternion().setFromUnitVectors(tDir, sDir);
      }

      for (const bName of matchedBones) {
        if (boneData[bName].align) continue;
        const parent = targetBones[bName].parent;
        boneData[bName].align = parent && boneData[parent.name]?.align ? boneData[parent.name].align.clone() : new THREE.Quaternion();
      }

      for (const bName of matchedBones) {
        const bd = boneData[bName];
        bd.tQrest = bd.align.clone().multiply(bd.tQ0);
        bd.sQ0inv = bd.sQ0.clone().invert();
      }

      const parentQuats: Record<string, THREE.Quaternion> = {};
      for (const bName of matchedBones) {
        const parent = targetBones[bName].parent;
        if (parent && !boneData[parent.name]) {
          const pq = new THREE.Quaternion();
          decomposeRel(root, parent, pq, new THREE.Vector3());
          parentQuats[bName] = pq;
        }
      }

      const pelvisRatio = boneData.pelvis && boneData.pelvis.sP0.y !== 0 ? boneData.pelvis.tP0.y / boneData.pelvis.sP0.y : 1;
      const pelvisMat = new THREE.Matrix4();
      if (boneData.pelvis && targetBones.pelvis && targetBones.pelvis.parent) {
        pelvisMat.copy(root.matrixWorld).invert().multiply(targetBones.pelvis.parent.matrixWorld).invert();
      }

      const mixer = new THREE.AnimationMixer(srcSkeleton);
      const cache = new Map<string, THREE.AnimationClip>();
      const tempQ = new THREE.Quaternion();
      const tempP = new THREE.Vector3();
      const parentQMap: Record<string, THREE.Quaternion> = {};
      for (const bName of matchedBones) parentQMap[bName] = new THREE.Quaternion();

      return (clipName: string) => {
        if (cache.has(clipName)) return cache.get(clipName)!;
        const clip = clips[clipName];
        if (!clip) return new THREE.AnimationClip(clipName, 0, []);
        copyRestPose(srcRest);
        const action = mixer.clipAction(clip);
        action.reset().play();
        const frameCount = Math.max(2, Math.round(30 * clip.duration) + 1);
        const times = new Float32Array(frameCount);
        const quatTracks: Record<string, Float32Array> = {};
        for (const bName of matchedBones) quatTracks[bName] = new Float32Array(4 * frameCount);
        const posTrack = new Float32Array(3 * frameCount);

        for (let f = 0; f < frameCount; f++) {
          const t = Math.min(clip.duration, f / 30);
          times[f] = t;
          mixer.setTime(t);
          srcSkeleton.updateMatrixWorld(true);
          for (const bName of matchedBones) {
            const bd = boneData[bName];
            decomposeRel(srcSkeleton, srcBones[bName], tempQ, tempP);
            const rot = parentQMap[bName].copy(tempQ).multiply(bd.sQ0inv).multiply(bd.tQrest);
            const pObj = targetBones[bName].parent;
            const parentRot = (boneData[pObj?.name || ''] ? parentQMap[pObj!.name] : parentQuats[bName] ?? new THREE.Quaternion());
            parentRot.clone().invert().multiply(rot).toArray(quatTracks[bName], 4 * f);
            if (bName === 'pelvis') {
              const pPos = bd.tP0.clone().add(tempP.clone().sub(bd.sP0).multiplyScalar(pelvisRatio));
              pPos.applyMatrix4(pelvisMat);
              pPos.toArray(posTrack, 3 * f);
            }
          }
        }
        action.stop();
        mixer.uncacheAction(clip);
        const tracks = matchedBones.map(bName => new THREE.QuaternionKeyframeTrack(`${bName}.quaternion`, times, quatTracks[bName]));
        if (boneData.pelvis) {
          tracks.push(new THREE.VectorKeyframeTrack('pelvis.position', times, posTrack));
        }
        const retargetedClip = new THREE.AnimationClip(clipName, clip.duration, tracks);
        copyRestPose(srcRest);
        cache.set(clipName, retargetedClip);
        return retargetedClip;
      };
    })(bones, animData);

    const mixer = new THREE.AnimationMixer(root);
    const actions: Record<string, THREE.AnimationAction> = {};
    const currentActionRef = { current: null as THREE.AnimationAction | null };

    const getAction = (clipName: string) => {
      if (!actions[clipName]) {
        actions[clipName] = mixer.clipAction(retarget(clipName));
      }
      return actions[clipName];
    };

    const boneList = Object.values(bones);
    const savedTransforms = new Float32Array(7 * boneList.length);
    let hasSaved = false;

    return {
      root,
      bones,
      restQuats,
      mixer,
      update: (delta: number) => {
        if (hasSaved) {
          boneList.forEach((b, idx) => {
            b.quaternion.fromArray(savedTransforms, 7 * idx);
            b.position.fromArray(savedTransforms, 7 * idx + 4);
          });
        }
        mixer.update(delta);
        boneList.forEach((b, idx) => {
          b.quaternion.toArray(savedTransforms, 7 * idx);
          b.position.toArray(savedTransforms, 7 * idx + 4);
        });
        hasSaved = true;
      },
      action: getAction,
      play: (clipName: string, { fade = 0.35, loop = true, timeScale = 1, from = 0 } = {}) => {
        const act = getAction(clipName);
        act.enabled = true;
        act.setEffectiveTimeScale(timeScale);
        act.setEffectiveWeight(1);
        if (act === currentActionRef.current && loop && act.isRunning()) {
          // already running
        } else {
          act.reset();
          act.time = from;
          act.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
          act.clampWhenFinished = !loop;
          act.play();
          if (currentActionRef.current && currentActionRef.current !== act) {
            currentActionRef.current.crossFadeTo(act, fade, true);
          } else {
            act.fadeIn(fade);
          }
        }
        currentActionRef.current = act;
        if (loop) return Promise.resolve();
        return new Promise<void>(resolve => {
          const onFinished = (e: any) => {
            if (e.action === act) {
              mixer.removeEventListener('finished', onFinished);
              resolve();
            }
          };
          mixer.addEventListener('finished', onFinished);
        });
      },
      setSpeed: (spd: number) => currentActionRef.current?.setEffectiveTimeScale(spd),
      duration: (clipName: string) => retarget(clipName).duration,
      currentName: () => currentActionRef.current?.getClip().name,
      clipTime: () => currentActionRef.current?.time ?? 0,
    };
  }, [charGltf, animData, name]);

  useEffect(() => () => {
    actor.mixer.stopAllAction();
  }, [actor]);
  useFrame((_, delta) => actor.update(Math.min(delta, 0.1)));

  return actor;
}

[
  '/models/anims-1.glb',
  '/models/anims-2.glb',
  '/models/humans/artist.glb',
  '/models/humans/swinger.glb',
  '/models/humans/thrower_a.glb',
  '/models/humans/thrower_b.glb',
  '/models/humans/runner_a.glb',
  '/models/humans/runner_b.glb',
  '/models/humans/parent.glb',
  '/models/humans/onlooker_a.glb',
  '/models/humans/onlooker_b.glb',
].forEach(url => useGLTF.preload(url));
