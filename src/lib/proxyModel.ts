// ─────────────────────────────────────────────────────────────────────────────
// Field-scale steam-flood proxy
// Response surface calibrated to the statistics of 150 Eclipse thermal runs
// (Niger Delta heavy oil, API 17–19, 20 % porosity).
//   COP: mean 5.94, sd 1.47, range 2.72 – 8.85  (×10³ bbl)
//   CWP: mean 8.47, sd 1.48, range 5.63 – 11.88 (×10³ bbl)
// Feature ranking (Random Forest, 500 trees): X6 steam quality > X5 rate >
// X7 temperature > X1–X4 producer BHP > X8–X17 well locations.
// ─────────────────────────────────────────────────────────────────────────────
import { heatInjectionMMBtuD } from './physics'

export interface SimInputs {
  steamQuality: number  // X6  0.1 – 1.0
  temperature: number   // X7  60 – 120 °C
  injectionRate: number // X5  100 – 800 bbl/d
  bhpP1: number         // X1  500 – 4000 psi
  bhpP2: number         // X2
  bhpP3: number         // X3
  bhpP4: number         // X4
  injI: number          // X8  injector i (1–10)
  injJ: number          // X9  injector j (1–10)
  p1I: number           // X10 producer-1 i (pattern geometry)
  p1J: number           // X11 producer-1 j
}

export interface SimOutputs {
  cop: number          // cumulative oil, ×10³ bbl
  cwp: number          // cumulative water, ×10³ bbl
  oilCut: number       // % of produced liquid that is oil
  waterCut: number     // %
  wor: number          // water–oil ratio
  copNorm: number      // 0–1 position in the Eclipse ensemble range
  cwpNorm: number
  heatMMBtuD: number   // heat injection rate
  heatPerOil: number   // MMBtu/d per ×10³ bbl COP — energy intensity
  saturated: boolean   // prediction hit the edge of the calibrated range
}

export type ParamKey = keyof SimInputs

export interface ParamMeta {
  key: ParamKey
  x: string
  label: string
  unit: string
  min: number
  max: number
  step: number
  group: 'injection' | 'producers' | 'placement'
  help: string
  inProxy: boolean
}

export const PARAMS: ParamMeta[] = [
  { key: 'steamQuality', x: 'X6', label: 'Steam quality', unit: '', min: 0.1, max: 1, step: 0.05, group: 'injection', inProxy: true,
    help: 'Mass fraction of vapour in the injected stream. Higher quality carries far more latent heat per barrel — the single strongest driver of oil recovery in the Eclipse ensemble.' },
  { key: 'temperature', x: 'X7', label: 'Injection temperature', unit: '°C', min: 60, max: 120, step: 5, group: 'injection', inProxy: true,
    help: 'Hotter injectant lowers crude viscosity (438 cP at 29 °C → ≈12 cP at 80 °C), improving mobility. Hot-chemical floods reached 98 % recovery at only 80 °C in the lab.' },
  { key: 'injectionRate', x: 'X5', label: 'Injection rate', unit: 'bbl/d', min: 100, max: 800, step: 25, group: 'injection', inProxy: true,
    help: 'Volumetric injection rate (cold-water equivalent). More rate accelerates the front but also raises water production and early breakthrough risk.' },
  { key: 'bhpP1', x: 'X1', label: 'Producer 1 BHP', unit: 'psi', min: 500, max: 4000, step: 100, group: 'producers', inProxy: true,
    help: 'Flowing bottom-hole pressure. Lower BHP = larger drawdown = more inflow, until sand/gas limits are reached.' },
  { key: 'bhpP2', x: 'X2', label: 'Producer 2 BHP', unit: 'psi', min: 500, max: 4000, step: 100, group: 'producers', inProxy: true, help: 'Flowing bottom-hole pressure of producer 2.' },
  { key: 'bhpP3', x: 'X3', label: 'Producer 3 BHP', unit: 'psi', min: 500, max: 4000, step: 100, group: 'producers', inProxy: true, help: 'Flowing bottom-hole pressure of producer 3.' },
  { key: 'bhpP4', x: 'X4', label: 'Producer 4 BHP', unit: 'psi', min: 500, max: 4000, step: 100, group: 'producers', inProxy: true, help: 'Flowing bottom-hole pressure of producer 4.' },
  { key: 'injI', x: 'X8', label: 'Injector i-index', unit: '', min: 1, max: 10, step: 1, group: 'placement', inProxy: true,
    help: 'Injector column on the 10 × 10 simulation grid. Central placement balances the pattern.' },
  { key: 'injJ', x: 'X9', label: 'Injector j-index', unit: '', min: 1, max: 10, step: 1, group: 'placement', inProxy: true,
    help: 'Injector row on the 10 × 10 simulation grid.' },
  { key: 'p1I', x: 'X10', label: 'Producer pattern i', unit: '', min: 1, max: 5, step: 1, group: 'placement', inProxy: false,
    help: 'Sets the five-spot spacing in the 3D view (producers mirror about the grid). Not an active input of this proxy build.' },
  { key: 'p1J', x: 'X11', label: 'Producer pattern j', unit: '', min: 1, max: 5, step: 1, group: 'placement', inProxy: false,
    help: 'Sets the five-spot spacing in the 3D view. Not an active input of this proxy build.' },
]

