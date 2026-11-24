'use client'
import { memo, useEffect, useMemo, useRef, useLayoutEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { CameraControls, Environment, Html, Lightformer, ContactShadows } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { FloodRun } from '../../lib/labData'
import { instability, recoveredAt } from '../../lib/physics'

const CORE_L = 6
const CORE_R = 0.95
const NL = 44
const NR = 9

function hash(a: number, b: number) {
  const s = Math.sin(a * 91.7 + b * 47.3) * 9631.17
  return s - Math.floor(s)
}

function CorePlug({ run, t }: { run: FloodRun; t: number }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const voxels = useMemo(() => {
    const v: { x: number; y: number; z: number; xn: number; finger: number }[] = []
    const step = (CORE_R * 2) / NR
    for (let a = 0; a < NL; a++) for (let b = 0; b < NR; b++) for (let c = 0; c < NR; c++) {
      const y = -CORE_R + step * (b + 0.5), z = -CORE_R + step * (c + 0.5)
      if (y * y + z * z > CORE_R * CORE_R) continue
      // fingers: a few radial channels plus small-scale noise
      const ang = Math.atan2(z, y)
      const finger = 0.55 * Math.max(0, Math.sin(ang * 3 + 0.7)) * (1 - Math.hypot(y, z) / CORE_R * 0.4) + 0.45 * hash(b * 13 + c, 3)
      v.push({ x: -CORE_L / 2 + (CORE_L / NL) * (a + 0.5), y, z, xn: (a + 0.5) / NL, finger })
    }
    return v
  }, [])
  const col = useMemo(() => new THREE.Color(), [])
  const oil = useMemo(() => new THREE.Color('#2a1404'), [])
  const fluid = useMemo(() => new THREE.Color(), [])
  const target = useRef(new Float32Array(voxels.length * 3))
  const cur = useRef(new Float32Array(voxels.length * 3))

  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    const o = new THREE.Object3D()
    const s = (CORE_R * 2) / NR
    voxels.forEach((v, n) => {
      o.position.set(v.x, v.y, v.z)
      o.scale.set((CORE_L / NL) * 0.96, s * 0.94, s * 0.94)
      o.updateMatrix()
      m.setMatrixAt(n, o.matrix)
      m.setColorAt(n, oil)
      cur.current.set([oil.r, oil.g, oil.b], n * 3)
    })
    m.instanceMatrix.needsUpdate = true
  }, [voxels, oil])

  useEffect(() => {
    const ins = instability(run)
    fluid.set(run.color)
    const front = t * 1.25
    const residual = 1 - run.recoveryPct / 100
    voxels.forEach((v, n) => {
      const lead = v.finger * ins * 0.55
      const swept = v.xn - lead < front
      if (swept) {
        // residual oil remains as a tint; more residual → browner
        col.copy(fluid).lerp(oil, Math.min(0.85, residual * 2.4 + (1 - Math.min(1, (front - (v.xn - lead)) * 3)) * 0.25))
      } else col.copy(oil)
      target.current.set([col.r, col.g, col.b], n * 3)
    })
  }, [run, t, voxels, col, fluid, oil])

  useFrame((_, dt) => {
    const m = ref.current
    if (!m || !m.instanceColor) return
    const a = Math.min(1, dt * 8)
    const c = cur.current, g = target.current
    for (let n = 0; n < voxels.length; n++) {
      c[n * 3] += (g[n * 3] - c[n * 3]) * a
      c[n * 3 + 1] += (g[n * 3 + 1] - c[n * 3 + 1]) * a
      c[n * 3 + 2] += (g[n * 3 + 2] - c[n * 3 + 2]) * a
      m.setColorAt(n, col.setRGB(c[n * 3], c[n * 3 + 1], c[n * 3 + 2]))
    }
    m.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, voxels.length]} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.35} metalness={0.05} />
    </instancedMesh>
  )
}

function PipeFlow({ points, color, active, speed = 1 }: { points: THREE.Vector3[]; color: string; active: boolean; speed?: number }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.05), [points])
  const group = useRef<THREE.Group>(null)
  const N = 16
  useFrame(({ clock }) => {
    group.current?.children.forEach((m, k) => {
      const u = (clock.elapsedTime * 0.35 * speed + k / N) % 1
      m.position.copy(curve.getPointAt(u))
      m.visible = active
    })
  })
  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 64, 0.09, 12, false]} />
        <meshStandardMaterial color="#b8c2cc" metalness={0.6} roughness={0.25} transparent opacity={0.35} />
      </mesh>
      <group ref={group}>
        {Array.from({ length: N }).map((_, k) => (
          <mesh key={k}><sphereGeometry args={[0.055, 10, 8]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} toneMapped={false} /></mesh>
        ))}
      </group>
    </group>
  )
}

