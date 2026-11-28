'use client'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, memo } from 'react'
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber'
import { CameraControls, Environment, Html, Lightformer, ContactShadows, PerformanceMonitor } from '@react-three/drei'
import SceneFrame, { Quality } from './SceneFrame'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { SimInputs, SimOutputs, producerCells } from '../../lib/proxyModel'
import { computeField, rampColor, cellValue, FieldProperty, NX, NY, NZ, steamRadius, Cell, RAMPS } from '../../lib/fieldModel'

// ── World layout ────────────────────────────────────────────────────────────
const RES_TOP = -4.2
const LAYER_H = 0.55
const RES_BOT = RES_TOP - NZ * LAYER_H
const HALF = NX / 2
const gx = (i: number) => i - HALF - 0.5
const gz = (j: number) => j - HALF - 0.5

export const STRATA = [
  { name: 'Benin Formation', sub: 'Continental sands · Pliocene–Recent', top: 0, bot: -1.6, color: '#a07c4a' },
  { name: 'Agbada shale', sub: 'Paralic shale interbeds', top: -1.6, bot: -2.6, color: '#5d636e' },
  { name: 'Agbada sand', sub: 'Eocene–Miocene', top: -2.6, bot: -3.3, color: '#b08a56' },
  { name: 'Cap-rock shale', sub: 'Seal', top: -3.3, bot: RES_TOP, color: '#474c56' },
  { name: 'Reservoir sand', sub: 'φ ≈ 20 % · k ≈ 60–80 mD · 16.8 °API', top: RES_TOP, bot: RES_BOT, color: '#c97f0e', reservoir: true },
  { name: 'Akata Formation', sub: 'Marine shale · source rock', top: RES_BOT, bot: RES_BOT - 1.3, color: '#34333b' },
]

export type CameraView = 'overview' | 'section' | 'top' | 'well'

export interface SceneProps {
  inputs: SimInputs
  outputs: SimOutputs
  time: number
  property?: FieldProperty
  layer?: number | 'all'
  xray?: boolean
  explode?: boolean
  labels?: boolean
  cutaway?: number // 0 = no cut, 1 = full cut of overburden front half
  view?: { name: CameraView; nonce: number }
  autoRotate?: boolean
  showcase?: boolean
  onHoverCell?: (c: Cell | null) => void
}

// ── Particle sprite ─────────────────────────────────────────────────────────
function useDotTexture() {
  return useMemo(() => {
    if (typeof document === 'undefined') return null
    const c = document.createElement('canvas')
    c.width = c.height = 64
    const g = c.getContext('2d')!
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    grd.addColorStop(0, 'rgba(255,255,255,1)')
    grd.addColorStop(0.35, 'rgba(255,255,255,0.6)')
    grd.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grd
    g.fillRect(0, 0, 64, 64)
    const t = new THREE.CanvasTexture(c)
    return t
  }, [])
}

// ── Strata (overburden + underburden) with cutaway & exploded view ─────────
function Strata({ xray, explode, cutaway, labels }: { xray: boolean; explode: boolean; cutaway: number; labels: boolean }) {
  const over = useRef<THREE.Group>(null)
  const zCut = HALF - cutaway * HALF * 1.4 // front edge of the overburden
  const depth = zCut + HALF
  useFrame((_, dt) => {
    if (!over.current) return
    const target = explode ? 4.2 : 0
    over.current.position.y += (target - over.current.position.y) * Math.min(1, dt * 4)
  })
  return (
    <group>
      <group ref={over}>
        {STRATA.filter(s => !s.reservoir && s.top > RES_TOP - 0.01).map((s, idx) => {
          const h = s.top - s.bot
          return (
            <group key={s.name}>
              <mesh position={[0, (s.top + s.bot) / 2, -HALF + depth / 2]} castShadow receiveShadow>
                <boxGeometry args={[NX, h - 0.02, depth]} />
                <meshStandardMaterial color={s.color} roughness={0.95} metalness={0} transparent opacity={xray ? 0.12 : 1} depthWrite={!xray} />
              </mesh>
              {idx === 0 && (
                <mesh position={[0, 0.03, -HALF + depth / 2]} receiveShadow>
                  <boxGeometry args={[NX + 0.02, 0.06, depth + 0.02]} />
                  <meshStandardMaterial color="#1f3a25" roughness={1} transparent opacity={xray ? 0.15 : 1} />
                </mesh>
              )}
            </group>
          )
        })}
        {/* the part of the ground in front of the cut, kept as a thin surface so wells sit on something */}
        {cutaway > 0 && (
          <mesh position={[0, 0.03, zCut + (HALF - zCut) / 2]} receiveShadow>
            <boxGeometry args={[NX, 0.06, HALF - zCut]} />
            <meshStandardMaterial color="#1f3a25" roughness={1} transparent opacity={xray ? 0.15 : 0.9} />
          </mesh>
        )}
      </group>
      {/* underburden */}
      {STRATA.filter(s => s.top <= RES_BOT + 0.01).map(s => (
        <mesh key={s.name} position={[0, (s.top + s.bot) / 2, 0]} receiveShadow>
          <boxGeometry args={[NX, s.top - s.bot - 0.02, NX]} />
          <meshStandardMaterial color={s.color} roughness={0.95} />
        </mesh>
      ))}
      {labels && STRATA.filter(s => !(explode && s.top > RES_TOP)).map(s => (
        <Html key={s.name} position={[HALF + 0.12, (s.top + s.bot) / 2 + (explode && s.top > RES_TOP ? 4.2 : 0), -HALF + 0.1]} center={false} distanceFactor={15} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
          <div className="strata-label">
            <span className="dot" style={{ background: s.color }} />
            <div>
              <div className="t">{s.name}</div>
              {s.reservoir && <div className="s">{s.sub}</div>}
            </div>
          </div>
        </Html>
      ))}
    </group>
  )
}

