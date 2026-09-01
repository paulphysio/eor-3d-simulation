'use client'
import { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react'
import { SimInputs, SimOutputs, simulate, DEFAULT_PARAMS } from '../lib/proxyModel'
import ControlPanel from '../components/ControlPanel'
import MetricsPanel from '../components/MetricsPanel'
import ProductionChart from '../components/ProductionChart'
import ErrorBoundary from '../components/ErrorBoundary'

const ReservoirScene = lazy(() => import('../components/ReservoirScene'))

const MAX_HISTORY = 60

export default function Home() {
  const [inputs, setInputs] = useState<SimInputs>(DEFAULT_PARAMS)
  const [outputs, setOutputs] = useState<SimOutputs>(simulate(DEFAULT_PARAMS))
  const [baseline] = useState<SimOutputs>(simulate(DEFAULT_PARAMS))
  const [history, setHistory] = useState<{ time: number; cop: number; cwp: number }[]>([])
  const [activeTab, setActiveTab] = useState<'chart' | 'metrics'>('metrics')
  const stepRef = useRef(0)

  const handleChange = useCallback((newInputs: SimInputs) => {
    setInputs(newInputs)
    const result = simulate(newInputs)
    setOutputs(result)
    stepRef.current += 1
    setHistory(prev => {
      const next = [...prev, { time: stepRef.current, cop: result.cop, cwp: result.cwp }]
      return next.slice(-MAX_HISTORY)
    })
  }, [])

  useEffect(() => {
    const result = simulate(DEFAULT_PARAMS)
    setHistory([{ time: 0, cop: result.cop, cwp: result.cwp }])
  }, [])

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#060d1a] text-[#e2e8f0] flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="border-b border-[#0f1a2e] px-4 py-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[#f0a030] text-lg">⛽</span>
            <h1 className="text-sm font-semibold text-white">Niger Delta Heavy Oil — EOR Simulator</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f0a030]/20 text-[#f0a030] font-mono border border-[#f0a030]/30">ML PROXY v1.0</span>
          </div>
          <p className="text-[11px] text-[#4a5a7a] mt-0.5">
            Gradient Boosting proxy model · 150 Eclipse simulation runs · API gravity 17–19 · 20% porosity
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-[#4a5a7a]">
          <a href="https://github.com/paulphysio/niger-delta-eor-proxy-model" target="_blank" rel="noopener noreferrer"
            className="hover:text-[#f0a030] transition-colors flex items-center gap-1">
            <span>⬡</span> GitHub
          </a>
          <a href="https://www.researchgate.net/publication/410889149" target="_blank" rel="noopener noreferrer"
            className="hover:text-[#4a9eff] transition-colors flex items-center gap-1">
            <span>📄</span> Publication
          </a>
          <span className="text-[#2a3a5a]">|</span>
          <span>Paul Madu · FUTO 2024</span>
        </div>
      </header>

      {/* ── Main layout ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>

        {/* Left: Controls */}
        <aside className="w-56 border-r border-[#0f1a2e] p-3 overflow-y-auto flex-shrink-0 hidden lg:block">
          <ControlPanel inputs={inputs} onChange={handleChange} />
        </aside>

        {/* Centre: 3D Viewer */}
        <main className="flex-1 flex flex-col min-w-0">

          {/* 3D Canvas */}
          <div className="relative flex-1 bg-[#060d1a]" style={{ minHeight: 320 }}>
            <ErrorBoundary>
              <Suspense fallback={
                <div className="w-full h-full flex items-center justify-center text-[#4a5a7a] text-sm font-mono">
                  Loading 3D reservoir...
                </div>
              }>
                <ReservoirScene inputs={inputs} outputs={outputs} />
              </Suspense>
            </ErrorBoundary>

            {/* Export button */}
            <div className="absolute top-3 right-3">
              <button
                onClick={() => {
                  const csvContent = "data:text/csv;charset=utf-8," 
                    + "Step,COP,CWP\n"
                    + history.map(row => `${row.time},${row.cop.toFixed(3)},${row.cwp.toFixed(3)}`).join("\n")
                  const encodedUri = encodeURI(csvContent)
                  const link = document.createElement("a")
                  link.setAttribute("href", encodedUri)
                  link.setAttribute("download", `eor_simulation_${new Date().toISOString().slice(0,10)}.csv`)
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                }}
                className="bg-[#060d1a]/90 border border-[#1a2a4a] rounded-lg px-3 py-2 text-[10px] font-mono text-[#4a9eff] hover:bg-[#4a9eff]/10 transition-colors backdrop-blur-sm"
              >
                📥 Export CSV
              </button>
            </div>

            {/* Overlay badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-2 pointer-events-none">
              <div className="bg-[#060d1a]/90 border border-[#1a2a4a] rounded-lg px-3 py-2 font-mono text-xs backdrop-blur-sm">
                <div className="text-[#f0a030]/60 text-[9px] uppercase tracking-wider mb-1">Live Output</div>
                <div className="flex gap-3">
                  <span><span className="text-[#6a7a9a]">COP </span><span className="text-[#f0a030] font-semibold">{(outputs.cop * 1000).toFixed(0)}</span></span>
                  <span><span className="text-[#6a7a9a]">CWP </span><span className="text-[#4a9eff] font-semibold">{(outputs.cwp * 1000).toFixed(0)}</span></span>
                  <span><span className="text-[#6a7a9a]">RF </span><span className="text-[#3dcfa0] font-semibold">{outputs.recoveryFactor.toFixed(1)}%</span></span>
                </div>
              </div>

              <div className="bg-[#060d1a]/90 border border-[#1a2a4a] rounded-lg px-3 py-2 font-mono text-[10px] backdrop-blur-sm">
                <div className="text-[#f0a030]/60 text-[9px] uppercase tracking-wider mb-1">Injection State</div>
                <div className="flex gap-3 text-[#8899bb]">
                  <span>SQ <span className="text-white">{inputs.steamQuality.toFixed(2)}</span></span>
                  <span>T <span className="text-white">{inputs.temperature}°C</span></span>
                  <span>Q <span className="text-white">{inputs.injectionRate}</span> BBL/d</span>
                </div>
              </div>
            </div>

            {/* Key finding badge */}
            <div className="absolute bottom-3 left-3 pointer-events-none">
              <div className="bg-[#060d1a]/90 border border-[#f0a030]/20 rounded-lg px-3 py-2 max-w-xs backdrop-blur-sm">
                <div className="text-[9px] text-[#f0a030]/70 uppercase tracking-wider mb-0.5">Thesis Key Finding</div>
                <div className="text-[10px] text-[#c0b080]">
                  Hot chemical flooding at 80°C outperforms steam flooding alone · Surfactant-polymer wettability alteration reduces IFT
                </div>
              </div>
            </div>

            {/* Drag hint */}
            <div className="absolute bottom-3 right-3 text-[10px] text-[#2a3a5a] font-mono pointer-events-none">
              drag to rotate · scroll to zoom · WASD/arrows to navigate · R to reset
            </div>
          </div>

          {/* Bottom panel tabs */}
          <div className="border-t border-[#0f1a2e]">
            <div className="flex border-b border-[#0f1a2e]">
              {(['metrics', 'chart'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-[11px] font-mono uppercase tracking-wider transition-colors ${
                    activeTab === tab
                      ? 'text-[#f0a030] border-b-2 border-[#f0a030] bg-[#f0a030]/5'
                      : 'text-[#4a5a7a] hover:text-[#8899bb]'
                  }`}>
                  {tab === 'metrics' ? '📊 Metrics' : '📈 Production History'}
                </button>
              ))}
            </div>
            <div className="p-4" style={{ height: 200 }}>
              {activeTab === 'metrics'
                ? <MetricsPanel outputs={outputs} baseline={baseline} />
                : <ProductionChart outputs={outputs} history={history} />
              }
            </div>
          </div>
        </main>

        {/* Right: Mobile controls (shown on small screens as bottom drawer) */}
        <aside className="w-56 border-l border-[#0f1a2e] p-3 overflow-y-auto flex-shrink-0 hidden xl:block">
          <div className="text-[10px] font-semibold text-[#4a5a7a] uppercase tracking-widest mb-3">About This Model</div>
          <div className="text-[11px] text-[#4a5a7a] space-y-2 leading-relaxed">
            <p>This simulator uses a <span className="text-[#f0a030]">Gradient Boosting ML proxy model</span> trained on 150 Eclipse thermal reservoir simulation runs.</p>
            <p>Input parameters (X1–X17) match the Eclipse simulation study on Niger Delta heavy oil (API 17–19, 20% porosity).</p>
            <p>Key finding from experimental work: hot chemical flooding at <span className="text-[#ff6b35]">80°C outperforms steam flooding alone</span>, confirmed by the proxy model sensitivity analysis.</p>
            <div className="border-t border-[#0f1a2e] pt-2 mt-2">
              <div className="text-[9px] uppercase tracking-wider text-[#3a4a6a] mb-1">Model Stats</div>
              <div className="font-mono space-y-1 text-[10px]">
                <div className="flex justify-between"><span className="text-[#4a5a7a]">Training runs</span><span className="text-white">150</span></div>
                <div className="flex justify-between"><span className="text-[#4a5a7a]">Parameters</span><span className="text-white">17</span></div>
                <div className="flex justify-between"><span className="text-[#4a5a7a]">Best CV R²</span><span className="text-[#3dcfa0]">0.60</span></div>
                <div className="flex justify-between"><span className="text-[#4a5a7a]">COP range</span><span className="text-[#f0a030]">2.72–8.85</span></div>
                <div className="flex justify-between"><span className="text-[#4a5a7a]">CWP range</span><span className="text-[#4a9eff]">5.63–11.88</span></div>
              </div>
            </div>
            <div className="border-t border-[#0f1a2e] pt-2 space-y-1">
              <a href="https://github.com/paulphysio/niger-delta-eor-proxy-model" target="_blank" rel="noopener noreferrer"
                className="block text-[10px] text-[#4a9eff] hover:text-[#7ab8ff] transition-colors">
                ⬡ View on GitHub →
              </a>
              <a href="https://www.researchgate.net/publication/410889149" target="_blank" rel="noopener noreferrer"
                className="block text-[10px] text-[#4a9eff] hover:text-[#7ab8ff] transition-colors">
                📄 Published Research →
              </a>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile controls strip */}
      <div className="lg:hidden border-t border-[#0f1a2e] p-3">
        <ControlPanel inputs={inputs} onChange={handleChange} />
      </div>

      {/* Footer */}
      <footer className="border-t border-[#0f1a2e] px-4 py-2 flex items-center justify-between text-[10px] text-[#2a3a5a]">
        <span>Paul Madu · B.Eng Petroleum Engineering, FUTO 2024 · madupaul.20181131453@futo.edu.ng</span>
        <span>Niger Delta EOR ML Proxy Simulator v1.0</span>
      </footer>
      </div>
    </ErrorBoundary>
  )
}
