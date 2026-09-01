'use client'
import { useState, memo, useCallback, useMemo, useEffect } from 'react'
import { SimInputs, DEFAULT_PARAMS, OPTIMAL_PARAMS, STEAM_ONLY, saveScenario, getScenarios, loadScenario, deleteScenario } from '../lib/proxyModel'

/**
 * Props for the Slider component
 */
interface SliderProps {
  label: string; min: number; max: number
  step: number; value: number; unit: string; color: string; onChange: (v: number) => void
}

/**
 * Props for the ControlPanel component
 */
interface ControlPanelProps {
  inputs: SimInputs
  onChange: (inputs: SimInputs) => void
}

const Slider = memo(function Slider({ label, min, max, step, value, unit, color, onChange }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-[11px] text-[#6a7a9a]">{label}</span>
        <span className="text-[11px] font-mono font-medium" style={{color}}>
          {value % 1 === 0 ? value.toFixed(0) : value.toFixed(2)} {unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-[3px] appearance-none rounded-full outline-none cursor-pointer"
        style={{background:`linear-gradient(to right, ${color} ${pct}%, #1a2a4a ${pct}%)`}}
      />
    </div>
  )
})

const SectionTitle = memo(function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold text-[#4a5a7a] uppercase tracking-widest pt-2 pb-1 border-t border-[#0f1a2e]">
      {children}
    </div>
  )
})

