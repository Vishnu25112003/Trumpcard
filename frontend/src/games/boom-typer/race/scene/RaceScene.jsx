/* react-three-fiber is imperative by design: useFrame mutates the camera and
   Object3D transforms every frame. The react-hooks immutability rule doesn't
   model that escape hatch (and r3f always invokes the latest useFrame closure,
   so reading props inside it is safe), so disable it for this scene file. */
/* eslint-disable react-hooks/immutability */
import { Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import CarModel from './CarModel';
import { RACE_TUNING, laneX } from '../logic/tuning';

const { TRACK_LENGTH, ROAD_WIDTH } = RACE_TUNING;

function clamp01(v) { return Math.max(0, Math.min(1, v || 0)); }

// ── Static world: grass, road, lane dashes, start/finish, roadside props ────
function Track() {
  const dashes = [];
  for (let z = 4; z < TRACK_LENGTH; z += 8) {
    dashes.push(<mesh key={`d${z}`} position={[0, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.3, 3]} />
      <meshStandardMaterial color="#f4d35e" />
    </mesh>);
  }
  const props = [];
  for (let z = 0; z <= TRACK_LENGTH; z += 12) {
    const h = 2 + ((z * 7) % 5) * 0.6;
    props.push(
      <mesh key={`pl${z}`} position={[-(ROAD_WIDTH / 2 + 2.2), h / 2, z]}>
        <boxGeometry args={[1.4, h, 1.4]} />
        <meshStandardMaterial color={z % 24 === 0 ? '#2f7d4f' : '#3a8d5a'} />
      </mesh>,
    );
    props.push(
      <mesh key={`pr${z}`} position={[ROAD_WIDTH / 2 + 2.2, h / 2, z + 6]}>
        <boxGeometry args={[1.4, h, 1.4]} />
        <meshStandardMaterial color={z % 24 === 0 ? '#2f7d4f' : '#3a8d5a'} />
      </mesh>,
    );
  }
  return (
    <group>
      {/* grass */}
      <mesh position={[0, -0.05, TRACK_LENGTH / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, TRACK_LENGTH + 80]} />
        <meshStandardMaterial color="#1f6e43" />
      </mesh>
      {/* road */}
      <mesh position={[0, 0, TRACK_LENGTH / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROAD_WIDTH, TRACK_LENGTH + 24]} />
        <meshStandardMaterial color="#2b2f36" />
      </mesh>
      {/* shoulders */}
      <mesh position={[-(ROAD_WIDTH / 2 + 0.3), 0.01, TRACK_LENGTH / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.6, TRACK_LENGTH + 24]} />
        <meshStandardMaterial color="#e8e8e8" />
      </mesh>
      <mesh position={[ROAD_WIDTH / 2 + 0.3, 0.01, TRACK_LENGTH / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.6, TRACK_LENGTH + 24]} />
        <meshStandardMaterial color="#e8e8e8" />
      </mesh>
      {dashes}
      {/* start line */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROAD_WIDTH, 0.6]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* finish line */}
      <mesh position={[0, 0.03, TRACK_LENGTH]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROAD_WIDTH, 1.4]} />
        <meshStandardMaterial color="#dddddd" />
      </mesh>
      {/* finish gate */}
      <mesh position={[0, 4, TRACK_LENGTH]}>
        <boxGeometry args={[ROAD_WIDTH + 2, 0.6, 0.6]} />
        <meshStandardMaterial color="#ff4d5e" emissive="#ff4d5e" emissiveIntensity={0.4} />
      </mesh>
      {props}
    </group>
  );
}

// ── Per-frame director: lerps every car toward its target % and chases the
//    local player's car with the camera. Reads live data through refs so the
//    useFrame closure never goes stale. Refs are kept LOCAL to this component
//    (not passed as props) so the imperative per-frame mutation is allowed. ────
function Scene({ players, localName, localProgress }) {
  const { camera } = useThree();
  const carRefs = useRef([]);

  useFrame(() => {
    let localGroup = null;
    for (let i = 0; i < players.length; i++) {
      const g = carRefs.current[i];
      if (!g) continue;
      const p = players[i];
      const isLocal = p.name === localName;
      const prog = isLocal ? localProgress : p.progress;
      const targetZ = clamp01(prog) * TRACK_LENGTH;
      const lerp = isLocal ? RACE_TUNING.LOCAL_LERP : RACE_TUNING.INTERP_LERP;
      g.position.z += (targetZ - g.position.z) * lerp;
      if (isLocal) localGroup = g;
    }
    if (localGroup) {
      const camZ = localGroup.position.z - RACE_TUNING.CAM_BACK;
      camera.position.x += (localGroup.position.x - camera.position.x) * RACE_TUNING.CAM_LERP;
      camera.position.y += (RACE_TUNING.CAM_HEIGHT - camera.position.y) * RACE_TUNING.CAM_LERP;
      camera.position.z += (camZ - camera.position.z) * RACE_TUNING.CAM_LERP;
      camera.lookAt(localGroup.position.x, 1, localGroup.position.z + RACE_TUNING.CAM_LOOK_AHEAD);
    }
  });

  return (
    <>
      <color attach="background" args={['#8fd1ff']} />
      <fog attach="fog" args={['#bfe3ff', 60, 320]} />
      <hemisphereLight args={['#ffffff', '#3a5a40', 0.9]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[20, 40, 10]} intensity={1.1} castShadow />

      <Track />

      {players.map((p, i) => (
        <group
          key={p.name}
          ref={(el) => { carRefs.current[i] = el; }}
          position={[laneX(i, players.length), 0, 0]}
        >
          <Suspense fallback={null}>
            <CarModel carId={p.carId} />
          </Suspense>
          <Html position={[0, 2.1, 0]} center distanceFactor={16} className="bt-car-tag-wrap" zIndexRange={[10, 0]}>
            <div className={`bt-car-tag${p.name === localName ? ' me' : ''}`}>
              {p.name === localName ? '★ ' : ''}{p.name}
            </div>
          </Html>
        </group>
      ))}
    </>
  );
}

export default function RaceScene({ players, localName, localProgress }) {
  return (
    <Canvas
      className="bt-race-canvas"
      shadows
      camera={{ position: [0, RACE_TUNING.CAM_HEIGHT, -RACE_TUNING.CAM_BACK], fov: 55, near: 0.1, far: 600 }}
      dpr={[1, 2]}
    >
      <Scene players={players} localName={localName} localProgress={localProgress} />
    </Canvas>
  );
}
