// ─────────────────────────────────────────────────────────────────────────────
// Spatial field for the 3D reservoir view.
// The proxy predicts end-of-project totals only; this module distributes them
// in space and time with a simple, transparent front-advance model so the 3D
// view is consistent with the proxy outputs. It is a visual interpretation,
// not a finite-volume solution — the UI says so wherever it is shown.
// ─────────────────────────────────────────────────────────────────────────────
import { SimInputs, SimOutputs, producerCells } from './proxyModel'
import { RESERVOIR_TEMP_C, oilViscosityCp } from './physics'

export const NX = 10
export const NY = 10
export const NZ = 3 // layers, 0 = top
export const SOI = 0.71 // initial oil saturation (lab: OOIP / PV ≈ 9.9 / 13.92)
export const SOR = 0.15 // field-scale residual oil (illustrative)
export const PROJECT_YEARS = 10

export type FieldProperty = 'so' | 'temp' | 'visc'

export interface Cell {
  i: number; j: number; k: number
  so: number; temp: number; visc: number
  zone: 'steam' | 'hot-water' | 'virgin'
}

// Deterministic heterogeneity so the field looks geological but never flickers.
function hash(i: number, j: number, k: number) {
  const s = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453
  return s - Math.floor(s)
}
export function permMultiplier(i: number, j: number, k: number) {
  const channel = Math.exp(-((j - 4.5 - 1.6 * Math.sin(i * 0.6)) ** 2) / 6) * 0.35 // a meandering sand channel
  return 0.8 + 0.3 * hash(i, j, k) + channel - k * 0.05
}

/** Steam-zone radius (grid cells) for a layer at normalised time t ∈ [0, 1]. */
export function steamRadius(inputs: SimInputs, out: SimOutputs, t: number, k: number) {
  const drive = 0.45 * out.copNorm + 0.3 * inputs.steamQuality + 0.25 * (inputs.injectionRate / 800)
  const override = [1.18, 1.0, 0.72][k] // gravity override: steam rides the top of the sand
  return (1.0 + 5.4 * drive) * Math.sqrt(Math.max(0, t)) * override
}

export function computeField(inputs: SimInputs, out: SimOutputs, t: number): Cell[] {
  const ci = inputs.injI, cj = inputs.injJ
  const prods = producerCells(inputs)
  const avgBhp = (inputs.bhpP1 + inputs.bhpP2 + inputs.bhpP3 + inputs.bhpP4) / 4
  const pull = 0.25 * (1 - (avgBhp - 500) / 3500) // drawdown stretches the front toward producers
  const cells: Cell[] = []
  for (let k = 0; k < NZ; k++) {
    const rs = steamRadius(inputs, out, t, k)
    const hw = 1.4 + 1.6 * Math.sqrt(t) // hot condensate bank ahead of the steam
    for (let j = 1; j <= NY; j++) for (let i = 1; i <= NX; i++) {
      let d = Math.hypot(i - ci, j - cj)
      // stretch toward the nearest producer
      let best = Infinity, dir = 0
      for (const [pi, pj] of prods) {
        const dp = Math.hypot(i - pi, j - pj)
        if (dp < best) { best = dp; dir = dp }
      }
      const toward = Math.max(0, 1 - dir / 6)
      d = d * (1 - pull * toward) / Math.sqrt(permMultiplier(i, j, k))
      let so: number, temp: number, zone: Cell['zone']
      if (d <= rs) {
        const f = d / Math.max(rs, 1e-3)
        so = SOR + 0.06 * f
        temp = inputs.temperature - 6 * f
        zone = 'steam'
      } else if (d <= rs + hw) {
        const f = (d - rs) / hw
        so = SOR + 0.06 + (SOI - SOR - 0.06) * f * f
        temp = inputs.temperature - 6 - (inputs.temperature - 6 - RESERVOIR_TEMP_C) * f
        zone = 'hot-water'
      } else {
        so = SOI - 0.04 * hash(i, j, k + 9)
        temp = RESERVOIR_TEMP_C
        zone = 'virgin'
      }
      // producers drain their own cell a little
      if (best < 1.1) so = Math.max(SOR, so - 0.18 * Math.min(1, t * 3))
      temp = Math.max(RESERVOIR_TEMP_C, temp)
      cells.push({ i, j, k, so, temp, visc: oilViscosityCp(temp), zone })
    }
  }
  return cells
}

