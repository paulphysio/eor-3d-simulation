// ─────────────────────────────────────────────────────────────────────────────
// Laboratory dataset — transcribed from the B.Eng thesis
// "Enhancing Heavy Oil Recovery in the Niger Delta through Thermal-Chemical
//  Methods: An Experimental Approach" (FUTO, July 2024), Chapter 4.
// Every number in this file is a measured value from Tables 4.10 – 4.19.
// Derived quantities are computed in physics.ts, never hard-coded here.
// ─────────────────────────────────────────────────────────────────────────────

export const CHART = {
  oil: '#c97f0e',
  water: '#2f86e0',
  steam: '#e8553a',
  xg: '#1aa883',
  dpfa: '#8b6cf0',
} as const

export interface CoreSample {
  id: 'A' | 'B'
  lengthCm: number
  diameterCm: number
  bulkVolumeCc: number
  dryWeightG: number
  densityGcc: number
  saturatedWeightG: number
  poreVolumeCc: number
  porosityPct: number
  permeabilityMd: number
  thermalConductivity: number // W/m·K
  rockType: string
}

/** Tables 4.10 & 4.11 */
export const CORES: CoreSample[] = [
  { id: 'A', lengthCm: 5.751, diameterCm: 3.753, bulkVolumeCc: 63.51, dryWeightG: 132.64, densityGcc: 2.09, saturatedWeightG: 145.74, poreVolumeCc: 12.84, porosityPct: 20.22, permeabilityMd: 60.28, thermalConductivity: 1.5, rockType: 'Sandy-shale' },
  { id: 'B', lengthCm: 5.585, diameterCm: 3.812, bulkVolumeCc: 63.74, dryWeightG: 115.39, densityGcc: 1.81, saturatedWeightG: 129.59, poreVolumeCc: 13.92, porosityPct: 21.83, permeabilityMd: 79.93, thermalConductivity: 1.53, rockType: 'Sandy-shale' },
]

/** Tables 4.12 & 4.13 — crude oil sample (measured at 29 °C) */
export const CRUDE = {
  specificGravity: 0.9542,
  api: 16.79,
  kinematicViscosityCst: 459.046,
  viscosityCp: 438.022,
  measuredAtC: 29,
  pH: 6.5,
}

export interface EorFluid {
  key: 'DPFA' | 'XG'
  name: string
  role: string
  description: string
  densityKgM3: number
  kinematicCst: number
  viscosityCp: number
  pH: number
  boilingPointC: number
  color: string
}

/** Tables 4.14 & 4.15 — locally sourced chemical EOR fluids (measured at 29 °C) */
export const FLUIDS: EorFluid[] = [
  {
    key: 'DPFA', name: 'Dissolved Palm Frond Ash', role: 'Alkali',
    description: 'Agricultural-waste alkali (pH 8.7). Reacts with acidic crude components to generate in-situ soaps that lower oil–water interfacial tension.',
    densityKgM3: 1100, kinematicCst: 0.9685, viscosityCp: 1.0653, pH: 8.7, boilingPointC: 86, color: CHART.dpfa,
  },
  {
    key: 'XG', name: 'Xanthan Gum', role: 'Polymer',
    description: 'Bio-polymer that thickens the displacing phase (23.3 cP, ~22× brine). Lowers the mobility ratio, suppresses viscous fingering and widens sweep.',
    densityKgM3: 1500, kinematicCst: 15.55, viscosityCp: 23.32, pH: 6.8, boilingPointC: 85, color: CHART.xg,
  },
]

export type FloodKey = 'DPFA-50' | 'XG-50' | 'DPFA-80' | 'XG-80' | 'HW-50' | 'HW-80' | 'STEAM-120'

export interface FloodRun {
  key: FloodKey
  label: string
  short: string
  method: 'Hot chemical' | 'Hot water' | 'Steam'
  fluid: string
  tempC: number
  flowRateMlMin: number
  diffPressurePsi: number
  poreVolumeCc: number
  ooipCc: number
  swiCc: number
  oilRecoveredMl: number
  recoveryPct: number
  color: string
  table: string
}

