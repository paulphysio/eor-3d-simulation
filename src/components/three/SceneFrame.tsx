'use client'
import { Component, ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import type { WebGLRenderer } from 'three'
import { MonitorX, RotateCcw } from 'lucide-react'

/**
 * Keeps a 3D canvas from taking the page down.
 *
 * - 'high' = shadows, bloom, MSAA; 'low' = no post-processing or shadows, 1× pixel ratio.
 *   Weak machines start on 'low'; a GPU slowdown (PerformanceMonitor) or a context
 *   loss drops to 'low' and remembers it for the browser session.
 * - If the browser cannot create or keep a WebGL context (Chrome blocks WebGL for a
 *   page after repeated GPU resets), the canvas is replaced by an explanation and a
 *   retry button; the rest of the page keeps working.
 */
export type Quality = 'high' | 'low'

const LOW_KEY = 'eor-gpu-low'

function initialQuality(): Quality {
  if (typeof window === 'undefined') return 'high'
  try { if (sessionStorage.getItem(LOW_KEY)) return 'low' } catch {}
  const nav = navigator as Navigator & { deviceMemory?: number }
  if ((nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) || (nav.deviceMemory && nav.deviceMemory <= 4)) return 'low'
  if (window.matchMedia?.('(max-width: 768px)').matches) return 'low'
  return 'high'
}

function rememberLow() {
  try { sessionStorage.setItem(LOW_KEY, '1') } catch {}
}

class Boundary extends Component<{ onError: () => void; fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: Error) {
    console.warn('3D view unavailable:', error.message)
    this.props.onError()
  }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

export interface SceneApi {
  quality: Quality
  /** Wire into <Canvas onCreated>: listens for context loss. */
  attach: (gl: WebGLRenderer) => void
  /** Call from PerformanceMonitor's onDecline. */
  degrade: () => void
}

export default function SceneFrame({ children }: { children: (api: SceneApi) => ReactNode }) {
  const [quality, setQuality] = useState<Quality>(initialQuality)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    return () => { alive.current = false }
  }, [])

  const degrade = useCallback(() => { rememberLow(); setQuality('low') }, [])

  const attach = useCallback((gl: WebGLRenderer) => {
    gl.domElement.addEventListener('webglcontextlost', (e) => {
      // React also forces a context loss when the canvas unmounts on navigation; ignore that one.
      if (!alive.current) return
      e.preventDefault()
      rememberLow()
      setQuality('low')
      setFailed(true)
    }, { once: true })
  }, [])

  const retry = () => { setFailed(false); setAttempt(a => a + 1) }

  const fallback = (
    <div className="w-full h-full min-h-[280px] flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto w-11 h-11 rounded-xl grid place-items-center bg-white/[0.05] text-[var(--oil)] mb-3"><MonitorX size={20} /></div>
        <div className="text-[15px] font-semibold text-white">3D view paused</div>
        <p className="text-[12.5px] leading-relaxed text-[var(--ink-2)] mt-1.5">
          Your browser couldn&apos;t start or keep the 3D graphics (WebGL). Everything else on this page still works.
        </p>
        <ul className="text-[12px] leading-relaxed text-[var(--ink-3)] mt-3 text-left list-disc pl-5 space-y-1">
          <li>Turn on hardware acceleration in your browser settings.</li>
          <li>Close other tabs that use 3D or video, then retry.</li>
          <li>If Chrome says WebGL was blocked for this page, fully restart the browser.</li>
        </ul>
        <button onClick={retry} className="focus-ring mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--oil)] text-[#1a1004] text-[13px] font-semibold hover:brightness-110">
          <RotateCcw size={14} /> Retry in light mode
        </button>
      </div>
    </div>
  )

  if (failed) return fallback
  return (
    <Boundary key={attempt} onError={() => { rememberLow(); setQuality('low') }} fallback={fallback}>
      {children({ quality, attach, degrade })}
    </Boundary>
  )
}
