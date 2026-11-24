'use client'
import { Suspense, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { pathFor } from '../../lib/site'
import { motion } from 'framer-motion'
import { ArrowRight, FlaskConical, Droplets, Cpu, Box, Beaker, Layers, LineChart as LineIcon, Sparkles } from 'lucide-react'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, ZAxis } from 'recharts'
import { AnimatedNumber, SectionHeader, Reveal, CanvasFallback, Pill } from '../ui'
import { DEFAULT_PARAMS, simulate } from '../../lib/proxyModel'
import { FLOODS, CRUDE, CHART } from '../../lib/labData'
import { oilViscosityCp, labHeatDemand, HEAT_NOTE, STEAM_RUN, BEST_CHEM } from '../../lib/physics'

const ReservoirScene = dynamic(() => import('../three/ReservoirScene'), { ssr: false, loading: () => <CanvasFallback label="Building reservoir model" /> })

const heroOut = simulate(DEFAULT_PARAMS)

export default function Overview() {
  const router = useRouter()
  const go = (s: string) => router.push(pathFor(s))
  const [t, setT] = useState(0.15)
  useEffect(() => {
    const start = performance.now()
    const id = setInterval(() => {
      const u = ((performance.now() - start) / 22000) % 1
      setT(0.12 + 0.88 * (u < 0.85 ? u / 0.85 : 1))
    }, 120)
    return () => clearInterval(id)
  }, [])

  const heatRatio = labHeatDemand(STEAM_RUN) / labHeatDemand(BEST_CHEM)
  const mu80 = oilViscosityCp(80)

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative h-[calc(100vh-64px)] min-h-[640px] overflow-hidden">
        <div className="absolute inset-0">
          <Suspense fallback={<CanvasFallback />}>
            <ReservoirScene inputs={DEFAULT_PARAMS} outputs={heroOut} time={t} labels={false} autoRotate showcase cutaway={0.62} property="temp" />
          </Suspense>
        </div>
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[#04070d]/95 via-[#04070d]/45 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-48 pointer-events-none bg-gradient-to-t from-[#04070d] to-transparent" />

        <div className="relative z-10 h-full max-w-[1400px] mx-auto px-4 md:px-8 flex flex-col justify-center pointer-events-none">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }} className="max-w-2xl pointer-events-auto">
            <div className="flex flex-wrap gap-2 mb-6">
              <Pill><Sparkles size={12} /> Thermal–chemical hybrid EOR</Pill>
              <Pill color="var(--chem)">Laboratory + Eclipse + ML proxy</Pill>
            </div>
            <h1 className="font-display text-[44px] md:text-[68px] leading-[0.98] font-semibold text-white">
              Recovering Niger&nbsp;Delta heavy oil with <span className="text-gradient">hot chemistry</span>, not just heat.
            </h1>
            <p className="mt-6 text-[16px] md:text-[18px] leading-relaxed text-[var(--ink-2)] max-w-xl">
              A locally sourced xanthan-gum flood at <b className="text-white">80 °C</b> recovered <b className="text-white">97.9 %</b> of the oil in place — matching a 120 °C steam flood while needing about <b className="text-white">{heatRatio.toFixed(0)}× less heat</b> per kilogram injected. Explore the experiment, the physics and a field-scale 3D simulator built on it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => go('simulator')} className="focus-ring group inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--oil)] text-[#1a1004] font-semibold text-[14px] shadow-[0_10px_40px_-10px_rgba(245,165,36,0.7)] hover:brightness-110 transition">
                Launch 3D simulator <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button onClick={() => go('laboratory')} className="focus-ring inline-flex items-center gap-2 px-5 py-3 rounded-xl glass text-white font-medium text-[14px] hover:border-[var(--line-strong)] transition">
                <FlaskConical size={16} /> See the lab evidence
              </button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8 }} className="absolute bottom-8 left-4 right-4 md:left-8 md:right-8 max-w-[1400px] mx-auto grid grid-cols-2 md:grid-cols-5 gap-3 pointer-events-auto">
            {[
              { v: 97.89, d: 2, s: '%', l: 'Recovery · xanthan @ 80 °C', c: CHART.xg },
              { v: CRUDE.api, d: 2, s: '°API', l: 'Niger Delta crude sample', c: CHART.oil },
              { v: CRUDE.viscosityCp, d: 0, s: ' cP', l: `at 29 °C → ≈${mu80.toFixed(0)} cP at 80 °C`, c: CHART.steam },
              { v: heatRatio, d: 1, s: '×', l: 'less heat than steam / kg', c: CHART.water },
              { v: 150, d: 0, s: '', l: 'Eclipse runs behind the proxy', c: CHART.dpfa },
            ].map((k, i) => (
              <div key={i} className="glass rounded-2xl px-4 py-3">
                <div className="font-display text-[26px] md:text-[30px] font-semibold text-white leading-none">
                  <AnimatedNumber value={k.v} decimals={k.d} suffix={k.s} />
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-[var(--ink-3)]"><span className="w-1.5 h-1.5 rounded-full" style={{ background: k.c }} />{k.l}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Story ───────────────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-4 md:px-8 py-24">
        <SectionHeader eyebrow="The research in four steps" title={<>From a core plug in a lab to a <span className="text-gradient">field you can fly through</span>.</>}>
          Heavy oil makes up nearly 20 % of Niger Delta reserves, but at 438 cP it barely moves. This work tests whether cheap, local chemicals, gently heated, can do what expensive steam does.
        </SectionHeader>
        <div className="mt-12 grid md:grid-cols-4 gap-4">
          {[
            { i: <Droplets size={20} />, c: CHART.oil, t: 'The problem', d: '16.8 °API crude, 438 cP at 29 °C. Too viscous for waterflooding; steam works but burns fuel and money.' },
            { i: <Beaker size={20} />, c: CHART.xg, t: 'The idea', d: 'Heat locally sourced chemicals — palm-frond-ash alkali (DPFA) and xanthan-gum polymer — to 50 °C and 80 °C before injection.' },
            { i: <FlaskConical size={20} />, c: CHART.steam, t: 'The evidence', d: 'Seven tertiary core floods. Hot xanthan at 80 °C recovered 97.9 % of OOIP — on par with 120 °C steam (98.0 %).' },
            { i: <Cpu size={20} />, c: CHART.dpfa, t: 'The tool', d: 'Lab data calibrated an Eclipse thermal model; 150 runs trained a proxy that now drives this real-time 3D simulator.' },
          ].map((s, k) => (
            <Reveal key={k} delay={k * 0.08}>
              <div className="panel panel-hover p-6 h-full relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-25" style={{ background: s.c }} />
                <div className="w-10 h-10 rounded-xl grid place-items-center mb-5" style={{ background: `${s.c}22`, color: s.c }}>{s.i}</div>
                <div className="num text-[11px] text-[var(--ink-3)] mb-1">0{k + 1}</div>
                <div className="font-display text-[20px] font-semibold text-white mb-2">{s.t}</div>
                <p className="text-[13.5px] leading-relaxed text-[var(--ink-2)]">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Key finding chart ───────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-4 md:px-8 pb-24">
        <div className="grid lg:grid-cols-[1fr_1.35fr] gap-8 items-center">
          <SectionHeader eyebrow="Key finding" title={<>Same recovery.<br /><span className="text-gradient">A fraction of the heat.</span></>}>
            Every laboratory flood plotted by how much heat each kilogram of injectant needs against how much oil it recovered. Hot chemical floods sit in the efficient top-left corner. Steam reaches the same recovery only by paying for latent heat.
          </SectionHeader>
          <Reveal>
            <div className="panel p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[13px] font-medium text-white">Recovery efficiency vs specific heat demand</div>
                <div className="flex gap-3 text-[11px] text-[var(--ink-3)]">
                  {[['Hot water', CHART.water], ['DPFA', CHART.dpfa], ['Xanthan', CHART.xg], ['Steam', CHART.steam]].map(([n, c]) => (
                    <span key={n} className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: c }} />{n}</span>
                  ))}
                </div>
              </div>
              <div className="h-[340px]">
                <ResponsiveContainer>
                  <ScatterChart margin={{ top: 16, right: 24, bottom: 28, left: 4 }}>
                    <CartesianGrid stroke="rgba(148,170,210,0.08)" />
                    <XAxis type="number" dataKey="heat" name="Heat" unit="" scale="log" domain={[60, 2400]} ticks={[100, 200, 500, 1000, 2000]} tick={{ fill: '#6b7890', fontSize: 11 }} stroke="rgba(148,170,210,0.2)" label={{ value: 'Specific heat demand (kJ per kg injectant, log scale)', position: 'bottom', offset: 10, fill: '#6b7890', fontSize: 11 }} />
                    <YAxis type="number" dataKey="re" domain={[60, 100]} tick={{ fill: '#6b7890', fontSize: 11 }} stroke="rgba(148,170,210,0.2)" unit="%" width={44} />
                    <ZAxis range={[160, 160]} />
                    <Tooltip cursor={{ stroke: 'rgba(148,170,210,0.3)' }} content={({ active, payload }) => active && payload?.[0] ? (
                      <div className="glass rounded-xl p-3 text-[12px]">
                        <div className="text-white font-medium mb-1">{(payload[0].payload as any).label}</div>
                        <div className="text-[var(--ink-2)]">Recovery <b className="num text-white">{(payload[0].payload as any).re.toFixed(2)} %</b></div>
                        <div className="text-[var(--ink-2)]">Heat <b className="num text-white">{(payload[0].payload as any).heat.toFixed(0)} kJ/kg</b></div>
                      </div>
                    ) : null} />
                    {FLOODS.map(f => (
                      <Scatter key={f.key} data={[{ heat: labHeatDemand(f), re: f.recoveryPct, label: f.label, short: f.short }]} fill={f.color} stroke="#0a1120" strokeWidth={2} isAnimationActive={false}>
                        <LabelList dataKey="short" position="right" offset={10} style={{ fill: '#a9b4c8', fontSize: 11 }} />
                      </Scatter>
                    ))}
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-[var(--ink-3)] mt-2 leading-relaxed">Recovery: measured (Tables 4.16, 4.17, 4.19). Heat: derived — {HEAT_NOTE}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Pipeline ───────────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-4 md:px-8 pb-28">
        <SectionHeader eyebrow="Workflow" title="How the evidence becomes a simulator" />
        <div className="mt-10 relative">
          <div className="hidden md:block absolute top-[38px] left-[8%] right-[8%] h-px bg-gradient-to-r from-transparent via-[var(--line-strong)] to-transparent overflow-hidden">
            <motion.div className="h-px w-40 bg-gradient-to-r from-transparent via-[var(--oil)] to-transparent" animate={{ x: ['-10%', '900%'] }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { i: <FlaskConical size={20} />, t: 'Core flooding', d: '7 tertiary floods · 2 cores · 3 fluids · 50–120 °C', go: 'laboratory' },
              { i: <Layers size={20} />, t: 'Eclipse history match', d: 'Thermal model calibrated to lab recovery', go: 'model' },
              { i: <Box size={20} />, t: '150-run ensemble', d: '17 inputs: BHPs, rate, quality, temperature, well grid', go: 'model' },
              { i: <Cpu size={20} />, t: 'ML proxy', d: 'Surrogate predicts COP & CWP in microseconds', go: 'model' },
              { i: <LineIcon size={20} />, t: '3D simulator', d: 'Real-time what-if, sensitivity & optimisation', go: 'simulator' },
            ].map((s, k) => (
              <Reveal key={k} delay={k * 0.08}>
                <button onClick={() => go(s.go)} className="focus-ring group w-full text-left">
                  <div className="w-[76px] h-[76px] rounded-2xl panel grid place-items-center text-[var(--oil)] mx-auto md:mx-0 mb-4 group-hover:scale-105 group-hover:border-[#f5a524]/50 transition-all relative z-10">{s.i}</div>
                  <div className="font-display text-[16px] font-semibold text-white">{s.t}</div>
                  <div className="text-[12.5px] text-[var(--ink-3)] mt-1 leading-relaxed">{s.d}</div>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
