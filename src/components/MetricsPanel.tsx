'use client'
import { memo, useMemo } from 'react'
import { SimOutputs } from '../lib/proxyModel'

/**
 * Props for the MetricCard component
 */
interface MetricCardProps {
  label: string; value: string; unit: string; color: string
  sub?: string; icon: string; glow: string
}

/**
 * Props for the MetricsPanel component
 */
interface MetricsPanelProps {
  outputs: SimOutputs
  baseline: SimOutputs
}

const MetricCard = memo(function MetricCard({ label, value, unit, color, sub, icon, glow }: MetricCardProps) {
  return (
    <div className="rounded-xl p-3 border flex flex-col gap-1" style={{ borderColor: `${color}30`, background: `${color}08` }}>
      <div className="flex items-center gap-1.5">
        <span className="text-base">{icon}</span>
        <span className="text-[10px] text-[#6a7a9a] uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-mono font-semibold" style={{ color, textShadow: `0 0 12px ${color}60` }}>
          {value}
        </span>
        <span className="text-[11px] text-[#4a5a7a]">{unit}</span>
      </div>
      {sub && <div className="text-[10px] text-[#4a5a7a]">{sub}</div>}
    </div>
  )
})

export default function MetricsPanel({ outputs, baseline }: MetricsPanelProps) {
  const copDelta = useMemo(() => ((outputs.cop - baseline.cop) / baseline.cop * 100), [outputs.cop, baseline.cop])
  const cwpDelta = useMemo(() => ((outputs.cwp - baseline.cwp) / baseline.cwp * 100), [outputs.cwp, baseline.cwp])
  const sign = useMemo(() => (v: number) => v >= 0 ? '+' : '', [])

  return (
    <div className="grid grid-cols-2 gap-3">
      <MetricCard
        icon="🛢" label="Cumulative Oil Production" unit="×10³ BBL"
        value={(outputs.cop * 1000).toFixed(0)} color="#f0a030" glow="#f0a030"
        sub={`${sign(copDelta)}${copDelta.toFixed(1)}% vs baseline`}
      />
      <MetricCard
        icon="💧" label="Cumulative Water Production" unit="×10³ BBL"
        value={(outputs.cwp * 1000).toFixed(0)} color="#4a9eff" glow="#4a9eff"
        sub={`${sign(cwpDelta)}${cwpDelta.toFixed(1)}% vs baseline`}
      />
      <MetricCard
        icon="📈" label="Recovery Factor" unit="%"
        value={outputs.recoveryFactor.toFixed(1)} color="#3dcfa0" glow="#3dcfa0"
        sub="Oil / (Oil + Water)"
      />
      <MetricCard
        icon="🌊" label="Water Cut" unit="%"
        value={outputs.waterCut.toFixed(1)} color="#a78bfa" glow="#a78bfa"
        sub="Water / Total fluids"
      />
      <MetricCard
        icon="⚡" label="Steam Efficiency" unit="BBL/unit"
        value={outputs.steamEfficiency.toFixed(2)} color="#ff6b35" glow="#ff6b35"
        sub="Oil per steam input"
      />
      <MetricCard
        icon="🔄" label="GOR Equivalent" unit="ratio"
        value={outputs.gor.toFixed(2)} color="#fbbf24" glow="#fbbf24"
        sub="Water-oil ratio"
      />
    </div>
  )
}