/** Tables 4.16, 4.17 and 4.19 — tertiary core-flood results (Core A set) */
export const FLOODS: FloodRun[] = [
  { key: 'HW-50', label: 'Hot water · 50 °C', short: 'HW 50', method: 'Hot water', fluid: 'Brine', tempC: 50, flowRateMlMin: 79.0, diffPressurePsi: 0.49, poreVolumeCc: 13.92, ooipCc: 9.92, swiCc: 4.0, oilRecoveredMl: 6.94, recoveryPct: 69.96, color: CHART.water, table: '4.19' },
  { key: 'HW-80', label: 'Hot water · 80 °C', short: 'HW 80', method: 'Hot water', fluid: 'Brine', tempC: 80, flowRateMlMin: 115.0, diffPressurePsi: 0.51, poreVolumeCc: 13.92, ooipCc: 9.83, swiCc: 4.09, oilRecoveredMl: 7.37, recoveryPct: 74.97, color: CHART.water, table: '4.19' },
  { key: 'DPFA-50', label: 'Palm-ash alkali · 50 °C', short: 'DPFA 50', method: 'Hot chemical', fluid: 'DPFA', tempC: 50, flowRateMlMin: 50.5, diffPressurePsi: 0.51, poreVolumeCc: 13.92, ooipCc: 9.87, swiCc: 4.05, oilRecoveredMl: 8.31, recoveryPct: 84.19, color: CHART.dpfa, table: '4.16' },
  { key: 'DPFA-80', label: 'Palm-ash alkali · 80 °C', short: 'DPFA 80', method: 'Hot chemical', fluid: 'DPFA', tempC: 80, flowRateMlMin: 61.6, diffPressurePsi: 0.6, poreVolumeCc: 13.92, ooipCc: 9.83, swiCc: 4.09, oilRecoveredMl: 9.1, recoveryPct: 92.57, color: CHART.dpfa, table: '4.17' },
  { key: 'XG-50', label: 'Xanthan polymer · 50 °C', short: 'XG 50', method: 'Hot chemical', fluid: 'XG', tempC: 50, flowRateMlMin: 61.07, diffPressurePsi: 0.57, poreVolumeCc: 13.92, ooipCc: 9.85, swiCc: 4.08, oilRecoveredMl: 9.35, recoveryPct: 94.97, color: CHART.xg, table: '4.16' },
  { key: 'XG-80', label: 'Xanthan polymer · 80 °C', short: 'XG 80', method: 'Hot chemical', fluid: 'XG', tempC: 80, flowRateMlMin: 60.38, diffPressurePsi: 0.66, poreVolumeCc: 13.92, ooipCc: 9.92, swiCc: 4.0, oilRecoveredMl: 9.71, recoveryPct: 97.89, color: CHART.xg, table: '4.17' },
  { key: 'STEAM-120', label: 'Steam · 120 °C (60% quality)', short: 'Steam 120', method: 'Steam', fluid: 'Steam', tempC: 120, flowRateMlMin: 135.0, diffPressurePsi: 0.56, poreVolumeCc: 13.92, ooipCc: 9.86, swiCc: 4.06, oilRecoveredMl: 9.66, recoveryPct: 97.97, color: CHART.steam, table: '4.19' },
]

/** Table 4.18 — injected steam properties */
export const STEAM_PROPS = {
  pressurePsi: 100,
  tempC: 120,
  rateMlMin: 135,
  qualityPct: 60,
  heatBtuLb: 850,
}

export const TEAM = {
  author: 'Paul Obinna Madu',
  group: ['Chimezie Michael', 'Onodu Fidelia', 'Mmadu Daniel', 'Eyinnaya Pedro'],
  supervisor: 'Engr. J. E. Odo',
  institution: 'Department of Petroleum Engineering, Federal University of Technology, Owerri',
  labVenue: 'Core-flood experiments conducted at UNIPORT',
  year: 2024,
}

/** Table 2.1 — selected Niger Delta heavy-oil fields (Odo, 2024; Evans et al., 2021) */
export const NIGER_DELTA_FIELDS = [
  { field: 'Ugheli East', api: '15.9', terrain: 'Onshore' },
  { field: 'Oweh', api: '16.7', terrain: 'Onshore' },
  { field: 'Ogini', api: '17.0', terrain: 'Onshore' },
  { field: 'Kokori', api: '17.4', terrain: 'Onshore' },
  { field: 'Sapele', api: '19.5–20.6', terrain: 'Onshore' },
  { field: 'Mosogar', api: '20.3', terrain: 'Onshore' },
  { field: 'Ebok', api: '15.1', terrain: 'Offshore' },
  { field: 'Bonga', api: '19.2', terrain: 'Offshore' },
]