// ── Reservoir voxels ────────────────────────────────────────────────────────
function Voxels({ cells, property, layer, onHover }: { cells: Cell[]; property: FieldProperty; layer: number | 'all'; onHover: (c: Cell | null) => void }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const count = NX * NY * NZ
  const current = useRef(new Float32Array(count * 3))
  const target = useRef(new Float32Array(count * 3))
  const [hovered, setHovered] = useState<number | null>(null)
  const tmp = useMemo(() => new THREE.Object3D(), [])
  const col = useMemo(() => new THREE.Color(), [])

  // targets
  useEffect(() => {
    cells.forEach((c, n) => {
      const [r, g, b] = rampColor(property, cellValue(c, property))
      target.current[n * 3] = r; target.current[n * 3 + 1] = g; target.current[n * 3 + 2] = b
    })
  }, [cells, property])

  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    cells.forEach((c, n) => {
      const visible = layer === 'all' || layer === c.k
      tmp.position.set(gx(c.i), RES_TOP - LAYER_H / 2 - c.k * LAYER_H, gz(c.j))
      const s = visible ? 1 : 0.0001
      tmp.scale.set(0.94 * s, 0.9 * s, 0.94 * s)
      tmp.updateMatrix()
      m.setMatrixAt(n, tmp.matrix)
      if (!m.instanceColor) {
        const [r, g, b] = rampColor(property, cellValue(c, property))
        current.current.set([r, g, b], n * 3)
        m.setColorAt(n, col.setRGB(r, g, b))
      }
    })
    m.instanceMatrix.needsUpdate = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer, cells.length])

  useFrame((_, dt) => {
    const m = ref.current
    if (!m || !m.instanceColor) return
    const a = Math.min(1, dt * 6)
    const cur = current.current, tgt = target.current
    for (let n = 0; n < count; n++) {
      cur[n * 3] += (tgt[n * 3] - cur[n * 3]) * a
      cur[n * 3 + 1] += (tgt[n * 3 + 1] - cur[n * 3 + 1]) * a
      cur[n * 3 + 2] += (tgt[n * 3 + 2] - cur[n * 3 + 2]) * a
      const boost = hovered === n ? 1.5 : 1
      m.setColorAt(n, col.setRGB(cur[n * 3] * boost, cur[n * 3 + 1] * boost, cur[n * 3 + 2] * boost))
    }
    m.instanceColor.needsUpdate = true
  })

  const handle = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (e.instanceId === undefined) return
    const c = cells[e.instanceId]
    if (layer !== 'all' && c.k !== layer) return
    setHovered(e.instanceId)
    onHover(c)
  }

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, count]}
      castShadow
      receiveShadow
      onPointerMove={handle}
      onPointerOut={() => { setHovered(null); onHover(null) }}
    >
      <boxGeometry args={[1, LAYER_H, 1]} />
      <meshStandardMaterial roughness={0.45} metalness={0.05} />
    </instancedMesh>
  )
}

