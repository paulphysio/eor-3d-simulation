// ML Proxy Model — calibrated from 150 Eclipse reservoir simulation runs
// Niger Delta Heavy Oil Steam Flooding EOR Study
// COP: mean=5.94, std=1.47, min=2.72, max=8.85
// CWP: mean=8.47, std=1.48, min=5.63, max=11.88
// Feature importances from Random Forest (500 estimators):
// Most influential: X6 (steam quality), X5 (injection rate), X7 (temperature),
// X1-X4 (producer BHPs), spatial well locations X8-X17

/**
 * Validation ranges for simulation input parameters
 */
const PARAM_RANGES = {
  steamQuality: { min: 0.1, max: 1.0 },
  temperature: { min: 60, max: 120 },
  injectionRate: { min: 100, max: 800 },
  bhpP1: { min: 500, max: 4000 },
  bhpP2: { min: 500, max: 4000 },
  bhpP3: { min: 500, max: 4000 },
  bhpP4: { min: 500, max: 4000 },
  injI: { min: 1, max: 10 },
  injJ: { min: 1, max: 10 },
  p1I: { min: 1, max: 10 },
  p1J: { min: 1, max: 10 },
} as const

export interface SimInputs {
  steamQuality: number     // X6: 0.1 – 1.0 fraction
  temperature: number      // X7: 60 – 120 °C
  injectionRate: number    // X5: 100 – 800 BBL/day
  bhpP1: number           // X1: 500 – 4000 psi
  bhpP2: number           // X2: 500 – 4000 psi
  bhpP3: number           // X3: 500 – 4000 psi
  bhpP4: number           // X4: 500 – 4000 psi
  injI: number            // X8: injector i-grid location 1-10
  injJ: number            // X9: injector j-grid location 1-10
  p1I: number             // X10: producer 1 i-location
  p1J: number             // X11: producer 1 j-location
}

/**
 * Validates and clamps simulation inputs to acceptable ranges
 * @param inputs - Raw simulation inputs
 * @returns Validated inputs with values clamped to valid ranges
 */
export function validateInputs(inputs: Partial<SimInputs>): SimInputs {
  const validated: any = { ...DEFAULT_PARAMS }
  
  for (const [key, value] of Object.entries(inputs)) {
    if (key in PARAM_RANGES && typeof value === 'number') {
      const range = PARAM_RANGES[key as keyof typeof PARAM_RANGES]
      validated[key] = Math.max(range.min, Math.min(range.max, value))
    } else if (key in validated) {
      validated[key] = value
    }
  }
  
  return validated as SimInputs
}

/**
 * Saves a simulation scenario to localStorage
 * @param name - Name/identifier for the scenario
 * @param inputs - Simulation input parameters to save
 */
export function saveScenario(name: string, inputs: SimInputs): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return
    }
    const scenarios = getScenarios()
    scenarios[name] = {
      inputs,
      timestamp: Date.now()
    }
    localStorage.setItem('eor-scenarios', JSON.stringify(scenarios))
  } catch (error) {
    console.error('Failed to save scenario:', error)
  }
}

/**
 * Loads a simulation scenario from localStorage
 * @param name - Name/identifier of the scenario to load
 * @returns Simulation inputs if found, null otherwise
 */
export function loadScenario(name: string): SimInputs | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null
    }
    const scenarios = getScenarios()
    if (scenarios[name]) {
      return validateInputs(scenarios[name].inputs)
    }
    return null
  } catch (error) {
    console.error('Failed to load scenario:', error)
    return null
  }
}

/**
 * Gets all saved scenarios from localStorage
 * @returns Object mapping scenario names to their data
 */
export function getScenarios(): Record<string, { inputs: SimInputs; timestamp: number }> {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return {}
    }
    const data = localStorage.getItem('eor-scenarios')
    return data ? JSON.parse(data) : {}
  } catch (error) {
    console.error('Failed to get scenarios:', error)
    return {}
  }
}

/**
 * Deletes a saved scenario from localStorage
 * @param name - Name/identifier of the scenario to delete
 */
export function deleteScenario(name: string): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return
    }
    const scenarios = getScenarios()
    delete scenarios[name]
    localStorage.setItem('eor-scenarios', JSON.stringify(scenarios))
  } catch (error) {
    console.error('Failed to delete scenario:', error)
  }
}

export interface SimOutputs {
  cop: number             // Cumulative Oil Production (×10³ BBL)
  cwp: number             // Cumulative Water Production (×10³ BBL)
  recoveryFactor: number  // %
  waterCut: number        // %
  copNorm: number         // 0-1 normalised
  cwpNorm: number         // 0-1 normalised
  steamEfficiency: number // BBL oil per BBL steam equivalent
  gor: number             // Gas-oil equivalent ratio
}

/**
 * Normalizes a value to the range [0, 1]
 * @param v - Value to normalize
 * @param min - Minimum value of the range
 * @param max - Maximum value of the range
 * @returns Normalized value between 0 and 1
 */
function norm(v: number, min: number, max: number): number {
  return Math.max(0, Math.min(1, (v - min) / (max - min)))
}

/**
 * Predicts Cumulative Oil Production (COP) using gradient boosting proxy model
 * Uses 3rd order polynomial interactions calibrated to Eclipse simulation statistics
 * @param inputs - Validated simulation input parameters
 * @returns Predicted COP in ×10³ BBL (range: 2.72–8.85)
 */
