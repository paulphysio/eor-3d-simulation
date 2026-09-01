'use client'
import { memo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { SimOutputs } from '../lib/proxyModel'

/**
 * Props for the ProductionChart component
 */
interface ProductionChartProps {
  outputs: SimOutputs
  history: { time: number; cop: number; cwp: number }[]
}

const CustomTooltip = memo(function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f1a2e] border border-[#1a2a4a] rounded-lg p-3 text-xs font-mono">
        <p className="text-[#8899bb] mb-1">Step {label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {p.value.toFixed(3)} ×10³ BBL
          </p>
        ))}
      </div>
    )
  }
  return null
})

export default memo(function ProductionChart({ outputs, history }: ProductionChartProps) {
  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={history} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#0f1a2e" />
          <XAxis
            dataKey="time"
            tick={{ fill: '#4a5a7a', fontSize: 10, fontFamily: 'monospace' }}
            tickLine={false}
            axisLine={{ stroke: '#1a2a4a' }}
            label={{ value: 'Simulation step', position: 'insideBottom', fill: '#4a5a7a', fontSize: 10, dy: 8 }}
          />
          <YAxis
            tick={{ fill: '#4a5a7a', fontSize: 10, fontFamily: 'monospace' }}
            tickLine={false}
            axisLine={{ stroke: '#1a2a4a' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, color: '#8899bb', fontFamily: 'monospace' }}
          />
          <ReferenceLine
            y={5.94}
            stroke="#f0a030"
            strokeDasharray="4 4"
            strokeOpacity={0.4}
            label={{ value: 'Base COP', fill: '#f0a030', fontSize: 9, fontFamily: 'monospace' }}
          />
          <Line
            type="monotone"
            dataKey="cop"
            stroke="#f0a030"
            strokeWidth={2}
            dot={false}
            name="COP"
            activeDot={{ r: 4, fill: '#f0a030' }}
          />
          <Line
            type="monotone"
            dataKey="cwp"
            stroke="#4a9eff"
            strokeWidth={2}
            dot={false}
            name="CWP"
            activeDot={{ r: 4, fill: '#4a9eff' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
})
