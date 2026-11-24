// ─────────────────────────────────────────────────────────────────────────────
// Engineering correlations used for derived (not measured) quantities.
// Each function states its assumptions so they can be shown in the UI.
// ─────────────────────────────────────────────────────────────────────────────
import { CRUDE, FLOODS, FLUIDS, FloodRun } from './labData'

export const RESERVOIR_TEMP_C = 55 // typical Niger Delta heavy-oil reservoir (~130 °F, Table 2.1)
export const LAB_AMBIENT_C = CRUDE.measuredAtC

const cToF = (c: number) => c * 9 / 5 + 32

/**
 * Dead-oil viscosity vs temperature — Beggs & Robinson (1975) form,
 *   log10(μ + 1) = A · T(°F)^-1.163
 * with A calibrated so the curve passes through the measured point
 * (438.0 cP at 29 °C, Table 4.13). Valid as a trend estimate only.
 */
const BR_EXP = -1.163
const BR_A = Math.log10(CRUDE.viscosityCp + 1) / Math.pow(cToF(CRUDE.measuredAtC), BR_EXP)

export function oilViscosityCp(tempC: number): number {
  const x = BR_A * Math.pow(cToF(tempC), BR_EXP)
  return Math.max(0.5, Math.pow(10, x) - 1)
}

export const VISCOSITY_NOTE = 'Beggs–Robinson dead-oil correlation, calibrated to the measured 438 cP at 29 °C (Table 4.13).'

/** Latent heat of vaporisation of water, Watson correlation (kJ/kg). */
export function latentHeatKjKg(tempC: number): number {
  const t = Math.min(tempC, 373)
  return 2257 * Math.pow((374 - t) / 274, 0.38)
}

/** Sensible heat of liquid water above a reference temperature (kJ/kg), cp ≈ 4.186. */
export function sensibleHeatKjKg(tempC: number, refC: number): number {
  return 4.186 * Math.max(0, tempC - refC)
}

/** Specific enthalpy added to injectant relative to a reference (kJ/kg). */
export function injectantEnthalpyKjKg(tempC: number, steamQuality: number, refC: number): number {
  return sensibleHeatKjKg(tempC, refC) + Math.max(0, Math.min(1, steamQuality)) * latentHeatKjKg(tempC)
}

export const KJKG_TO_BTULB = 0.429923

/**
 * Field heat-injection rate (MMBtu/d) using the cold-water-equivalent convention
 * (1 bbl CWE ≈ 350 lb), relative to reservoir temperature.
 */
export function heatInjectionMMBtuD(rateBblD: number, tempC: number, steamQuality: number): number {
  const btuLb = injectantEnthalpyKjKg(tempC, steamQuality, RESERVOIR_TEMP_C) * KJKG_TO_BTULB
  return (rateBblD * 350 * btuLb) / 1e6
}

/** Specific heat demand of each laboratory flood (kJ per kg injectant, from 29 °C ambient). */
export function labHeatDemand(run: FloodRun): number {
  const quality = run.method === 'Steam' ? 0.6 : 0 // Table 4.18: 60 % quality
  return injectantEnthalpyKjKg(run.tempC, quality, LAB_AMBIENT_C)
}

export const HEAT_NOTE = 'Heat per kg of injectant raised from 29 °C lab ambient. Liquids: cp = 4.186 kJ/kg·K (chemical solutions assumed water-like). Steam: sensible + 60 % × latent heat (Watson).'

/**
 * End-point mobility ratio M = λ_displacing / λ_oil = μ_oil / μ_displacing,
 * assuming equal end-point relative permeabilities (stated simplification).
 */
export function mobilityRatio(oilCp: number, displacingCp: number): number {
  return oilCp / Math.max(1e-3, displacingCp)
}

/** Capillary number Nc = v·μ / σ  (SI units: m/s, Pa·s, N/m). */
export function capillaryNumber(velocityMs: number, viscosityPaS: number, iftNm: number): number {
  return (velocityMs * viscosityPaS) / Math.max(1e-9, iftNm)
}

/**
 * Generic capillary-desaturation trend (illustrative): normalised residual oil
 * stays ~1 below a critical Nc (~1e-5) then falls towards 0 by ~1e-2.
 */
export function residualOilFraction(nc: number): number {
  const lg = Math.log10(Math.max(1e-10, nc))
  const t = (lg - -5) / (-2 - -5)
  if (t <= 0) return 1
  if (t >= 1) return 0.02
  return 1 - 0.98 * (t * t * (3 - 2 * t))
}

/** Derived per-flood metrics used in the laboratory section. */
export function floodDerived(run: FloodRun) {
  const heat = labHeatDemand(run)
  return {
    heatKjKg: heat,
    sor: (run.ooipCc - run.oilRecoveredMl) / run.poreVolumeCc, // residual oil saturation (fraction of PV)
    soi: run.ooipCc / run.poreVolumeCc,
    swi: run.swiCc / run.poreVolumeCc,
    recoveryPerHeat: run.recoveryPct / heat, // % RE per kJ/kg
  }
}

export const STEAM_RUN = FLOODS.find(f => f.key === 'STEAM-120')!
export const BEST_CHEM = FLOODS.find(f => f.key === 'XG-80')!

// ── Core-flood helpers (used by the 3D rig and the readouts) ─────────────────
export function displacingViscosity(run: FloodRun) {
  if (run.fluid === 'XG') return FLUIDS[1].viscosityCp
  if (run.fluid === 'DPFA') return FLUIDS[0].viscosityCp
  if (run.method === 'Steam') return 0.013
  // hot brine: water viscosity at temperature (Vogel fit)
  return 0.02939 * Math.exp(507.88 / (run.tempC + 273.15 - 149.3))
}

/** Front instability 0 (piston-like) → 1 (severe fingering) from the mobility ratio. */
export function instability(run: FloodRun) {
  if (run.method === 'Steam') return 0.3 // condensation stabilises the steam front
  const M = mobilityRatio(oilViscosityCp(run.tempC), displacingViscosity(run))
  return Math.max(0, Math.min(1, Math.log10(M) / 2))
}

/** Illustrative recovery path that ends exactly at the measured value. */
export const recoveredAt = (run: FloodRun, t: number) => run.oilRecoveredMl * (1 - Math.exp(-4.2 * t)) / (1 - Math.exp(-4.2))