function MeasuringCylinder({ volume, labels }: { volume: number; labels: boolean }) {
  const H = 3.6
  const MAX = 12
  const liquid = useRef<THREE.Mesh>(null)
  useFrame((_, dt) => {
    if (!liquid.current) return
    const h = Math.max(0.001, (volume / MAX) * H)
    liquid.current.scale.y += (h - liquid.current.scale.y) * Math.min(1, dt * 5)
    liquid.current.position.y = liquid.current.scale.y / 2 + 0.06
  })
  return (
    <group position={[5.2, -1.9, 0]}>
      <mesh position={[0, 0.03, 0]} receiveShadow><cylinderGeometry args={[0.75, 0.8, 0.06, 32]} /><meshStandardMaterial color="#2a3340" metalness={0.4} roughness={0.5} /></mesh>
      <mesh position={[0, H / 2 + 0.06, 0]}>
        <cylinderGeometry args={[0.42, 0.42, H, 40, 1, true]} />
        <meshPhysicalMaterial color="#cfe6ff" transparent opacity={0.16} roughness={0.05} metalness={0} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh ref={liquid} scale={[1, 0.001, 1]}>
        <cylinderGeometry args={[0.39, 0.39, 1, 32]} />
        <meshStandardMaterial color="#6a3507" roughness={0.12} metalness={0.1} emissive="#3a1a02" emissiveIntensity={0.6} />
      </mesh>
      {Array.from({ length: MAX + 1 }).map((_, k) => (
        <mesh key={k} position={[0.43, 0.06 + (k / MAX) * H, 0]}>
          <boxGeometry args={[k % 2 === 0 ? 0.14 : 0.07, 0.012, 0.02]} />
          <meshBasicMaterial color="#9fb3c8" />
        </mesh>
      ))}
      {labels && [2, 4, 6, 8, 10].map(v => (
        <Html key={v} position={[0.62, 0.06 + (v / MAX) * H, 0]} center distanceFactor={9} style={{ pointerEvents: 'none' }}>
          <span className="grad">{v} mL</span>
        </Html>
      ))}
    </group>
  )
}

