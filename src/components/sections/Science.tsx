'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot, ReferenceLine } from 'recharts'
import { Flame, FlaskConical, Wind, Layers } from 'lucide-react'
import { SectionHeader, Reveal, Slider, Segmented, Note } from '../ui'
import { oilViscosityCp, VISCOSITY_NOTE, mobilityRatio, capillaryNumber, residualOilFraction } from '../../lib/physics'
import { CRUDE, FLUIDS, CHART } from '../../lib/labData'

export default function Science() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-10">
      <SectionHeader as="h1" eyebrow="The physics, interactively" title={<>Three numbers explain <span className="text-gradient">why hot chemistry works</span>.</>}>
        Heavy oil stays in the rock for three reasons: it is too viscous, the injected fluid bypasses it, and capillary forces trap what is left. Heat attacks the first, polymer the second, and alkali-generated surfactant the third. Move the sliders to see each effect.
      </SectionHeader>
      <div className="mt-10 grid gap-5">
        <Reveal><ViscosityCard /></Reveal>
        <div className="grid gap-5 lg:grid-cols-2">
          <Reveal><MobilityCard /></Reveal>
          <Reveal delay={0.06}><CapillaryCard /></Reveal>
        </div>
        <Reveal><StagesCard /></Reveal>
      </div>
    </div>
  )
}

function CardHead({ n, title, sub, color }: { n: string; title: string; sub: string; color: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="num text-[12px] w-8 h-8 rounded-lg grid place-items-center flex-none" style={{ background: `${color}22`, color }}>{n}</div>
      <div>
        <div className="font-display text-[20px] font-semibold text-white leading-tight">{title}</div>
        <div className="text-[13px] text-[var(--ink-3)] mt-0.5">{sub}</div>
      </div>
    </div>
  )
}

// ── 1 Viscosity ─────────────────────────────────────────────────────────────
function ViscosityCard() {
  const [T, setT] = useState(80)
  const data = useMemo(() => Array.from({ length: 47 }, (_, k) => { const t = 25 + k * 2.5; return { t, mu: +oilViscosityCp(t).toFixed(2) } }), [])
  const mu = oilViscosityCp(T)
  const red = (1 - mu / CRUDE.viscosityCp) * 100
  return (
    <div className="panel p-6 grid lg:grid-cols-[1fr_1.5fr] gap-6">
      <div>
        <CardHead n="01" title="Heat collapses viscosity" sub="Dead-oil viscosity of the 16.79 °API sample vs temperature" color={CHART.steam} />
        <Slider label="Oil temperature" value={T} min={25} max={140} step={1} unit="°C" color="#ff6a3a" onChange={setT} />
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="rounded-xl p-4 bg-white/[0.03] border border-[var(--line)]">
            <div className="text-[11px] text-[var(--ink-3)]">Viscosity at {T} °C</div>
            <div className="num text-[30px] text-white font-semibold leading-tight">{mu < 10 ? mu.toFixed(1) : mu.toFixed(0)}<span className="text-[14px] text-[var(--ink-3)] ml-1">cP</span></div>
          </div>
          <div className="rounded-xl p-4 bg-white/[0.03] border border-[var(--line)]">
            <div className="text-[11px] text-[var(--ink-3)]">Reduction vs 29 °C</div>
            <div className="num text-[30px] text-white font-semibold leading-tight">{red.toFixed(1)}<span className="text-[14px] text-[var(--ink-3)] ml-1">%</span></div>
          </div>
        </div>
        <p className="text-[13px] leading-relaxed text-[var(--ink-2)] mt-5">Most of the benefit arrives early. Going from 29 °C to 80 °C removes about 97 % of the viscosity. Pushing on to 120 °C gains little more oil mobility but costs a great deal of extra heat. This is why the optimum sits near 80 °C.</p>
      </div>
      <div>
        <div className="h-[300px]">
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 10, right: 20, bottom: 22, left: 0 }}>
              <CartesianGrid stroke="rgba(148,170,210,0.08)" />
              <XAxis dataKey="t" type="number" domain={[25, 140]} ticks={[29, 50, 80, 100, 120, 140]} tick={{ fill: '#6b7890', fontSize: 11 }} stroke="rgba(148,170,210,0.2)" label={{ value: 'Temperature (°C)', position: 'bottom', offset: 4, fill: '#6b7890', fontSize: 11 }} />
              <YAxis scale="log" domain={[2, 600]} ticks={[3, 10, 30, 100, 300]} tick={{ fill: '#6b7890', fontSize: 11 }} stroke="rgba(148,170,210,0.2)" width={40} allowDataOverflow />
              <Tooltip content={({ active, payload }) => active && payload?.[0] ? <div className="glass rounded-xl px-3 py-2 text-[12px] text-[var(--ink-2)]"><b className="num text-white">{(payload[0].payload as any).mu} cP</b> at {(payload[0].payload as any).t} °C</div> : null} />
              <ReferenceLine x={T} stroke="#ff6a3a" strokeDasharray="3 3" />
              <Line dataKey="mu" stroke={CHART.steam} strokeWidth={2} dot={false} isAnimationActive={false} />
              <ReferenceDot x={29} y={CRUDE.viscosityCp} r={6} fill="#fff" stroke="#0a1120" strokeWidth={2} label={{ value: 'Measured 438 cP', position: 'right', fill: '#a9b4c8', fontSize: 11 }} />
              <ReferenceDot x={T} y={Math.max(2, mu)} r={6} fill={CHART.steam} stroke="#0a1120" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[11px] text-[var(--ink-3)]">{VISCOSITY_NOTE} Log scale.</p>
      </div>
    </div>
  )
}