export const PARAM_BY_KEY = Object.fromEntries(PARAMS.map(p => [p.key, p])) as Record<ParamKey, ParamMeta>

export const COP_RANGE = { min: 2.72, max: 8.85, mean: 5.94 }
export const CWP_RANGE = { min: 5.63, max: 11.88, mean: 8.47 }

// ── Presets ───────────────────────────────────────────────────────────────────
export const DEFAULT_PARAMS: SimInputs = {
  steamQuality: 0.7, temperature: 80, injectionRate: 400,
  bhpP1: 2000, bhpP2: 2000, bhpP3: 2000, bhpP4: 2000,
  injI: 5, injJ: 5, p1I: 2, p1J: 2,
}

export const OPTIMAL_PARAMS: SimInputs = {
  steamQuality: 0.85, temperature: 100, injectionRate: 550,
  bhpP1: 1200, bhpP2: 1200, bhpP3: 1200, bhpP4: 1200,
  injI: 5, injJ: 5, p1I: 2, p1J: 2,
}

export const STEAM_ONLY: SimInputs = { ...DEFAULT_PARAMS, steamQuality: 1.0, temperature: 120 }

export const LOW_ENERGY: SimInputs = {
  ...DEFAULT_PARAMS, steamQuality: 0.55, temperature: 80, injectionRate: 350, bhpP1: 1000, bhpP2: 1000, bhpP3: 1000, bhpP4: 1000,
}

export const PRESETS = [
  { id: 'base', name: 'Base case', tag: '80 °C · SQ 0.70', inputs: DEFAULT_PARAMS, blurb: 'Field analogue of the 80 °C laboratory programme.' },
  { id: 'opt', name: 'Proxy optimum', tag: '100 °C · 1200 psi', inputs: OPTIMAL_PARAMS, blurb: 'Best combination found on the proxy optimisation map.' },
  { id: 'lean', name: 'Low-energy drawdown', tag: '80 °C · 1000 psi', inputs: LOW_ENERGY, blurb: 'Less heat, more drawdown — tests energy-efficient operation.' },
  { id: 'steam', name: 'High-energy steam', tag: '120 °C · SQ 1.0', inputs: STEAM_ONLY, blurb: 'Dry steam at maximum temperature — highest heat cost.' },
] as const

// ── Validation ───────────────────────────────────────────────────────────────
export function validateInputs(inputs: Partial<SimInputs>): SimInputs {
  const out: SimInputs = { ...DEFAULT_PARAMS }
  for (const p of PARAMS) {
    const v = inputs[p.key]
    if (typeof v === 'number' && Number.isFinite(v)) out[p.key] = Math.max(p.min, Math.min(p.max, v))
  }
  return out
}

const norm = (v: number, min: number, max: number) => Math.max(0, Math.min(1, (v - min) / (max - min)))

function features(i: SimInputs) {
  const sq = norm(i.steamQuality, 0.1, 1.0)
  const t = norm(i.temperature, 60, 120)
  const ir = norm(i.injectionRate, 100, 800)
  const avgP = (norm(i.bhpP1, 500, 4000) + norm(i.bhpP2, 500, 4000) + norm(i.bhpP3, 500, 4000) + norm(i.bhpP4, 500, 4000)) / 4
  const di = norm(i.injI, 1, 10)
  const dj = norm(i.injJ, 1, 10)
  const spatial = 0.1 * (1 - Math.abs(di - 0.5) - Math.abs(dj - 0.5))
  return { sq, t, ir, avgP, spatial }
}

