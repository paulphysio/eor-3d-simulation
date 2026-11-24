'use client'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Pause, RotateCcw, Eye, Layers3, Tag, Camera, Download, Save, Trash2, FolderOpen, AlertTriangle,
  Mountain, Map as MapIcon, Crosshair, Orbit, ScanLine, Flame, Droplet, Thermometer, Gauge, Zap, Scale, Keyboard,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell as RCell, LabelList } from 'recharts'
import {
  SimInputs, simulate, PARAMS, PARAM_BY_KEY, PRESETS, DEFAULT_PARAMS, sensitivity, responseGrid, ParamKey,
  COP_RANGE, getScenarios, saveScenario, loadScenario, deleteScenario, SimOutputs,
} from '../../lib/proxyModel'
import { productionProfile, RAMPS, FieldProperty, PROJECT_YEARS, Cell } from '../../lib/fieldModel'
import { CHART } from '../../lib/labData'
import { Slider, Segmented, Toggle, InfoTip, CanvasFallback, Note } from '../ui'
import type { CameraView } from '../three/ReservoirScene'

const ReservoirScene = dynamic(() => import('../three/ReservoirScene'), { ssr: false, loading: () => <CanvasFallback label="Building reservoir model" /> })

const BASE_OUT = simulate(DEFAULT_PARAMS)
const COLOR_BY_GROUP = { injection: '#ff6a3a', producers: '#3b9eff', placement: '#2dd4a8' }