// ── 2 Mobility ratio with animated fingering ────────────────────────────────
function MobilityCard() {
  const [T, setT] = useState(80)
  const [fluid, setFluid] = useState<'brine' | 'DPFA' | 'XG'>('XG')
  const muD = fluid === 'XG' ? FLUIDS[1].viscosityCp : fluid === 'DPFA' ? FLUIDS[0].viscosityCp : 0.02939 * Math.exp(507.88 / (T + 273.15 - 149.3))
  const M = mobilityRatio(oilViscosityCp(T), muD)
  const ins = Math.max(0, Math.min(1, Math.log10(M) / 2))
  return (
    <div className="panel p-6 h-full flex flex-col">
      <CardHead n="02" title="Mobility ratio controls sweep" sub="M = (k/μ)displacing ÷ (k/μ)oil — below 1 is favourable" color={CHART.xg} />
      <div className="flex flex-col gap-4">
        <Segmented ariaLabel="Displacing fluid" value={fluid} onChange={setFluid} options={[{ value: 'brine', label: 'Hot brine' }, { value: 'DPFA', label: 'Palm-ash alkali' }, { value: 'XG', label: 'Xanthan polymer' }]} />
        <Slider label="Temperature" value={T} min={29} max={120} step={1} unit="°C" color="#2dd4a8" onChange={setT} />
      </div>
      <Fingering instability={ins} color={fluid === 'XG' ? CHART.xg : fluid === 'DPFA' ? CHART.dpfa : CHART.water} />
      <div className="flex items-end justify-between mt-3">
        <div>
          <div className="text-[11px] text-[var(--ink-3)]">Mobility ratio</div>
          <div className="num text-[28px] text-white font-semibold leading-tight">{M < 10 ? M.toFixed(2) : M.toFixed(0)}</div>
        </div>
        <div className={`text-[12px] font-medium px-3 py-1.5 rounded-full ${M <= 1 ? 'bg-[#1aa883]/15 text-[#4fe0b5]' : M < 10 ? 'bg-[#d9a441]/15 text-[#f5c06a]' : 'bg-[#e8553a]/15 text-[#ff8a6a]'}`}>
          {M <= 1 ? '✓ Stable, piston-like' : M < 10 ? '◐ Mildly unstable' : '✕ Severe fingering'}
        </div>
      </div>
      <div className="mt-4"><Note>Uses measured fluid viscosities (29 °C) and equal end-point relative permeabilities. Brine viscosity follows a Vogel fit of water vs temperature.</Note></div>
    </div>
  )
}

