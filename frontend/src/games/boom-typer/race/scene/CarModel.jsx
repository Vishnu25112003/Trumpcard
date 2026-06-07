import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { CARS, carFile } from '../data/cars';
import { RACE_TUNING } from '../logic/tuning';

// Loads a car GLB and normalizes it: uniformly scaled so its longest footprint
// matches CAR_TARGET_LENGTH, centered horizontally, dropped onto the road
// (y = 0), and rotated to face down the track (+Z). Works for any model in the
// pack without per-asset tweaking.
export default function CarModel({ carId }) {
  const { scene } = useGLTF(carFile(carId));

  const { object, scale, offset } = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const s = RACE_TUNING.CAR_TARGET_LENGTH / Math.max(size.x, size.z, 0.001);
    return {
      object: clone,
      scale: s,
      offset: [-center.x * s, -box.min.y * s, -center.z * s],
    };
  }, [scene]);

  return (
    <group rotation={[0, RACE_TUNING.CAR_ROTATION_Y, 0]}>
      <primitive object={object} scale={scale} position={offset} />
    </group>
  );
}

// Preload every car so there's no hitch when the race starts.
Object.values(CARS).forEach((c) => useGLTF.preload(c.file));