// ─────────────────────────────────────────────────────────────────────────────
export default function Simulator() {
  const [inputs, setInputs] = useState<SimInputs>(DEFAULT_PARAMS)
  const outputs = useMemo(() => simulate(inputs), [inputs])
  const [time, setTime] = useState(0.45)
  const [playing, setPlaying] = useState(false)
  const [property, setProperty] = useState<FieldProperty>('so')
  const [layer, setLayer] = useState<number | 'all'>('all')
  const [xray, setXray] = useState(false)
  const [explode, setExplode] = useState(false)
  const [labels, setLabels] = useState(true)
  const [cut, setCut] = useState(0.55)
  const [rotate, setRotate] = useState(false)
  const [view, setView] = useState<{ name: CameraView; nonce: number }>({ name: 'overview', nonce: 0 })
  const [hoverCell, setHoverCell] = useState<Cell | null>(null)
  const [presetId, setPresetId] = useState<string>('base')
  const viewport = useRef<HTMLDivElement>(null)

  const change = useCallback((k: ParamKey, v: number) => { setInputs(p => ({ ...p, [k]: v })); setPresetId('') }, [])
  const goView = (name: CameraView) => setView(v => ({ name, nonce: v.nonce + 1 }))

  // playback
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setTime(t => {
        const n = t + 0.012
        if (n >= 1) { setPlaying(false); return 1 }
        return n
      })
    }, 60)
    return () => clearInterval(id)
  }, [playing])

  const togglePlay = useCallback(() => {
    setPlaying(p => {
      if (!p) setTime(t => (t >= 0.999 ? 0 : t))
      return !p
    })
  }, [])

  // keyboard
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' && (e.target as HTMLInputElement).type === 'text') return
      if (e.key === ' ') { e.preventDefault(); togglePlay() }
      else if (e.key === '1') goView('overview')
      else if (e.key === '2') goView('section')
      else if (e.key === '3') goView('top')
      else if (e.key === '4') goView('well')
      else if (e.key.toLowerCase() === 'x') setXray(v => !v)
      else if (e.key.toLowerCase() === 'e') setExplode(v => !v)
      else if (e.key.toLowerCase() === 'l') setLabels(v => !v)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [togglePlay])

  const screenshot = () => {
    const c = viewport.current?.querySelector('canvas')
    if (!c) return
    const a = document.createElement('a')
    a.download = `niger-delta-eor-3d-${Date.now()}.png`
    a.href = c.toDataURL('image/png')
    a.click()
  }

  const exportCsv = () => {
    const prof = productionProfile(inputs, outputs)
    const lines = [
      '# Niger Delta EOR Simulator — scenario export',
      ...PARAMS.map(p => `# ${p.x} ${p.label},${inputs[p.key]}${p.unit ? ' ' + p.unit : ''}`),
      `# COP (x10^3 bbl),${outputs.cop.toFixed(3)}`,
      `# CWP (x10^3 bbl),${outputs.cwp.toFixed(3)}`,
      `# Oil cut (%),${outputs.oilCut.toFixed(2)}`,
      `# Heat injection (MMBtu/d),${outputs.heatMMBtuD.toFixed(2)}`,
      'year,cum_oil_x1e3_bbl,cum_water_x1e3_bbl,water_cut_pct (illustrative profile)',
      ...prof.map(r => `${r.year},${r.oil},${r.water},${r.waterCut}`),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `eor-scenario-${Date.now()}.csv`
    a.click()
  }

  const year = time * PROJECT_YEARS

  return (
    <div className="max-w-[1680px] mx-auto px-3 md:px-6 py-6">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
        <div>
          <div className="eyebrow mb-1.5">Field-scale simulator</div>
          <h1 className="font-display text-[28px] md:text-[34px] font-semibold text-white leading-tight">Steam-flood five-spot · 10 × 10 × 3 grid</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button key={p.id} onClick={() => { setInputs(p.inputs); setPresetId(p.id) }} title={p.blurb}
              className={`focus-ring text-left px-3.5 py-2 rounded-xl border transition-all ${presetId === p.id ? 'bg-[#f5a524]/12 border-[#f5a524]/60' : 'bg-white/[0.02] border-[var(--line)] hover:border-[var(--line-strong)]'}`}>
              <div className={`text-[12.5px] font-semibold ${presetId === p.id ? 'text-[var(--oil)]' : 'text-white'}`}>{p.name}</div>
              <div className="num text-[10.5px] text-[var(--ink-3)]">{p.tag}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_320px] lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* ── Controls ── */}
        <Controls inputs={inputs} change={change} setInputs={(i) => { setInputs(i); setPresetId('') }} />

        {/* ── Viewport ── */}
        <div className="flex flex-col gap-4 min-w-0">
          <div ref={viewport} className="panel relative overflow-hidden h-[62vh] min-h-[480px]">
            <Suspense fallback={<CanvasFallback />}>
              <ReservoirScene inputs={inputs} outputs={outputs} time={time} property={property} layer={layer} xray={xray} explode={explode} labels={labels} cutaway={cut} view={view} autoRotate={rotate} onHoverCell={setHoverCell} />
            </Suspense>

            {/* top-left: property & legend */}
            <div className="absolute z-20 top-3 left-3 flex flex-col gap-2 max-w-[calc(100%-24px)]">
              <Segmented size="sm" ariaLabel="Displayed property" value={property} onChange={setProperty} options={[
                { value: 'so', label: <span className="inline-flex items-center gap-1"><Droplet size={12} />Oil sat.</span> },
                { value: 'temp', label: <span className="inline-flex items-center gap-1"><Thermometer size={12} />Temp.</span> },
                { value: 'visc', label: <span className="inline-flex items-center gap-1"><Gauge size={12} />Viscosity</span> },
              ]} />
              <Legend property={property} />
            </div>

            {/* top-right: camera + toggles */}
            <div className="absolute z-20 top-3 right-3 flex flex-col items-end gap-2">
              <div className="flex gap-1 glass rounded-xl p-1">
                {([['overview', <Mountain size={14} key="o" />, 'Overview (1)'], ['section', <ScanLine size={14} key="s" />, 'Cross-section (2)'], ['top', <MapIcon size={14} key="t" />, 'Map view (3)'], ['well', <Crosshair size={14} key="w" />, 'Injector close-up (4)']] as const).map(([n, icon, t]) => (
                  <button key={n} title={t} aria-label={t} onClick={() => goView(n)} className={`focus-ring w-8 h-8 grid place-items-center rounded-lg transition ${view.name === n ? 'bg-[var(--oil)] text-[#1a1004]' : 'text-[var(--ink-2)] hover:text-white hover:bg-white/5'}`}>{icon}</button>
                ))}
                <span className="w-px bg-[var(--line)] mx-0.5" />
                <button title="Auto-rotate" aria-label="Auto-rotate" onClick={() => setRotate(r => !r)} className={`focus-ring w-8 h-8 grid place-items-center rounded-lg transition ${rotate ? 'bg-white/10 text-white' : 'text-[var(--ink-2)] hover:text-white hover:bg-white/5'}`}><Orbit size={14} /></button>
                <button title="Save PNG" aria-label="Save screenshot" onClick={screenshot} className="focus-ring w-8 h-8 grid place-items-center rounded-lg text-[var(--ink-2)] hover:text-white hover:bg-white/5"><Camera size={14} /></button>
              </div>
              <div className="flex flex-wrap justify-end gap-1.5">
                <Toggle on={xray} onChange={setXray} label="X-ray" icon={<Eye size={12} />} />
                <Toggle on={explode} onChange={setExplode} label="Lift overburden" icon={<Layers3 size={12} />} />
                <Toggle on={labels} onChange={setLabels} label="Labels" icon={<Tag size={12} />} />
              </div>
              <div className="glass rounded-xl px-3 py-2 w-[200px]">
                <Slider label="Cutaway" value={cut} min={0} max={1} step={0.01} color="#a9b4c8" onChange={setCut} format={v => `${Math.round(v * 100)}%`} />
              </div>
              <div className="glass rounded-xl p-1">
                <Segmented size="sm" ariaLabel="Layer filter" value={layer} onChange={setLayer} options={[
                  { value: 'all', label: 'All layers' }, { value: 0, label: 'L1' }, { value: 1, label: 'L2' }, { value: 2, label: 'L3' },
                ]} />
              </div>
            </div>

            {/* bottom: timeline */}
            <div className="absolute z-20 bottom-3 left-3 right-3 glass rounded-2xl px-3 py-2.5 flex items-center gap-3">
              <button onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'} className="focus-ring w-10 h-10 flex-none rounded-xl bg-[var(--oil)] text-[#1a1004] grid place-items-center hover:brightness-110 transition">
                {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
              </button>
              <button onClick={() => { setTime(0); setPlaying(false) }} aria-label="Rewind" className="focus-ring w-8 h-8 flex-none rounded-lg grid place-items-center text-[var(--ink-2)] hover:text-white hover:bg-white/5"><RotateCcw size={14} /></button>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className="text-[var(--ink-3)]">Injection time</span>
                  <span className="num text-white">Year {year.toFixed(1)} <span className="text-[var(--ink-3)]">/ {PROJECT_YEARS}</span></span>
                </div>
                <input type="range" className="rng" aria-label="Simulation time" min={0} max={1} step={0.001} value={time} onChange={e => { setTime(parseFloat(e.target.value)); setPlaying(false) }}
                  style={{ ['--c' as string]: '#f5a524', ['--track' as string]: `linear-gradient(90deg, #ff6a3a, #f5a524 ${time * 100}%, rgba(148,170,210,0.14) ${time * 100}%)` }} />
              </div>
              <div className="hidden md:flex items-center gap-1.5 text-[10.5px] text-[var(--ink-3)]"><Keyboard size={12} /><span className="kbd">Space</span><span className="kbd">1–4</span><span className="kbd">X</span><span className="kbd">E</span><span className="kbd">L</span></div>
            </div>

            <AnimatePresence>
              {hoverCell && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute z-20 left-3 bottom-[84px] glass rounded-xl px-3 py-2 text-[11px] text-[var(--ink-2)] hidden md:block">
                  Inspecting grid cell <span className="num text-white">i={hoverCell.i} j={hoverCell.j} k={hoverCell.k + 1}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Analysis inputs={inputs} outputs={outputs} time={time} onPick={(k, v) => change(k, v)} />
        </div>

        {/* ── KPIs ── */}
        <div className="lg:col-span-2 xl:col-span-1">
          <Kpis outputs={outputs} inputs={inputs} onExport={exportCsv} />
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
function Legend({ property }: { property: FieldProperty }) {
  const r = RAMPS[property]
  return (
    <div className="glass rounded-xl px-3 py-2 w-[230px]">
      <div className="flex justify-between text-[11px] mb-1.5"><span className="text-white font-medium">{r.label}</span><span className="text-[var(--ink-3)]">{r.unit}{r.log ? ' · log' : ''}</span></div>
      <div className="h-2.5 rounded-full" style={{ background: `linear-gradient(90deg, ${r.stops.join(',')})` }} />
      <div className="flex justify-between num text-[10px] text-[var(--ink-3)] mt-1">
        <span>{r.min}{property === 'so' ? '' : ''} · {r.lowLabel}</span><span>{r.highLabel} · {r.max}</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
function Controls({ inputs, change, setInputs }: { inputs: SimInputs; change: (k: ParamKey, v: number) => void; setInputs: (i: SimInputs) => void }) {
  const [saved, setSaved] = useState<string[]>([])
  const [name, setName] = useState('')
  const [linkBhp, setLinkBhp] = useState(true)
  useEffect(() => { setSaved(Object.keys(getScenarios())) }, [])

  const groups: { id: 'injection' | 'producers' | 'placement'; title: string; icon: JSX.Element; note: string }[] = [
    { id: 'injection', title: 'Injection', icon: <Flame size={14} />, note: 'Heat & fluid delivered by INJ-1' },
    { id: 'producers', title: 'Producers', icon: <Gauge size={14} />, note: 'Bottom-hole pressure controls drawdown' },
    { id: 'placement', title: 'Well placement', icon: <Crosshair size={14} />, note: '10 × 10 Eclipse grid indices' },
  ]

  const setBhp = (k: ParamKey, v: number) => {
    if (linkBhp) setInputs({ ...inputs, bhpP1: v, bhpP2: v, bhpP3: v, bhpP4: v })
    else change(k, v)
  }

  return (
    <aside className="panel p-4 flex flex-col gap-5 lg:max-h-[calc(62vh+520px)] lg:overflow-y-auto">
      {groups.map(g => (
        <div key={g.id}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md grid place-items-center" style={{ background: `${COLOR_BY_GROUP[g.id]}22`, color: COLOR_BY_GROUP[g.id] }}>{g.icon}</span>
              <div>
                <div className="text-[13px] font-semibold text-white leading-tight">{g.title}</div>
                <div className="text-[10.5px] text-[var(--ink-3)]">{g.note}</div>
              </div>
            </div>
            {g.id === 'producers' && <Toggle on={linkBhp} onChange={setLinkBhp} label="Link" />}
          </div>
          <div className="flex flex-col gap-3">
            {PARAMS.filter(p => p.group === g.id).filter(p => !(g.id === 'producers' && linkBhp && p.key !== 'bhpP1')).map(p => (
              <Slider key={p.key} tag={p.x} label={g.id === 'producers' && linkBhp ? 'All producers BHP' : p.label} value={inputs[p.key]} min={p.min} max={p.max} step={p.step} unit={p.unit}
                color={COLOR_BY_GROUP[g.id]} help={p.help} muted={!p.inProxy}
                format={p.key === 'steamQuality' ? v => v.toFixed(2) : undefined}
                onChange={v => (g.id === 'producers' ? setBhp(p.key, v) : change(p.key, v))} />
            ))}
          </div>
        </div>
      ))}

      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <span className="w-6 h-6 rounded-md grid place-items-center bg-white/5 text-[var(--ink-2)]"><Save size={13} /></span>
          <div className="text-[13px] font-semibold text-white">Saved scenarios</div>
        </div>
        <form className="flex gap-2" onSubmit={e => { e.preventDefault(); if (!name.trim()) return; saveScenario(name.trim(), inputs); setSaved(Object.keys(getScenarios())); setName('') }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Name this scenario" aria-label="Scenario name"
            className="flex-1 min-w-0 bg-white/[0.03] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-[12px] text-white placeholder:text-[var(--ink-3)] focus:outline-none focus:border-[#f5a524]/60" />
          <button className="focus-ring px-3 rounded-lg bg-white/[0.06] hover:bg-white/10 text-[12px] text-white">Save</button>
        </form>
        <div className="mt-2 flex flex-col gap-1">
          {saved.length === 0 && <div className="text-[11.5px] text-[var(--ink-3)] py-1">Nothing saved yet. Scenarios are stored in this browser.</div>}
          {saved.map(n => (
            <div key={n} className="flex items-center gap-1 group">
              <button onClick={() => { const s = loadScenario(n); if (s) setInputs(s) }} className="focus-ring flex-1 flex items-center gap-2 text-left px-2 py-1.5 rounded-lg hover:bg-white/5 text-[12px] text-[var(--ink-2)] hover:text-white truncate"><FolderOpen size={12} />{n}</button>
              <button onClick={() => { deleteScenario(n); setSaved(Object.keys(getScenarios())) }} aria-label={`Delete ${n}`} className="focus-ring p-1.5 rounded-lg text-[var(--ink-3)] hover:text-[#ff8a6a] opacity-0 group-hover:opacity-100 focus:opacity-100"><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
function Delta({ v, invert = false }: { v: number; invert?: boolean }) {
  if (Math.abs(v) < 0.05) return <span className="text-[11px] text-[var(--ink-3)]">≈ base</span>
  const good = invert ? v < 0 : v > 0
  return <span className={`num text-[11px] ${good ? 'text-[#4fe0b5]' : 'text-[#ff8a6a]'}`}>{v > 0 ? '▲' : '▼'} {Math.abs(v).toFixed(1)}%</span>
}

function Kpis({ outputs, inputs, onExport }: { outputs: SimOutputs; inputs: SimInputs; onExport: () => void }) {
  const d = (a: number, b: number) => ((a - b) / b) * 100
  const cards = [
    { k: 'Cumulative oil', v: (outputs.cop * 1000).toFixed(0), u: 'bbl', delta: d(outputs.cop, BASE_OUT.cop), c: CHART.oil, icon: <Droplet size={14} />, tip: 'COP — proxy prediction of cumulative oil produced over the project (×10³ bbl in the Eclipse ensemble).' },
    { k: 'Cumulative water', v: (outputs.cwp * 1000).toFixed(0), u: 'bbl', delta: d(outputs.cwp, BASE_OUT.cwp), c: CHART.water, invert: true, icon: <Droplet size={14} />, tip: 'CWP — cumulative water (condensate + formation water) produced. Lower is cheaper to handle.' },
    { k: 'Oil cut', v: outputs.oilCut.toFixed(1), u: '%', delta: d(outputs.oilCut, BASE_OUT.oilCut), c: CHART.xg, icon: <Scale size={14} />, tip: 'Share of produced liquid that is oil: COP / (COP + CWP). Not the same as recovery factor (which needs OOIP).' },
    { k: 'Water–oil ratio', v: outputs.wor.toFixed(2), u: 'bbl/bbl', delta: d(outputs.wor, BASE_OUT.wor), c: CHART.dpfa, invert: true, icon: <Scale size={14} />, tip: 'Barrels of water lifted per barrel of oil — a key cost driver for surface facilities.' },
    { k: 'Heat injection', v: outputs.heatMMBtuD.toFixed(1), u: 'MMBtu/d', delta: d(outputs.heatMMBtuD, BASE_OUT.heatMMBtuD), c: CHART.steam, invert: true, icon: <Flame size={14} />, tip: 'Derived: rate × 350 lb/bbl × (sensible + quality × latent heat) above a 55 °C reservoir. Proxy for fuel cost and CO₂.' },
    { k: 'Energy intensity', v: outputs.heatPerOil.toFixed(2), u: 'per 10³ bbl', delta: d(outputs.heatPerOil, BASE_OUT.heatPerOil), c: '#f5c06a', invert: true, icon: <Zap size={14} />, tip: 'Heat rate per unit cumulative oil. Lower = more oil per unit of fuel burned. The thesis’ core economic argument.' },
  ]
  const pos = outputs.copNorm * 100
  const meanPos = ((COP_RANGE.mean - COP_RANGE.min) / (COP_RANGE.max - COP_RANGE.min)) * 100
  return (
    <div className="flex flex-col gap-3">
      <div className="panel p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[13px] font-semibold text-white">Live proxy output</div>
          <span className="text-[10.5px] text-[var(--ink-3)]">Δ vs base case</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {cards.map(c => (
            <motion.div key={c.k} layout className="rounded-xl p-3 bg-white/[0.025] border border-[var(--line)] relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: c.c }} />
              <div className="flex items-center justify-between text-[10.5px] text-[var(--ink-3)] mb-1">
                <span className="flex items-center gap-1">{c.k}</span>
                <InfoTip side="bottom" width={230}>{c.tip}</InfoTip>
              </div>
              <motion.div key={c.v} initial={{ opacity: 0.4, y: -3 }} animate={{ opacity: 1, y: 0 }} className="num text-[20px] font-semibold text-white leading-tight">{c.v}</motion.div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-[10px] text-[var(--ink-3)]">{c.u}</span>
                <Delta v={c.delta} invert={c.invert} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="panel p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[12.5px] font-semibold text-white">Position in Eclipse ensemble</div>
          <InfoTip side="bottom" width={240}>Where this prediction sits within the COP range observed across the 150 training runs. Predictions are clamped to that range.</InfoTip>
        </div>
        <div className="relative h-3 rounded-full bg-gradient-to-r from-[#2a1a0a] via-[#8a5410] to-[#f5a524]">
          <div className="absolute top-[-3px] bottom-[-3px] w-px bg-white/50" style={{ left: `${meanPos}%` }} />
          <motion.div className="absolute top-1/2 w-4 h-4 -mt-2 -ml-2 rounded-full bg-white border-[3px] border-[var(--oil)] shadow-lg" animate={{ left: `${pos}%` }} transition={{ type: 'spring', stiffness: 200, damping: 24 }} />
        </div>
        <div className="flex justify-between num text-[10px] text-[var(--ink-3)] mt-1.5"><span>min 2.72</span><span>mean 5.94</span><span>max 8.85</span></div>
        <AnimatePresence>
          {outputs.saturated && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 flex gap-2 text-[11.5px] text-[#ffc56a] bg-[#f5a524]/10 border border-[#f5a524]/30 rounded-lg p-2.5">
              <AlertTriangle size={14} className="flex-none mt-0.5" />
              <span>This combination pushes the response surface past the training range, so the output is held at the ensemble limit. Treat as extrapolation.</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="panel p-4">
        <div className="text-[12.5px] font-semibold text-white mb-2">Operating point</div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[['SQ', inputs.steamQuality.toFixed(2), ''], ['T', inputs.temperature, '°C'], ['Q', inputs.injectionRate, 'bbl/d']].map(([k, v, u]) => (
            <div key={k as string} className="rounded-lg bg-white/[0.025] border border-[var(--line)] py-2">
              <div className="text-[10px] text-[var(--ink-3)]">{k}</div>
              <div className="num text-[14px] text-white">{v}<span className="text-[10px] text-[var(--ink-3)] ml-0.5">{u}</span></div>
            </div>
          ))}
        </div>
        <button onClick={onExport} className="focus-ring mt-3 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-[var(--line)] text-[12.5px] text-white transition">
          <Download size={14} /> Export scenario CSV
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
type Tab = 'profile' | 'tornado' | 'map' | 'compare'
function Analysis({ inputs, outputs, time, onPick }: { inputs: SimInputs; outputs: SimOutputs; time: number; onPick: (k: ParamKey, v: number) => void }) {
  const [tab, setTab] = useState<Tab>('profile')
  return (
    <div className="panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <Segmented ariaLabel="Analysis view" value={tab} onChange={setTab} options={[
          { value: 'profile', label: 'Production profile' },
          { value: 'tornado', label: 'Sensitivity' },
          { value: 'map', label: 'Response map' },
          { value: 'compare', label: 'Compare strategies' },
        ]} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {tab === 'profile' && <Profile inputs={inputs} outputs={outputs} time={time} />}
          {tab === 'tornado' && <Tornado inputs={inputs} />}
          {tab === 'map' && <ResponseMap inputs={inputs} onPick={onPick} />}
          {tab === 'compare' && <Compare inputs={inputs} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function Profile({ inputs, outputs, time }: { inputs: SimInputs; outputs: SimOutputs; time: number }) {
  const data = useMemo(() => productionProfile(inputs, outputs), [inputs, outputs])
  return (
    <div>
      <div className="flex flex-wrap gap-4 text-[11.5px] text-[var(--ink-2)] mb-2">
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-[2px]" style={{ background: CHART.oil }} />Cumulative oil</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-[2px]" style={{ background: CHART.water }} />Cumulative water</span>
        <span className="text-[var(--ink-3)]">×10³ bbl · year-10 values equal the proxy totals</span>
      </div>
      <div className="h-[260px]">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 56, bottom: 18, left: 0 }}>
            <CartesianGrid stroke="rgba(148,170,210,0.08)" vertical={false} />
            <XAxis dataKey="year" type="number" domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fill: '#6b7890', fontSize: 11 }} stroke="rgba(148,170,210,0.2)" label={{ value: 'Year', position: 'bottom', offset: 2, fill: '#6b7890', fontSize: 11 }} />
            <YAxis tick={{ fill: '#6b7890', fontSize: 11 }} stroke="rgba(148,170,210,0.2)" width={36} />
            <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
              <div className="glass rounded-xl p-3 text-[12px] min-w-[170px]">
                <div className="text-white font-medium mb-1">Year {Number(label).toFixed(1)}</div>
                <div className="flex justify-between gap-4 text-[var(--ink-2)]"><span>Oil</span><b className="num text-white">{(payload[0].payload as any).oil.toFixed(2)}</b></div>
                <div className="flex justify-between gap-4 text-[var(--ink-2)]"><span>Water</span><b className="num text-white">{(payload[0].payload as any).water.toFixed(2)}</b></div>
                <div className="flex justify-between gap-4 text-[var(--ink-2)]"><span>Water cut</span><b className="num text-white">{(payload[0].payload as any).waterCut}%</b></div>
              </div>
            ) : null} />
            <ReferenceLine x={time * PROJECT_YEARS} stroke="#f5a524" strokeDasharray="3 3" strokeOpacity={0.7} />
            <Line type="monotone" dataKey="oil" stroke={CHART.oil} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: '#0a1120', strokeWidth: 2 }} isAnimationActive={false}>
              <LabelList dataKey="oil" content={(p: any) => p.index === data.length - 1 ? <text x={p.x + 6} y={p.y + 4} fill="#a9b4c8" fontSize={11}>Oil</text> : null} />
            </Line>
            <Line type="monotone" dataKey="water" stroke={CHART.water} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: '#0a1120', strokeWidth: 2 }} isAnimationActive={false}>
              <LabelList dataKey="water" content={(p: any) => p.index === data.length - 1 ? <text x={p.x + 6} y={p.y + 4} fill="#a9b4c8" fontSize={11}>Water</text> : null} />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </div>
      <Note>The proxy predicts end-of-project totals. The curve shape (exponential oil decline, delayed water breakthrough) is illustrative and scaled to hit those totals exactly; the dashed line tracks the 3D timeline.</Note>
    </div>
  )
}

function Tornado({ inputs }: { inputs: SimInputs }) {
  const [target, setTarget] = useState<'cop' | 'cwp'>('cop')
  const rows = useMemo(() => sensitivity(inputs, target), [inputs, target])
  const max = Math.max(0.5, ...rows.map(r => Math.max(Math.abs(r.up), Math.abs(r.down))))
  const [hover, setHover] = useState<string | null>(null)
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="text-[12px] text-[var(--ink-2)]">Change in {target === 'cop' ? 'cumulative oil' : 'cumulative water'} when each input moves ±10 % of its range from the current point</div>
        <Segmented size="sm" ariaLabel="Sensitivity target" value={target} onChange={setTarget} options={[{ value: 'cop', label: 'Oil (COP)' }, { value: 'cwp', label: 'Water (CWP)' }]} />
      </div>
      <div className="flex gap-4 text-[11px] text-[var(--ink-3)] mb-2 justify-center">
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: CHART.water }} />Input −10 %</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: CHART.oil }} />Input +10 %</span>
      </div>
      <div className="flex flex-col gap-[6px]">
        {rows.map(r => {
          const bars = [{ v: r.down, c: CHART.water, n: '−10 %' }, { v: r.up, c: CHART.oil, n: '+10 %' }]
          return (
            <div key={r.key} className="grid grid-cols-[150px_1fr_110px] items-center gap-3 text-[12px]" onMouseEnter={() => setHover(r.key)} onMouseLeave={() => setHover(null)}>
              <div className={`text-right truncate transition-colors ${hover === r.key ? 'text-white' : 'text-[var(--ink-2)]'}`}><span className="num text-[10px] text-[var(--ink-3)] mr-1.5">{r.x}</span>{r.label}</div>
              <div className="relative h-5 rounded bg-white/[0.02]">
                <div className="absolute left-1/2 top-[-2px] bottom-[-2px] w-px bg-[var(--line-strong)]" />
                {bars.map((b, k) => {
                  const w = (Math.abs(b.v) / max) * 50
                  const left = b.v >= 0 ? 50 : 50 - w
                  return (
                    <motion.div key={k} title={`${b.n}: ${b.v >= 0 ? '+' : ''}${b.v.toFixed(2)} %`} className="absolute top-[3px] bottom-[3px]"
                      style={{ background: b.c, borderRadius: b.v >= 0 ? '0 4px 4px 0' : '4px 0 0 4px', opacity: hover && hover !== r.key ? 0.35 : 1 }}
                      initial={false} animate={{ left: `${left}%`, width: `${Math.max(0.3, w)}%` }} transition={{ type: 'spring', stiffness: 180, damping: 24 }} />
                  )
                })}
              </div>
              <div className="num text-[11px] text-[var(--ink-2)] whitespace-nowrap">{r.down >= 0 ? '+' : ''}{r.down.toFixed(1)} / {r.up >= 0 ? '+' : ''}{r.up.toFixed(1)}%</div>
            </div>
          )
        })}
      </div>
      <div className="mt-3"><Note>Computed on the un-clamped response surface so the ranking stays informative near the ensemble limits. Steam quality (X6) dominating oil while injection rate (X5) dominates water matches the Random Forest feature ranking from the Eclipse study.</Note></div>
    </div>
  )
}

function ResponseMap({ inputs, onPick }: { inputs: SimInputs; onPick: (k: ParamKey, v: number) => void }) {
  const [xKey, setX] = useState<ParamKey>('temperature')
  const [yKey, setY] = useState<ParamKey>('steamQuality')
  const N = 24
  const cells = useMemo(() => responseGrid(inputs, xKey, yKey, N), [inputs, xKey, yKey])
  const px = PARAM_BY_KEY[xKey], py = PARAM_BY_KEY[yKey]
  const [hover, setHover] = useState<{ x: number; y: number; v: number } | null>(null)
  const ramp = ['#1a1036', '#3b1f5e', '#6e2a6a', '#a8395e', '#d9573d', '#f39a2c', '#fdd76a']
  const colorOf = (v: number) => {
    const f = Math.max(0, Math.min(1, (v - COP_RANGE.min) / (COP_RANGE.max - COP_RANGE.min)))
    const s = f * (ramp.length - 1), a = Math.floor(s), b = Math.min(ramp.length - 1, a + 1), m = s - a
    const h = (x: string, i: number) => parseInt(x.slice(1 + i * 2, 3 + i * 2), 16)
    return `rgb(${[0, 1, 2].map(i => Math.round(h(ramp[a], i) + (h(ramp[b], i) - h(ramp[a], i)) * m)).join(',')})`
  }
  const opts = PARAMS.filter(p => p.inProxy && !['bhpP2', 'bhpP3', 'bhpP4'].includes(p.key))
  const cx = ((inputs[xKey] - px.min) / (px.max - px.min)) * 100
  const cy = ((inputs[yKey] - py.min) / (py.max - py.min)) * 100
  return (
    <div className="grid md:grid-cols-[1fr_220px] gap-5">
      <div>
        <div className="flex gap-3">
          <div className="flex items-center"><span className="text-[11px] text-[var(--ink-3)] [writing-mode:vertical-rl] rotate-180 whitespace-nowrap">{py.label} {py.unit && `(${py.unit})`}</span></div>
          <div className="flex-1">
            <div className="relative aspect-[16/9] rounded-lg overflow-hidden border border-[var(--line)] cursor-crosshair" onMouseLeave={() => setHover(null)}>
              <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${N}, 1fr)`, gridTemplateRows: `repeat(${N}, 1fr)` }}>
                {Array.from({ length: N }).map((_, row) => Array.from({ length: N }).map((_, col) => {
                  const c = cells[(N - 1 - row) * N + col]
                  return <div key={`${row}-${col}`} style={{ background: colorOf(c.v) }} onMouseEnter={() => setHover(c)} onClick={() => { onPick(xKey, Math.round(c.x / px.step) * px.step); onPick(yKey, Math.round(c.y / py.step) * py.step) }} />
                }))}
              </div>
              <motion.div className="absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full border-2 border-white shadow-[0_0_0_3px_rgba(0,0,0,0.45)] pointer-events-none" animate={{ left: `${cx}%`, top: `${100 - cy}%` }} transition={{ type: 'spring', stiffness: 200, damping: 22 }} />
            </div>
            <div className="flex justify-between num text-[10px] text-[var(--ink-3)] mt-1"><span>{px.min}</span><span className="font-sans text-[11px]">{px.label} {px.unit && `(${px.unit})`}</span><span>{px.max}</span></div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3 text-[12px]">
        <label className="flex flex-col gap-1 text-[var(--ink-3)]">Horizontal axis
          <select value={xKey} onChange={e => setX(e.target.value as ParamKey)} className="bg-[var(--surface-2)] border border-[var(--line)] rounded-lg px-2 py-1.5 text-white focus:outline-none focus:border-[#f5a524]/60">
            {opts.filter(o => o.key !== yKey).map(o => <option key={o.key} value={o.key}>{o.x} · {o.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[var(--ink-3)]">Vertical axis
          <select value={yKey} onChange={e => setY(e.target.value as ParamKey)} className="bg-[var(--surface-2)] border border-[var(--line)] rounded-lg px-2 py-1.5 text-white focus:outline-none focus:border-[#f5a524]/60">
            {opts.filter(o => o.key !== xKey).map(o => <option key={o.key} value={o.key}>{o.x} · {o.label}</option>)}
          </select>
        </label>
        <div>
          <div className="text-[var(--ink-3)] mb-1">Cumulative oil (×10³ bbl)</div>
          <div className="h-2.5 rounded-full" style={{ background: `linear-gradient(90deg, ${ramp.join(',')})` }} />
          <div className="flex justify-between num text-[10px] text-[var(--ink-3)] mt-1"><span>2.72</span><span>8.85</span></div>
        </div>
        <div className="rounded-xl bg-white/[0.03] border border-[var(--line)] p-3 min-h-[86px]">
          {hover ? (
            <>
              <div className="text-[var(--ink-3)] text-[11px]">{px.label}: <b className="num text-white">{hover.x.toFixed(px.step < 1 ? 2 : 0)}</b></div>
              <div className="text-[var(--ink-3)] text-[11px]">{py.label}: <b className="num text-white">{hover.y.toFixed(py.step < 1 ? 2 : 0)}</b></div>
              <div className="text-[var(--ink-3)] text-[11px] mt-1">COP: <b className="num text-white text-[14px]">{hover.v.toFixed(2)}</b></div>
              <div className="text-[10px] text-[var(--ink-3)] mt-1">Click to move the operating point here</div>
            </>
          ) : <div className="text-[var(--ink-3)] text-[11.5px]">Hover the map to read COP; click to jump there. The ring marks the current operating point.</div>}
        </div>
      </div>
    </div>
  )
}

function Compare({ inputs }: { inputs: SimInputs }) {
  const [metric, setMetric] = useState<'cop' | 'cwp' | 'oilCut' | 'heatPerOil'>('cop')
  const rows = useMemo(() => {
    const list = [{ name: 'Current', i: inputs, color: '#e8edf6' }, ...PRESETS.map((p, k) => ({ name: p.name, i: p.inputs as SimInputs, color: [CHART.oil, CHART.xg, CHART.water, CHART.steam][k] }))]
    return list.map(r => { const o = simulate(r.i); return { name: r.name, color: r.color, cop: +(o.cop).toFixed(3), cwp: +o.cwp.toFixed(3), oilCut: +o.oilCut.toFixed(2), heatPerOil: +o.heatPerOil.toFixed(3) } })
  }, [inputs])
  const meta = { cop: ['Cumulative oil', '×10³ bbl'], cwp: ['Cumulative water', '×10³ bbl'], oilCut: ['Oil cut', '%'], heatPerOil: ['Energy intensity', 'MMBtu/d per 10³ bbl'] }[metric]
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="text-[12px] text-[var(--ink-2)]">{meta[0]} <span className="text-[var(--ink-3)]">({meta[1]})</span> across operating strategies</div>
        <Segmented size="sm" ariaLabel="Comparison metric" value={metric} onChange={setMetric} options={[{ value: 'cop', label: 'Oil' }, { value: 'cwp', label: 'Water' }, { value: 'oilCut', label: 'Oil cut' }, { value: 'heatPerOil', label: 'Energy' }]} />
      </div>
      <div className="h-[250px]">
        <ResponsiveContainer>
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 60, bottom: 4, left: 8 }} barCategoryGap={8}>
            <CartesianGrid stroke="rgba(148,170,210,0.08)" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#6b7890', fontSize: 11 }} stroke="rgba(148,170,210,0.2)" />
            <YAxis type="category" dataKey="name" width={140} tick={{ fill: '#a9b4c8', fontSize: 12 }} stroke="rgba(148,170,210,0.2)" />
            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} content={({ active, payload }) => active && payload?.[0] ? (
              <div className="glass rounded-xl p-3 text-[12px]"><div className="text-white font-medium">{(payload[0].payload as any).name}</div><div className="text-[var(--ink-2)]">{meta[0]}: <b className="num text-white">{payload[0].value as number}</b> {meta[1]}</div></div>
            ) : null} />
            <Bar dataKey={metric} radius={[0, 4, 4, 0]} isAnimationActive animationDuration={500}>
              {rows.map(r => <RCell key={r.name} fill={r.color} stroke="#0a1120" strokeWidth={2} />)}
              <LabelList dataKey={metric} position="right" style={{ fill: '#a9b4c8', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Note>&ldquo;High-energy steam&rdquo; and &ldquo;Proxy optimum&rdquo; can tie on oil because both reach the ensemble ceiling — the Energy view separates them. That trade-off (similar oil, very different heat bill) is the field-scale echo of the laboratory finding.</Note>
    </div>
  )
}
