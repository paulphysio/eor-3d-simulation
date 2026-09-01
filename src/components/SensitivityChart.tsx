'use client'
import { memo, useMemo } from 'react'
import { SimInputs, simulate, DEFAULT_PARAMS } from '../lib/proxyModel'

/**
 * Sensitivity Analysis Chart Component
 * Shows which parameters have the biggest effect on COP when varied ±10%
 * This is a standard petroleum engineering tool for tornado charts
 */
interface SensitivityChartProps {
  inputs: SimInputs
}

const SensitivityChart = memo(function SensitivityChart({ inputs }: SensitivityChartProps) {
  const sensitivityData = useMemo(() => {
    const baseResult = simulate(inputs)
    const baseCOP = baseResult.cop
    
    const parameters: Array<{ key: keyof SimInputs; name: string; min: number; max: number; step: number }> = [
      { key: 'steamQuality', name: 'Steam Quality', min: 0.1, max: 1.0, step: 0.05 },
      { key: 'temperature', name: 'Temperature (°C)', min: 60, max: 120, step: 5 },
      { key: 'injectionRate', name: 'Injection Rate (BBL/d)', min: 100, max: 800, step: 50 },
      { key: 'bhpP1', name: 'Producer 1 BHP (psi)', min: 500, max: 4000, step: 100 },
      { key: 'bhpP2', name: 'Producer 2 BHP (psi)', min: 500, max: 4000, step: 100 },
      { key: 'bhpP3', name: 'Producer 3 BHP (psi)', min: 500, max: 4000, step: 100 },
      { key: 'bhpP4', name: 'Producer 4 BHP (psi)', min: 500, max: 4000, step: 100 },
      { key: 'injI', name: 'Injector I-Pos', min: 1, max: 10, step: 1 },
      { key: 'injJ', name: 'Injector J-Pos', min: 1, max: 10, step: 1 },
      { key: 'p1I', name: 'Producer 1 I-Pos', min: 1, max: 10, step: 1 },
      { key: 'p1J', name: 'Producer 1 J-Pos', min: 1, max: 10, step: 1 },
    ]

    const results = parameters.map(param => {
      const currentValue = inputs[param.key]
      const range = param.max - param.min
      const variation = range * 0.1 // ±10% variation
      
      // Test +10%
      const plusInputs = { ...inputs }
      plusInputs[param.key] = Math.min(param.max, currentValue + variation)
      const plusResult = simulate(plusInputs)
      
      // Test -10%
      const minusInputs = { ...inputs }
      minusInputs[param.key] = Math.max(param.min, currentValue - variation)
      const minusResult = simulate(minusInputs)
      
      const plusEffect = ((plusResult.cop - baseCOP) / baseCOP) * 100
      const minusEffect = ((minusResult.cop - baseCOP) / baseCOP) * 100
      const maxEffect = Math.max(Math.abs(plusEffect), Math.abs(minusEffect))
      
      return {
        name: param.name,
        plusEffect,
        minusEffect,
        maxEffect,
        baseValue: currentValue
      }
    })

    // Sort by maximum effect (descending) for tornado chart
    return results.sort((a, b) => b.maxEffect - a.maxEffect)
  }, [inputs])

  const maxEffect = Math.max(...sensitivityData.map(d => d.maxEffect))

  return (
    <div className="w-full h-full flex flex-col">
      <div className="text-[10px] font-semibold text-[#4a5a7a] uppercase tracking-widest mb-2">
        Sensitivity Analysis (±10% variation)
      </div>
      <div className="flex-1 overflow-y-auto space-y-2">
        {sensitivityData.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-28 text-[10px] text-[#8899bb] truncate text-right" title={item.name}>
              {item.name}
            </div>
            <div className="flex-1 flex items-center h-6 relative">
              {/* Center line */}
              <div className="absolute left-1/2 w-px h-full bg-[#1a2a4a]" />
              
              {/* Negative effect bar */}
              {item.minusEffect < 0 && (
                <div 
                  className="h-2 bg-[#ff6b35] rounded-l"
                  style={{ 
                    width: `${(Math.abs(item.minusEffect) / maxEffect) * 40}%`,
                    marginRight: 'auto'
                  }}
                />
              )}
              
              {/* Positive effect bar */}
              {item.plusEffect > 0 && (
                <div 
                  className="h-2 bg-[#3dcfa0] rounded-r"
                  style={{ 
                    width: `${(item.plusEffect / maxEffect) * 40}%`,
                    marginLeft: 'auto'
                  }}
                />
              )}
              
              {/* Zero value indicator */}
              {Math.abs(item.plusEffect) < 0.1 && Math.abs(item.minusEffect) < 0.1 && (
                <div className="absolute left-1/2 transform -translate-x-1/2 w-2 h-2 bg-[#4a5a7a] rounded-full" />
              )}
            </div>
            <div className="w-16 text-[10px] font-mono text-right">
              <span className={item.plusEffect > 0 ? "text-[#3dcfa0]" : "text-[#ff6b35]"}>
                {item.plusEffect > 0 ? "+" : ""}{item.plusEffect.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-[#0f1a2e] flex justify-between text-[9px] text-[#4a5a7a]">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-[#3dcfa0] rounded" />
          <span>Positive effect on COP</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-[#ff6b35] rounded" />
          <span>Negative effect on COP</span>
        </div>
      </div>
    </div>
  )
})

export default SensitivityChart