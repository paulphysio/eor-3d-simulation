'use client'
import { Suspense, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, Thermometer, Waves, Gauge, Droplet, Flame, Tag } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell as RCell, ReferenceLine } from 'recharts'
import { FLOODS, FLUIDS, CORES, CRUDE, STEAM_PROPS, FloodRun, CHART } from '../../lib/labData'
import { floodDerived, oilViscosityCp, mobilityRatio, HEAT_NOTE, displacingViscosity, instability, recoveredAt } from '../../lib/physics'
import { SectionHeader, Reveal, Toggle, CanvasFallback, Note, InfoTip } from '../ui'

const CoreFloodScene = dynamic(() => import('../three/CoreFloodScene'), { ssr: false, loading: () => <CanvasFallback label="Assembling core-flood rig" /> })

const GROUPS: { title: string; keys: FloodRun['key'][] }[] = [
  { title: 'Hot chemical', keys: ['XG-80', 'XG-50', 'DPFA-80', 'DPFA-50'] },
  { title: 'Baselines', keys: ['STEAM-120', 'HW-80', 'HW-50'] },
]

export default function Laboratory() {
  const [key, setKey] = useState<FloodRun['key']>('XG-80')
  const run = FLOODS.find(f => f.key === key)!
  const [t, setT] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [labels, setLabels] = useState(true)

  useEffect(() => { setT(0); setPlaying(true) }, [key])
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setT(v => { const n = v + 0.01; if (n >= 1) { setPlaying(false); return 1 } return n }), 60)
    return () => clearInterval(id)
  }, [playing])

  const d = floodDerived(run)
  const M = run.method === 'Steam' ? null : mobilityRatio(oilViscosityCp(run.tempC), displacingViscosity(run))
  const ins = instability(run)
  const vol = recoveredAt(run, t)

  return (
    <div className="max-w-[1500px] mx-auto px-4 md:px-8 py-10">
      <SectionHeader as="h1" eyebrow="Laboratory evidence · Chapter 4" title={<>Seven core floods, <span className="text-gradient">one clear winner</span>.</>}>
        Tertiary floods on a 20 % porosity sandy-shale plug saturated with 16.79 °API Niger Delta crude. Pick a run to replay it. The displacement front's shape comes from the mobility ratio of the measured fluids, and the collected volume ends at the measured value.
      </SectionHeader>

      <div className="mt-8 grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)_300px]">
        {/* run picker */}
        <div className="panel p-3 flex flex-col gap-4">
          {GROUPS.map(g => (
            <div key={g.title}>
              <div className="eyebrow px-2 mb-2">{g.title}</div>
              <div className="flex flex-col gap-1">
                {g.keys.map(k => {
                  const f = FLOODS.find(x => x.key === k)!
                  const active = k === key
                  return (
                    <button key={k} onClick={() => setKey(k)} className={`focus-ring relative text-left px-3 py-2.5 rounded-xl transition-all ${active ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'}`}>
                      {active && <motion.span layoutId="run-ind" className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full" style={{ background: f.color }} />}
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[13px] ${active ? 'text-white font-semibold' : 'text-[var(--ink-2)]'}`}>{f.label}</span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                          <motion.div className="h-full rounded-full" style={{ background: f.color }} initial={{ width: 0 }} whileInView={{ width: `${f.recoveryPct}%` }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.1 }} />
                        </div>
                        <span className="num text-[11px] text-[var(--ink-2)] w-12 text-right">{f.recoveryPct.toFixed(1)}%</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 3D rig */}
        <div className="panel relative overflow-hidden h-[560px]">
          <Suspense fallback={<CanvasFallback />}>
            <CoreFloodScene run={run} t={t} labels={labels} />
          </Suspense>
          <div className="absolute z-20 top-3 left-3 glass rounded-xl px-3 py-2">
            <div className="text-[11px] text-[var(--ink-3)]">Now replaying</div>
            <div className="text-[14px] font-semibold text-white flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: run.color }} />{run.label}</div>
          </div>
          <div className="absolute z-20 top-3 right-3"><Toggle on={labels} onChange={setLabels} label="Labels" icon={<Tag size={12} />} /></div>
          <div className="absolute z-20 bottom-3 left-3 right-3 glass rounded-2xl px-3 py-2.5 flex items-center gap-3">
            <button onClick={() => { if (t >= 1) setT(0); setPlaying(p => !p) }} aria-label={playing ? 'Pause' : 'Play'} className="focus-ring w-10 h-10 flex-none rounded-xl bg-[var(--oil)] text-[#1a1004] grid place-items-center">{playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}</button>
            <button onClick={() => { setT(0); setPlaying(false) }} aria-label="Rewind" className="focus-ring w-8 h-8 rounded-lg grid place-items-center text-[var(--ink-2)] hover:text-white hover:bg-white/5"><RotateCcw size={14} /></button>
            <div className="flex-1">
              <div className="flex justify-between text-[11px] mb-0.5"><span className="text-[var(--ink-3)]">Flood progress</span><span className="num text-white">{vol.toFixed(2)} mL recovered</span></div>
              <input type="range" className="rng" aria-label="Flood progress" min={0} max={1} step={0.001} value={t} onChange={e => { setT(parseFloat(e.target.value)); setPlaying(false) }}
                style={{ ['--c' as string]: run.color, ['--track' as string]: `linear-gradient(90deg, ${run.color} ${t * 100}%, rgba(148,170,210,0.14) ${t * 100}%)` }} />
            </div>
          </div>
        </div>

        {/* readouts */}
        <div className="flex flex-col gap-3">
          <div className="panel p-4">
            <div className="eyebrow mb-1">Recovery efficiency</div>
            <div className="flex items-end gap-2">
              <AnimatePresence mode="wait">
                <motion.div key={run.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="font-display text-[48px] font-semibold text-white leading-none num">
                  {((vol / run.ooipCc) * 100).toFixed(1)}<span className="text-[22px] text-[var(--ink-3)]">%</span>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="text-[11.5px] text-[var(--ink-3)] mt-1">Measured final: <b className="text-white num">{run.recoveryPct.toFixed(2)} %</b> · Table {run.table}</div>
          </div>
          <div className="panel p-4 grid grid-cols-2 gap-3 text-[12px]">
            {[
              { i: <Thermometer size={13} />, k: 'Temperature', v: `${run.tempC} °C` },
              { i: <Waves size={13} />, k: 'Flow rate', v: `${run.flowRateMlMin} mL/min` },
              { i: <Gauge size={13} />, k: 'ΔP', v: `${run.diffPressurePsi} psi` },
              { i: <Droplet size={13} />, k: 'OOIP', v: `${run.ooipCc} cc` },
              { i: <Droplet size={13} />, k: 'Soi', v: d.soi.toFixed(3) },
              { i: <Droplet size={13} />, k: 'Sor (after)', v: d.sor.toFixed(3) },
              { i: <Flame size={13} />, k: 'Heat demand', v: `${d.heatKjKg.toFixed(0)} kJ/kg` },
              { i: <Gauge size={13} />, k: 'μ oil @ T', v: `${oilViscosityCp(run.tempC).toFixed(1)} cP` },
            ].map(r => (
              <div key={r.k}>
                <div className="flex items-center gap-1 text-[var(--ink-3)] text-[10.5px]">{r.i}{r.k}</div>
                <div className="num text-white text-[13px]">{r.v}</div>
              </div>
            ))}
          </div>
          <div className="panel p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[12.5px] font-semibold text-white">Front stability</div>
              <InfoTip side="bottom" width={250}>Mobility ratio M = μ<sub>oil</sub>(T) / μ<sub>displacing</sub>, assuming equal end-point relative permeabilities. M ≫ 1 means the injectant fingers through the oil. Xanthan&apos;s 23 cP viscosity is what stabilises the front.</InfoTip>
            </div>
            <div className="num text-[22px] text-white">{M === null ? 'n/a' : M < 10 ? M.toFixed(2) : M.toFixed(0)}<span className="text-[12px] text-[var(--ink-3)] ml-1.5">M</span></div>
            <div className="mt-2 h-2 rounded-full bg-gradient-to-r from-[#1aa883] via-[#d9a441] to-[#e8553a] relative">
              <motion.div className="absolute top-1/2 -mt-[7px] -ml-[7px] w-[14px] h-[14px] rounded-full bg-white border-2 border-[#0a1120]" animate={{ left: `${ins * 100}%` }} transition={{ type: 'spring', stiffness: 160, damping: 20 }} />
            </div>
            <div className="flex justify-between text-[10px] text-[var(--ink-3)] mt-1"><span>Piston-like</span><span>Viscous fingering</span></div>
            {run.method === 'Steam' && <div className="text-[11px] text-[var(--ink-3)] mt-2">Steam fronts are stabilised by condensation; gravity override dominates instead.</div>}
          </div>
        </div>
      </div>

      {/* charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Reveal>
          <div className="panel p-5 h-full">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[14px] font-semibold text-white">Recovery efficiency by flood</div>
              <span className="text-[11px] text-[var(--ink-3)]">% of OOIP · measured</span>
            </div>
            <div className="text-[12px] text-[var(--ink-3)] mb-3">Raising chemicals from 50 °C to 80 °C adds 3–8 points; brine alone stalls near 70–75 %.</div>
            <div className="h-[300px]">
              <ResponsiveContainer>
                <BarChart data={[...FLOODS].sort((a, b) => b.recoveryPct - a.recoveryPct)} layout="vertical" margin={{ top: 0, right: 56, bottom: 0, left: 8 }} barCategoryGap={6}>
                  <CartesianGrid stroke="rgba(148,170,210,0.08)" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: '#6b7890', fontSize: 11 }} stroke="rgba(148,170,210,0.2)" unit="%" />
                  <YAxis type="category" dataKey="label" width={170} tick={{ fill: '#a9b4c8', fontSize: 11.5 }} stroke="rgba(148,170,210,0.2)" />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} content={({ active, payload }) => active && payload?.[0] ? <FloodTip f={payload[0].payload as FloodRun} /> : null} />
                  <Bar dataKey="recoveryPct" radius={[0, 4, 4, 0]} onClick={(p: any) => setKey(p.key)} className="cursor-pointer">
                    {[...FLOODS].sort((a, b) => b.recoveryPct - a.recoveryPct).map(f => <RCell key={f.key} fill={f.color} stroke="#0a1120" strokeWidth={2} opacity={f.key === key ? 1 : 0.75} />)}
                    <LabelList dataKey="recoveryPct" position="right" formatter={(v: number) => `${v.toFixed(1)}%`} style={{ fill: '#a9b4c8', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="panel p-5 h-full">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[14px] font-semibold text-white">Heat needed per kg injected</div>
              <span className="text-[11px] text-[var(--ink-3)]">kJ/kg · derived</span>
            </div>
            <div className="text-[12px] text-[var(--ink-3)] mb-3">Steam pays for latent heat; a hot chemical solution only pays for its temperature rise.</div>
            <div className="h-[300px]">
              <ResponsiveContainer>
                <BarChart data={FLOODS.map(f => ({ ...f, heat: +floodDerived(f).heatKjKg.toFixed(0) })).sort((a, b) => a.heat - b.heat)} layout="vertical" margin={{ top: 0, right: 64, bottom: 0, left: 8 }} barCategoryGap={6}>
                  <CartesianGrid stroke="rgba(148,170,210,0.08)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#6b7890', fontSize: 11 }} stroke="rgba(148,170,210,0.2)" />
                  <YAxis type="category" dataKey="label" width={170} tick={{ fill: '#a9b4c8', fontSize: 11.5 }} stroke="rgba(148,170,210,0.2)" />
                  <ReferenceLine x={floodDerived(FLOODS.find(f => f.key === "XG-80")!).heatKjKg} stroke={CHART.xg} strokeDasharray="3 3" />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} content={({ active, payload }) => active && payload?.[0] ? <FloodTip f={payload[0].payload as FloodRun} /> : null} />
                  <Bar dataKey="heat" radius={[0, 4, 4, 0]}>
                    {FLOODS.map(f => ({ ...f, heat: floodDerived(f).heatKjKg })).sort((a, b) => a.heat - b.heat).map(f => <RCell key={f.key} fill={f.color} stroke="#0a1120" strokeWidth={2} />)}
                    <LabelList dataKey="heat" position="right" style={{ fill: '#a9b4c8', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">{HEAT_NOTE}</p>
          </div>
        </Reveal>
      </div>

      {/* tables */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Reveal>
          <DataTable title="Core plugs" source="Tables 4.10–4.11" head={['', 'Core A', 'Core B']} rows={[
            ['Length (cm)', CORES[0].lengthCm, CORES[1].lengthCm],
            ['Diameter (cm)', CORES[0].diameterCm, CORES[1].diameterCm],
            ['Bulk volume (cc)', CORES[0].bulkVolumeCc, CORES[1].bulkVolumeCc],
            ['Pore volume (cc)', CORES[0].poreVolumeCc, CORES[1].poreVolumeCc],
            ['Porosity (%)', CORES[0].porosityPct, CORES[1].porosityPct],
            ['Permeability (mD)', CORES[0].permeabilityMd, CORES[1].permeabilityMd],
            ['Grain density (g/cc)', CORES[0].densityGcc, CORES[1].densityGcc],
            ['Thermal cond. (W/m·K)', CORES[0].thermalConductivity, CORES[1].thermalConductivity],
          ]} />
        </Reveal>
        <Reveal delay={0.06}>
          <DataTable title="Fluids at 29 °C" source="Tables 4.12–4.15" head={['', 'Crude', 'DPFA', 'XG']} rows={[
            ['Density (kg/m³)', (CRUDE.specificGravity * 1000).toFixed(0), FLUIDS[0].densityKgM3, FLUIDS[1].densityKgM3],
            ['Viscosity (cP)', CRUDE.viscosityCp.toFixed(1), FLUIDS[0].viscosityCp, FLUIDS[1].viscosityCp],
            ['Kinematic (cSt)', CRUDE.kinematicViscosityCst.toFixed(1), FLUIDS[0].kinematicCst, FLUIDS[1].kinematicCst],
            ['pH', CRUDE.pH, FLUIDS[0].pH, FLUIDS[1].pH],
            ['API gravity', CRUDE.api, '—', '—'],
            ['Boiling point (°C)', '—', FLUIDS[0].boilingPointC, FLUIDS[1].boilingPointC],
          ]} />
        </Reveal>
        <Reveal delay={0.12}>
          <div className="panel p-5 h-full">
            <div className="flex items-center justify-between mb-3"><div className="text-[14px] font-semibold text-white">The local chemicals</div><span className="text-[11px] text-[var(--ink-3)]">Ch. 3</span></div>
            <div className="flex flex-col gap-3">
              {FLUIDS.map(f => (
                <div key={f.key} className="rounded-xl p-3 border border-[var(--line)] bg-white/[0.02]">
                  <div className="flex items-center gap-2 mb-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: f.color }} /><span className="text-[13px] font-semibold text-white">{f.name}</span><span className="text-[10.5px] text-[var(--ink-3)] ml-auto">{f.role}</span></div>
                  <p className="text-[12px] leading-relaxed text-[var(--ink-2)]">{f.description}</p>
                </div>
              ))}
              <div className="rounded-xl p-3 border border-[var(--line)] bg-white/[0.02]">
                <div className="flex items-center gap-2 mb-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: CHART.steam }} /><span className="text-[13px] font-semibold text-white">Steam benchmark</span></div>
                <p className="text-[12px] leading-relaxed text-[var(--ink-2)]">{STEAM_PROPS.tempC} °C, {STEAM_PROPS.qualityPct} % quality, {STEAM_PROPS.pressurePsi} psi, {STEAM_PROPS.rateMlMin} mL/min, {STEAM_PROPS.heatBtuLb} Btu/lb (Table 4.18).</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
      <div className="mt-4"><Note>FTIR (Figs 4.20–4.21): palm-frond ash shows hydroxyl, amine and aromatic groups; xanthan gum shows a carboxylic-acid band near 3050 cm⁻¹. Front-shape and recovery-versus-time animation are visual interpretations; only the final volumes are measured.</Note></div>
    </div>
  )
}

function FloodTip({ f }: { f: FloodRun }) {
  const d = floodDerived(f)
  return (
    <div className="glass rounded-xl p-3 text-[12px] min-w-[200px]">
      <div className="text-white font-medium mb-1.5 flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: f.color }} />{f.label}</div>
      {[['Recovery', `${f.recoveryPct.toFixed(2)} %`], ['Oil recovered', `${f.oilRecoveredMl} mL / ${f.ooipCc} cc`], ['Flow rate', `${f.flowRateMlMin} mL/min`], ['Heat demand', `${d.heatKjKg.toFixed(0)} kJ/kg`]].map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4 text-[var(--ink-2)]"><span>{k}</span><b className="num text-white font-medium">{v}</b></div>
      ))}
    </div>
  )
}

function DataTable({ title, source, head, rows }: { title: string; source: string; head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="panel p-5 h-full">
      <div className="flex items-center justify-between mb-3"><div className="text-[14px] font-semibold text-white">{title}</div><span className="text-[11px] text-[var(--ink-3)]">{source}</span></div>
      <table className="w-full text-[12px]">
        <thead><tr>{head.map((h, k) => <th key={k} className={`pb-2 font-medium text-[var(--ink-3)] ${k ? 'text-right' : 'text-left'}`}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, k) => (
            <tr key={k} className="border-t border-[var(--line)]">
              {r.map((c, j) => <td key={j} className={`py-1.5 ${j ? 'text-right num text-white' : 'text-[var(--ink-2)]'}`}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