// ── Steam chamber glow ──────────────────────────────────────────────────────
function SteamChamber({ x, z, radius, intensity }: { x: number; z: number; radius: number; intensity: number }) {
  const ref = useRef<THREE.Mesh>(null)
  const mat = useRef<THREE.MeshStandardMaterial>(null)
  useFrame(({ clock }) => {
    if (!ref.current || !mat.current) return
    const r = Math.max(0.05, radius)
    ref.current.scale.lerp(new THREE.Vector3(r, 0.55 + 0.25 * Math.min(1, r / 4), r), 0.08)
    mat.current.emissiveIntensity = (0.6 + 0.25 * Math.sin(clock.elapsedTime * 2.2)) * intensity
  })
  return (
    <mesh ref={ref} position={[x, RES_TOP - 0.15, z]}>
      <sphereGeometry args={[1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial ref={mat} color="#ff8a5c" emissive="#ff5a2a" transparent opacity={0.22} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  )
}

// ── Well bore ───────────────────────────────────────────────────────────────
function WellBore({ x, z, color, label, sub, labels, injector }: { x: number; z: number; color: string; label: string; sub: string; labels: boolean; injector?: boolean }) {
  const perf = useRef<THREE.MeshStandardMaterial>(null)
  useFrame(({ clock }) => {
    if (perf.current) perf.current.emissiveIntensity = 1.6 + 0.8 * Math.sin(clock.elapsedTime * (injector ? 4 : 2.5) + x)
  })
  const len = -RES_BOT + 0.1
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, -len / 2 + 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.065, 0.065, len, 16]} />
        <meshStandardMaterial color="#9aa3ad" metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh position={[0, (RES_TOP + RES_BOT) / 2, 0]}>
        <cylinderGeometry args={[0.1, 0.1, RES_TOP - RES_BOT, 16, 1, true]} />
        <meshStandardMaterial ref={perf} color={color} emissive={color} emissiveIntensity={2} toneMapped={false} transparent opacity={0.9} />
      </mesh>
      {labels && (
        <Html position={[0, injector ? 2.6 : 2.1, 0]} center distanceFactor={13} zIndexRange={[6, 0]} style={{ pointerEvents: 'none' }}>
          <div className="well-chip" style={{ ['--c' as string]: color }}>
            <b>{label}</b><span>{sub}</span>
          </div>
        </Html>
      )}
    </group>
  )
}

// ── Pumpjack (nodding donkey) ───────────────────────────────────────────────
function Pumpjack({ x, z, speed, rotation }: { x: number; z: number; speed: number; rotation: number }) {
  const beam = useRef<THREE.Group>(null)
  const crank = useRef<THREE.Group>(null)
  const phase = useMemo(() => Math.random() * Math.PI * 2, [])
  useFrame(({ clock }) => {
    const a = clock.elapsedTime * speed + phase
    if (beam.current) beam.current.rotation.z = Math.sin(a) * 0.22
    if (crank.current) crank.current.rotation.z = -a
  })
  const steel = <meshStandardMaterial color="#59616b" metalness={0.7} roughness={0.4} />
  const accent = <meshStandardMaterial color="#d99a2b" metalness={0.4} roughness={0.45} />
  return (
    <group position={[x, 0.06, z]} rotation={[0, rotation, 0]}>
      <group position={[-0.88, 0, 0]}>
        <mesh position={[0, 0.04, 0]} castShadow>{<boxGeometry args={[1.7, 0.08, 0.42]} />}{steel}</mesh>
        {/* Samson post */}
        <mesh position={[0.1, 0.5, 0.12]} rotation={[0.18, 0, 0]} castShadow><boxGeometry args={[0.07, 0.95, 0.07]} />{steel}</mesh>
        <mesh position={[0.1, 0.5, -0.12]} rotation={[-0.18, 0, 0]} castShadow><boxGeometry args={[0.07, 0.95, 0.07]} />{steel}</mesh>
        {/* walking beam */}
        <group ref={beam} position={[0.1, 0.98, 0]}>
          <mesh castShadow><boxGeometry args={[1.55, 0.09, 0.09]} />{accent}</mesh>
          <mesh position={[0.78, -0.08, 0]} castShadow><boxGeometry args={[0.12, 0.38, 0.16]} />{accent}</mesh>
          <mesh position={[-0.62, -0.05, 0]}><boxGeometry args={[0.12, 0.12, 0.2]} />{steel}</mesh>
        </group>
        {/* crank + counterweights */}
        <group ref={crank} position={[-0.55, 0.34, 0]}>
          <mesh position={[0.12, 0, 0.13]} castShadow><boxGeometry args={[0.42, 0.14, 0.05]} />{steel}</mesh>
          <mesh position={[0.12, 0, -0.13]} castShadow><boxGeometry args={[0.42, 0.14, 0.05]} />{steel}</mesh>
        </group>
        <mesh position={[-0.55, 0.18, 0]}><boxGeometry args={[0.2, 0.3, 0.3]} />{steel}</mesh>
        {/* polished rod + wellhead */}
        <mesh position={[0.88, 0.3, 0]}><cylinderGeometry args={[0.015, 0.015, 0.6, 6]} />{steel}</mesh>
        <mesh position={[0.88, 0.08, 0]} castShadow><cylinderGeometry args={[0.1, 0.12, 0.16, 12]} />{steel}</mesh>
      </group>
    </group>
  )
}