function Fingering({ instability, color }: { instability: number; color: string }) {
  const [t, setT] = useState(0)
  const raf = useRef(0)
  useEffect(() => {
    let start = performance.now()
    const loop = (now: number) => { const u = ((now - start) / 5000) % 1; setT(u); raf.current = requestAnimationFrame(loop) }
    raf.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf.current)
  }, [])
  const W = 400, H = 120
  const front = t * W * 0.95
  const pts: string[] = []
  const n = 60
  for (let k = 0; k <= n; k++) {
    const y = (k / n) * H
    const f = Math.sin(k * 0.9) * 0.6 + Math.sin(k * 0.37 + 1) * 0.4
    const x = Math.max(0, front + instability * front * 0.55 * Math.max(-0.4, f))
    pts.push(`${Math.min(W, x).toFixed(1)},${y.toFixed(1)}`)
  }
  const path = `M0,0 L${pts.join(' L')} L0,${H} Z`
  return (
    <div className="mt-5 rounded-xl overflow-hidden border border-[var(--line)]" aria-label="Animated displacement front">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-[120px] block">
        <defs>
          <linearGradient id="oilg" x1="0" x2="1"><stop offset="0" stopColor="#3a1c05" /><stop offset="1" stopColor="#5a2a06" /></linearGradient>
          <pattern id="grains" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="1.2" fill="rgba(255,255,255,0.06)" /></pattern>
        </defs>
        <rect width={W} height={H} fill="url(#oilg)" />
        <path d={path} fill={color} opacity={0.85} />
        <rect width={W} height={H} fill="url(#grains)" />
        <text x={8} y={H - 8} fill="#0a1120" fontSize="11" fontWeight={600}>injectant →</text>
        <text x={W - 8} y={14} fill="#c9a77a" fontSize="11" textAnchor="end">oil</text>
      </svg>
    </div>
  )
}

// ── 3 Capillary number ──────────────────────────────────────────────────────
function CapillaryCard() {
  const [lv, setLv] = useState(-5) // log10 m/s
  const [mu, setMu] = useState(1) // cP
  const [lift, setLift] = useState(1.5) // log10 mN/m
  const nc = capillaryNumber(10 ** lv, mu / 1000, 10 ** lift / 1000)
  const data = useMemo(() => Array.from({ length: 61 }, (_, k) => { const x = -8 + k * 0.1; return { x, s: +(residualOilFraction(10 ** x) * 100).toFixed(1) } }), [])
  const lnc = Math.log10(nc)
  return (
    <div className="panel p-6 h-full flex flex-col">
      <CardHead n="03" title="Capillary number frees trapped oil" sub="Nc = v·μ / σ — raise it 1000× to mobilise residual oil" color={CHART.dpfa} />
      <div className="flex flex-col gap-3">
        <Slider label="Darcy velocity" value={lv} min={-6} max={-3} step={0.1} color="#a78bfa" onChange={setLv} format={v => `10^${v.toFixed(1)}`} unit="m/s" />
        <Slider label="Injectant viscosity" value={mu} min={0.3} max={30} step={0.1} color="#a78bfa" onChange={setMu} format={v => v.toFixed(1)} unit="cP" />
        <Slider label="Interfacial tension σ" value={lift} min={-3} max={1.5} step={0.05} color="#a78bfa" onChange={setLift} format={v => (10 ** v < 1 ? (10 ** v).toFixed(3) : (10 ** v).toFixed(1))} unit="mN/m" help="Brine–crude IFT is typically ~30 mN/m. Alkali reacting with acidic crude generates soaps that can drive it below 0.01 mN/m." />
      </div>
      <div className="h-[170px] mt-4">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 18, left: 0 }}>
            <CartesianGrid stroke="rgba(148,170,210,0.08)" />
            <XAxis dataKey="x" type="number" domain={[-8, -2]} ticks={[-8, -7, -6, -5, -4, -3, -2]} tickFormatter={v => `1e${v}`} tick={{ fill: '#6b7890', fontSize: 10 }} stroke="rgba(148,170,210,0.2)" label={{ value: 'Capillary number', position: 'bottom', offset: 2, fill: '#6b7890', fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fill: '#6b7890', fontSize: 10 }} stroke="rgba(148,170,210,0.2)" width={34} unit="%" />
            <Line dataKey="s" stroke={CHART.dpfa} strokeWidth={2} dot={false} isAnimationActive={false} />
            <ReferenceDot x={Math.max(-8, Math.min(-2, lnc))} y={residualOilFraction(nc) * 100} r={6} fill="#fff" stroke={CHART.dpfa} strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-end justify-between">
        <div><div className="text-[11px] text-[var(--ink-3)]">Nc</div><div className="num text-[24px] text-white font-semibold">{nc.toExponential(1)}</div></div>
        <div className="text-right"><div className="text-[11px] text-[var(--ink-3)]">Residual oil remaining</div><div className="num text-[24px] text-white font-semibold">{(residualOilFraction(nc) * 100).toFixed(0)}%</div></div>
      </div>
      <div className="mt-3"><Note>A generic capillary-desaturation curve for teaching. IFT was not measured in this study, which makes it a priority for the master&apos;s phase.</Note></div>
    </div>
  )
}

