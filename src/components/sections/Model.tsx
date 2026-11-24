'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Copy, Github, FileText, AlertTriangle, Rocket, Users, Target } from 'lucide-react'
import { SectionHeader, Reveal } from '../ui'
import { TEAM, NIGER_DELTA_FIELDS } from '../../lib/labData'

const X_TABLE = [
  ['X1–X4', 'Producer bottom-hole pressures', '500 – 4000 psi', true],
  ['X5', 'Injection rate', '100 – 800 bbl/d', true],
  ['X6', 'Steam quality', '0.1 – 1.0', true],
  ['X7', 'Injection temperature', '60 – 120 °C', true],
  ['X8–X9', 'Injector grid location (i, j)', '1 – 10', true],
  ['X10–X17', 'Producer grid locations', '1 – 10', false],
] as const

const CITATION = `Madu, P. O., Chimezie, M., Onodu, F., Mmadu, D., & Eyinnaya, P. (2024). Enhancing heavy oil recovery in the Niger Delta through thermal-chemical methods: An experimental approach [B.Eng thesis, Federal University of Technology, Owerri]. Supervisor: Engr. J. E. Odo.`

export default function Model() {
  const [copied, setCopied] = useState(false)
  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-10">
      <SectionHeader as="h1" eyebrow="Methods & model card" title={<>What the simulator knows, <span className="text-gradient">and what it doesn’t</span>.</>}>
        A good proxy model is honest about where it applies. This page documents the data behind every number in the app, how the field-scale proxy was built, and where the research goes next.
      </SectionHeader>

      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        <Reveal className="lg:col-span-2">
          <div className="panel p-6 h-full">
            <div className="text-[16px] font-semibold text-white mb-1">Field-scale proxy · model card</div>
            <div className="text-[12.5px] text-[var(--ink-3)] mb-5">Surrogate of an Eclipse thermal simulation study of Niger Delta heavy oil (API 17–19, 20 % porosity)</div>
            <div className="grid sm:grid-cols-4 gap-3 mb-6">
              {[['150', 'Eclipse runs'], ['17', 'input variables'], ['0.60', 'best CV R² (reported)'], ['2', 'targets: COP, CWP']].map(([v, l]) => (
                <div key={l} className="rounded-xl p-3 bg-white/[0.03] border border-[var(--line)]">
                  <div className="num text-[24px] font-semibold text-white">{v}</div>
                  <div className="text-[11px] text-[var(--ink-3)]">{l}</div>
                </div>
              ))}
            </div>
            <table className="w-full text-[12.5px]">
              <thead><tr className="text-[var(--ink-3)]"><th className="text-left font-medium pb-2">Variable</th><th className="text-left font-medium pb-2">Meaning</th><th className="text-left font-medium pb-2">Range</th><th className="text-right font-medium pb-2">Active in app</th></tr></thead>
              <tbody>
                {X_TABLE.map(([x, m, r, on]) => (
                  <tr key={x} className="border-t border-[var(--line)]">
                    <td className="py-2 num text-[var(--oil)]">{x}</td>
                    <td className="py-2 text-white">{m}</td>
                    <td className="py-2 num text-[var(--ink-2)]">{r}</td>
                    <td className="py-2 text-right">{on ? <Check size={14} className="inline text-[#4fe0b5]" /> : <span className="text-[11px] text-[var(--ink-3)]">geometry only</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-5 grid sm:grid-cols-2 gap-3 text-[12.5px] leading-relaxed text-[var(--ink-2)]">
              <div className="rounded-xl p-4 bg-white/[0.02] border border-[var(--line)]">
                <div className="text-white font-medium mb-1">Response statistics</div>
                COP: mean 5.94, sd 1.47, range 2.72–8.85 (×10³ bbl)<br />CWP: mean 8.47, sd 1.48, range 5.63–11.88
              </div>
              <div className="rounded-xl p-4 bg-white/[0.02] border border-[var(--line)]">
                <div className="text-white font-medium mb-1">Feature ranking (RF, 500 trees)</div>
                Steam quality &gt; injection rate &gt; temperature &gt; producer BHPs &gt; well locations
              </div>
            </div>
            <p className="mt-4 text-[12px] leading-relaxed text-[var(--ink-3)]">
              In-browser engine: a third-order polynomial response surface whose coefficients reproduce the ensemble mean, range and feature ranking. It runs in microseconds so the 3D view can update live. The trained gradient-boosting model and the raw run table are in the companion repository.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.06}>
          <div className="panel p-6 h-full border-[#f5a524]/25">
            <div className="flex items-center gap-2 mb-4"><AlertTriangle size={16} className="text-[var(--oil)]" /><div className="text-[16px] font-semibold text-white">Limitations</div></div>
            <ul className="flex flex-col gap-3 text-[12.5px] leading-relaxed text-[var(--ink-2)]">
              {[
                'Laboratory floods used one core (A) and single runs per condition. There are no repeats, so no error bars yet.',
                'The proxy has no chemical-additive input. Hot-chemical benefits are shown at lab scale only, not yet upscaled.',
                'CV R² of 0.60 means roughly 40 % of run-to-run variance is unexplained. Treat outputs as screening estimates.',
                'Predictions are clamped to the training range. Combinations beyond it are flagged as extrapolation.',
                'The 3D saturation and temperature fields and time profiles are illustrative interpretations of end-of-run totals.',
                'Interfacial tension and relative permeability were not measured, so mobility ratios assume equal end-points.',
              ].map((l, k) => <li key={k} className="flex gap-2.5"><span className="num text-[10px] text-[var(--oil)] mt-[3px]">0{k + 1}</span>{l}</li>)}
            </ul>
          </div>
        </Reveal>
      </div>

      {/* roadmap */}
      <Reveal>
        <div className="panel p-6 mt-4">
          <div className="flex items-center gap-2 mb-1"><Rocket size={16} className="text-[var(--chem)]" /><div className="text-[16px] font-semibold text-white">Proposed master&apos;s research programme</div></div>
          <div className="text-[12.5px] text-[var(--ink-3)] mb-6">Each step closes one limitation above and moves the work from screening to decision-grade</div>
          <div className="relative grid md:grid-cols-4 gap-4">
            <div className="hidden md:block absolute top-4 left-4 right-4 h-px bg-gradient-to-r from-[var(--chem)] via-[var(--oil)] to-[var(--steam)] opacity-40" />
            {[
              { p: 'Phase 1', t: 'Repeatable lab programme', d: 'Triplicate floods on both cores. Add IFT (spinning-drop) and rheology vs temperature for DPFA/XG. Run a XG + DPFA blend (alkali–polymer).' },
              { p: 'Phase 2', t: 'Chemical-aware simulation', d: 'Add polymer viscosity and IFT tables to the thermal model (CMG STARS / Eclipse 500 thermal). History-match each core flood.' },
              { p: 'Phase 3', t: 'Physics-informed proxy', d: 'Latin-hypercube ensemble with chemical concentration and temperature as inputs. Gradient boosting / GP with uncertainty and SHAP explanations.' },
              { p: 'Phase 4', t: 'Techno-economics & CO₂', d: 'NPV, chemical and fuel cost, and CO₂ intensity per barrel. Optimise for profit and emissions on a real Niger Delta field such as Ugheli East or Kokori.' },
            ].map((s, k) => (
              <motion.div key={s.p} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: k * 0.1 }} className="relative">
                <div className="w-8 h-8 rounded-full grid place-items-center bg-[var(--surface-2)] border border-[var(--line-strong)] num text-[11px] text-white relative z-10 mb-3">{k + 1}</div>
                <div className="eyebrow">{s.p}</div>
                <div className="text-[14.5px] font-semibold text-white mt-1">{s.t}</div>
                <p className="text-[12.5px] leading-relaxed text-[var(--ink-2)] mt-1.5">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Reveal>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Reveal>
          <div className="panel p-6 h-full">
            <div className="flex items-center gap-2 mb-4"><Target size={16} className="text-[var(--water)]" /><div className="text-[16px] font-semibold text-white">Target fields (Table 2.1)</div></div>
            <table className="w-full text-[12.5px]">
              <thead><tr className="text-[var(--ink-3)]"><th className="text-left font-medium pb-2">Field</th><th className="text-right font-medium pb-2">API</th><th className="text-right font-medium pb-2">Terrain</th></tr></thead>
              <tbody>{NIGER_DELTA_FIELDS.map(f => <tr key={f.field} className="border-t border-[var(--line)]"><td className="py-1.5 text-white">{f.field}</td><td className="py-1.5 text-right num text-[var(--ink-2)]">{f.api}</td><td className="py-1.5 text-right text-[var(--ink-3)]">{f.terrain}</td></tr>)}</tbody>
            </table>
          </div>
        </Reveal>
        <Reveal delay={0.06}>
          <div className="panel p-6 h-full">
            <div className="flex items-center gap-2 mb-4"><Users size={16} className="text-[var(--violet)]" /><div className="text-[16px] font-semibold text-white">Research team</div></div>
            <div className="text-[14px] text-white font-medium">{TEAM.author}</div>
            <div className="text-[12px] text-[var(--ink-3)] mb-3">Lead author · simulator & proxy model</div>
            <div className="text-[12.5px] text-[var(--ink-2)] leading-relaxed">With {TEAM.group.join(', ')}.</div>
            <div className="mt-3 text-[12.5px] text-[var(--ink-2)]">Supervisor: <span className="text-white">{TEAM.supervisor}</span></div>
            <div className="mt-1 text-[12px] text-[var(--ink-3)]">{TEAM.institution}. {TEAM.labVenue}.</div>
          </div>
        </Reveal>
        <Reveal delay={0.12}>
          <div className="panel p-6 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4"><FileText size={16} className="text-[var(--oil)]" /><div className="text-[16px] font-semibold text-white">Cite & explore</div></div>
            <div className="text-[12px] leading-relaxed text-[var(--ink-2)] bg-white/[0.03] border border-[var(--line)] rounded-xl p-3">{CITATION}</div>
            <button onClick={() => { navigator.clipboard?.writeText(CITATION); setCopied(true); setTimeout(() => setCopied(false), 1800) }} className="focus-ring mt-2 self-start inline-flex items-center gap-1.5 text-[12px] text-[var(--ink-2)] hover:text-white">
              {copied ? <><Check size={13} className="text-[#4fe0b5]" /> Copied</> : <><Copy size={13} /> Copy citation</>}
            </button>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <a href="https://github.com/paulphysio/niger-delta-eor-proxy-model" target="_blank" rel="noopener noreferrer" className="focus-ring inline-flex items-center gap-2 text-[13px] text-white hover:text-[var(--oil)]"><Github size={15} /> Proxy-model repository →</a>
              <a href="https://www.researchgate.net/publication/410889149" target="_blank" rel="noopener noreferrer" className="focus-ring inline-flex items-center gap-2 text-[13px] text-white hover:text-[var(--oil)]"><FileText size={15} /> Publication on ResearchGate →</a>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  )
}
