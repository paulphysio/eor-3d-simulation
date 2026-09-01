'use client'
import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { SimInputs, SimOutputs } from '../lib/proxyModel'

interface Props {
  inputs: SimInputs
  outputs: SimOutputs
}

export default function ReservoirScene({ inputs, outputs }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<any>({})
  const handleKeyDownRef = useRef<((e: KeyboardEvent) => void) | null>(null)

  const init = useCallback(() => {
    const mount = mountRef.current
    if (!mount) return
    const W = mount.clientWidth
    const H = mount.clientHeight

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x060d1a, 1)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    mount.appendChild(renderer.domElement)

    // Scene
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x060d1a, 0.04)

    // Camera
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 200)
    camera.position.set(16, 10, 16)
    camera.lookAt(0, 0, 0)

    // ── Lighting ──────────────────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0x223355, 0.6)
    scene.add(ambientLight)

    const sunLight = new THREE.DirectionalLight(0xffeedd, 1.4)
    sunLight.position.set(8, 12, 6)
    sunLight.castShadow = true
    sunLight.shadow.camera.near = 0.1
    sunLight.shadow.camera.far = 60
    sunLight.shadow.camera.left = -15
    sunLight.shadow.camera.right = 15
    sunLight.shadow.camera.top = 15
    sunLight.shadow.camera.bottom = -15
    sunLight.shadow.mapSize.width = 2048
    sunLight.shadow.mapSize.height = 2048
    scene.add(sunLight)

    const fillLight = new THREE.PointLight(0x4488ff, 0.5, 30)
    fillLight.position.set(-6, 4, -6)
    scene.add(fillLight)

    const oilLight = new THREE.PointLight(0xf0a030, 0.8, 20)
    oilLight.position.set(0, 2, 0)
    scene.add(oilLight)

    // ── Ground / Reservoir formation ─────────────────────────────────────────
    // Base rock layer
    const baseGeo = new THREE.BoxGeometry(14, 0.3, 14)
    const baseMat = new THREE.MeshLambertMaterial({ color: 0x2a1a0a })
    const base = new THREE.Mesh(baseGeo, baseMat)
    base.position.y = -0.65
    base.receiveShadow = true
    scene.add(base)

    // ── Reservoir grid (5×5 cells representing simulation grid) ──────────────
    const GRID = 5
    const CELL = 1.8
    const cells: { mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; i: number; j: number }[] = []

    for (let i = 0; i < GRID; i++) {
      for (let j = 0; j < GRID; j++) {
        const geo = new THREE.BoxGeometry(CELL - 0.08, 0.6, CELL - 0.08)
        const mat = new THREE.MeshLambertMaterial({
          color: 0xc06010,
          transparent: true,
          opacity: 0.7,
        })
        const mesh = new THREE.Mesh(geo, mat)
        mesh.position.set(
          (i - 2) * CELL,
          -0.1,
          (j - 2) * CELL
        )
        mesh.castShadow = true
        mesh.receiveShadow = true
        scene.add(mesh)
        cells.push({ mesh, mat, i, j })
      }
    }

    // ── Geological layers (visual depth below) ────────────────────────────────
    const layers = [
      { y: -1.2, color: 0x3a2510, opacity: 0.5 },
      { y: -1.8, color: 0x1a0f08, opacity: 0.4 },
      { y: -2.4, color: 0x2a3050, opacity: 0.3 },
    ]
    layers.forEach(l => {
      const geo = new THREE.BoxGeometry(14, 0.5, 14)
      const mat = new THREE.MeshLambertMaterial({ color: l.color, transparent: true, opacity: l.opacity })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.y = l.y
      scene.add(mesh)
    })

    // ── Grid lines ────────────────────────────────────────────────────────────
    const gridHelper = new THREE.GridHelper(14, 14, 0x1a2a4a, 0x0f1a2e)
    gridHelper.position.y = 0.22
    scene.add(gridHelper)

    // ── Well helper ───────────────────────────────────────────────────────────
    function makeWell(x: number, z: number, color: number, isInjector: boolean) {
      const group = new THREE.Group()

      // Casing (outer tube)
      const casingGeo = new THREE.CylinderGeometry(0.12, 0.12, 3.5, 12)
      const casingMat = new THREE.MeshLambertMaterial({ color: 0x888888 })
      const casing = new THREE.Mesh(casingGeo, casingMat)
      casing.position.y = 1.25
      group.add(casing)

      // Inner tube (flowing fluid)
      const innerGeo = new THREE.CylinderGeometry(0.07, 0.07, 3.5, 8)
      const innerMat = new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.4 })
      const inner = new THREE.Mesh(innerGeo, innerMat)
      inner.position.y = 1.25
      group.add(inner)

      // Wellhead assembly
      const headGeo = new THREE.CylinderGeometry(0.28, 0.22, 0.35, 8)
      const headMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa })
      const head = new THREE.Mesh(headGeo, headMat)
      head.position.y = 3.1
      group.add(head)

      // Flange
      const flangeGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.08, 12)
      const flangeMat = new THREE.MeshLambertMaterial({ color: 0x777777 })
      const flange = new THREE.Mesh(flangeGeo, flangeMat)
      flange.position.y = 2.96
      group.add(flange)

      // Indicator light
      const lightGeo = new THREE.SphereGeometry(0.1, 8, 8)
      const lightMat = new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 1.0 })
      const light = new THREE.Mesh(lightGeo, lightMat)
      light.position.y = 3.4
      group.add(light)

      // Point light at wellhead
      const pointLight = new THREE.PointLight(color, 0.8, 4)
      pointLight.position.y = 3.4
      group.add(pointLight)

      // Perforation zone (slots in the casing)
      for (let k = 0; k < 4; k++) {
        const slotGeo = new THREE.BoxGeometry(0.15, 0.06, 0.15)
        const slotMat = new THREE.MeshLambertMaterial({ color })
        const slot = new THREE.Mesh(slotGeo, slotMat)
        const angle = (k / 4) * Math.PI * 2
        slot.position.set(Math.cos(angle) * 0.14, -0.2 + k * 0.12, Math.sin(angle) * 0.14)
        group.add(slot)
      }

      if (isInjector) {
        // Steam injection surface casing
        const scGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.5, 12)
        const scMat = new THREE.MeshLambertMaterial({ color: 0xff6b35, transparent: true, opacity: 0.6 })
        const sc = new THREE.Mesh(scGeo, scMat)
        sc.position.y = -0.05
        group.add(sc)
      }

      group.position.set(x, 0, z)
      group.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })
      scene.add(group)
      return group
    }

    const injectorWell = makeWell(0, 0, 0xff6b35, true)
    const prodWells = [
      makeWell(-4.5, -4.5, 0x4a9eff, false),
      makeWell(4.5, -4.5, 0x4a9eff, false),
      makeWell(-4.5, 4.5, 0x4a9eff, false),
      makeWell(4.5, 4.5, 0x4a9eff, false),
    ]

    // ── Steam plume (animated cone above injector) ────────────────────────────
    const plumeGeo = new THREE.ConeGeometry(1.2, 3, 16, 1, true)
    const plumeMat = new THREE.MeshLambertMaterial({
      color: 0xfff0e0,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    const plume = new THREE.Mesh(plumeGeo, plumeMat)
    plume.position.set(0, 5, 0)
    scene.add(plume)

    // ── Water front (animated horizontal plane) ────────────────────────────────
    const waterGeo = new THREE.PlaneGeometry(10, 10, 8, 8)
    const waterMat = new THREE.MeshLambertMaterial({
      color: 0x1a4a8a,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    const waterFront = new THREE.Mesh(waterGeo, waterMat)
    waterFront.rotation.x = -Math.PI / 2
    waterFront.position.y = 0.22
    scene.add(waterFront)

    // ── Particle system (steam + chemical flow) ───────────────────────────────
    const NPART = 180
    const partGeo = new THREE.BufferGeometry()
    const positions = new Float32Array(NPART * 3)
    const colors = new Float32Array(NPART * 3)
    const partData: any[] = []

    const prodPositions = [[-4.5,-4.5],[4.5,-4.5],[-4.5,4.5],[4.5,4.5]]

    for (let k = 0; k < NPART; k++) {
      const prodIdx = Math.floor(Math.random() * 4)
      const [tx, tz] = prodPositions[prodIdx]
      partData.push({
        progress: Math.random(),
        speed: 0.006 + Math.random() * 0.008,
        tx: tx * (0.8 + Math.random() * 0.3),
        tz: tz * (0.8 + Math.random() * 0.3),
        yBase: -0.05 + Math.random() * 0.15,
        isSteam: k < NPART * 0.6,
        jitter: Math.random() * 0.4 - 0.2,
      })
      positions[k * 3] = 0
      positions[k * 3 + 1] = 0
      positions[k * 3 + 2] = 0
      colors[k * 3]   = k < NPART * 0.6 ? 1.0 : 0.85
      colors[k * 3+1] = k < NPART * 0.6 ? 0.6 : 0.45
      colors[k * 3+2] = k < NPART * 0.6 ? 0.2 : 0.05
    }
    partGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    partGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const partMat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      sizeAttenuation: true,
    })
    const particles = new THREE.Points(partGeo, partMat)
    scene.add(particles)

    // ── Streamlines from injector to producers ────────────────────────────────
    const streamlines: THREE.Line[] = []
    prodPositions.forEach(([px, pz], idx) => {
      const points = []
      const STEPS = 20
      for (let s = 0; s <= STEPS; s++) {
        const t = s / STEPS
        const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
        const x = px * ease + Math.sin(t * Math.PI * 2 + idx) * 0.3
        const y = -0.05 + Math.sin(t * Math.PI) * 0.15
        const z = pz * ease + Math.cos(t * Math.PI * 2 + idx) * 0.3
        points.push(new THREE.Vector3(x, y, z))
      }
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points)
      const lineMat = new THREE.LineBasicMaterial({
        color: 0xf0a030,
        transparent: true,
        opacity: 0.25,
        linewidth: 1,
      })
      const line = new THREE.Line(lineGeo, lineMat)
      scene.add(line)
      streamlines.push(line)
    })

    // ── Seismic cross-section walls (ghost planes at edges) ───────────────────
    const wallData = [
      { pos: [0, -0.2, -7.5], rot: [0, 0, 0] },
      { pos: [-7.5, -0.2, 0], rot: [0, Math.PI / 2, 0] },
    ]
    wallData.forEach(({ pos, rot }) => {
      const wGeo = new THREE.PlaneGeometry(15, 4, 10, 4)
      const wMat = new THREE.MeshLambertMaterial({
        color: 0x1a2a4a,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
        wireframe: false,
      })
      const wall = new THREE.Mesh(wGeo, wMat)
      wall.position.set(...pos as [number, number, number])
      wall.rotation.set(...rot as [number, number, number])
      scene.add(wall)
    })

    // ── Mouse orbit ────────────────────────────────────────────────────────────
    let theta = 0.785, phi = 0.55, radius = 22
    let isDragging = false, lastX = 0, lastY = 0

    const dom = renderer.domElement
    dom.addEventListener('mousedown', (e: MouseEvent) => {
      isDragging = true; lastX = e.clientX; lastY = e.clientY
    })
    dom.addEventListener('mouseup', () => isDragging = false)
    dom.addEventListener('mouseleave', () => isDragging = false)
    dom.addEventListener('mousemove', (e: MouseEvent) => {
      if (!isDragging) return
      const dx = (e.clientX - lastX) * 0.008
      const dy = (e.clientY - lastY) * 0.008
      theta -= dx
      phi = Math.max(0.12, Math.min(1.3, phi + dy))
      lastX = e.clientX; lastY = e.clientY
    })
    dom.addEventListener('wheel', (e: WheelEvent) => {
      radius = Math.max(8, Math.min(35, radius + e.deltaY * 0.025))
      e.preventDefault()
    }, { passive: false })

    // Touch support
    let lastTouchX = 0, lastTouchY = 0, lastPinchDist = 0
    dom.addEventListener('touchstart', (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true; lastTouchX = e.touches[0].clientX; lastTouchY = e.touches[0].clientY
      } else if (e.touches.length === 2) {
        lastPinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
      }
    })
    dom.addEventListener('touchend', () => isDragging = false)
    dom.addEventListener('touchmove', (e: TouchEvent) => {
      if (e.touches.length === 1 && isDragging) {
        const dx = (e.touches[0].clientX - lastTouchX) * 0.01
        const dy = (e.touches[0].clientY - lastTouchY) * 0.01
        theta -= dx
        phi = Math.max(0.12, Math.min(1.3, phi + dy))
        lastTouchX = e.touches[0].clientX; lastTouchY = e.touches[0].clientY
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
        radius = Math.max(8, Math.min(35, radius - (dist - lastPinchDist) * 0.05))
        lastPinchDist = dist
      }
      e.preventDefault()
    }, { passive: false })

    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      const rotationSpeed = 0.05
      const zoomSpeed = 2
      
      switch(e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          theta += rotationSpeed
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          theta -= rotationSpeed
          break
        case 'ArrowUp':
        case 'w':
        case 'W':
          phi = Math.max(0.12, phi - rotationSpeed)
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          phi = Math.min(1.3, phi + rotationSpeed)
          break
        case '+':
        case '=':
          radius = Math.max(8, radius - zoomSpeed)
          break
        case '-':
        case '_':
          radius = Math.min(35, radius + zoomSpeed)
          break
        case 'r':
        case 'R':
          // Reset view
          theta = 0.785
          phi = 0.55
          radius = 22
          break
        default:
          return
      }
      e.preventDefault()
    }
    
    window.addEventListener('keydown', handleKeyDown)
    handleKeyDownRef.current = handleKeyDown

    // ── Store refs ─────────────────────────────────────────────────────────────
    sceneRef.current = {
      renderer, scene, camera, cells, particles, partGeo, partData, partMat,
      waterFront, waterMat, plume, plumeMat, oilLight, streamlines,
      injectorWell, prodWells, fillLight,
      getOrbit: () => ({ theta, phi, radius }),
      setOrbit: (t: number, p: number, r: number) => { theta = t; phi = p; radius = r },
      isDragging: () => isDragging,
      takeScreenshot: () => {
        renderer.render(scene, camera)
        const dataURL = renderer.domElement.toDataURL('image/png')
        const link = document.createElement('a')
        link.download = `eor_3d_scene_${new Date().toISOString().slice(0,10)}.png`
        link.href = dataURL
        link.click()
        return dataURL
      }
    }

    // ── Animation ──────────────────────────────────────────────────────────────
    let frame = 0
    let animId: number | undefined

    const animate = () => {
      animId = requestAnimationFrame(animate)
      frame++
      const { theta: th, phi: ph, radius: r } = sceneRef.current.getOrbit()

      // Auto-rotate when not dragging
      if (!isDragging) {
        theta += 0.002
        sceneRef.current.setOrbit(theta, ph, r)
      }

      // Camera orbit
      camera.position.x = r * Math.sin(theta) * Math.cos(phi)
      camera.position.y = r * Math.sin(phi)
      camera.position.z = r * Math.cos(theta) * Math.cos(phi)
      camera.lookAt(0, 0.5, 0)

      // Particle animation
      const pos = partGeo.attributes.position.array as Float32Array
      partData.forEach((p, k) => {
        p.progress += p.speed * (sceneRef.current.injIntensity || 0.5)
        if (p.progress > 1) {
          p.progress = 0
          const prodIdx = Math.floor(Math.random() * 4)
          const [ntx, ntz] = prodPositions[prodIdx]
          p.tx = ntx * (0.85 + Math.random() * 0.25)
          p.tz = ntz * (0.85 + Math.random() * 0.25)
        }
        const t = p.progress
        const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
        pos[k * 3]     = p.tx * ease + Math.sin(frame * 0.04 + k * 0.3) * 0.15 + p.jitter
        pos[k * 3 + 1] = p.yBase + Math.sin(t * Math.PI) * 0.35
        pos[k * 3 + 2] = p.tz * ease + Math.cos(frame * 0.04 + k * 0.3) * 0.15
      })
      partGeo.attributes.position.needsUpdate = true
      partMat.opacity = 0.4 + (sceneRef.current.injIntensity || 0.5) * 0.4

      // Steam plume pulse
      const pulseFactor = sceneRef.current.injIntensity || 0.5
      plume.scale.setScalar(0.8 + pulseFactor * 0.6 + Math.sin(frame * 0.05) * 0.08)
      plumeMat.opacity = 0.06 + pulseFactor * 0.12
      plume.rotation.y += 0.008

      // Streamline opacity
      streamlines.forEach((l, idx) => {
        ;(l.material as THREE.LineBasicMaterial).opacity = 
          0.1 + pulseFactor * 0.25 + Math.sin(frame * 0.04 + idx) * 0.05
      })

      // Oil light pulse
      oilLight.intensity = 0.5 + Math.sin(frame * 0.03) * 0.2

      renderer.render(scene, camera)
    }
    animate()
    sceneRef.current.animId = animId
  }, [])

  // Update 3D visuals when simulation outputs change
  useEffect(() => {
    const s = sceneRef.current
    if (!s.cells) return

    const { copNorm, cwpNorm } = outputs

    // Update reservoir cell colours — oil saturation gradient
    s.cells.forEach(({ mesh, mat, i, j }: any) => {
      const distFromCenter = Math.sqrt((i - 2) ** 2 + (j - 2) ** 2) / 3.5
      const saturation = Math.max(0.05, copNorm - distFromCenter * 0.25)

      // Oil-rich: amber-orange; Water-invaded: dark blue
      const oilR = 0.75 + saturation * 0.25
      const oilG = 0.35 + saturation * 0.25
      const oilB = 0.02 + saturation * 0.05
      const waterR = 0.05 + (1 - saturation) * 0.1
      const waterG = 0.1 + (1 - saturation) * 0.15
      const waterB = 0.3 + (1 - saturation) * 0.4

      const blend = saturation
      mat.color.setRGB(
        oilR * blend + waterR * (1 - blend),
        oilG * blend + waterG * (1 - blend),
        oilB * blend + waterB * (1 - blend)
      )
      mat.opacity = 0.5 + saturation * 0.35
      mesh.scale.y = 0.7 + saturation * 0.7
    })

    // Water front expansion
    if (s.waterFront) {
      const ws = 0.4 + cwpNorm * 0.9
      s.waterFront.scale.set(ws, 1, ws)
      s.waterMat && (s.waterMat.opacity = 0.12 + cwpNorm * 0.28)
    }

    // Injection intensity controls particle speed and steam plume
    const sq = inputs.steamQuality
    const ir = inputs.injectionRate / 800
    s.injIntensity = 0.2 + sq * 0.4 + ir * 0.4
  }, [outputs, inputs])

  useEffect(() => {
    init()
    const handleResize = () => {
      const s = sceneRef.current
      if (!s.renderer || !mountRef.current) return
      const W = mountRef.current.clientWidth
      const H = mountRef.current.clientHeight
      s.renderer.setSize(W, H)
      s.camera.aspect = W / H
      s.camera.updateProjectionMatrix()
    }
    
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      if (handleKeyDownRef.current) {
        window.removeEventListener('keydown', handleKeyDownRef.current)
      }
      const s = sceneRef.current
      if (s.animId) cancelAnimationFrame(s.animId)
      if (s.renderer && mountRef.current) {
        try { mountRef.current.removeChild(s.renderer.domElement) } catch {}
        s.renderer.dispose()
      }
    }
  }, [init])

  return (
    <div className="relative w-full h-full">
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{ minHeight: 420 }}
      />
      <button
        onClick={() => {
          const s = sceneRef.current
          if (s.takeScreenshot) {
            s.takeScreenshot()
          }
        }}
        className="absolute bottom-3 right-3 bg-[#060d1a]/90 border border-[#1a2a4a] rounded-lg px-3 py-2 text-[10px] font-mono text-[#f0a030] hover:bg-[#f0a030]/10 transition-colors backdrop-blur-sm"
        title="Take screenshot (also supports WASD/arrows navigation, R to reset)"
      >
        📷
      </button>
    </div>
  )
}