// ── Injector surface facility: wellhead + steam generator + puffs ──────────
function InjectorFacility({ x, z, intensity }: { x: number; z: number; intensity: number }) {
  const puffs = useRef<THREE.Group>(null)
  const seeds = useMemo(() => Array.from({ length: 14 }, (_, k) => ({ o: k / 14, dx: (Math.random() - 0.5) * 0.25 })), [])
  useFrame(({ clock }) => {
    const g = puffs.current
    if (!g) return
    g.children.forEach((m, k) => {
      const s = seeds[k]
      const u = (clock.elapsedTime * (0.18 + 0.25 * intensity) + s.o) % 1
      m.position.set(s.dx + Math.sin(u * 6 + k) * 0.12 * u, u * 2.4, s.dx * 0.6)
      const sc = 0.12 + u * 0.55
      m.scale.setScalar(sc)
      ;((m as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity = (1 - u) * 0.35 * (0.4 + intensity)
    })
  })
  const steel = <meshStandardMaterial color="#8e99a5" metalness={0.85} roughness={0.3} />
  const gx2 = x + 1.6
  return (
    <group>
      {/* christmas tree */}
      <group position={[x, 0.06, z]}>
        <mesh position={[0, 0.12, 0]} castShadow><cylinderGeometry args={[0.16, 0.2, 0.24, 16]} />{steel}</mesh>
        <mesh position={[0, 0.42, 0]} castShadow><cylinderGeometry args={[0.08, 0.08, 0.4, 12]} />{steel}</mesh>
        <mesh position={[0, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.05, 0.05, 0.5, 10]} />{steel}</mesh>
        <mesh position={[0, 0.66, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.1, 0.018, 8, 20]} /><meshStandardMaterial color="#e8553a" emissive="#e8553a" emissiveIntensity={1.4} toneMapped={false} /></mesh>
        {/* insulated steam line */}
        <mesh position={[0.8, 0.5, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.055, 0.055, 1.6, 12]} /><meshStandardMaterial color="#c8ccd2" metalness={0.3} roughness={0.5} /></mesh>
      </group>
      {/* steam generator skid */}
      <group position={[gx2, 0.06, z]}>
        <mesh position={[0.4, 0.35, 0]} castShadow><boxGeometry args={[0.9, 0.7, 0.6]} /><meshStandardMaterial color="#3a4452" metalness={0.5} roughness={0.5} /></mesh>
        <mesh position={[0.4, 0.36, 0.305]}><planeGeometry args={[0.7, 0.08]} /><meshStandardMaterial color="#e8553a" emissive="#e8553a" emissiveIntensity={1.2 * intensity} toneMapped={false} /></mesh>
        <mesh position={[0.65, 1.05, 0]} castShadow><cylinderGeometry args={[0.08, 0.1, 0.8, 12]} />{steel}</mesh>
        <group ref={puffs} position={[0.65, 1.45, 0]}>
          {seeds.map((_, k) => (
            <mesh key={k}><sphereGeometry args={[1, 12, 10]} /><meshStandardMaterial color="#e9eef5" transparent opacity={0.3} depthWrite={false} roughness={1} /></mesh>
          ))}
        </group>
      </group>
    </group>
  )
}

// ── Flow particles injector → producers ─────────────────────────────────────
function FlowParticles({ from, to, intensity, reach }: { from: [number, number]; to: [number, number][]; intensity: number; reach: number }) {
  const N = 520
  const tex = useDotTexture()
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3))
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(N * 3), 3))
    return g
  }, [])
  const data = useMemo(() => Array.from({ length: N }, () => ({
    u: Math.random(), p: Math.floor(Math.random() * 4), bend: (Math.random() - 0.5) * 2.2,
    y: RES_TOP - 0.08 - Math.pow(Math.random(), 1.6) * (RES_TOP - RES_BOT - 0.16), sp: 0.6 + Math.random() * 0.8,
  })), [])
  const hot = useMemo(() => new THREE.Color('#ff7a45'), [])
  const oil = useMemo(() => new THREE.Color('#ffc15a'), [])
  const c = useMemo(() => new THREE.Color(), [])
  useFrame((_, dt) => {
    const pos = geo.attributes.position.array as Float32Array
    const colr = geo.attributes.color.array as Float32Array
    for (let n = 0; n < N; n++) {
      const d = data[n]
      d.u += dt * 0.09 * d.sp * (0.35 + intensity)
      if (d.u > 1) { d.u = 0; d.p = Math.floor(Math.random() * 4); d.bend = (Math.random() - 0.5) * 2.2 }
      const [tx, tz] = to[d.p] ?? to[0]
      const u = d.u
      const dx = tx - from[0], dz = tz - from[1]
      const L = Math.hypot(dx, dz) || 1
      const nx = -dz / L, nz = dx / L
      const arc = Math.sin(u * Math.PI) * d.bend
      pos[n * 3] = from[0] + dx * u + nx * arc
      pos[n * 3 + 1] = d.y
      pos[n * 3 + 2] = from[1] + dz * u + nz * arc
      // particles ahead of the front are dim (oil not yet mobilised)
      const lit = u * L <= reach + 1.5 ? 1 : 0.18
      c.copy(hot).lerp(oil, u).multiplyScalar(lit * 1.6)
      colr[n * 3] = c.r; colr[n * 3 + 1] = c.g; colr[n * 3 + 2] = c.b
    }
    geo.attributes.position.needsUpdate = true
    geo.attributes.color.needsUpdate = true
  })
  return (
    <points geometry={geo}>
      <pointsMaterial size={0.16} map={tex ?? undefined} vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} sizeAttenuation />
    </points>
  )
}