export default function ControlPanel({ inputs, onChange }: ControlPanelProps) {
  const set = useCallback((key: keyof SimInputs) => (v: number) => onChange({ ...inputs, [key]: v }), [inputs, onChange])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [scenarioName, setScenarioName] = useState('')
  const [savedScenarios, setSavedScenarios] = useState<string[]>([])
  
  // Only access localStorage on client side
  useEffect(() => {
    try {
      setSavedScenarios(Object.keys(getScenarios()))
    } catch (error) {
      console.error('Failed to get scenarios:', error)
      setSavedScenarios([])
    }
  }, [])

  const handleSave = useCallback(() => {
    if (scenarioName.trim()) {
      saveScenario(scenarioName.trim(), inputs)
      setScenarioName('')
      setShowSaveDialog(false)
      // Refresh the scenarios list
      try {
        setSavedScenarios(Object.keys(getScenarios()))
      } catch (error) {
        console.error('Failed to refresh scenarios:', error)
      }
    }
  }, [scenarioName, inputs])

  const handleLoad = useCallback((name: string) => {
    const loaded = loadScenario(name)
    if (loaded) {
      onChange(loaded)
    }
  }, [onChange])

  const handleDelete = useCallback((name: string) => {
    deleteScenario(name)
    // Refresh the scenarios list
    try {
      setSavedScenarios(Object.keys(getScenarios()))
    } catch (error) {
      console.error('Failed to refresh scenarios:', error)
    }
  }, [])

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto pr-1">
      <SectionTitle>⚡ Injection Parameters</SectionTitle>
      <Slider label="Steam Quality" min={0.1} max={1.0} step={0.05} value={inputs.steamQuality} unit="frac" color="#ff6b35" onChange={set('steamQuality')} />
      <Slider label="Temperature" min={60} max={120} step={5} value={inputs.temperature} unit="°C" color="#ff9050" onChange={set('temperature')} />
      <Slider label="Injection Rate" min={100} max={800} step={50} value={inputs.injectionRate} unit="BBL/d" color="#f0a030" onChange={set('injectionRate')} />
      <SectionTitle>🛢 Producer BHP (psi)</SectionTitle>
      <Slider label="Producer 1 BHP" min={500} max={4000} step={100} value={inputs.bhpP1} unit="psi" color="#4a9eff" onChange={set('bhpP1')} />
      <Slider label="Producer 2 BHP" min={500} max={4000} step={100} value={inputs.bhpP2} unit="psi" color="#4a9eff" onChange={set('bhpP2')} />
      <Slider label="Producer 3 BHP" min={500} max={4000} step={100} value={inputs.bhpP3} unit="psi" color="#4a9eff" onChange={set('bhpP3')} />
      <Slider label="Producer 4 BHP" min={500} max={4000} step={100} value={inputs.bhpP4} unit="psi" color="#4a9eff" onChange={set('bhpP4')} />
      <SectionTitle>📍 Well Locations (grid)</SectionTitle>
      <Slider label="Injector i-pos" min={1} max={10} step={1} value={inputs.injI} unit="" color="#ff6b35" onChange={set('injI')} />
      <Slider label="Injector j-pos" min={1} max={10} step={1} value={inputs.injJ} unit="" color="#ff6b35" onChange={set('injJ')} />
      <SectionTitle>💾 Saved Scenarios</SectionTitle>
      {savedScenarios.length > 0 ? (
        <div className="flex flex-col gap-1">
          {savedScenarios.map(name => (
            <div key={name} className="flex items-center gap-1">
              <button 
                onClick={() => handleLoad(name)}
                className="flex-1 py-1.5 px-2 rounded text-[10px] font-mono border border-[#4a9eff]/30 text-[#4a9eff] hover:bg-[#4a9eff]/10 transition-colors text-left"
              >
                📂 {name}
              </button>
              <button 
                onClick={() => handleDelete(name)}
                className="py-1.5 px-2 rounded text-[10px] border border-[#ff6b35]/30 text-[#ff6b35] hover:bg-[#ff6b35]/10 transition-colors"
              >
                🗑
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-[10px] text-[#4a5a7a] italic">No saved scenarios</div>
      )}
      <button 
        onClick={() => setShowSaveDialog(true)}
        className="w-full py-2 px-3 rounded-lg text-[11px] font-mono border border-[#3dcfa0]/40 text-[#3dcfa0] hover:bg-[#3dcfa0]/10 transition-colors"
      >
        ➕ Save Current Scenario
      </button>
      {showSaveDialog && (
        <div className="flex gap-2">
          <input
            type="text"
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            placeholder="Scenario name..."
            className="flex-1 px-2 py-1 rounded text-[10px] bg-[#0f1a2e] border border-[#1a2a4a] text-white focus:outline-none focus:border-[#f0a030]"
          />
          <button 
            onClick={handleSave}
            className="py-1 px-3 rounded text-[10px] bg-[#f0a030] text-[#060d1a] hover:bg-[#ff9a40] transition-colors"
          >
            Save
          </button>
          <button 
            onClick={() => { setShowSaveDialog(false); setScenarioName('') }}
            className="py-1 px-3 rounded text-[10px] border border-[#4a5a7a] text-[#4a5a7a] hover:bg-[#4a5a7a]/10 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
      <SectionTitle>🎯 Presets</SectionTitle>
      <div className="flex flex-col gap-2">
        <button onClick={() => onChange(DEFAULT_PARAMS)} className="w-full py-2 px-3 rounded-lg text-[11px] font-mono border border-[#f0a030]/40 text-[#f0a030] hover:bg-[#f0a030]/10 transition-colors">
          🧪 Thesis Base (80°C hot chemical)
        </button>
        <button onClick={() => onChange(OPTIMAL_PARAMS)} className="w-full py-2 px-3 rounded-lg text-[11px] font-mono border border-[#3dcfa0]/40 text-[#3dcfa0] hover:bg-[#3dcfa0]/10 transition-colors">
          ✨ Proxy Model Optimum
        </button>
        <button onClick={() => onChange(STEAM_ONLY)} className="w-full py-2 px-3 rounded-lg text-[11px] font-mono border border-[#8899bb]/30 text-[#8899bb] hover:bg-[#8899bb]/10 transition-colors">
          💨 Steam-Only Baseline
        </button>
      </div>
    </div>
  )
}