function Rig({ run, t, labels }: { run: FloodRun; t: number; labels: boolean }) {
  const sleeve = useRef<THREE.MeshStandardMaterial>(null)
  const heat = (run.tempC - 29) / (120 - 29)
  useFrame(({ clock }) => {
    if (sleeve.current) sleeve.current.emissiveIntensity = heat * (0.55 + 0.15 * Math.sin(clock.elapsedTime * 3))
  })
  const vol = recoveredAt(run, Math.min(1, t))
  const flowing = t > 0.001 && t < 0.999
  const inlet = useMemo(() => [new THREE.Vector3(-5.2, 1.4, 0), new THREE.Vector3(-5.2, 2.1, 0), new THREE.Vector3(-4.2, 2.1, 0), new THREE.Vector3(-4.2, 0, 0), new THREE.Vector3(-3.4, 0, 0)], [])
  const outlet = useMemo(() => [new THREE.Vector3(3.4, 0, 0), new THREE.Vector3(5.2, 0, 0), new THREE.Vector3(5.2, 1.9, 0)], [])
  const steel = <meshStandardMaterial color="#9aa5b1" metalness={0.85} roughness={0.28} />
  return (
    <group>
      {/* bench */}
      <mesh position={[0, -1.95, 0]} receiveShadow><boxGeometry args={[14, 0.1, 4]} /><meshStandardMaterial color="#1a2230" roughness={0.8} /></mesh>

      {/* accumulator / steam generator */}
      <group position={[-5.2, -0.3, 0]}>
        <mesh castShadow><cylinderGeometry args={[0.55, 0.55, 3.2, 32]} /><meshStandardMaterial color={run.method === 'Steam' ? '#5a3a34' : '#3d4a5a'} metalness={0.7} roughness={0.35} /></mesh>
        <mesh position={[0, 1.65, 0]}><cylinderGeometry args={[0.6, 0.6, 0.12, 32]} />{steel}</mesh>
        <mesh position={[0, -1.65, 0]}><cylinderGeometry args={[0.6, 0.6, 0.12, 32]} />{steel}</mesh>
        <mesh position={[0, 0, 0.56]}><planeGeometry args={[0.5, 2.6 * (1 - t * 0.6)]} /><meshStandardMaterial color={run.color} emissive={run.color} emissiveIntensity={1.1} toneMapped={false} /></mesh>
        {labels && <Html position={[0, 2.25, 0]} center distanceFactor={9} style={{ pointerEvents: 'none' }}><div className="rig-label">{run.method === 'Steam' ? 'Steam generator' : 'Accumulator'}<span>{run.method === 'Steam' ? '120 °C · 60 % quality' : `${run.fluid} heated to ${run.tempC} °C`}</span></div></Html>}
      </group>

      {/* nitrogen overburden cylinder */}
      <group position={[-2.4, -0.25, -1.7]}>
        <mesh castShadow><cylinderGeometry args={[0.35, 0.35, 3, 24]} /><meshStandardMaterial color="#2f6b4a" metalness={0.5} roughness={0.4} /></mesh>
        <mesh position={[0, 1.6, 0]}><sphereGeometry args={[0.35, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#2f6b4a" metalness={0.5} roughness={0.4} /></mesh>
        {labels && <Html position={[0, 2.25, 0]} center distanceFactor={9} style={{ pointerEvents: 'none' }}><div className="rig-label">N₂ overburden<span>1000–1500 psi</span></div></Html>}
      </group>

      {/* core holder */}
      <group>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[CORE_R + 0.18, CORE_R + 0.18, CORE_L + 0.2, 48, 1, true]} />
          <meshStandardMaterial ref={sleeve} color="#9fc4ff" emissive="#ff5a2a" emissiveIntensity={0} transparent opacity={0.14} roughness={0.1} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
        </mesh>
        {[-1, 1].map(s => (
          <group key={s} position={[s * (CORE_L / 2 + 0.25), 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <mesh castShadow><cylinderGeometry args={[CORE_R + 0.32, CORE_R + 0.32, 0.36, 40]} />{steel}</mesh>
            {Array.from({ length: 6 }).map((_, k) => (
              <mesh key={k} position={[Math.cos((k / 6) * Math.PI * 2) * (CORE_R + 0.2), 0.2, Math.sin((k / 6) * Math.PI * 2) * (CORE_R + 0.2)]}><cylinderGeometry args={[0.05, 0.05, 0.1, 8]} /><meshStandardMaterial color="#d0d6dc" metalness={1} roughness={0.2} /></mesh>
            ))}
          </group>
        ))}
        {[-2.2, 2.2].map(x => (
          <mesh key={x} position={[x, -1.4, 0]} castShadow><boxGeometry args={[0.18, 1.0, 0.9]} /><meshStandardMaterial color="#39424f" metalness={0.6} roughness={0.4} /></mesh>
        ))}
        <CorePlug run={run} t={t} />
        {labels && <Html position={[0.6, 1.75, 0]} center distanceFactor={9} style={{ pointerEvents: 'none' }}><div className="rig-label">Core holder · Core A<span>L 5.75 cm · φ 20.2 % · k 60 mD</span></div></Html>}
      </group>

      <PipeFlow points={inlet} color={run.color} active={flowing} speed={1 + run.flowRateMlMin / 80} />
      <PipeFlow points={outlet} color="#ffb340" active={flowing} speed={1} />
      <MeasuringCylinder volume={vol} labels={labels} />
      {labels && <Html position={[4.3, 2.55, 0]} center distanceFactor={9} style={{ pointerEvents: 'none' }}><div className="rig-label">Effluent · oil recovered<span>{vol.toFixed(2)} mL of {run.ooipCc.toFixed(2)} mL OOIP</span></div></Html>}
    </group>
  )
}

export default memo(function CoreFloodScene({ run, t, labels = true }: { run: FloodRun; t: number; labels?: boolean }) {
  const ref = useRef<CameraControls>(null)
  return (
    <Canvas shadows dpr={[1, 1.75]} camera={{ position: [0, 3.2, 11], fov: 40 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
      <color attach="background" args={['#04070d']} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 8, 6]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[0, 0, 2.5]} intensity={run.tempC > 60 ? 4 : 1.5} color="#ff7a45" distance={6} />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={2.2} position={[0, 5, -6]} scale={[16, 3, 1]} color="#a8c0ff" />
        <Lightformer form="rect" intensity={1.4} position={[6, 2, 5]} scale={[6, 4, 1]} color="#ffd9b0" />
      </Environment>
      <Rig run={run} t={t} labels={labels} />
      <ContactShadows position={[0, -1.89, 0]} opacity={0.55} scale={16} blur={2.4} far={4} />
      <CameraControls ref={ref} makeDefault minDistance={5} maxDistance={20} maxPolarAngle={Math.PI * 0.55} />
      <EffectComposer multisampling={4}>
        <Bloom intensity={0.7} luminanceThreshold={0.65} mipmapBlur />
        <Vignette offset={0.25} darkness={0.6} />
      </EffectComposer>
    </Canvas>
  )
})