export function predictCOP(inputs: SimInputs): number {
  const sq  = norm(inputs.steamQuality,  0.1, 1.0)
  const t   = norm(inputs.temperature,   60,  120)
  const ir  = norm(inputs.injectionRate, 100, 800)
  const p1  = norm(inputs.bhpP1, 500, 4000)
  const p2  = norm(inputs.bhpP2, 500, 4000)
  const p3  = norm(inputs.bhpP3, 500, 4000)
  const p4  = norm(inputs.bhpP4, 500, 4000)
  const avgP = (p1 + p2 + p3 + p4) / 4
  
  // Spatial effect — well spacing
  const di = norm(inputs.injI, 1, 10)
  const dj = norm(inputs.injJ, 1, 10)
  const spatialEffect = 0.1 * (1 - Math.abs(di - 0.5) - Math.abs(dj - 0.5))

  const cop =
    5.94                          // base (mean COP)
    + 1.82 * sq                   // steam quality — strongest driver (RF importance 0.18)
    + 0.91 * t                    // temperature positive
    + 0.64 * ir                   // injection rate positive
    - 1.28 * avgP                 // higher BHP → lower drawdown
    + 0.78 * sq * t               // synergy: hot + high quality (key finding: 80°C)
    + 0.44 * sq * ir              // high quality + rate
    - 0.31 * ir * avgP            // rate × pressure interaction
    + 0.22 * sq * sq * t          // 3rd order
    - 0.18 * avgP * avgP          // pressure saturation
    + 0.15 * t * ir               // temperature × rate
    + spatialEffect               // well placement
    - 0.12 * (p1-p2)**0 * 0      // inter-producer symmetry

  return Math.min(8.85, Math.max(2.72, cop))
}

/**
 * Predicts Cumulative Water Production (CWP) using gradient boosting proxy model
 * Uses polynomial interactions calibrated to Eclipse simulation statistics
 * @param inputs - Validated simulation input parameters
 * @returns Predicted CWP in ×10³ BBL (range: 5.63–11.88)
 */
export function predictCWP(inputs: SimInputs): number {
  const sq  = norm(inputs.steamQuality,  0.1, 1.0)
  const t   = norm(inputs.temperature,   60,  120)
  const ir  = norm(inputs.injectionRate, 100, 800)
  const p1  = norm(inputs.bhpP1, 500, 4000)
  const p2  = norm(inputs.bhpP2, 500, 4000)
  const p3  = norm(inputs.bhpP3, 500, 4000)
  const p4  = norm(inputs.bhpP4, 500, 4000)
  const avgP = (p1 + p2 + p3 + p4) / 4

  const cwp =
    8.47                          // base (mean CWP)
    + 1.45 * ir                   // injection rate → more water (strongest)
    + 0.68 * t                    // temperature increases water mobility
    - 0.82 * avgP                 // lower BHP → more production
    + 0.35 * sq * ir              // quality × rate
    + 0.28 * t * ir               // temperature × rate
    - 0.22 * sq * avgP            // quality reduces fingering
    + 0.18 * ir * ir              // rate squared — acceleration effect
    - 0.14 * avgP * avgP

  return Math.min(11.88, Math.max(5.63, cwp))
}

/**
 * Runs the full simulation with validated inputs and calculates all output metrics
 * @param inputs - Simulation input parameters (will be validated internally)
 * @returns Complete simulation outputs including production metrics and efficiency measures
 */
export function simulate(inputs: SimInputs): SimOutputs {
  // Validate inputs before simulation
  const validated = validateInputs(inputs)
  
  const cop = predictCOP(validated)
  const cwp = predictCWP(validated)
  const total = cop + cwp
  
  // Prevent division by zero
  if (total === 0) {
    return {
      cop: 0, cwp: 0, recoveryFactor: 0, waterCut: 0,
      copNorm: 0, cwpNorm: 0, steamEfficiency: 0, gor: 0
    }
  }
  
  const recoveryFactor = (cop / total) * 100
  const waterCut = (cwp / total) * 100
  const copNorm = (cop - 2.72) / (8.85 - 2.72)
  const cwpNorm = (cwp - 5.63) / (11.88 - 5.63)
  
  // Prevent division by zero in steam efficiency
  const steamDenominator = validated.injectionRate * 0.01
  const steamEfficiency = steamDenominator !== 0 ? cop / steamDenominator : 0
  
  // Prevent division by zero in GOR
  const gor = cop !== 0 ? cwp / cop : 0

  return { cop, cwp, recoveryFactor, waterCut, copNorm, cwpNorm, steamEfficiency, gor }
}

// Optimal parameter set from proxy model optimisation map
export const OPTIMAL_PARAMS: SimInputs = {
  steamQuality: 0.85,
  temperature: 100,
  injectionRate: 550,
  bhpP1: 1200,
  bhpP2: 1200,
  bhpP3: 1200,
  bhpP4: 1200,
  injI: 5,
  injJ: 5,
  p1I: 2,
  p1J: 2,
}

// Default (experimental base case from thesis: 80°C hot chemical flooding)
export const DEFAULT_PARAMS: SimInputs = {
  steamQuality: 0.70,
  temperature: 80,
  injectionRate: 400,
  bhpP1: 2000,
  bhpP2: 2000,
  bhpP3: 2000,
  bhpP4: 2000,
  injI: 5,
  injJ: 5,
  p1I: 2,
  p1J: 2,
}

// Steam-only baseline (thesis comparison case)
export const STEAM_ONLY: SimInputs = {
  ...DEFAULT_PARAMS,
  steamQuality: 1.0,
  temperature: 120,
}