// ── 4 Recovery stages & EOR family ──────────────────────────────────────────
function StagesCard() {
  const stages = [
    { n: 'Primary', v: 10, d: 'Natural reservoir energy', c: '#6b7890' },
    { n: 'Secondary', v: 30, d: 'Water / gas injection', c: CHART.water },
    { n: 'Tertiary (EOR)', v: 70, d: 'Thermal, chemical, miscible', c: CHART.oil },
  ]
  return (
    <div className="panel p-6 grid lg:grid-cols-[1fr_1.2fr] gap-8">
      <div>
        <CardHead n="04" title="Where EOR fits" sub="Typical recoverable fraction of oil in place by stage (Sheng 2010; Hassan 2022)" color={CHART.oil} />
        <div className="flex flex-col gap-4 mt-2">
          {stages.map((s, k) => (
            <div key={s.n}>
              <div className="flex justify-between text-[12.5px] mb-1.5"><span className="text-white font-medium">{s.n} <span className="text-[var(--ink-3)] font-normal">· {s.d}</span></span><span className="num text-[var(--ink-2)]">up to {s.v}%</span></div>
              <div className="h-3 rounded-full bg-white/[0.04] overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ background: s.c }} initial={{ width: 0 }} whileInView={{ width: `${s.v}%` }} viewport={{ once: true }} transition={{ duration: 1.2, delay: k * 0.2, ease: [0.2, 0.7, 0.2, 1] }} />
              </div>
            </div>
          ))}
        </div>
        <p className="text-[13px] leading-relaxed text-[var(--ink-2)] mt-5">Secondary flooding was not even possible on this crude in the lab. At 438 cP, brine simply channels through. That is why the floods here are run directly as tertiary processes.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {[
          { i: <Flame size={16} />, c: CHART.steam, t: 'Thermal', items: ['Continuous steam flood', 'Cyclic steam (huff & puff)', 'SAGD', 'In-situ combustion'] },
          { i: <FlaskConical size={16} />, c: CHART.xg, t: 'Chemical', items: ['Alkali → in-situ soap (DPFA)', 'Polymer → mobility control (XG)', 'Surfactant → IFT reduction', 'ASP combinations'] },
          { i: <Wind size={16} />, c: CHART.water, t: 'Gas', items: ['CO₂ miscible / immiscible', 'Nitrogen', 'Natural gas', 'WAG'] },
          { i: <Layers size={16} />, c: CHART.oil, t: 'Hybrid · this work', items: ['Heated alkali', 'Heated polymer', 'Lower temperature than steam', 'Local, low-cost chemicals'], hl: true },
        ].map(g => (
          <div key={g.t} className={`rounded-2xl p-4 border ${g.hl ? 'border-[#f5a524]/50 bg-[#f5a524]/[0.06]' : 'border-[var(--line)] bg-white/[0.02]'}`}>
            <div className="flex items-center gap-2 mb-2.5"><span className="w-7 h-7 rounded-lg grid place-items-center" style={{ background: `${g.c}22`, color: g.c }}>{g.i}</span><span className="text-[14px] font-semibold text-white">{g.t}</span></div>
            <ul className="flex flex-col gap-1.5">
              {g.items.map(i => <li key={i} className="text-[12.5px] text-[var(--ink-2)] flex gap-2"><span className="text-[var(--ink-3)]">—</span>{i}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