/**
 * Illustrative production profile: cumulative curves shaped by a decline
 * constant and water breakthrough, scaled so the year-10 value equals the
 * proxy's cumulative prediction exactly.
 */
export function productionProfile(inputs: SimInputs, out: SimOutputs, n = 41) {
  const k = 1.6 + 2.2 * (inputs.injectionRate / 800)
  const bt = 0.12 + 0.25 * (1 - inputs.injectionRate / 800) // breakthrough fraction of life
  const oilShape = (t: number) => (1 - Math.exp(-k * t)) / (1 - Math.exp(-k))
  const watShape = (t: number) => (t <= bt ? 0.12 * (t / bt) ** 2 : 0.12 + 0.88 * ((t - bt) / (1 - bt)) ** 1.25)
  const rows = []
  for (let s = 0; s < n; s++) {
    const t = s / (n - 1)
    const t2 = Math.min(1, t + 1 / (n - 1))
    const oil = out.cop * oilShape(t)
    const water = out.cwp * watShape(t)
    const dOil = out.cop * (oilShape(t2) - oilShape(t)) + 1e-9
    const dWat = out.cwp * (watShape(t2) - watShape(t))
    rows.push({
      year: +(t * PROJECT_YEARS).toFixed(2),
      oil: +oil.toFixed(3),
      water: +water.toFixed(3),
      waterCut: +((dWat / (dOil + dWat)) * 100).toFixed(1),
    })
  }
  return rows
}

// ── Colour maps (sRGB triples 0–1) ───────────────────────────────────────────
type RGB = [number, number, number]
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255]

export const RAMPS: Record<FieldProperty, { stops: string[]; label: string; unit: string; min: number; max: number; log?: boolean; lowLabel: string; highLabel: string }> = {
  so: { stops: ['#1d5fb8', '#2f9fd0', '#8fb8a0', '#d9a441', '#b8650c', '#5a2a06'], label: 'Oil saturation', unit: 'So', min: SOR, max: SOI, lowLabel: 'Swept', highLabel: 'Oil-rich' },
  temp: { stops: ['#1a1036', '#4a1c6b', '#962f6e', '#e8553a', '#f99a3a', '#fde58a'], label: 'Temperature', unit: '°C', min: RESERVOIR_TEMP_C, max: 120, lowLabel: 'Reservoir', highLabel: 'Steam' },
  visc: { stops: ['#fde58a', '#7fd17a', '#22a28a', '#2a6f97', '#363a7a', '#1e1235'], label: 'Oil viscosity', unit: 'cP', min: 5, max: 120, log: true, lowLabel: 'Mobile', highLabel: 'Viscous' },
}

export function rampColor(prop: FieldProperty, value: number): RGB {
  const r = RAMPS[prop]
  let f = r.log
    ? (Math.log(value) - Math.log(r.min)) / (Math.log(r.max) - Math.log(r.min))
    : (value - r.min) / (r.max - r.min)
  f = Math.max(0, Math.min(1, f))
  const seg = f * (r.stops.length - 1)
  const a = Math.floor(seg), b = Math.min(r.stops.length - 1, a + 1), m = seg - a
  const A = hex(r.stops[a]), B = hex(r.stops[b])
  return [A[0] + (B[0] - A[0]) * m, A[1] + (B[1] - A[1]) * m, A[2] + (B[2] - A[2]) * m]
}

export function cellValue(c: Cell, prop: FieldProperty) {
  return prop === 'so' ? c.so : prop === 'temp' ? c.temp : c.visc
}