/** Unclamped COP response surface (×10³ bbl). */
export function rawCOP(inputs: SimInputs): number {
  const { sq, t, ir, avgP, spatial } = features(inputs)
  return 5.94
    + 1.82 * sq + 0.91 * t + 0.64 * ir - 1.28 * avgP
    + 0.78 * sq * t + 0.44 * sq * ir - 0.31 * ir * avgP
    + 0.22 * sq * sq * t - 0.18 * avgP * avgP + 0.15 * t * ir
    + spatial
}

/** Unclamped CWP response surface (×10³ bbl). */
export function rawCWP(inputs: SimInputs): number {
  const { sq, t, ir, avgP } = features(inputs)
  return 8.47
    + 1.45 * ir + 0.68 * t - 0.82 * avgP
    + 0.35 * sq * ir + 0.28 * t * ir - 0.22 * sq * avgP
    + 0.18 * ir * ir - 0.14 * avgP * avgP
}

export const predictCOP = (i: SimInputs) => Math.min(COP_RANGE.max, Math.max(COP_RANGE.min, rawCOP(i)))
export const predictCWP = (i: SimInputs) => Math.min(CWP_RANGE.max, Math.max(CWP_RANGE.min, rawCWP(i)))

export function simulate(raw: SimInputs): SimOutputs {
  const inputs = validateInputs(raw)
  const rc = rawCOP(inputs)
  const rw = rawCWP(inputs)
  const cop = predictCOP(inputs)
  const cwp = predictCWP(inputs)
  const total = cop + cwp
  const heat = heatInjectionMMBtuD(inputs.injectionRate, inputs.temperature, inputs.steamQuality)
  return {
    cop, cwp,
    oilCut: (cop / total) * 100,
    waterCut: (cwp / total) * 100,
    wor: cwp / cop,
    copNorm: norm(cop, COP_RANGE.min, COP_RANGE.max),
    cwpNorm: norm(cwp, CWP_RANGE.min, CWP_RANGE.max),
    heatMMBtuD: heat,
    heatPerOil: heat / cop,
    saturated: rc > COP_RANGE.max || rc < COP_RANGE.min || rw > CWP_RANGE.max || rw < CWP_RANGE.min,
  }
}

/** One-at-a-time sensitivity: swing each active parameter ±10 % of its range. */
export function sensitivity(inputs: SimInputs, target: 'cop' | 'cwp' = 'cop') {
  const f = target === 'cop' ? rawCOP : rawCWP
  const base = f(inputs)
  return PARAMS.filter(p => p.inProxy).map(p => {
    const d = (p.max - p.min) * 0.1
    const hi = f({ ...inputs, [p.key]: Math.min(p.max, inputs[p.key] + d) })
    const lo = f({ ...inputs, [p.key]: Math.max(p.min, inputs[p.key] - d) })
    return { key: p.key, x: p.x, label: p.label, up: ((hi - base) / base) * 100, down: ((lo - base) / base) * 100 }
  }).sort((a, b) => Math.max(Math.abs(b.up), Math.abs(b.down)) - Math.max(Math.abs(a.up), Math.abs(a.down)))
}

/** Response map of COP across two parameters (others held), for the heat-map. */
export function responseGrid(inputs: SimInputs, xKey: ParamKey, yKey: ParamKey, n = 24) {
  const px = PARAM_BY_KEY[xKey], py = PARAM_BY_KEY[yKey]
  const cells: { x: number; y: number; v: number }[] = []
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const x = px.min + (px.max - px.min) * (i / (n - 1))
    const y = py.min + (py.max - py.min) * (j / (n - 1))
    cells.push({ x, y, v: predictCOP({ ...inputs, [xKey]: x, [yKey]: y }) })
  }
  return cells
}

/** Producer locations on the 10 × 10 grid (five-spot mirrored about the centre). */
export function producerCells(i: SimInputs): [number, number][] {
  const a = i.p1I, b = i.p1J
  return [[a, b], [11 - a, b], [a, 11 - b], [11 - a, 11 - b]]
}

// ── Saved scenarios (browser-local) ──────────────────────────────────────────
const KEY = 'eor-scenarios'
export function getScenarios(): Record<string, { inputs: SimInputs; timestamp: number }> {
  try {
    if (typeof window === 'undefined') return {}
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch { return {} }
}
export function saveScenario(name: string, inputs: SimInputs) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...getScenarios(), [name]: { inputs, timestamp: Date.now() } })) } catch {}
}
export function loadScenario(name: string): SimInputs | null {
  const s = getScenarios()[name]
  return s ? validateInputs(s.inputs) : null
}
export function deleteScenario(name: string) {
  try { const s = getScenarios(); delete s[name]; localStorage.setItem(KEY, JSON.stringify(s)) } catch {}
}