// ── Camera rig ──────────────────────────────────────────────────────────────
function Rig({ view, autoRotate, inj }: { view?: { name: CameraView; nonce: number }; autoRotate: boolean; inj: [number, number] }) {
  const ref = useRef<CameraControls>(null)
  const interacting = useRef(false)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const name = view?.name ?? 'overview'
    if (name === 'overview') c.setLookAt(13, 8.5, 15, 0, -3.2, 0, true)
    if (name === 'section') c.setLookAt(0.5, -2.8, 17.5, 0, -3.6, 0, true)
    if (name === 'top') c.setLookAt(0, 21, 0.01, 0, -4, 0, true)
    if (name === 'well') c.setLookAt(inj[0] + 3.2, -1.2, inj[1] + 4.2, inj[0], -4.6, inj[1], true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view?.name, view?.nonce])
  useFrame((_, dt) => {
    if (autoRotate && ref.current && !interacting.current) ref.current.azimuthAngle += dt * 0.08
  })
  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={5}
      maxDistance={38}
      maxPolarAngle={Math.PI * 0.62}
      smoothTime={0.6}
      onStart={() => (interacting.current = true)}
      onEnd={() => (interacting.current = false)}
    />
  )
}

// ── Main scene ──────────────────────────────────────────────────────────────
function SceneContent(p: Required<Omit<SceneProps, 'view' | 'onHoverCell'>> & Pick<SceneProps, 'view' | 'onHoverCell'> & { quality: Quality; degrade: () => void }) {
  const { inputs, outputs, time, property, layer, xray, explode, labels, cutaway, autoRotate, showcase, quality } = p
  const hi = quality === 'high'
  const cells = useMemo(() => computeField(inputs, outputs, time), [inputs, outputs, time])
  const [hoverCell, setHoverCell] = useState<Cell | null>(null)
  const inj: [number, number] = [gx(inputs.injI), gz(inputs.injJ)]
  const prods = producerCells(inputs).map(([i, j]) => [gx(i), gz(j)] as [number, number])
  const bhps = [inputs.bhpP1, inputs.bhpP2, inputs.bhpP3, inputs.bhpP4]
  const intensity = 0.25 + 0.45 * inputs.steamQuality + 0.3 * (inputs.injectionRate / 800)
  const rs = steamRadius(inputs, outputs, time, 0)

  const onHover = (c: Cell | null) => { setHoverCell(c); p.onHoverCell?.(c) }

  return (
    <>
      <color attach="background" args={['#04070d']} />
      <fog attach="fog" args={['#04070d', 26, 60]} />
      <ambientLight intensity={0.75} />
      <hemisphereLight args={['#bcd2ff', '#3a2a18', 0.9]} />
      {hi && <PerformanceMonitor onDecline={p.degrade} />}
      <directionalLight position={[10, 16, 8]} intensity={2.4} castShadow={hi} shadow-mapSize={[1024, 1024]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} />
      <pointLight position={[inj[0], RES_TOP + 0.6, inj[1]]} color="#ff6a3a" intensity={6 * intensity} distance={7} />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={2} position={[0, 6, -8]} scale={[20, 4, 1]} color="#9fb7ff" />
        <Lightformer form="rect" intensity={1.2} position={[8, 3, 6]} scale={[8, 6, 1]} color="#ffd2a0" />
        <Lightformer form="ring" intensity={0.8} position={[-8, 4, 4]} scale={4} color="#ffffff" />
      </Environment>

      <Strata xray={xray} explode={explode} cutaway={cutaway} labels={labels} />
      <Voxels cells={cells} property={property} layer={layer} onHover={onHover} />
      <SteamChamber x={inj[0]} z={inj[1]} radius={rs} intensity={intensity} />
      <FlowParticles from={inj} to={prods} intensity={intensity} reach={rs + 1.4} />

      <WellBore x={inj[0]} z={inj[1]} color="#ff6a3a" label="INJ-1" sub={`${inputs.injectionRate} bbl/d · ${inputs.temperature}°C`} labels={labels} injector />
      <InjectorFacility x={inj[0]} z={inj[1]} intensity={intensity} />
      {prods.map(([x, z], k) => (
        <group key={k}>
          <WellBore x={x} z={z} color="#ffb340" label={`P-${k + 1}`} sub={`${bhps[k]} psi BHP`} labels={labels} />
          <Pumpjack x={x} z={z} speed={0.8 + 2.4 * (1 - (bhps[k] - 500) / 3500)} rotation={x > inj[0] ? Math.PI : 0} />
        </group>
      ))}

      {hoverCell && !showcase && (
        <Html position={[gx(hoverCell.i), RES_TOP + 0.4, gz(hoverCell.j)]} center zIndexRange={[8, 0]} style={{ pointerEvents: 'none' }}>
          <div className="cell-tip">
            <div className="h">Cell ({hoverCell.i}, {hoverCell.j}, {hoverCell.k + 1})<span className={`z z-${hoverCell.zone}`}>{hoverCell.zone === 'steam' ? 'Steam zone' : hoverCell.zone === 'hot-water' ? 'Hot condensate' : 'Unswept'}</span></div>
            <div className="r"><span>So</span><b>{hoverCell.so.toFixed(2)}</b></div>
            <div className="r"><span>T</span><b>{hoverCell.temp.toFixed(0)} °C</b></div>
            <div className="r"><span>μ oil</span><b>{hoverCell.visc < 20 ? hoverCell.visc.toFixed(1) : hoverCell.visc.toFixed(0)} cP</b></div>
          </div>
        </Html>
      )}

      {hi && <ContactShadows position={[0, RES_BOT - 1.32, 0]} opacity={0.5} scale={30} blur={2.6} far={6} resolution={256} />}
      <Rig view={p.view} autoRotate={autoRotate} inj={inj} />
      {hi && (
        <EffectComposer multisampling={2}>
          <Bloom intensity={0.85} luminanceThreshold={0.62} luminanceSmoothing={0.2} mipmapBlur />
          <Vignette eskil={false} offset={0.2} darkness={showcase ? 0.55 : 0.5} />
        </EffectComposer>
      )}
    </>
  )
}

export default memo(function ReservoirScene(props: SceneProps) {
  const full = {
    property: 'so' as FieldProperty, layer: 'all' as const, xray: false, explode: false, labels: true, cutaway: 0.55, autoRotate: false, showcase: false,
    ...props,
  }
  return (
    <SceneFrame>
      {({ quality, attach, degrade }) => (
        <Canvas
          shadows={quality === 'high'}
          dpr={quality === 'high' ? [1, 1.5] : 1}
          camera={{ position: [13, 8.5, 15], fov: 42, near: 0.1, far: 120 }}
          gl={{ antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, powerPreference: 'default' }}
          onCreated={({ gl }) => { gl.toneMappingExposure = 1.05; attach(gl) }}
        >
          <SceneContent {...full} quality={quality} degrade={degrade} />
        </Canvas>
      )}
    </SceneFrame>
  )
})

export { RAMPS }
